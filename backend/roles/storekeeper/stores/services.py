"""
S2 Ledger Service — Atomic posting logic for S2 transactions.
All financial/posting operations use DB transactions.
"""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import (
    S2Transaction, S2Ledger, InventoryItem, ItemTypeChoices,
    TRANSACTION_TYPE_CHOICES, ENTRY_STATUS_CHOICES,
)


def get_or_create_s2_ledger(item: InventoryItem) -> tuple:
    """
    Get or create a S2Ledger summary row for the given InventoryItem.
    Returns (S2Ledger, created).
    """
    ledger, created = S2Ledger.objects.select_for_update().get_or_create(
        itemCode=item.id,
        defaults={
            'item': item,
            'itemName': item.name,
            'category': item.category,
            'category_type': item.category_type,
            'unit': item.unit,
            'openingBalance': item.openingBalance,
            'closingBalance': item.openingBalance,
            'closingValue': Decimal('0.00'),
        }
    )
    return ledger, created


def validate_s2_post(txn_type: str, item: InventoryItem, qty: int,
                     custodian_id: str = '', dept_id: str = '',
                     unit_cost: Decimal = Decimal('0')) -> list:
    """
    Validate a proposed S2 transaction before posting.
    Returns a list of error messages (empty if valid).
    """
    errors = []

    if txn_type not in dict(TRANSACTION_TYPE_CHOICES):
        errors.append(f"Invalid transaction type: {txn_type}")
        return errors

    if qty <= 0:
        errors.append("Quantity must be greater than zero.")

    # Custodian required for Expendable & Permanent on issue/transfer
    if txn_type in ('issue', 'transfer') and item.category_type in (
            ItemTypeChoices.EXPENDABLE, ItemTypeChoices.PERMANENT):
        if not custodian_id:
            errors.append(
                f"Custodian is required for {item.get_category_type_display()} items on {txn_type}."
            )

    # Department required for issue
    if txn_type == 'issue' and not dept_id:
        errors.append("Department is required for issue transactions.")

    return errors


def post_s2_receipt(*, item: InventoryItem, date, qty: int,
                    unit_cost: Decimal, supplier_id: str = '',
                    supplier_name: str = '', ref_no: str = '',
                    created_by: str = '', remarks: str = '',
                    condition: str = '') -> S2Transaction:
    """
    Post a GRN → Store receipt to the S2 ledger.
    Increases stock balance.
    """
    with transaction.atomic():
        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance
        total_value = Decimal(str(qty)) * unit_cost
        running_after = running_before + qty

        txn = S2Transaction.objects.create(
            transaction_type='receipt',
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_received=qty,
            running_balance_before=running_before,
            running_balance_after=running_after,
            unit_cost=unit_cost,
            total_value=total_value,
            supplier_id=supplier_id,
            supplier_name=supplier_name,
            condition=condition,
            remarks=remarks,
            created_by=created_by,
        )

        # Update ledger summary
        ledger.receiptsQty += qty
        ledger.receiptsValue += total_value
        ledger.closingBalance = running_after
        ledger.closingValue += total_value
        ledger.lastTransactionDate = date
        ledger.save()

        # Sync InventoryItem openingBalance
        item.openingBalance = running_after
        item.save(update_fields=['openingBalance'])

        return txn


def post_s2_issue(*, item: InventoryItem, date, qty: int,
                  unit_cost: Decimal, custodian_id: str = '',
                  custodian_name: str = '', dept_id: str = '',
                  dept_name: str = '', ref_no: str = '',
                  created_by: str = '', remarks: str = '',
                  condition: str = '') -> S2Transaction:
    """
    Post a Store → Department issue to the S2 ledger.
    Decreases stock balance. Requires custodian for Expendable/Permanent.
    """
    with transaction.atomic():
        errors = validate_s2_post('issue', item, qty,
                                  custodian_id=custodian_id, dept_id=dept_id,
                                  unit_cost=unit_cost)
        if errors:
            from django.core.exceptions import ValidationError
            raise ValidationError(errors)

        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance

        if qty > running_before:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f"Insufficient stock for {item.name}. "
                f"Available: {running_before}, requested: {qty}."
            )

        total_value = Decimal(str(qty)) * unit_cost
        running_after = running_before - qty

        txn = S2Transaction.objects.create(
            transaction_type='issue',
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_issued=qty,
            running_balance_before=running_before,
            running_balance_after=running_after,
            unit_cost=unit_cost,
            total_value=total_value,
            custodian_id=custodian_id,
            custodian_name=custodian_name,
            dept_id=dept_id,
            dept_name=dept_name,
            condition=condition,
            remarks=remarks,
            created_by=created_by,
        )

        # Update ledger summary
        ledger.issuesQty += qty
        ledger.issuesValue += total_value
        ledger.closingBalance = running_after
        ledger.closingValue -= total_value
        ledger.lastTransactionDate = date
        ledger.save()

        # Sync InventoryItem openingBalance
        item.openingBalance = running_after
        item.save(update_fields=['openingBalance'])

        return txn


