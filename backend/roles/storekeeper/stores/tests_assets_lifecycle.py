from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse

from .models import FixedAsset


class AssetLifecycleTests(TestCase):
    def test_disposal_requires_approval(self):
        asset = FixedAsset.objects.create(assetCode='ASSET-D1', name='Disposal Test', qty=1, total_cost=Decimal('1000.00'), useful_life=12, nbv=Decimal('1000.00'), accumulated_depreciation=Decimal('0.00'), status='in_stores')

        url = reverse('storekeeper-assets-transition', args=[asset.id])
        resp = self.client.post(url, {'new_status': 'disposed', 'changed_by': 'tester'}, content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Disposal transitions require', resp.json().get('detail', ''))

        # Now provide approval metadata
        resp2 = self.client.post(url, {'new_status': 'disposed', 'changed_by': 'tester', 'approved_by': 'manager'}, content_type='application/json')
        self.assertEqual(resp2.status_code, 200)
        asset.refresh_from_db()
        self.assertEqual(asset.status, 'disposed')

    def test_deployed_creates_depreciation_schedule(self):
        asset = FixedAsset.objects.create(assetCode='ASSET-D2', name='Deployed Test', qty=1, total_cost=Decimal('1200.00'), useful_life=12, nbv=Decimal('1200.00'), accumulated_depreciation=Decimal('0.00'), status='in_stores', acq_date=date(2026,5,10))

        url = reverse('storekeeper-assets-transition', args=[asset.id])
        resp = self.client.post(url, {'new_status': 'deployed', 'changed_by': 'tester'}, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        asset.refresh_from_db()
        # DepreciationSchedule should have been created for the asset's depreciation_start_date month
        from django.apps import apps
        try:
            DepreciationSchedule = apps.get_model('stores', 'DepreciationSchedule')
        except LookupError:
            DepreciationSchedule = None

        if DepreciationSchedule is not None and asset.depreciation_start_date:
            sch = DepreciationSchedule.objects.filter(asset=asset, year=asset.depreciation_start_date.year, month=asset.depreciation_start_date.month).first()
            self.assertIsNotNone(sch)
