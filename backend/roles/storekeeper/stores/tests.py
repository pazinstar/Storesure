"""
Phase 1 — Foundation & Data Model: Unit tests for ItemTypeChoices enum and validation.
"""
from django.test import TestCase
from rest_framework.exceptions import ValidationError
from .models import InventoryItem, ItemTypeChoices
from .serializers import InventoryItemSerializer, VALID_ITEM_TYPES


class ItemTypeChoicesEnumTests(TestCase):
    """Verify that ItemTypeChoices contains exactly the 4 required types."""

    def test_enum_contains_exactly_four_types(self):
        expected_values = {'consumable', 'expendable', 'permanent', 'fixed_asset'}
        actual_values = {choice.value for choice in ItemTypeChoices}
        self.assertEqual(actual_values, expected_values)

    def test_enum_labels_are_readable(self):
        labels = {choice.label for choice in ItemTypeChoices}
        expected_labels = {'Consumable', 'Expendable', 'Permanent', 'Fixed Asset'}
        self.assertEqual(labels, expected_labels)

    def test_valid_item_types_set_matches_enum(self):
        enum_values = {choice.value for choice in ItemTypeChoices}
        self.assertEqual(VALID_ITEM_TYPES, enum_values)


class InventoryItemCategoryTypeFieldTests(TestCase):
    """Verify the new category_type field on InventoryItem."""

    def test_default_category_type_is_consumable(self):
        item = InventoryItem.objects.create(
            name='Test Item',
            category='Test',
            assetType='General',
            unit='Unit',
            status='Active',
            location='Main Store',
        )
        self.assertEqual(item.category_type, 'consumable')

    def test_explicit_category_type_saves_correctly(self):
        item = InventoryItem.objects.create(
            name='Permanent Item',
            category='Test',
            category_type='permanent',
            assetType='General',
            unit='Unit',
            status='Active',
            location='Main Store',
        )
        self.assertEqual(item.category_type, 'permanent')

    def test_fixed_asset_category_type_saves_correctly(self):
        item = InventoryItem.objects.create(
            name='Building',
            category='Infrastructure',
            category_type='fixed_asset',
            assetType='General',
            unit='Unit',
            status='Active',
            location='Campus',
        )
        self.assertEqual(item.category_type, 'fixed_asset')

    def test_expendable_category_type_saves_correctly(self):
        item = InventoryItem.objects.create(
            name='Stationery',
            category='Office',
            category_type='expendable',
            assetType='General',
            unit='Pack',
            status='Active',
            location='Store',
        )
        self.assertEqual(item.category_type, 'expendable')


class InventoryItemSerializerValidationTests(TestCase):
    """Verify serializer validation rejects unknown types."""

    def setUp(self):
        self.valid_data = {
            'name': 'Valid Item',
            'category': 'Test',
            'assetType': 'General',
            'unit': 'Unit',
            'status': 'Active',
            'location': 'Main Store',
        }

    def test_valid_category_type_accepts_consumable(self):
        data = {**self.valid_data, 'category_type': 'consumable'}
        serializer = InventoryItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_valid_category_type_accepts_fixed_asset(self):
        data = {**self.valid_data, 'category_type': 'fixed_asset'}
        serializer = InventoryItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_valid_category_type_accepts_permanent(self):
        data = {**self.valid_data, 'category_type': 'permanent'}
        serializer = InventoryItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_valid_category_type_accepts_expendable(self):
        data = {**self.valid_data, 'category_type': 'expendable'}
        serializer = InventoryItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_invalid_category_type_rejected(self):
        """Unknown types should raise a validation error."""
        data = {**self.valid_data, 'category_type': 'invalid_type'}
        serializer = InventoryItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category_type', serializer.errors)
        # DRF model-level choices validation catches this before custom validator
        self.assertIn('not a valid choice', str(serializer.errors['category_type']).lower())

    def test_blank_category_type_uses_default(self):
        """If category_type is not provided, model default 'consumable' applies."""
        data = {**self.valid_data}
        serializer = InventoryItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.category_type, 'consumable')

    def test_case_sensitive_validation(self):
        """Validation should be case-sensitive; 'Consumable' with capital C is invalid."""
        data = {**self.valid_data, 'category_type': 'Consumable'}
        serializer = InventoryItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('category_type', serializer.errors)


class InventoryItemMinUsefulLifeFieldTests(TestCase):
    """Verify the optional min_useful_life and default_custodian_required fields."""

    def test_min_useful_life_defaults_to_zero(self):
        item = InventoryItem.objects.create(
            name='Test', category='Test', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        self.assertEqual(item.min_useful_life, 0)

    def test_min_useful_life_can_be_set(self):
        item = InventoryItem.objects.create(
            name='Test', category='Test', assetType='General',
            unit='Unit', status='Active', location='Store',
            min_useful_life=60,
        )
        self.assertEqual(item.min_useful_life, 60)

    def test_default_custodian_required_defaults_to_false(self):
        item = InventoryItem.objects.create(
            name='Test', category='Test', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        self.assertFalse(item.default_custodian_required)

    def test_default_custodian_required_can_be_set(self):
        item = InventoryItem.objects.create(
            name='Test', category='Test', assetType='General',
            unit='Unit', status='Active', location='Store',
            default_custodian_required=True,
        )
        self.assertTrue(item.default_custodian_required)


class Phase1EmptyModelTests(TestCase):
    """Verify that the new Phase 1 tables exist and can be created (migrations only)."""

    def test_s2_ledger_model_exists(self):
        from .models import S2Ledger
        record = S2Ledger.objects.create(
            itemCode='ITM001', itemName='Test', unit='Unit',
            openingBalance=10, closingBalance=10,
        )
        self.assertIsNotNone(record.id)
        self.assertEqual(record.itemCode, 'ITM001')

    def test_fixed_asset_model_exists(self):
        from .models import FixedAsset
        asset = FixedAsset.objects.create(
            name='School Van', category='Vehicle',
            purchaseCost=5000000, currentValue=5000000,
        )
        self.assertIsNotNone(asset.id)
        self.assertIsNotNone(asset.assetCode)
        self.assertEqual(asset.status, 'active')

    def test_capitalization_rule_model_exists(self):
        from .models import CapitalizationRule
        rule = CapitalizationRule.objects.create(
            categoryType='fixed_asset',
            minCost=50000,
            minUsefulLifeMonths=12,
        )
        self.assertIsNotNone(rule.id)
        self.assertTrue(rule.isActive)

    def test_lso_record_model_exists(self):
        from .models import LsoRecord
        lso = LsoRecord.objects.create(
            description='Test LSO',
            supplierName='Test Supplier',
            totalValue=100000,
        )
        self.assertIsNotNone(lso.id)
        self.assertIsNotNone(lso.lsoNumber)
        self.assertEqual(lso.status, 'draft')