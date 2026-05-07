"""
Phase 3 — Capitalization Rules Engine & Decision Assistant: Comprehensive Tests.
Tests Rules A-D, auto-suggestion, override workflow, and audit logging.
"""

from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError

from .models import (
    InventoryItem, ItemTypeChoices, CapitalizationRule,
    CapitalizationSetting, CapitalizationPrompt,
)
from .capitalization_engine import (
    classify_item, log_classification_prompt, apply_override,
    get_cap_settings, get_active_rules,
    evaluate_rule_a, evaluate_rule_b, evaluate_rule_c, evaluate_rule_d,
    ClassificationResult,
)
from .serializers import (
    CapitalizationRuleSerializer, CapitalizationSettingSerializer,
    CapitalizationPromptListSerializer, CapitalizationPromptDetailSerializer,
    ClassifyItemSerializer, OverrideDecisionSerializer,
)


class CapSettingsTests(TestCase):
    """Tests for capitalization settings defaults and retrieval."""

    def test_get_settings_creates_defaults(self):
        settings = get_cap_settings()
        self.assertEqual(settings.threshold, Decimal('50000'))
        self.assertEqual(settings.bulk_materiality, Decimal('100000'))
        self.assertEqual(settings.min_useful_life, 12)
        self.assertEqual(settings.default_residual_pct, Decimal('10.00'))

    def test_get_settings_is_singleton(self):
        s1 = get_cap_settings()
        s2 = get_cap_settings()
        self.assertEqual(s1.id, s2.id)

    def test_settings_can_be_updated(self):
        settings = get_cap_settings()
        settings.threshold = Decimal('75000')
        settings.save()
        settings.refresh_from_db()
        self.assertEqual(settings.threshold, Decimal('75000'))


class CapRuleModelTests(TestCase):
    """Tests for CapitalizationRule model and auto rule_code."""

    def test_auto_rule_code_first_rule(self):
        rule = CapitalizationRule.objects.create(
            categoryType='consumable', action='expense',
        )
        self.assertIsNotNone(rule.rule_code)

    def test_rule_str_includes_code(self):
        rule = CapitalizationRule.objects.create(
            categoryType='consumable', action='expense',
            rule_code='A', rule_label='Consumable Rule',
        )
        self.assertIn('Rule A', str(rule))

    def test_rule_ordering_by_priority(self):
        rule_b = CapitalizationRule.objects.create(
            categoryType='expendable', action='expense',
            priority=2, rule_code='B',
        )
        rule_a = CapitalizationRule.objects.create(
            categoryType='consumable', action='expense',
            priority=1, rule_code='A',
        )
        rules = list(get_active_rules())
        self.assertEqual(rules[0].rule_code, 'A')
        self.assertEqual(rules[1].rule_code, 'B')


# =============================================================================
# Rule A — Consumable Tests
# =============================================================================