def post_s2_transfer(*, item: InventoryItem, date, qty: int,
                     unit_cost: Decimal,
                     from_dept_id: str = '', from_dept_name: str = '',
                     to_dept_id: str = '', to_dept_name: str = '',
                     custodian_id: str = '', custodian_name: str = '',
                     ref_no: str = '', created_by: str = '',
                     remarks: str = '') -> tuple:
    """
    Post a department transfer.
    Creates two S2Transaction entries (transfer-out and transfer-in).
    Returns (outgoing_txn, incoming_txn).
    """
    with transaction.atomic():
        errors = validate_s2_post('transfer', item, qty,
                                  custodian_id=custodian_id, unit_cost=unit_cost)
        if errors:
            from django.core.exceptions import ValidationError
            raise ValidationError(errors)

        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance

        if qty > running_before:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f"Insufficient stock for transfer of {item.name}. "
                f"Available: {running_before}, requested: {qty}."
            )

        total_value = Decimal(str(qty)) * unit_cost
        running_after = running_before  # Net effect: transfer doesn't change net balance

        # Outgoing transfer
        out_txn = S2Transaction.objects.create(
            transaction_type='transfer',
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_issued=qty,
            running_balance_before=running_before,
            running_balance_after=running_before - qty,
            unit_cost=unit_cost,
            total_value=total_value,
            dept_id=from_dept_id,
            dept_name=from_dept_name,
            custodian_id=custodian_id,
            custodian_name=custodian_name,
            remarks=f"Transfer out → {to_dept_name or to_dept_id}. {remarks}",
            created_by=created_by,
        )

        # Incoming transfer
        in_txn = S2Transaction.objects.create(
            transaction_type='transfer',
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_received=qty,
            running_balance_before=running_before - qty,
            running_balance_after=running_after,
            unit_cost=unit_cost,
            total_value=total_value,
            dept_id=to_dept_id,
            dept_name=to_dept_name,
            remarks=f"Transfer in ← {from_dept_name or from_dept_id}. {remarks}",
            created_by=created_by,
        )

        # Link reversals
        out_txn.reversed_by = in_txn
        in_txn.reversed_by = out_txn
        out_txn.save(update_fields=['reversed_by'])
        in_txn.save(update_fields=['reversed_by'])

        # Update ledger summary
        ledger.transfersOutQty += qty
        ledger.transfersOutValue += total_value
        ledger.transfersInQty += qty
        ledger.transfersInValue += total_value
        ledger.closingBalance = running_after
        ledger.lastTransactionDate = date
        ledger.save()

        return out_txn, in_txn


def post_s2_return(*, item: InventoryItem, date, qty: int,
                   unit_cost: Decimal,
                   dept_id: str = '', dept_name: str = '',
                   custodian_id: str = '', custodian_name: str = '',
                   ref_no: str = '', created_by: str = '',
                   remarks: str = '',
                   condition: str = '') -> S2Transaction:
    """
    Post a Return to Store transaction.
    Increases stock balance.
    """
    with transaction.atomic():
        if qty <= 0:
            from django.core.exceptions import ValidationError
            raise ValidationError("Return quantity must be greater than zero.")

        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance
        total_value = Decimal(str(qty)) * unit_cost
        running_after = running_before + qty

        txn = S2Transaction.objects.create(
            transaction_type='return',
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_received=qty,
            running_balance_before=running_before,
            running_balance_after=running_after,
            unit_cost=unit_cost,
            total_value=total_value,
            dept_id=dept_id,
            dept_name=dept_name,
            custodian_id=custodian_id,
            custodian_name=custodian_name,
            condition=condition,
            remarks=remarks,
            created_by=created_by,
        )

        ledger.returnsQty += qty
        ledger.returnsValue += total_value
        ledger.closingBalance = running_after
        ledger.closingValue += total_value
        ledger.lastTransactionDate = date
        ledger.save()

        item.openingBalance = running_after
        item.save(update_fields=['openingBalance'])

        return txn


