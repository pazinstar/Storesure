from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse

from .models import InventoryItem
from .capitalization_engine import get_cap_settings


class CapitalizationAPITests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_get_and_put_settings(self):
        url = reverse('storekeeper-cap-settings')
        # GET
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('threshold', data)
        # PUT update
        update = {'threshold': '75000.00', 'bulk_materiality': '250000.00'}
        resp2 = self.client.put(url, data=update, content_type='application/json')
        self.assertIn(resp2.status_code, (200, 201))
        data2 = resp2.json()
        self.assertEqual(str(data2.get('threshold')), '75000.00')

    def test_classify_endpoint_creates_prompt_and_returns_classification(self):
        item = InventoryItem.objects.create(
            name='API Test Item', category='Test',
            category_type='consumable', assetType='General',
            unit='Unit', status='Active', location='Store',
        )
        url = reverse('storekeeper-cap-classify')
        payload = {'item_id': item.id, 'qty': 10, 'unit_cost': '100.00', 'created_by': 'tester'}
        resp = self.client.post(url, data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn('prompt', data)
        self.assertIn('classification', data)
        self.assertIn('suggested_action', data['classification'])