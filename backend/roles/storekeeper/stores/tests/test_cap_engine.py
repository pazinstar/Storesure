from decimal import Decimal
from django.test import TestCase
from roles.storekeeper.stores.models import InventoryItem, CapitalizationPrompt
from roles.storekeeper.stores.capitalization_engine import classify_item, log_classification_prompt


class CapitalizationEngineTests(TestCase):
    def setUp(self):
        InventoryItem.objects.create(id='ITMTEST', name='Test Item', category='Test', category_type='permanent', min_useful_life=24)
        self.item = InventoryItem.objects.get(id='ITMTEST')

    def test_individual_capitalization(self):
        result = classify_item(self.item, qty=1, unit_cost=Decimal('60000'))
        self.assertEqual(result.suggested_action, 'capitalize')

    def test_log_prompt(self):
        result = classify_item(self.item, qty=2, unit_cost=Decimal('40000'))
        prompt = log_classification_prompt(item=self.item, qty=2, unit_cost=Decimal('40000'), classification=result, created_by='tester')
        self.assertIsInstance(prompt, CapitalizationPrompt)


class OverrideManagerTests(TestCase):
    def test_override_requires_reason(self):
        # basic smoke test for override manager presence
        from roles.storekeeper.stores.override_manager import OverrideManager
        om = OverrideManager()
        self.assertTrue(callable(om.request_override))