def post_s2_damage(*, item: InventoryItem, date, qty: int,
                   unit_cost: Decimal,
                   custodian_id: str = '', custodian_name: str = '',
                   dept_id: str = '', dept_name: str = '',
                   ref_no: str = '', created_by: str = '',
                   remarks: str = '',
                   condition: str = 'Damaged') -> S2Transaction:
    """
    Post a Damage/Loss/Condemn transaction.
    Decreases stock balance. Creates an audit-locked entry.
    """
    with transaction.atomic():
        if qty <= 0:
            from django.core.exceptions import ValidationError
            raise ValidationError("Damage/loss quantity must be greater than zero.")

        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance

        if qty > running_before:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f"Insufficient stock for damage/loss of {item.name}. "
                f"Available: {running_before}, requested: {qty}."
            )

        total_value = Decimal(str(qty)) * unit_cost
        running_after = running_before - qty

        txn = S2Transaction.objects.create(
            transaction_type='damage',
            status='locked',  # Audit-locked immediately
            date=date,
            ref_no=ref_no,
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_issued=qty,
            running_balance_before=running_before,
            running_balance_after=running_after,
            unit_cost=unit_cost,
            total_value=total_value,
            custodian_id=custodian_id,
            custodian_name=custodian_name,
            dept_id=dept_id,
            dept_name=dept_name,
            condition=condition,
            remarks=f"DAMAGE/LOSS: {remarks}",
            created_by=created_by,
        )

        ledger.damagesQty += qty
        ledger.damagesValue += total_value
        ledger.closingBalance = running_after
        ledger.closingValue -= total_value
        ledger.lastTransactionDate = date
        ledger.save()

        item.openingBalance = running_after
        item.save(update_fields=['openingBalance'])

        return txn


def reverse_s2_transaction(txn: S2Transaction, reversed_by: str = '',
                           reason: str = '') -> S2Transaction:
    """
    Reverse a posted S2 transaction.
    Creates an opposite-sign adjustment entry and links it.
    The original entry is marked 'reversed'.
    """
    with transaction.atomic():
        if txn.status not in ('posted', 'locked'):
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f"Cannot reverse transaction in status '{txn.status}'."
            )

        item = txn.item
        if not item:
            from django.core.exceptions import ValidationError
            raise ValidationError("Cannot reverse: linked item not found.")

        ledger, _ = get_or_create_s2_ledger(item)
        running_before = ledger.closingBalance

        # Calculate opposite quantities
        reverse_qty_received = txn.qty_issued
        reverse_qty_issued = txn.qty_received

        # Running balance after reversal
        qty_effect = reverse_qty_received - reverse_qty_issued
        running_after = running_before + qty_effect

        reversal = S2Transaction.objects.create(
            transaction_type='adjustment',
            status='posted',
            date=timezone.now().date(),
            ref_no=f"REV-{txn.id}",
            item=item,
            item_code=item.id,
            item_name=item.name,
            category=item.category,
            category_type=item.category_type,
            unit=item.unit,
            qty_received=reverse_qty_received,
            qty_issued=reverse_qty_issued,
            running_balance_before=running_before,
            running_balance_after=running_after,
            unit_cost=txn.unit_cost,
            total_value=txn.total_value,
            created_by=reversed_by,
            reversal_reason=reason,
            reversed_by=txn,
        )

        # Mark original as reversed
        txn.status = 'reversed'
        txn.reversal_reason = reason
        txn.save(update_fields=['status', 'reversal_reason'])

        # Update ledger
        if reverse_qty_received > 0:
            ledger.receiptsQty += reverse_qty_received
            ledger.receiptsValue += Decimal(str(reverse_qty_received)) * txn.unit_cost
            ledger.closingValue += Decimal(str(reverse_qty_received)) * txn.unit_cost
        if reverse_qty_issued > 0:
            ledger.issuesQty += reverse_qty_issued
            ledger.issuesValue += Decimal(str(reverse_qty_issued)) * txn.unit_cost
            ledger.closingValue -= Decimal(str(reverse_qty_issued)) * txn.unit_cost

        ledger.closingBalance = running_after
        ledger.lastTransactionDate = timezone.now().date()
        ledger.save()

        # Sync InventoryItem
        item.openingBalance = running_after
        item.save(update_fields=['openingBalance'])

        return reversal