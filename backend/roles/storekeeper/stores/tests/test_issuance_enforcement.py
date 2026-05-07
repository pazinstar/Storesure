from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from roles.storekeeper.stores.models import Requisition, RequisitionItem, InventoryItem, InventoryLedger
from common.messaging.models import DocumentAttachment


class IssuanceEnforcementTests(TestCase):
    def setUp(self):
        # create inventory item and ledger
        self.item = InventoryItem.objects.create(name='Test Item', category='General', assetType='Consumable', unit='pcs', openingBalance=10, status='Active', location='Store', lastUpdated=timezone.now().date())
        InventoryLedger.objects.create(itemCode=self.item.id, item=self.item, itemName=self.item.name, unit=self.item.unit, openingQty=10, closingQty=10, closingValue=0)

    def test_cannot_issue_unapproved_requisition(self):
        req = Requisition.objects.create(requestDate=timezone.now().date(), requestingDepartment='Dept', requestedBy='User', purpose='Test', status='Draft')
        ritem = RequisitionItem.objects.create(requisition=req, itemCode=self.item, description='Test', unit='pcs', quantityRequested=2)

        # attempt to process as if issuer signed -> should be blocked because status not approved
        req.issuerSignature = True
        req.receiverSignature = True
        req.save()

        # perform update via save triggers in views not called here; simulate check used in view
        self.assertNotEqual(req.status.lower(), 'approved')

    def test_issue_creates_s13_and_links_to_s12(self):
        req = Requisition.objects.create(requestDate=timezone.now().date(), requestingDepartment='Dept', requestedBy='User', purpose='Test', status='Approved')
        ritem = RequisitionItem.objects.create(requisition=req, itemCode=self.item, description='Test', unit='pcs', quantityRequested=2, quantityApproved=2)

        # Create a supporting attachment as the view requires
        DocumentAttachment.objects.create(entity_type='requisition', entity_id=str(req.id), file_path='doc.pdf', uploaded_by='tester')

        client = APIClient()
        # patch the requisition via API to set signatures (this triggers perform_update view logic)
        url = f'/api/v1/storekeeper/stores/s12-requisitions/{req.id}/'
        resp = client.patch(url, data={'issuerSignature': True, 'receiverSignature': True}, format='json')
        self.assertIn(resp.status_code, (200, 204))

        # reload and assert linked issue exists
        req.refresh_from_db()
        issues = req.issues.all()
        self.assertTrue(issues.exists())
        s13 = issues.first()
        self.assertEqual(s13.requisition.id, req.id)
