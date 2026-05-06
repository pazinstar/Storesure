"""
Phase 2 — S2 Ledger & Core Stores Workflows: Unit & Integration Tests.
Tests atomic posting, running balance, custodians, reversal, and audit trail.
"""

from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import (
    InventoryItem, ItemTypeChoices, S2Transaction, S2Ledger,
)
from .services import (
    post_s2_receipt, post_s2_issue, post_s2_transfer,
    post_s2_return, post_s2_damage, reverse_s2_transaction,
    validate_s2_post, get_or_create_s2_ledger,
)
from .serializers import (
    S2ReceiptSerializer, S2IssueSerializer, S2TransferSerializer,
    S2ReturnSerializer, S2DamageSerializer, S2ReversalSerializer,
    S2TransactionListSerializer, S2TransactionDetailSerializer,
    S2LedgerSerializer,
)


class S2ValidatePostTests(TestCase):
    """Tests for the validate_s2_post validation function."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Test Consumable', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )

    def test_valid_receipt_no_errors(self):
        errors = validate_s2_post('receipt', self.item, 10)
        self.assertEqual(errors, [])

    def test_invalid_type_returns_error(self):
        errors = validate_s2_post('invalid_type', self.item, 10)
        self.assertGreater(len(errors), 0)

    def test_zero_qty_rejected(self):
        errors = validate_s2_post('receipt', self.item, 0)
        self.assertGreater(len(errors), 0)

    def test_negative_qty_rejected(self):
        errors = validate_s2_post('receipt', self.item, -5)
        self.assertGreater(len(errors), 0)

    def test_issue_requires_dept(self):
        errors = validate_s2_post('issue', self.item, 10, dept_id='')
        self.assertGreater(len(errors), 0)

    def test_issue_with_dept_valid(self):
        errors = validate_s2_post('issue', self.item, 10, dept_id='DEPT001')
        self.assertEqual(errors, [])

    def test_expendable_issue_requires_custodian(self):
        expendable = InventoryItem.objects.create(
            name='Test Expendable', category='Test',
            category_type='expendable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        errors = validate_s2_post('issue', expendable, 10,
                                  custodian_id='', dept_id='DEPT001')
        self.assertGreater(len(errors), 0)
        self.assertIn('Custodian', str(errors))

    def test_permanent_issue_requires_custodian(self):
        permanent = InventoryItem.objects.create(
            name='Test Permanent', category='Test',
            category_type='permanent', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        errors = validate_s2_post('issue', permanent, 10,
                                  custodian_id='', dept_id='DEPT001')
        self.assertGreater(len(errors), 0)
        self.assertIn('Custodian', str(errors))

    def test_consumable_issue_no_custodian_required(self):
        errors = validate_s2_post('issue', self.item, 10,
                                  custodian_id='', dept_id='DEPT001')
        self.assertEqual(errors, [])

    def test_transfer_requires_custodian_for_expendable(self):
        expendable = InventoryItem.objects.create(
            name='Exp Transfer', category='Test',
            category_type='expendable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        errors = validate_s2_post('transfer', expendable, 10, custodian_id='')
        self.assertGreater(len(errors), 0)


class S2ReceiptFlowTests(TestCase):
    """Integration tests for the full receipt posting flow."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Receipt Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
            openingBalance=0,
        )

    def test_basic_receipt_updates_balance(self):
        txn = post_s2_receipt(
            item=self.item, date='2026-01-15', qty=100,
            unit_cost=Decimal('50.00'),
            supplier_name='Test Supplier',
            ref_no='GRN-2026-001',
            created_by='Storekeeper',
            condition='Good',
        )
        self.assertEqual(txn.transaction_type, 'receipt')
        self.assertEqual(txn.qty_received, 100)
        self.assertEqual(txn.running_balance_before, 0)
        self.assertEqual(txn.running_balance_after, 100)
        self.assertEqual(txn.total_value, Decimal('5000.00'))
        self.assertEqual(txn.status, 'posted')

    def test_receipt_creates_s2_ledger(self):
        post_s2_receipt(
            item=self.item, date='2026-01-15', qty=50,
            unit_cost=Decimal('20.00'),
        )
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 50)
        self.assertEqual(ledger.receiptsQty, 50)
        self.assertEqual(ledger.receiptsValue, Decimal('1000.00'))

    def test_multiple_receipts_accumulate(self):
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('10.00'))
        post_s2_receipt(item=self.item, date='2026-01-15',
                         qty=50, unit_cost=Decimal('12.00'))
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 150)
        self.assertEqual(ledger.receiptsQty, 150)

    def test_receipt_syncs_inventory_item(self):
        self.item.openingBalance = 0
        self.item.save()
        post_s2_receipt(item=self.item, date='2026-01-15',
                         qty=75, unit_cost=Decimal('30.00'))
        self.item.refresh_from_db()
        self.assertEqual(self.item.openingBalance, 75)

    def test_receipt_serializer_valid(self):
        data = {
            'item_id': self.item.id,
            'date': '2026-01-15',
            'qty': 25,
            'unit_cost': '40.00',
            'supplier_name': 'Supplier A',
        }
        serializer = S2ReceiptSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        txn = serializer.save()
        self.assertEqual(txn.qty_received, 25)

    def test_receipt_serializer_invalid_item(self):
        data = {
            'item_id': 'NONEXISTENT',
            'date': '2026-01-15',
            'qty': 10,
            'unit_cost': '10.00',
        }
        serializer = S2ReceiptSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class S2IssueFlowTests(TestCase):
    """Integration tests for the Store→Department issue flow."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Issue Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
            openingBalance=0,
        )
        # Pre-load stock
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('10.00'))

    def test_basic_issue_decreases_balance(self):
        txn = post_s2_issue(
            item=self.item, date='2026-01-20', qty=30,
            unit_cost=Decimal('10.00'),
            dept_id='DEPT001', dept_name='Science Department',
            custodian_id='',  # Not needed for consumable
            ref_no='RQ-2026-001',
            created_by='Storekeeper',
        )
        self.assertEqual(txn.transaction_type, 'issue')
        self.assertEqual(txn.qty_issued, 30)
        self.assertEqual(txn.running_balance_before, 100)
        self.assertEqual(txn.running_balance_after, 70)
        self.assertEqual(txn.dept_id, 'DEPT001')

    def test_issue_updates_ledger(self):
        post_s2_issue(item=self.item, date='2026-01-20', qty=20,
                       unit_cost=Decimal('10.00'),
                       dept_id='DEPT001')
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 80)
        self.assertEqual(ledger.issuesQty, 20)
        self.assertEqual(ledger.issuesValue, Decimal('200.00'))

    def test_issue_insufficient_stock_raises_error(self):
        with self.assertRaises(ValidationError):
            post_s2_issue(item=self.item, date='2026-01-20', qty=200,
                           unit_cost=Decimal('10.00'),
                           dept_id='DEPT001')

    def test_issue_without_dept_raises_error(self):
        with self.assertRaises(ValidationError):
            post_s2_issue(item=self.item, date='2026-01-20', qty=10,
                           unit_cost=Decimal('10.00'), dept_id='')

    def test_issue_serializer_valid(self):
        data = {
            'item_id': self.item.id,
            'date': '2026-01-20',
            'qty': 10,
            'unit_cost': '10.00',
            'dept_id': 'DEPT001',
            'dept_name': 'Science',
        }
        serializer = S2IssueSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class S2IssueWithCustodianTests(TestCase):
    """Tests that custodian is required for Expendable & Permanent items."""

    def setUp(self):
        self.expendable = InventoryItem.objects.create(
            name='Expendable Item', category='Test',
            category_type='expendable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        self.permanent = InventoryItem.objects.create(
            name='Permanent Item', category='Test',
            category_type='permanent', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        for item in [self.expendable, self.permanent]:
            post_s2_receipt(item=item, date='2026-01-01',
                             qty=50, unit_cost=Decimal('10.00'))

    def test_expendable_issue_requires_custodian(self):
        with self.assertRaises(ValidationError):
            post_s2_issue(
                item=self.expendable, date='2026-01-20', qty=10,
                unit_cost=Decimal('10.00'),
                custodian_id='', dept_id='DEPT001',
            )

    def test_expendable_issue_with_custodian_succeeds(self):
        txn = post_s2_issue(
            item=self.expendable, date='2026-01-20', qty=10,
            unit_cost=Decimal('10.00'),
            custodian_id='CUST001', custodian_name='John Doe',
            dept_id='DEPT001',
        )
        self.assertEqual(txn.custodian_id, 'CUST001')

    def test_permanent_issue_requires_custodian(self):
        with self.assertRaises(ValidationError):
            post_s2_issue(
                item=self.permanent, date='2026-01-20', qty=10,
                unit_cost=Decimal('10.00'),
                custodian_id='', dept_id='DEPT001',
            )

    def test_permanent_issue_with_custodian_succeeds(self):
        txn = post_s2_issue(
            item=self.permanent, date='2026-01-20', qty=10,
            unit_cost=Decimal('10.00'),
            custodian_id='CUST002', custodian_name='Jane Doe',
            dept_id='DEPT001',
        )
        self.assertEqual(txn.custodian_name, 'Jane Doe')


class S2TransferFlowTests(TestCase):
    """Integration tests for department transfer workflow."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Transfer Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('20.00'))

    def test_transfer_creates_two_entries(self):
        out_txn, in_txn = post_s2_transfer(
            item=self.item, date='2026-01-25', qty=30,
            unit_cost=Decimal('20.00'),
            from_dept_id='DEPT001', from_dept_name='Science',
            to_dept_id='DEPT002', to_dept_name='Math',
        )
        self.assertEqual(out_txn.transaction_type, 'transfer')
        self.assertEqual(out_txn.qty_issued, 30)
        self.assertEqual(in_txn.transaction_type, 'transfer')
        self.assertEqual(in_txn.qty_received, 30)
        # Entries are linked
        self.assertEqual(out_txn.reversed_by, in_txn)
        self.assertEqual(in_txn.reversed_by, out_txn)

    def test_transfer_net_balance_unchanged(self):
        post_s2_transfer(
            item=self.item, date='2026-01-25', qty=30,
            unit_cost=Decimal('20.00'),
            from_dept_id='DEPT001', to_dept_id='DEPT002',
        )
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 100)
        self.assertEqual(ledger.transfersOutQty, 30)
        self.assertEqual(ledger.transfersInQty, 30)

    def test_transfer_insufficient_stock(self):
        with self.assertRaises(ValidationError):
            post_s2_transfer(
                item=self.item, date='2026-01-25', qty=200,
                unit_cost=Decimal('20.00'),
                from_dept_id='DEPT001', to_dept_id='DEPT002',
            )

    def test_transfer_serializer_valid(self):
        data = {
            'item_id': self.item.id,
            'date': '2026-01-25',
            'qty': 10,
            'unit_cost': '20.00',
            'from_dept_id': 'DEPT001',
            'to_dept_id': 'DEPT002',
        }
        serializer = S2TransferSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class S2ReturnFlowTests(TestCase):
    """Integration tests for Return to Store workflow."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Return Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=50, unit_cost=Decimal('15.00'))

    def test_return_increases_balance(self):
        txn = post_s2_return(
            item=self.item, date='2026-01-30', qty=10,
            unit_cost=Decimal('15.00'),
            dept_id='DEPT001', dept_name='Science',
        )
        self.assertEqual(txn.transaction_type, 'return')
        self.assertEqual(txn.qty_received, 10)
        self.assertEqual(txn.running_balance_after, 60)

    def test_return_updates_ledger(self):
        post_s2_return(item=self.item, date='2026-01-30', qty=5,
                        unit_cost=Decimal('15.00'), dept_id='DEPT001')
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 55)
        self.assertEqual(ledger.returnsQty, 5)

    def test_return_serializer_valid(self):
        data = {
            'item_id': self.item.id,
            'date': '2026-01-30',
            'qty': 5,
            'unit_cost': '15.00',
            'dept_id': 'DEPT001',
            'remarks': 'Returned unused',
        }
        serializer = S2ReturnSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class S2DamageFlowTests(TestCase):
    """Integration tests for Damage/Loss/Condemn workflow."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Damage Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('25.00'))

    def test_damage_locks_entry(self):
        txn = post_s2_damage(
            item=self.item, date='2026-02-01', qty=5,
            unit_cost=Decimal('25.00'),
            remarks='Broken during handling',
        )
        self.assertEqual(txn.status, 'locked')
        self.assertIn('DAMAGE/LOSS', txn.remarks)

    def test_damage_decreases_balance(self):
        post_s2_damage(item=self.item, date='2026-02-01', qty=10,
                        unit_cost=Decimal('25.00'), remarks='Lost')
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 90)
        self.assertEqual(ledger.damagesQty, 10)

    def test_damage_insufficient_stock(self):
        with self.assertRaises(ValidationError):
            post_s2_damage(item=self.item, date='2026-02-01', qty=200,
                            unit_cost=Decimal('25.00'), remarks='')

    def test_damage_serializer_valid(self):
        data = {
            'item_id': self.item.id,
            'date': '2026-02-01',
            'qty': 3,
            'unit_cost': '25.00',
            'remarks': 'Stolen',
        }
        serializer = S2DamageSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class S2ReversalFlowTests(TestCase):
    """Integration tests for transaction reversal."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Reversal Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('10.00'))

    def test_reverse_receipt_creates_adjustment(self):
        original = S2Transaction.objects.filter(
            transaction_type='receipt'
        ).first()
        reversal = reverse_s2_transaction(
            original, reversed_by='Auditor', reason='Invoice correction'
        )
        self.assertEqual(reversal.transaction_type, 'adjustment')
        self.assertEqual(reversal.ref_no, f"REV-{original.id}")
        # Original marked reversed
        original.refresh_from_db()
        self.assertEqual(original.status, 'reversed')

    def test_reverse_receipt_restores_balance(self):
        original = S2Transaction.objects.filter(
            transaction_type='receipt'
        ).first()
        reverse_s2_transaction(original, reason='Correction')
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 0)

    def test_cannot_reverse_already_reversed(self):
        original = S2Transaction.objects.filter(
            transaction_type='receipt'
        ).first()
        reverse_s2_transaction(original, reason='First reversal')
        with self.assertRaises(ValidationError):
            reverse_s2_transaction(original, reason='Double reversal')

    def test_reverse_issue_restores_balance(self):
        post_s2_issue(item=self.item, date='2026-01-15', qty=30,
                       unit_cost=Decimal('10.00'), dept_id='DEPT001')
        issue = S2Transaction.objects.filter(
            transaction_type='issue'
        ).first()
        reverse_s2_transaction(issue, reason='Wrong department')
        ledger = S2Ledger.objects.get(itemCode=self.item.id)
        self.assertEqual(ledger.closingBalance, 100)

    def test_reversal_serializer_valid(self):
        txn = S2Transaction.objects.filter(
            transaction_type='receipt'
        ).first()
        data = {
            'transaction_id': txn.id,
            'reason': 'Duplicate entry',
            'reversed_by': 'Auditor',
        }
        serializer = S2ReversalSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class S2AtomicBalanceTests(TestCase):
    """End-to-end tests for running balance accuracy."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Atomic Test Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
            openingBalance=0,
        )

    def test_full_workflow_balance_accuracy(self):
        """Receipt → Issue → Return → Damage → Reversal should yield correct balance."""
        # 1. Receipt: +100
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=100, unit_cost=Decimal('10.00'))
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 100
        )

        # 2. Issue: -30 → 70
        post_s2_issue(item=self.item, date='2026-01-10', qty=30,
                       unit_cost=Decimal('10.00'), dept_id='DEPT001')
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 70
        )

        # 3. Return: +10 → 80
        post_s2_return(item=self.item, date='2026-01-15', qty=10,
                        unit_cost=Decimal('10.00'), dept_id='DEPT001')
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 80
        )

        # 4. Damage: -5 → 75
        post_s2_damage(item=self.item, date='2026-01-20', qty=5,
                        unit_cost=Decimal('10.00'), remarks='Damaged')
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 75
        )

        # 5. Transfer: -10 out, +10 in → 75 (net same)
        post_s2_transfer(item=self.item, date='2026-01-25', qty=10,
                          unit_cost=Decimal('10.00'),
                          from_dept_id='DEPT001', to_dept_id='DEPT002')
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 75
        )

        # 6. Reverse Issue: +30 → 105
        issue = S2Transaction.objects.filter(
            transaction_type='issue'
        ).first()
        reverse_s2_transaction(issue, reason='Test reversal')
        self.assertEqual(
            S2Ledger.objects.get(itemCode=self.item.id).closingBalance, 105
        )

        # Verify InventoryItem sync
        self.item.refresh_from_db()
        self.assertEqual(self.item.openingBalance, 105)


