from django.test import TestCase
from decimal import Decimal
from datetime import date

from roles.storekeeper.stores.models import FixedAsset
from common.messaging.models import DocumentAttachment


class DisposalAttachmentTests(TestCase):
    def setUp(self):
        self.asset = FixedAsset.objects.create(
            assetCode='TEST-D1',
            name='Disposal Asset',
            qty=1,
            total_cost=Decimal('100.00'),
            residual_value=Decimal('0.00'),
            useful_life=5,
            depreciation_method='straight_line',
            accumulated_depreciation=Decimal('0.00'),
            nbv=Decimal('100.00'),
            acq_date=date(2020,1,1),
        )

    def test_disposal_requires_attachment(self):
        url = f'/api/v1/storekeeper/stores/assets/{self.asset.id}/dispose/'
        payload = {
            'disposal_status': 'disposed',
            'disposal_date': '2026-05-01',
            'disposal_reason': 'End of life',
        }
        resp = self.client.post(url, data=payload, content_type='application/json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Supporting attachments required', str(resp.content))

    def test_disposal_with_attachment_succeeds(self):
        # attach a supporting document
        DocumentAttachment.objects.create(entity_type='fixed_asset', entity_id=str(self.asset.id), file_path='/tmp/doc.pdf', doc_type='disposal', uploaded_by='tester')
        url = f'/api/v1/storekeeper/stores/assets/{self.asset.id}/dispose/'
        payload = {
            'disposal_status': 'disposed',
            'disposal_date': '2026-05-01',
            'disposal_reason': 'End of life',
        }
        resp = self.client.post(url, data=payload, content_type='application/json')
        self.assertIn(resp.status_code, (200, 201))
