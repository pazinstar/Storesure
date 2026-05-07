from django.test import TestCase
from rest_framework.exceptions import ValidationError
from .serializers import InventoryItemSerializer

class ClassificationTests(TestCase):
    def test_serializer_rejects_unknown_category_type(self):
        payload = {
            'id': 'TST001',
            'name': 'Test Item',
            'category': 'Testing',
            'category_type': 'unknown_type',
            'assetType': 'Misc',
            'unit': 'Unit',
            'minimumStockLevel': 0,
            'reorderLevel': 0,
            'min_useful_life': 0,
            'openingBalance': 0,
            'status': 'Available',
            'location': 'Main Store'
        }
        serializer = InventoryItemSerializer(data=payload)
        with self.assertRaises(Exception):
            serializer.is_valid(raise_exception=True)