class S2SerializerTests(TestCase):
    """Tests for S2 serializer output formats."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Serializer Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=self.item, date='2026-01-01',
                         qty=50, unit_cost=Decimal('20.00'))

    def test_transaction_list_serializer(self):
        txn = S2Transaction.objects.first()
        serializer = S2TransactionListSerializer(txn)
        data = serializer.data
        self.assertIn('transaction_type_display', data)
        self.assertIn('transaction_type', data)
        self.assertIn('qty_received', data)
        self.assertIn('running_balance_before', data)

    def test_transaction_detail_serializer(self):
        txn = S2Transaction.objects.first()
        serializer = S2TransactionDetailSerializer(txn)
        data = serializer.data
        self.assertIn('transaction_type_display', data)
        self.assertIn('status_display', data)
        self.assertIn('id', data)

    def test_ledger_serializer(self):
        ledger = S2Ledger.objects.first()
        serializer = S2LedgerSerializer(ledger)
        data = serializer.data
        self.assertIn('closingBalance', data)
        self.assertIn('receiptsQty', data)
        self.assertIn('damagesQty', data)


class S2ModelTests(TestCase):
    """Tests for S2 model constraints and properties."""

    def test_s2_transaction_auto_id(self):
        item = InventoryItem.objects.create(
            name='ID Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        txn = post_s2_receipt(item=item, date='2026-01-01',
                               qty=10, unit_cost=Decimal('5.00'))
        self.assertTrue(txn.id.startswith('S2-2026-'))

    def test_s2_ledger_auto_id(self):
        item = InventoryItem.objects.create(
            name='Ledger ID', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=item, date='2026-01-01',
                         qty=10, unit_cost=Decimal('5.00'))
        ledger = S2Ledger.objects.get(itemCode=item.id)
        self.assertTrue(ledger.id.startswith('SL-2026-'))

    def test_s2_transaction_str(self):
        item = InventoryItem.objects.create(
            name='Str Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        txn = post_s2_receipt(item=item, date='2026-01-01',
                               qty=5, unit_cost=Decimal('10.00'))
        self.assertIn('Receipt', str(txn))

    def test_get_or_create_ledger_existing_item(self):
        item = InventoryItem.objects.create(
            name='GOC Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
            openingBalance=25,
        )
        ledger, created = get_or_create_s2_ledger(item)
        self.assertTrue(created)
        self.assertEqual(ledger.openingBalance, 25)
        self.assertEqual(ledger.closingBalance, 25)

    def test_damage_entry_is_locked(self):
        item = InventoryItem.objects.create(
            name='Lock Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        post_s2_receipt(item=item, date='2026-01-01',
                         qty=20, unit_cost=Decimal('5.00'))
        txn = post_s2_damage(item=item, date='2026-01-15', qty=3,
                              unit_cost=Decimal('5.00'), remarks='Test')
        self.assertEqual(txn.status, 'locked')