class RuleATests(TestCase):
    """Rule A: Consumable items always expense."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Paper', category='Stationery',
            category_type='consumable', assetType='General',
            unit='Ream', status='Active', location='Store',
        )
        self.rule = CapitalizationRule.objects.create(
            rule_code='A', categoryType='consumable',
            action='expense', priority=1, rule_label='Consumable',
        )

    def test_consumable_returns_expense(self):
        result = classify_item(self.item, qty=10, unit_cost=Decimal('500'))
        self.assertEqual(result.suggested_action, 'expense')
        self.assertEqual(result.suggested_category_type, 'consumable')
        self.assertEqual(result.applied_rule, 'A')
        self.assertFalse(result.override_required)

    def test_consumable_with_high_value_still_expense(self):
        result = classify_item(self.item, qty=1000, unit_cost=Decimal('100000'))
        self.assertEqual(result.suggested_action, 'expense')


# =============================================================================
# Rule B — Expendable Tests
# =============================================================================

class RuleBTests(TestCase):
    """Rule B: Expendable items always expense."""

    def setUp(self):
        self.item = InventoryItem.objects.create(
            name='Lab Chemicals', category='Lab',
            category_type='expendable', assetType='General',
            unit='Liter', status='Active', location='Store',
        )
        self.rule = CapitalizationRule.objects.create(
            rule_code='B', categoryType='expendable',
            action='expense', priority=2, rule_label='Expendable',
        )

    def test_expendable_returns_expense(self):
        result = classify_item(self.item, qty=5, unit_cost=Decimal('2000'))
        self.assertEqual(result.suggested_action, 'expense')
        self.assertEqual(result.suggested_category_type, 'expendable')
        self.assertEqual(result.applied_rule, 'B')


# =============================================================================
# Rule C — Individual Capitalization Tests
# =============================================================================

class RuleCTests(TestCase):
    """Rule C: Individual capitalization for permanent/fixed_asset items."""

    def setUp(self):
        # Needs threshold >= 50000
        self.item = InventoryItem.objects.create(
            name='Office Desk', category='Furniture',
            category_type='permanent', assetType='General',
            unit='Unit', status='Active', location='Store',
            min_useful_life=60,
        )
        self.rule = CapitalizationRule.objects.create(
            rule_code='C', categoryType='permanent',
            minCost=Decimal('50000'), minUsefulLifeMonths=12,
            action='capitalize', priority=3, rule_label='Individual Cap',
        )

    def test_high_value_permanent_capitalizes(self):
        result = classify_item(self.item, qty=1, unit_cost=Decimal('75000'))
        self.assertEqual(result.suggested_action, 'capitalize')
        self.assertEqual(result.suggested_category_type, 'permanent')
        self.assertEqual(result.applied_rule, 'C')
        self.assertFalse(result.override_required)

    def test_low_value_permanent_does_not_capitalize(self):
        result = classify_item(self.item, qty=1, unit_cost=Decimal('10000'))
        # Should fall back to no match → prompt
        self.assertEqual(result.suggested_action, 'prompt')

    def test_fixed_asset_with_high_value_capitalizes(self):
        fa_item = InventoryItem.objects.create(
            name='Server', category='IT',
            category_type='fixed_asset', assetType='General',
            unit='Unit', status='Active', location='Server Room',
            min_useful_life=36,
        )
        result = classify_item(fa_item, qty=1, unit_cost=Decimal('200000'))
        self.assertEqual(result.suggested_action, 'capitalize')

    def test_prompt_action_when_rule_configured_as_prompt(self):
        prompt_rule = CapitalizationRule.objects.create(
            rule_code='C2', categoryType='permanent',
            minCost=Decimal('10000'), minUsefulLifeMonths=6,
            action='prompt', priority=4, rule_label='Manual Review',
        )
        result = classify_item(self.item, qty=1, unit_cost=Decimal('15000'))
        self.assertEqual(result.suggested_action, 'prompt')
        self.assertTrue(result.override_required)


# =============================================================================
# Rule D — Bulk/Grouped Capitalization Tests
# =============================================================================

class RuleDTests(TestCase):
    """Rule D: Bulk/grouped capitalization for multiple low-value items."""

    def setUp(self):
        # Use a permanent item with low useful life so Rule C doesn't match
        self.item = InventoryItem.objects.create(
            name='Office Chairs', category='Furniture',
            category_type='permanent', assetType='General',
            unit='Unit', status='Active', location='Store',
            min_useful_life=0,
        )
        self.rule = CapitalizationRule.objects.create(
            rule_code='D', categoryType='fixed_asset',
            bulkThreshold=5, bulkMateriality=Decimal('100000'),
            action='capitalize', priority=5, rule_label='Bulk Cap',
        )

    def test_bulk_with_high_qty_capitalizes(self):
        result = classify_item(self.item, qty=20, unit_cost=Decimal('10000'))
        self.assertEqual(result.suggested_action, 'capitalize')
        self.assertEqual(result.applied_rule, 'D')
        self.assertTrue(result.is_bulk)

    def test_single_item_does_not_trigger_bulk(self):
        result = classify_item(self.item, qty=1, unit_cost=Decimal('10000'))
        self.assertFalse(result.is_bulk)

    def test_bulk_below_threshold_does_not_trigger(self):
        result = classify_item(self.item, qty=3, unit_cost=Decimal('5000'))
        self.assertFalse(result.is_bulk)


# =============================================================================
# Full Classification Flow Tests
# =============================================================================

class ClassificationFlowTests(TestCase):
    """End-to-end tests for the complete classification pipeline."""

    def test_classification_creates_prompt(self):
        item = InventoryItem.objects.create(
            name='Test Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=10, unit_cost=Decimal('100'))
        prompt = log_classification_prompt(
            item=item, qty=10, unit_cost=Decimal('100'),
            classification=result, created_by='Tester',
        )
        self.assertIsNotNone(prompt.id)
        self.assertTrue(prompt.id.startswith('CAP-2026-'))
        self.assertEqual(prompt.item_code, item.id)
        self.assertEqual(prompt.approval_status, 'auto')

    def test_override_workflow_capitalize(self):
        item = InventoryItem.objects.create(
            name='Override Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('500'))
        prompt = log_classification_prompt(
            item=item, qty=1, unit_cost=Decimal('500'),
            classification=result, created_by='User1',
        )
        # Apply override to capitalize
        updated_prompt = apply_override(
            prompt_id=prompt.id,
            override_decision='capitalize',
            reason='Item should be capitalized for tracking',
            override_by='Manager',
            approval_status='approved',
            approved_by='Director',
        )
        self.assertEqual(updated_prompt.override_decision, 'capitalize')
        self.assertEqual(updated_prompt.approval_status, 'approved')
        self.assertEqual(updated_prompt.override_by, 'Manager')
        self.assertEqual(updated_prompt.approved_by, 'Director')
        self.assertIsNotNone(updated_prompt.override_at)
        # Item should be reclassified to fixed_asset
        item.refresh_from_db()
        self.assertEqual(item.category_type, 'fixed_asset')

    def test_override_workflow_expense(self):
        item = InventoryItem.objects.create(
            name='Expense Item', category='Test',
            category_type='permanent', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('500'))
        prompt = log_classification_prompt(
            item=item, qty=1, unit_cost=Decimal('500'),
            classification=result, created_by='User1',
        )
        updated_prompt = apply_override(
            prompt_id=prompt.id,
            override_decision='expense',
            reason='Low value item',
            override_by='Manager',
        )
        self.assertEqual(updated_prompt.override_decision, 'expense')
        # Item category_type stays as original since we overrode to expense
        item.refresh_from_db()
        self.assertEqual(item.category_type, 'permanent')

    def test_cannot_override_already_approved_prompt(self):
        item = InventoryItem.objects.create(
            name='Double Override', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('100'))
        prompt = log_classification_prompt(
            item=item, qty=1, unit_cost=Decimal('100'),
            classification=result, created_by='User1',
        )
        apply_override(
            prompt_id=prompt.id,
            override_decision='expense',
            reason='First override',
            override_by='Manager',
        )
        serializer = OverrideDecisionSerializer(data={
            'prompt_id': prompt.id,
            'override_decision': 'capitalize',
            'reason': 'Second override',
            'override_by': 'Auditor',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('already been approved', str(serializer.errors))


# =============================================================================
# Serializer Tests
# =============================================================================

class CapSerializerTests(TestCase):
    """Tests for capitalization serializer output."""

    def setUp(self):
        self.rule = CapitalizationRule.objects.create(
            rule_code='A', categoryType='consumable',
            action='expense', priority=1, rule_label='Consumable',
        )

    def test_rule_serializer_fields(self):
        serializer = CapitalizationRuleSerializer(self.rule)
        data = serializer.data
        self.assertIn('rule_code', data)
        self.assertIn('category_type_display', data)
        self.assertIn('action_display', data)

    def test_setting_serializer_fields(self):
        settings = get_cap_settings()
        serializer = CapitalizationSettingSerializer(settings)
        data = serializer.data
        self.assertIn('threshold', data)
        self.assertIn('bulk_materiality', data)
        self.assertIn('asset_classes', data)

    def test_classify_item_serializer_valid(self):
        item = InventoryItem.objects.create(
            name='Serializer Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        data = {
            'item_id': item.id,
            'qty': 5,
            'unit_cost': '100.00',
        }
        serializer = ClassifyItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        result = serializer.save()
        self.assertIn('prompt', result)
        self.assertIn('classification', result)

    def test_classify_item_serializer_invalid_item(self):
        data = {
            'item_id': 'NONEXISTENT',
            'qty': 1,
            'unit_cost': '100.00',
        }
        serializer = ClassifyItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_override_serializer_valid(self):
        item = InventoryItem.objects.create(
            name='Override Test', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('100'))
        prompt = log_classification_prompt(
            item=item, qty=1, unit_cost=Decimal('100'),
            classification=result, created_by='Test',
        )
        data = {
            'prompt_id': prompt.id,
            'override_decision': 'expense',
            'reason': 'Not needed',
            'override_by': 'Manager',
        }
        serializer = OverrideDecisionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_override_serializer_missing_reason(self):
        data = {
            'prompt_id': 'CAP-2026-00001',
            'override_decision': 'expense',
            'reason': '',
            'override_by': 'Manager',
        }
        serializer = OverrideDecisionSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class ApprovalEndpointTests(TestCase):
    """Tests for the OverrideApprovalView endpoint."""

    def setUp(self):
        from django.contrib.auth.models import User, Group
        self.user = User.objects.create_user(username='approver', password='pass')
        self.user.is_staff = True
        self.user.save()

    def test_approve_requires_attachment_for_capitalize(self):
        # create item and prompt
        item = InventoryItem.objects.create(
            name='Approve Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('100'))
        prompt = log_classification_prompt(item=item, qty=1, unit_cost=Decimal('100'), classification=result, created_by='Tester')
        # set override decision to capitalize and pending status
        prompt.override_decision = 'capitalize'
        prompt.approval_status = 'pending'
        prompt.save()

        self.client.force_login(self.user)
        url = f'/api/v1/storekeeper/stores/capitalization/prompts/{prompt.id}/approve/'
        resp = self.client.post(url, data={'approval_status': 'approved', 'approved_by': 'approver'}, content_type='application/json')
        self.assertEqual(resp.status_code, 400)

    def test_approve_with_attachment_succeeds(self):
        item = InventoryItem.objects.create(
            name='Approve Item 2', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        result = classify_item(item, qty=1, unit_cost=Decimal('100'))
        prompt = log_classification_prompt(item=item, qty=1, unit_cost=Decimal('100'), classification=result, created_by='Tester')
        prompt.override_decision = 'capitalize'
        prompt.approval_status = 'pending'
        prompt.save()

        # create attachment record
        from common.messaging.models import DocumentAttachment
        DocumentAttachment.objects.create(entity_type='capitalization_prompt', entity_id=str(prompt.id), file_path='x.pdf', uploaded_by='approver')

        self.client.force_login(self.user)
        url = f'/api/v1/storekeeper/stores/capitalization/prompts/{prompt.id}/approve/'
        resp = self.client.post(url, data={'approval_status': 'approved', 'approved_by': 'approver'}, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        prompt.refresh_from_db()
        self.assertEqual(prompt.approval_status, 'approved')