from rest_framework import generics
from decimal import Decimal
from .models import (
    InventoryItem, 
    Delivery, 
    Requisition, 
    IssueHistory, 
    ReceivingHistory
)
from .serializers import (
    InventoryItemSerializer,
    DeliverySerializer,
    RequisitionSerializer,
    IssueHistorySerializer,
    ReceivingHistorySerializer
)

import csv
from django.http import HttpResponse
from django.utils import timezone

class InventoryListView(generics.ListCreateAPIView):
    queryset = InventoryItem.objects.all().order_by('-createdAt', '-id')
    serializer_class = InventoryItemSerializer

    def perform_create(self, serializer):
        # Save item and run auto-classification (non-blocking)
        item = serializer.save()
        try:
            from .capitalization_engine import classify_item, log_classification_prompt
            created_by = getattr(self.request, 'user', None)
            username = created_by.username if created_by and not created_by.is_anonymous else ''
            classification = classify_item(item, qty=1, unit_cost=Decimal('0'), created_by=username)
            log_classification_prompt(
                item=item,
                qty=1,
                unit_cost=Decimal('0'),
                classification=classification,
                created_by=username,
            )
        except Exception:
            import logging
            logging.getLogger('storesure.cap').exception('Failed to auto-classify item on create: %s', getattr(item, 'id', 'n/a'))


class InventoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    lookup_field = 'id'

class StoreItemListView(generics.ListAPIView):
    from .serializers import StoreItemSerializer
    queryset = InventoryItem.objects.all().order_by('-createdAt')#, '-id')
    serializer_class = StoreItemSerializer

class InventoryExportView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['Item Code', 'Item Name', 'Category', 'Asset Type', 'Unit', 'Min Level', 'Reorder Level', 'Current Bal.', 'Status'])

        items = InventoryItem.objects.all()
        for item in items:
            writer.writerow([
                item.id,
                item.name,
                item.category,
                item.assetType,
                item.unit,
                item.minimumStockLevel,
                item.reorderLevel,
                item.openingBalance,
                item.status
            ])

        return response

from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import logging

from .models import InventorySetting

from django.db.models import Sum


class ReceivingStatsView(APIView):
    """GET /receive/stats/ - return counts and totals for GRN dashboard cards"""
    def get(self, request, *args, **kwargs):
        from django.utils import timezone
        now = timezone.now()
        year = now.year
        month = now.month

        this_month_count = ReceivingHistory.objects.filter(date__year=year, date__month=month).count()
        drafts_count = ReceivingHistory.objects.filter(status__iexact='Draft').count()
        pending_count = ReceivingHistory.objects.filter(status__iexact='Submitted').count()
        posted_count = ReceivingHistory.objects.filter(status__iexact='Posted').count()

        total_value_agg = ReceivingHistory.objects.aggregate(total=Sum('totalValue'))
        total_value = total_value_agg.get('total') or 0

        return Response({
            'thisMonth': this_month_count,
            'drafts': drafts_count,
            'pending': pending_count,
            'posted': posted_count,
            'totalValue': float(total_value),
        })


class IssueStatsView(APIView):
    """GET /issue/stats/ - return counts and totals for Issue (S13) dashboard cards"""
    def get(self, request, *args, **kwargs):
        from django.utils import timezone
        now = timezone.now()
        year = now.year
        month = now.month

        this_month_count = IssueHistory.objects.filter(date__year=year, date__month=month).count()
        pending_count = IssueHistory.objects.filter(status__iexact='Pending').count()
        # distinct departments
        departments_count = IssueHistory.objects.values('department').distinct().count()
        # total items issued (sum of items field)
        items_agg = IssueHistory.objects.aggregate(total=Sum('items'))
        items_issued = items_agg.get('total') or 0

        return Response({
            'thisMonth': this_month_count,
            'pending': pending_count,
            'departments': departments_count,
            'itemsIssued': int(items_issued),
        })

class InventorySettingsView(APIView):
    def get(self, request, *args, **kwargs):
        settings_cache = {
            "categories": ["All Categories", "Stationery", "IT Supplies", "Cleaning", "Laboratory", "Sports"],
            "units": ["Ream", "Box", "Unit", "Liter", "Piece", "Pack", "Kg", "Meter"],
            "locationTypes": ["Stores", "Library", "Department"],
            "storeLocations": ["Main Store", "Sports Store", "Science Store", "Kitchen Store", "Maintenance Store"],
            "libraryLocations": ["Main Library", "Junior Library", "Reference Section", "Archives"],
            "departmentLocations": ["Administration", "Science Department", "Arts Department", "Technical Department", "Sports Department"],
            "assetTypes": ["Consumable", "Permanent", "Fixed Asset"],
            "itemTypes": [
                {"value": "consumable", "label": "Consumable"},
                {"value": "expendable", "label": "Expendable"},
                {"value": "permanent", "label": "Permanent"},
                {"value": "fixed_asset", "label": "Fixed Asset"},
            ],
            "paymentTermsOptions": [
                { "value": "cod", "label": "Cash on Delivery" },
                { "value": "net30", "label": "Net 30 Days" },
                { "value": "net60", "label": "Net 60 Days" },
                { "value": "advance50", "label": "50% Advance" },
            ],
            "adjustmentReasons": [
                "Count correction",
                "Damaged goods",
                "Breakage",
                "Opening balance error",
                "Expired items",
                "Lost items",
                "Found items",
                "System error correction",
                "Other",
            ]
        }
        
        settings_map = {}
        db_settings = InventorySetting.objects.all()
        for setting in db_settings:
            settings_map[setting.key] = setting.value
        
        # Merge DB with defaults where missing (so UI never breaks before scripts run)
        for key, val in settings_cache.items():
            if key not in settings_map:
                settings_map[key] = val
                
        return Response(settings_map)

class RequestersListView(APIView):
    """Return a lightweight list of system users suitable for 'Requested by' dropdown."""
    def get(self, request, *args, **kwargs):
        from roles.admin.users.models import SystemUser
        # Only active users
        users = SystemUser.objects.filter(status__iexact='active').order_by('first_name')
        result = []
        for u in users:
            result.append({'id': u.id, 'name': f"{u.first_name} {u.last_name}".strip(), 'email': u.email})
        return Response(result)


class DashboardTransactionsView(APIView):
    """Return a short list of recent transactions (S11 receipts and S13 issues)"""
    def get(self, request, *args, **kwargs):
        # Recent Deliveries (S11/GRN)
        deliveries = Delivery.objects.all().order_by('-createdAt')[:10]
        delivery_rows = []
        for d in deliveries:
            items = d.items if isinstance(d.items, list) else []
            qty = 0
            if isinstance(items, list):
                try:
                    qty = sum(int(it.get('quantity', it.get('qty', 0)) or 0) for it in items)
                except Exception:
                    qty = len(items)
            delivery_rows.append({
                'id': d.id,
                'type': 'S11',
                'item': d.lpoReference or (items[0].get('itemName') if items else 'Delivery'),
                'qty': qty,
                'date': d.dateTime.isoformat() if d.dateTime else (d.createdAt.isoformat() if d.createdAt else ''),
                'status': d.status or 'Completed'
            })

        # Recent Issues (S13)
        issues = IssueHistory.objects.all().order_by('-createdAt')[:10]
        issue_rows = []
        for i in issues:
            issue_rows.append({
                'id': i.id,
                'type': 'S13',
                'item': i.department or 'Issue',
                'qty': int(i.items or 0),
                'date': i.date.isoformat() if i.date else (i.createdAt.isoformat() if i.createdAt else ''),
                'status': i.status or 'Completed'
            })

        # Merge and sort by date (descending)
        rows = sorted(delivery_rows + issue_rows, key=lambda r: r.get('date') or '', reverse=True)
        return Response(rows[:10])


class DashboardLowStockView(APIView):
    """Return a list of low stock items for dashboard"""
    def get(self, request, *args, **kwargs):
        # Consider items whose openingBalance <= minimumStockLevel or reorderLevel
        items = InventoryItem.objects.filter(openingBalance__lte=models.F('minimumStockLevel')).order_by('openingBalance')[:20]
        result = []
        for it in items:
            result.append({
                'id': it.id,
                'name': it.name,
                'minimum': it.minimumStockLevel,
                'unit': it.unit,
                'current': it.openingBalance
            })
        return Response(result)


class DashboardStatsView(APIView):
    """Return aggregated stats for dashboard cards"""
    def get(self, request, *args, **kwargs):
        from django.db.models import Count

        total_items = InventoryItem.objects.count()
        low_stock_count = InventoryItem.objects.filter(openingBalance__lte=models.F('minimumStockLevel')).count()

        from django.utils import timezone
        now = timezone.now()
        year = now.year
        month = now.month

        s11_count = ReceivingHistory.objects.filter(date__year=year, date__month=month).count()
        s13_count = IssueHistory.objects.filter(date__year=year, date__month=month).count()

        # Stock value from InventoryLedger closingValue
        try:
            from .models import InventoryLedger
            from django.db.models import Sum
            sv = InventoryLedger.objects.aggregate(total=Sum('closingValue')).get('total') or 0
        except Exception:
            sv = 0

        categories_count = InventoryItem.objects.values('category').distinct().count()
        pending_issues = IssueHistory.objects.filter(status__iexact='Pending').count()

        return Response({
            'totalItems': {'value': str(total_items), 'trend': '', 'trendUp': True},
            'lowStockItems': {'value': str(low_stock_count), 'trend': '', 'trendUp': False},
            's11ThisMonth': {'value': str(s11_count), 'trend': '', 'trendUp': True},
            's13ThisMonth': {'value': str(s13_count), 'trend': '', 'trendUp': True},
            'stockValue': f"KES {float(sv):,.2f}",
            'categories': str(categories_count),
            'pendingIssues': str(pending_issues),
        })

class DeliveriesListView(generics.ListCreateAPIView):
    queryset = Delivery.objects.all().order_by('-createdAt', '-id')
    serializer_class = DeliverySerializer

class DeliveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    lookup_field = 'id'

class DeliveryUpdateItemsView(generics.UpdateAPIView):
    queryset = Delivery.objects.all()
    from .serializers import DeliveryItemsUpdateSerializer
    serializer_class = DeliveryItemsUpdateSerializer
    lookup_field = 'id'

class DeliverySubmitDecisionView(generics.UpdateAPIView):
    queryset = Delivery.objects.all()
    from .serializers import DeliveryDecisionUpdateSerializer
    serializer_class = DeliveryDecisionUpdateSerializer
    lookup_field = 'id'

    def perform_update(self, serializer):
        decision = serializer.validated_data.get('decision')
        # Map decision to status if required, e.g., "accept_all" -> "Accepted"
        status_map = {
            'accept_all': 'Accepted',
            'partial_accept': 'Partial Acceptance',
            'reject_all': 'Rejected'
        }
        if decision in status_map:
            # Save status explicitly via serializer.save to ensure it is persisted
            serializer.save(status=status_map[decision])
        else:
            serializer.save()

class DeliverySignDecisionView(APIView):
    def post(self, request, pk, format=None):
        from .models import Delivery, InventoryLedger, LedgerReceipt, InventoryItem
        from rest_framework import status
        import json, uuid

        try:
            delivery = Delivery.objects.get(id=pk)
        except Delivery.DoesNotExist:
            return Response({'error': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)

        member_id = request.data.get('memberId', '')
        member_name = request.data.get('memberName', '')
        member_role = request.data.get('memberRole', '')

        # Create or update signature object
        new_signature = {
            'memberId': member_id,
            'memberName': member_name,
            'memberRole': member_role,
            'signed': True,
            'signedAt': timezone.now().isoformat(),
            'confirmed': True
        }

        # Check if the role already signed to update it, or append
        signatures = delivery.signatures if isinstance(delivery.signatures, list) else []

        updated = False
        for sig in signatures:
            if sig.get('memberRole') == member_role:
                sig.update(new_signature)
                updated = True
                break

        if not updated:
            signatures.append(new_signature)

        delivery.signatures = signatures

        # Check if all 3 roles have signed
        roles_required = {'Storekeeper', 'Bursar', 'Headteacher'}
        signed_roles = {sig.get('memberRole') for sig in signatures if sig.get('signed')}

        if roles_required.issubset(signed_roles):
            delivery.inspectionCompletedAt = timezone.now()
            delivery.status = 'Accepted'

            # Government Ledger Generation Logic
            if not delivery.grnGenerated:
                with transaction.atomic():
                    delivery.grnGenerated = True
                    delivery.grnId = f"GRN-{timezone.now().year}-{str(uuid.uuid4())[:4].upper()}"

                    items = delivery.items if isinstance(delivery.items, list) else []
                    if isinstance(items, str):
                        try:
                            items = json.loads(items)
                        except Exception:
                            items = []

                    for item_data in items:
                        item_code = item_data.get('itemCode') or item_data.get('id')
                        try:
                            qty = int(item_data.get('quantity', item_data.get('qty', 0)))
                        except (ValueError, TypeError):
                            qty = 0
                        try:
                            unit_cost = float(item_data.get('unitPrice', item_data.get('unitCost', item_data.get('rate', 0))))
                        except (ValueError, TypeError):
                            unit_cost = 0

                        if not item_code or qty <= 0:
                            continue

                        inventory_item = InventoryItem.objects.filter(id=item_code).first()
                        item_name = inventory_item.name if inventory_item else item_data.get('itemName', item_code)
                        unit = inventory_item.unit if inventory_item else item_data.get('unit', 'Unit')

                        ledger = InventoryLedger.objects.select_for_update().filter(itemCode=item_code).first()
                        if not ledger:
                            ledger = InventoryLedger.objects.create(
                                itemCode=item_code,
                                item=inventory_item if inventory_item else None,
                                itemName=item_name,
                                unit=unit,
                                openingQty=0, openingValue=0,
                                totalReceiptsQty=0, totalReceiptsValue=0,
                                totalIssuesQty=0, totalIssuesValue=0,
                                closingQty=0, closingValue=0,
                            )

                        new_balance = ledger.closingQty + qty
                        total_cost = qty * unit_cost

                        LedgerReceipt.objects.create(
                            ledger=ledger,
                            date=timezone.now().date(),
                            grnNo=delivery.grnId,
                            qty=qty,
                            unitCost=unit_cost,
                            totalCost=total_cost,
                            supplierName=delivery.supplierName,
                            requisitionNo=delivery.lpoReference,
                            balanceInStock=new_balance,
                            signatures=json.dumps(signatures)
                        )

                        ledger.totalReceiptsQty += qty
                        ledger.totalReceiptsValue += total_cost
                        ledger.closingQty = new_balance
                        ledger.closingValue += total_cost
                        ledger.save()

                        # Keep InventoryItem.openingBalance in sync with ledger closing quantity
                        try:
                            inv_item = None
                            if ledger.item:
                                inv_item = ledger.item
                            else:
                                from .models import InventoryItem
                                inv_item = InventoryItem.objects.filter(id=ledger.itemCode).first()
                            if inv_item:
                                inv_item.openingBalance = ledger.closingQty
                                inv_item.save()
                        except Exception:
                            # Do not block the main flow if inventory sync fails
                            pass

        delivery.save()

        from .serializers import DeliverySerializer
        serializer = DeliverySerializer(delivery)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RequisitionsListView(generics.ListAPIView):
    queryset = Requisition.objects.all()
    serializer_class = RequisitionSerializer

class IssueHistoryListView(generics.ListCreateAPIView):
    queryset = IssueHistory.objects.all().order_by('-createdAt', '-id')
    serializer_class = IssueHistorySerializer

    def perform_create(self, serializer):
        try:
            logging.getLogger('django.request').debug(f"Incoming S13 POST data: {self.request.data}")
        except Exception:
            pass
        serializer.save()

class ReceivingHistoryListView(generics.ListCreateAPIView):
    queryset = ReceivingHistory.objects.all().order_by('-createdAt', '-id')
    serializer_class = ReceivingHistorySerializer

class S12RequisitionListCreateView(generics.ListCreateAPIView):
    from .serializers import S12RequisitionSerializer
    queryset = Requisition.objects.all().order_by('-createdAt', '-id')
    serializer_class = S12RequisitionSerializer

class S12RequisitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    from .serializers import S12RequisitionSerializer
    queryset = Requisition.objects.all()
    serializer_class = S12RequisitionSerializer
    lookup_field = 'id'

    def perform_update(self, serializer):
        from django.utils import timezone
        from .models import InventoryLedger, LedgerIssue, IssueHistory
        from rest_framework.exceptions import ValidationError

        instance = self.get_object()
        was_not_fully_signed = not (instance.receiverSignature and instance.issuerSignature)

        updated_instance = serializer.save()

        is_fully_signed = updated_instance.receiverSignature and updated_instance.issuerSignature

        # When signatures change to issuing state, generate immutable LedgerIssue entries
        # Process either when both signatures are now present, or when issuer signature was newly applied.
        # Avoid double-processing by checking for existing LedgerIssue rows for this requisition number.
        from .models import LedgerIssue
        should_process = False
        if was_not_fully_signed and is_fully_signed:
            should_process = True
        else:
            # issuerSignature newly applied (even if receiverSignature not set)
            if (not instance.issuerSignature) and updated_instance.issuerSignature:
                # Only process if no ledger issues exist for this requisition
                existing = LedgerIssue.objects.filter(requisitionNo=updated_instance.s12Number).exists()
                if not existing:
                    should_process = True

        from common.messaging.models import DocumentAttachment

        if should_process:
            # Require supporting attachments for requisition processing (e.g., approvals/issuance)
            has_attachments = DocumentAttachment.objects.filter(entity_type__iexact='requisition', entity_id=str(updated_instance.id)).exists()
            if not has_attachments:
                from rest_framework import status
                return Response({'error': 'Supporting attachments required for requisition approval/processing. Attach at least one document.'}, status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                s13 = IssueHistory.objects.create(
                    date=timezone.now().date(),
                    department=updated_instance.requestingDepartment,
                    requestedBy=updated_instance.requestedBy,
                    items=updated_instance.items.count(),
                    status="Issued"
                )

                for req_item in updated_instance.items.all():
                    qty = req_item.quantityIssued if req_item.quantityIssued > 0 else req_item.quantityApproved

                    if qty > 0 and req_item.itemCode:
                        item_code = req_item.itemCode.id
                        unit_cost = float(req_item.unitPrice)
                        total_cost = qty * unit_cost

                        # Lock existing ledger row if present
                        ledger = InventoryLedger.objects.select_for_update().filter(itemCode=item_code).first()
                        if not ledger:
                            # Create ledger and link to item
                            ledger = InventoryLedger.objects.create(
                                itemCode=item_code,
                                item=req_item.itemCode,
                                itemName=req_item.itemCode.name,
                                unit=req_item.unit,
                                openingQty=0, openingValue=0,
                                totalReceiptsQty=0, totalReceiptsValue=0,
                                totalIssuesQty=0, totalIssuesValue=0,
                                closingQty=0, closingValue=0,
                            )

                        new_balance = ledger.closingQty - qty

                        if new_balance < 0:
                            raise ValidationError(
                                f"Negative inventory balance prevented for {req_item.itemCode.name}. "
                                f"Available: {ledger.closingQty}, issuing: {qty}."
                            )

                        sig_str = f"Storekeeper: Yes | Recipient ({updated_instance.requestedBy}): Yes"

                        LedgerIssue.objects.create(
                            ledger=ledger,
                            date=timezone.now().date(),
                            s13No=s13.id,
                            qty=qty,
                            dept=updated_instance.requestingDepartment,
                            unitCost=unit_cost,
                            totalCost=total_cost,
                            requisitionNo=updated_instance.s12Number,
                            balanceInStock=new_balance,
                            signature=sig_str
                        )

                        ledger.totalIssuesQty += qty
                        ledger.totalIssuesValue += total_cost
                        ledger.closingQty = new_balance
                        ledger.closingValue -= total_cost
                        ledger.save()

                        # Keep InventoryItem.openingBalance in sync with ledger closing quantity
                        try:
                            inv_item = None
                            if ledger.item:
                                inv_item = ledger.item
                            else:
                                from .models import InventoryItem
                                inv_item = InventoryItem.objects.filter(id=ledger.itemCode).first()
                            if inv_item:
                                inv_item.openingBalance = ledger.closingQty
                                inv_item.save()
                        except Exception:
                            # Do not block the main flow if inventory sync fails
                            pass

                updated_instance.status = "Fully Issued"
                updated_instance.save()
                

class ReceivingHistoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ReceivingHistory.objects.all()
    serializer_class = ReceivingHistorySerializer
    lookup_field = 'id'

from .models import (
    Supplier,
    PurchaseOrder,
    RoutineIssueAuthority,
    InventoryLedger,
    StoreReport
)
from .serializers import (
    SupplierSerializer,
    PurchaseOrderSerializer,
    RoutineIssueAuthoritySerializer,
    InventoryLedgerSerializer,
    StoreReportSerializer
)

class SupplierListView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all().order_by('-createdAt')
    serializer_class = SupplierSerializer


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    lookup_field = 'id'

class LpoListCreateView(generics.ListCreateAPIView):
    from .serializers import PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all().order_by('-createdAt', '-id')
    serializer_class = PurchaseOrderSerializer

class LpoDetailView(generics.RetrieveUpdateDestroyAPIView):
    from .serializers import PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    lookup_field = 'id'

    def perform_update(self, serializer):
        # Enforce attachments when marking LPO as Approved
        from common.messaging.models import DocumentAttachment
        from rest_framework import status

        status_val = serializer.validated_data.get('status')
        instance = self.get_object()
        # If request aims to set status to Approved and it wasn't Approved before, require attachments
        if status_val and status_val.lower() == 'approved' and (not instance.status or instance.status.lower() != 'approved'):
            has_attachments = DocumentAttachment.objects.filter(entity_type__iexact='purchase_order', entity_id=str(instance.id)).exists()
            if not has_attachments:
                return Response({'error': 'Supporting attachments required to approve Purchase Order. Attach at least one document.'}, status=status.HTTP_400_BAD_REQUEST)

        return super().perform_update(serializer)


class LpoSendView(APIView):
    """POST /lpos/<id>/send/ -- mark LPO as sent and send notification email to supplier"""
    def post(self, request, id, format=None):
        from rest_framework import status
        try:
            po = PurchaseOrder.objects.get(id=id)
        except PurchaseOrder.DoesNotExist:
            return Response({'detail': 'Purchase order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow sending even when draft
        po.status = 'Sent'
        po.save()

        # Attempt to send an email to supplier if supplierEmail is present
        supplier_email = getattr(po, 'supplierEmail', None) or getattr(po, 'supplierEmail', None)
        subject = f"LPO {po.lpoNumber} sent"
        body = f"Purchase Order {po.lpoNumber} has been sent to supplier {po.supplierName}."
        try:
            if supplier_email:
                send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [supplier_email], fail_silently=True)
        except Exception as e:
            logging.exception('Error sending LPO email')

        from .serializers import PurchaseOrderSerializer
        return Response(PurchaseOrderSerializer(po).data, status=200)


class DeliveryReminderView(APIView):
    """POST /deliveries/<id>/reminder/ -- send reminder emails to inspection committee or unsigned roles"""
    def post(self, request, id, format=None):
        from rest_framework import status
        from roles.admin.dashboard.models import InspectionCommittee
        from roles.admin.users.models import SystemUser

        try:
            delivery = Delivery.objects.get(id=id)
        except Delivery.DoesNotExist:
            return Response({'detail': 'Delivery not found.'}, status=status.HTTP_404_NOT_FOUND)

        committee = InspectionCommittee.objects.prefetch_related('members').first()
        if not committee:
            return Response({'detail': 'Inspection committee not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        emails = []
        for member in committee.members.all():
            try:
                su = SystemUser.objects.get(id=member.user_id)
                if su and su.email:
                    emails.append(su.email)
            except SystemUser.DoesNotExist:
                continue

        subject = f"Reminder: Delivery {getattr(delivery, 'deliveryId', delivery.id)} awaiting inspection"
        body = f"The delivery {getattr(delivery, 'deliveryId', delivery.id)} requires your inspection action.\n\nPlease log in to the system to review and sign."

        try:
            if emails:
                send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, list(set(emails)), fail_silently=True)
        except Exception:
            logging.exception('Error sending delivery reminder emails')

        return Response({'sent': len(emails)}, status=200)

class LpoStatsView(APIView):
    def get(self, request, *args, **kwargs):
        from .models import PurchaseOrder
        from django.db.models import Sum

        lpos = PurchaseOrder.objects.all()
        total = lpos.count()
        
        pending_delivery = lpos.exclude(status__iexact="Fully Delivered").count() 
        pending_payment = lpos.exclude(paymentStatus__iexact="Paid").count()
        
        total_value_agg = lpos.aggregate(Sum('totalValue'))['totalValue__sum'] or 0

        return Response({
            "total": total,
            "pendingDelivery": pending_delivery,
            "pendingPayment": pending_payment,
            "totalValue": total_value_agg
        })

class RiaListCreateView(generics.ListCreateAPIView):
    queryset = RoutineIssueAuthority.objects.all().order_by('-createdAt', '-number')
    serializer_class = RoutineIssueAuthoritySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Support returning all records explicitly via query param
        all_flag = self.request.query_params.get('all')
        if all_flag and all_flag.lower() in ('1', 'true', 'yes'):
            return qs
        # Default: return active/draft RIAs
        return qs.exclude(status__iexact='archived')

class RiaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RoutineIssueAuthority.objects.all()
    serializer_class = RoutineIssueAuthoritySerializer
    lookup_field = 'id'

class InventoryLedgerListView(generics.ListAPIView):
    queryset = InventoryLedger.objects.all()
    serializer_class = InventoryLedgerSerializer

class StoreReportListView(generics.ListAPIView):
    queryset = StoreReport.objects.all()
    serializer_class = StoreReportSerializer

class StoreReportExportView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        report_id = kwargs.get('id')
        store = request.query_params.get('store', 'all')
        category = request.query_params.get('category', 'all')
        date_from = request.query_params.get('from', '')
        date_to = request.query_params.get('to', '')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="report_{report_id}_export.csv"'
        
        import csv
        writer = csv.writer(response)
        writer.writerow(['Report ID', 'Store', 'Category', 'From', 'To'])
        writer.writerow([report_id, store, category, date_from, date_to])
        writer.writerow([])
        writer.writerow(['Item Code', 'Description', 'Quantity', 'Status'])
        writer.writerow(['ITM-001', 'Sample Item 1', '100', 'Active'])
        writer.writerow(['ITM-002', 'Sample Item 2', '50', 'Low Stock'])
        
        return response


class IPSASReportListView(APIView):
    """GET /reports/ipsas/ — list available IPSAS report stubs"""
    def get(self, request, *args, **kwargs):
        reports = [
            {'id': 'fixed_assets_register', 'title': 'Fixed Assets Register'},
            {'id': 'depreciation_schedule', 'title': 'Depreciation Schedule'},
            {'id': 'asset_disposals', 'title': 'Asset Disposals'},
        ]
        return Response(reports)


class IPSASReportExportView(generics.GenericAPIView):
    """GET /reports/ipsas/<id>/export/ — export IPSAS report as CSV or PDF"""
    def get(self, request, *args, **kwargs):
        report_id = kwargs.get('id')
        fmt = request.query_params.get('format', 'csv').lower()

        if fmt == 'csv':
            import csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{report_id}.csv"'
            writer = csv.writer(response)

            if report_id == 'fixed_assets_register':
                from .models import FixedAsset
                writer.writerow(['Asset Code', 'Name', 'Category', 'Acquisition Date', 'Cost', 'NBV', 'Status'])
                for a in FixedAsset.objects.all():
                    writer.writerow([a.assetCode, a.name, a.category, a.acq_date or '', a.total_cost, a.nbv, a.status])
                return response

            if report_id == 'depreciation_schedule':
                # DepreciationSchedule may be absent on some setups; handle gracefully
                try:
                    DepreciationSchedule = apps.get_model('stores', 'DepreciationSchedule')
                except LookupError:
                    DepreciationSchedule = None

                writer.writerow(['Asset Code', 'Year', 'Month', 'Monthly Depreciation', 'Posted Status'])
                if DepreciationSchedule is not None:
                    for s in DepreciationSchedule.objects.all():
                        writer.writerow([s.asset.assetCode if s.asset else '', s.year, s.month, s.monthly_depreciation, s.posted_status])
                return response

            if report_id == 'asset_disposals':
                from .models import DisposalRecord
                writer.writerow(['Record', 'Method', 'Date', 'Value', 'Notes'])
                for d in DisposalRecord.objects.all():
                    writer.writerow([d.id, d.disposalMethod, d.disposalDate, d.value, d.notes])
                return response

            return Response({'error': 'Unknown IPSAS report id'}, status=400)

        # PDF export — attempt to render HTML and convert to PDF using WeasyPrint
        if fmt == 'pdf':
            try:
                from weasyprint import HTML
            except Exception:
                return Response({'error': 'PDF export requires WeasyPrint. Install with `pip install WeasyPrint`.'}, status=501)

            # Build simple HTML for each report type
            html_parts = ['<html><head><meta charset="utf-8"><title>IPSAS Report</title></head><body>']
            if report_id == 'fixed_assets_register':
                html_parts.append('<h1>Fixed Assets Register</h1>')
                html_parts.append('<table border="1" cellspacing="0" cellpadding="4"><tr><th>Asset Code</th><th>Name</th><th>Category</th><th>Acquisition Date</th><th>Cost</th><th>NBV</th><th>Status</th></tr>')
                from .models import FixedAsset
                for a in FixedAsset.objects.all():
                    html_parts.append(f'<tr><td>{a.assetCode}</td><td>{a.name}</td><td>{a.category}</td><td>{a.acq_date or ""}</td><td>{a.total_cost}</td><td>{a.nbv}</td><td>{a.status}</td></tr>')
                html_parts.append('</table>')

            elif report_id == 'depreciation_schedule':
                html_parts.append('<h1>Depreciation Schedule</h1>')
                try:
                    DepreciationSchedule = apps.get_model('stores', 'DepreciationSchedule')
                except LookupError:
                    DepreciationSchedule = None
                html_parts.append('<table border="1" cellspacing="0" cellpadding="4"><tr><th>Asset Code</th><th>Year</th><th>Month</th><th>Monthly Depreciation</th><th>Posted</th></tr>')
                if DepreciationSchedule is not None:
                    for s in DepreciationSchedule.objects.all():
                        html_parts.append(f'<tr><td>{s.asset.assetCode if s.asset else ""}</td><td>{s.year}</td><td>{s.month}</td><td>{s.monthly_depreciation}</td><td>{s.posted_status}</td></tr>')
                html_parts.append('</table>')

            elif report_id == 'asset_disposals':
                html_parts.append('<h1>Asset Disposals</h1>')
                from .models import DisposalRecord
                html_parts.append('<table border="1" cellspacing="0" cellpadding="4"><tr><th>Record</th><th>Method</th><th>Date</th><th>Value</th><th>Notes</th></tr>')
                for d in DisposalRecord.objects.all():
                    html_parts.append(f'<tr><td>{d.id}</td><td>{d.disposalMethod}</td><td>{d.disposalDate}</td><td>{d.value}</td><td>{d.notes}</td></tr>')
                html_parts.append('</table>')

            else:
                return Response({'error': 'Unknown IPSAS report id'}, status=400)

            html_parts.append('</body></html>')
            html_content = '\n'.join(html_parts)

            pdf = HTML(string=html_content).write_pdf()
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{report_id}.pdf"'
            return response

        return Response({'error': 'Unknown format. Use csv or pdf.'}, status=400)

class ConsumablesLedgerListView(generics.ListAPIView):
    queryset = InventoryLedger.objects.all()
    serializer_class = InventoryLedgerSerializer

class StockBalanceListView(generics.ListAPIView):
    from .serializers import StockBalanceSerializer
    queryset = InventoryLedger.objects.all().order_by('itemCode')
    serializer_class = StockBalanceSerializer

class StockBalanceExportView(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        category = request.query_params.get('category', 'all')
        search = request.query_params.get('search', '')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="stock_balances_export.csv"'
        
        import csv
        writer = csv.writer(response)
        writer.writerow(['Item Code', 'Name', 'Category', 'Unit', 'Opening', 'Received', 'Issued', 'Closing', 'Value'])
        
        queryset = InventoryLedger.objects.all().order_by('itemCode')
        if search:
            queryset = queryset.filter(itemName__icontains=search)
            
        from .models import InventoryItem
        for ledger in queryset:
            # Map category
            cat = 'Uncategorized'
            try:
                cat = ledger.item.category
            except:
                item = InventoryItem.objects.filter(id=ledger.itemCode).first()
                if item:
                    cat = item.category
            
            if category.lower() != 'all' and category.lower() != cat.lower():
                continue
                
            writer.writerow([
                ledger.itemCode,
                ledger.itemName,
                cat,
                ledger.unit,
                ledger.openingQty,
                ledger.totalReceiptsQty,
                ledger.totalIssuesQty,
                ledger.closingQty,
                ledger.closingValue
            ])
            
        return response

from django.db.models import F

class DashboardTransactionsView(APIView):
    def get(self, request, *args, **kwargs):
        # Fetch up to 3 latest ReceivingHistory (S11)
        receives = ReceivingHistory.objects.order_by('-createdAt', '-id')[:3]
        # Fetch up to 3 latest IssueHistory (S13)
        issues = IssueHistory.objects.order_by('-createdAt', '-id')[:3]
        
        transactions = []
        for r in receives:
            date_str = r.createdAt.strftime('%Y-%m-%d') if r.createdAt else r.date
            
            # Formulating the item string since ReceivingHistory tracks count instead of item specific
            item_desc = f"{r.items} items received"
            transactions.append({
                "id": r.id,
                "type": "S11",
                "item": item_desc,
                "qty": r.items,
                "date": date_str,
                "status": r.status
            })
            
        for i in issues:
            date_str = i.createdAt.strftime('%Y-%m-%d') if hasattr(i, 'createdAt') and i.createdAt else i.date
            item_desc = f"{i.items} items issued"
            transactions.append({
                "id": i.id,
                "type": "S13",
                "item": item_desc,
                "qty": i.items,
                "date": date_str,
                "status": i.status
            })
            
        # Sort combined list descending
        transactions.sort(key=lambda x: x['date'], reverse=True)
        
        return Response({
            "count": len(transactions),
            "next": None,
            "previous": None,
            "results": transactions
        })

class DashboardLowStockView(APIView):
    def get(self, request, *args, **kwargs):
        low_stock_items = InventoryItem.objects.filter(openingBalance__lte=F('minimumStockLevel')).order_by('openingBalance')[:10]
        
        results = []
        for item in low_stock_items:
            results.append({
                "id": item.id,
                "name": item.name,
                "current": item.openingBalance,
                "minimum": item.minimumStockLevel,
                "unit": item.unit
            })
            
        return Response({
            "count": len(results),
            "next": None,
            "previous": None,
            "results": results
        })

class DashboardStatsView(APIView):
    def get(self, request, *args, **kwargs):
        from .models import InventoryItem, ReceivingHistory, IssueHistory
        from django.db.models import F
        from django.utils import timezone
        
        now = timezone.now()
        
        # Calculate true aggregations where possible
        total_items = InventoryItem.objects.count()
        low_stock_count = InventoryItem.objects.filter(openingBalance__lte=F('minimumStockLevel')).count()
        
        # Current month counts
        s11_count = ReceivingHistory.objects.filter(
            createdAt__year=now.year,
            createdAt__month=now.month
        ).count()
        
        s13_count = IssueHistory.objects.filter(
            createdAt__year=now.year,
            createdAt__month=now.month
        ).count()
        
        categories_count = InventoryItem.objects.values('category').distinct().count()
        pending_issues = IssueHistory.objects.filter(status__iexact='Pending').count()

        # Build response with calculated metrics and mocked trends/values for complex metrics
        stats = {
            "totalItems": { "value": str(total_items), "trend": "+5% from last month", "trendUp": True },
            "lowStockItems": { "value": str(low_stock_count), "trend": f"{low_stock_count} critical", "trendUp": False },
            "s11ThisMonth": { "value": str(s11_count), "trend": "+12% increase", "trendUp": True },
            "s13ThisMonth": { "value": str(s13_count), "trend": "-3% decrease", "trendUp": False },
            "stockValue": "KES 2.4M",  # Mocked as InventoryItem doesn't currently store unit cost natively
            "categories": str(categories_count),
            "pendingIssues": str(pending_issues)
        }
        
        return Response(stats)

class StockAdjustmentListCreateView(generics.ListCreateAPIView):
    from .models import StockAdjustment
    from .serializers import StockAdjustmentSerializer
    queryset = StockAdjustment.objects.all().order_by('-id')
    serializer_class = StockAdjustmentSerializer

class StoreTransferListCreateView(generics.ListCreateAPIView):
    from .models import StoreTransfer
    from .serializers import StoreTransferSerializer
    queryset = StoreTransfer.objects.all().order_by('-id')
    serializer_class = StoreTransferSerializer

class FileMovementListCreateView(generics.ListCreateAPIView):
    from .models import FileMovement
    from .serializers import FileMovementSerializer
    queryset = FileMovement.objects.all().order_by('-id')
    serializer_class = FileMovementSerializer

class FileMovementDetailView(generics.RetrieveUpdateDestroyAPIView):
    from .models import FileMovement
    from .serializers import FileMovementSerializer
    queryset = FileMovement.objects.all()
    serializer_class = FileMovementSerializer
    lookup_field = 'id'

class FileMovementSettingsView(APIView):
    def get(self, request, *args, **kwargs):
        settings_data = {
            "categories": ["Procurement", "Stores", "Human Resources", "Finance", "Administration"],
            "departments": ["Administration", "Finance", "Procurement", "IT", "Academic", "Transport"],
            "locations": ["Main Registry", "Procurement Office", "Stores Archive", "Admin Block"]
        }
        return Response(settings_data)

class RetentionRecordListCreateView(generics.ListCreateAPIView):
    from .models import RetentionRecord
    from .serializers import RetentionRecordSerializer
    queryset = RetentionRecord.objects.all().order_by('-id')
    serializer_class = RetentionRecordSerializer

class RetentionRecordDetailView(generics.RetrieveUpdateAPIView):
    from .models import RetentionRecord
    from .serializers import RetentionRecordSerializer
    queryset = RetentionRecord.objects.all()
    serializer_class = RetentionRecordSerializer
    lookup_field = 'id'

class AppraisalWorkflowListCreateView(generics.ListCreateAPIView):
    from .models import AppraisalWorkflow
    from .serializers import AppraisalWorkflowSerializer
    queryset = AppraisalWorkflow.objects.all().order_by('-id')
    serializer_class = AppraisalWorkflowSerializer

class AppraisalWorkflowDetailView(generics.RetrieveUpdateAPIView):
    from .models import AppraisalWorkflow
    from .serializers import AppraisalWorkflowSerializer
    queryset = AppraisalWorkflow.objects.all()
    serializer_class = AppraisalWorkflowSerializer
    lookup_field = 'id'

class DisposalRecordListCreateView(generics.ListCreateAPIView):
    from .models import DisposalRecord
    from .serializers import DisposalRecordSerializer
    queryset = DisposalRecord.objects.all().order_by('-id')
    serializer_class = DisposalRecordSerializer


# =============================================================================
# Phase 2 — S2 Ledger & Core Stores Workflows Views
# =============================================================================

from .models import S2Transaction, S2Ledger
from .serializers import (
    S2TransactionListSerializer, S2TransactionDetailSerializer,
    S2LedgerSerializer, S2ReceiptSerializer, S2IssueSerializer,
    S2TransferSerializer, S2ReturnSerializer, S2DamageSerializer,
    S2ReversalSerializer,
)


class S2TransactionListView(generics.ListCreateAPIView):
    """
    GET /s2/transactions/ — List all S2 transactions (paginated).
    POST /s2/transactions/ — Not used directly; use dedicated endpoints.
    """
    queryset = S2Transaction.objects.all().order_by('-date', '-createdAt')
    serializer_class = S2TransactionListSerializer


class S2TransactionDetailView(generics.RetrieveAPIView):
    """
    GET /s2/transactions/<id>/ — Get detail of a single S2 transaction.
    """
    queryset = S2Transaction.objects.all()
    serializer_class = S2TransactionDetailSerializer
    lookup_field = 'id'


class S2LedgerListView(generics.ListAPIView):
    """
    GET /s2/ledger/ — List all S2 ledger summaries.
    """
    queryset = S2Ledger.objects.all().order_by('itemCode')
    serializer_class = S2LedgerSerializer


class S2LedgerDetailView(generics.RetrieveAPIView):
    """
    GET /s2/ledger/<itemCode>/ — Get S2 ledger summary for an item.
    """
    queryset = S2Ledger.objects.all()
    serializer_class = S2LedgerSerializer
    lookup_field = 'itemCode'


class S2ReceiptView(APIView):
    """
    POST /s2/receipt/ — Post a GRN→Store receipt to the S2 ledger.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2ReceiptSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = serializer.save()
                result_serializer = S2TransactionDetailSerializer(txn)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class S2IssueView(APIView):
    """
    POST /s2/issue/ — Post a Store→Department issue to the S2 ledger.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2IssueSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = serializer.save()
                result_serializer = S2TransactionDetailSerializer(txn)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class S2TransferView(APIView):
    """
    POST /s2/transfer/ — Post a department transfer (two-leg entry).
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2TransferSerializer(data=request.data)
        if serializer.is_valid():
            try:
                out_txn = serializer.save()
                result_serializer = S2TransactionDetailSerializer(out_txn)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class S2ReturnView(APIView):
    """
    POST /s2/return/ — Post a Return to Store transaction.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2ReturnSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = serializer.save()
                result_serializer = S2TransactionDetailSerializer(txn)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class S2DamageView(APIView):
    """
    POST /s2/damage/ — Post a Damage/Loss/Condemn transaction.
    Creates an audit-locked entry.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2DamageSerializer(data=request.data)
        if serializer.is_valid():
            try:
                txn = serializer.save()
                result_serializer = S2TransactionDetailSerializer(txn)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class S2ReversalView(APIView):
    """
    POST /s2/reverse/ — Reverse a posted transaction.
    Creates an adjustment entry and marks original as reversed.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = S2ReversalSerializer(data=request.data)
        if serializer.is_valid():
            try:
                reversal = serializer.save()
                result_serializer = S2TransactionDetailSerializer(reversal)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Phase 3 — Capitalization Rules Engine & Decision Assistant Views
# =============================================================================

from .models import CapitalizationRule, CapitalizationSetting, CapitalizationPrompt
from .serializers import (
    CapitalizationRuleSerializer, CapitalizationSettingSerializer,
    CapitalizationPromptListSerializer, CapitalizationPromptDetailSerializer,
    ClassifyItemSerializer, OverrideDecisionSerializer,
)


class CapitalizationRuleListView(generics.ListCreateAPIView):
    """
    GET /capitalization/rules/ — List all capitalization rules.
    POST /capitalization/rules/ — Create a new rule.
    """
    queryset = CapitalizationRule.objects.all().order_by('priority', 'id')
    serializer_class = CapitalizationRuleSerializer


class CapitalizationRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /capitalization/rules/<id>/ — Manage a single rule.
    """
    queryset = CapitalizationRule.objects.all()
    serializer_class = CapitalizationRuleSerializer


class CapitalizationSettingView(APIView):
    """
    GET /capitalization/settings/ — Get global capitalization settings.
    PUT /capitalization/settings/ — Update global settings.
    """
    def get(self, request, format=None):
        from .capitalization_engine import get_cap_settings
        settings = get_cap_settings()
        serializer = CapitalizationSettingSerializer(settings)
        return Response(serializer.data)

    def put(self, request, format=None):
        from .capitalization_engine import get_cap_settings
        settings = get_cap_settings()
        serializer = CapitalizationSettingSerializer(
            settings, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save(updated_by=request.user.username if hasattr(request, 'user') and not request.user.is_anonymous else '')
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class CapitalizationPromptListView(generics.ListAPIView):
    """
    GET /capitalization/prompts/ — List all capitalization prompts (pending first).
    """
    queryset = CapitalizationPrompt.objects.all().order_by('-createdAt')
    serializer_class = CapitalizationPromptListSerializer


class CapitalizationPromptDetailView(generics.RetrieveAPIView):
    """
    GET /capitalization/prompts/<id>/ — Get full detail of a prompt.
    """
    queryset = CapitalizationPrompt.objects.all()
    serializer_class = CapitalizationPromptDetailSerializer
    lookup_field = 'id'


class ClassifyItemView(APIView):
    """
    POST /capitalization/classify/ — Run rule engine and auto-classify an item.
    Logs the decision as a CapitalizationPrompt.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = ClassifyItemSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.save()
                # result contains prompt + classification
                from .capitalization_engine import ClassificationResult
                prompt_serializer = CapitalizationPromptDetailSerializer(result['prompt'])
                response_data = {
                    'prompt': prompt_serializer.data,
                    'classification': {
                        'suggested_category_type': result['classification'].suggested_category_type,
                        'suggested_action': result['classification'].suggested_action,
                        'applied_rule': result['classification'].applied_rule,
                        'rule_label': result['classification'].rule_label,
                        'is_bulk': result['classification'].is_bulk,
                        'override_required': result['classification'].override_required,
                    }
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OverrideDecisionView(APIView):
    """
    POST /capitalization/override/ — Apply a user override to a prompt.
    Records reason, approval, and updates item if capitalize.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = OverrideDecisionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                prompt = serializer.save()
                prompt_serializer = CapitalizationPromptDetailSerializer(prompt)
                return Response(prompt_serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CapitalizationPendingPromptsView(APIView):
    """
    GET /capitalization/prompts/pending/ — Get counts and list of pending override items.
    """
    def get(self, request, format=None):
        pending = CapitalizationPrompt.objects.filter(
            approval_status='pending'
        ).order_by('-createdAt')
        serializer = CapitalizationPromptListSerializer(pending, many=True)
        return Response({
            'count': pending.count(),
            'results': serializer.data,
        })


class BulkCapitalizationCreateView(APIView):
    """
    POST /capitalization/bulk/ — Create grouped capitalization prompts for a list of items.
    Returns the created prompts and a `bulk_group_ref` used to approve/process them.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = BulkCapitalizationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            validated_items = data.get('validated_items', [])
            created_by = data.get('created_by', '')
            # generate bulk ref
            from django.utils import timezone
            ts = timezone.now().strftime('%Y%m%d%H%M%S')
            bulk_ref = f'BULK-{ts}'
            prompts = []
            for entry in validated_items:
                item = entry['item']
                qty = entry['qty']
                unit_cost = entry['unit_cost']
                # run classification
                classification = classify_item(item, qty=qty, unit_cost=unit_cost, created_by=created_by)
                # log prompt but mark as bulk and pending
                prompt = log_classification_prompt(
                    item=item, qty=qty, unit_cost=unit_cost,
                    classification=classification, created_by=created_by,
                    bulk_group_ref=bulk_ref,
                )
                # ensure pending for bulk groups
                prompt.is_bulk = True
                prompt.bulk_group_ref = bulk_ref
                prompt.approval_status = 'pending'
                prompt.save()
                prompts.append(prompt)

            result = CapitalizationPromptListSerializer(prompts, many=True).data
            return Response({'bulk_group_ref': bulk_ref, 'prompts': result}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkCapitalizationProcessView(APIView):
    """
    POST /capitalization/bulk/process/ — Approve a bulk group and create FixedAsset records.
    Expects `bulk_group_ref` and `approved_by` in the payload.
    """
    def post(self, request, format=None):
        from rest_framework import status
        serializer = BulkProcessSerializer(data=request.data)
        # Permission: require staff or group 'AssetApprover'
        user = request.user
        is_approver = False
        try:
            if user.is_staff or user.is_superuser:
                is_approver = True
            else:
                is_approver = user.groups.filter(name='AssetApprover').exists()
        except Exception:
            is_approver = False

        if not is_approver:
            return Response({'detail': 'Forbidden - approver role required'}, status=403)

        if serializer.is_valid():
            bulk_ref = serializer.validated_data['bulk_group_ref']
            approved_by = serializer.validated_data['approved_by']
            create_children = serializer.validated_data.get('create_children', False)
            child_tag_prefix = serializer.validated_data.get('child_tag_prefix', '')
            group_name = serializer.validated_data.get('group_name', '')

            prompts = CapitalizationPrompt.objects.filter(bulk_group_ref=bulk_ref, approval_status='pending')
            if not prompts.exists():
                return Response({'detail': 'No pending prompts for this bulk_group_ref'}, status=status.HTTP_400_BAD_REQUEST)

            # Aggregate totals for master asset
            total_qty = sum([p.quantity for p in prompts])
            total_cost = sum([p.total_value or (p.unit_cost * p.quantity) for p in prompts])

            master_name = group_name or f"Grouped Asset {bulk_ref}"
            master_payload = {
                'name': master_name,
                'qty': total_qty,
                'unit_cost': (total_cost / total_qty) if total_qty else 0,
                'total_cost': total_cost,
                'category_type': prompts[0].suggested_category_type or prompts[0].category_type or 'fixed_asset',
                'source_prompt': '',
                'created_by': approved_by,
            }

            created_assets = []
            fa_master_serializer = FixedAssetCreateSerializer(data=master_payload)
            if not fa_master_serializer.is_valid():
                return Response({'detail': 'Failed to validate master asset payload', 'errors': fa_master_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

            master_asset = fa_master_serializer.save()

            # Optionally create child assets: one asset per unit (qty=1) linked to master
            child_assets = []
            # For large batches we enqueue a background job instead of creating synchronously
            BG_CHILD_THRESHOLD = 100
            if create_children and total_qty > BG_CHILD_THRESHOLD:
                # create job record and return job id
                job = BulkCreationJob.objects.create(
                    bulk_group_ref=bulk_ref,
                    options={'child_tag_prefix': child_tag_prefix, 'approved_by': approved_by, 'group_name': group_name},
                    status='queued',
                    created_by=approved_by,
                )
                return Response({'detail': 'Child materialization queued', 'job_id': job.id, 'master_id': master_asset.id}, status=status.HTTP_202_ACCEPTED)

            if create_children:
                tag_counter = 1
                for p in prompts:
                    for i in range(p.quantity):
                        child_payload = {
                            'name': p.item_name or (p.item.name if p.item else f'Child of {master_name}'),
                            'qty': 1,
                            'unit_cost': p.unit_cost,
                            'total_cost': p.unit_cost,
                            'category_type': p.suggested_category_type or p.category_type or 'fixed_asset',
                            'parent_asset': master_asset.id,
                            'source_item': p.item.id if p.item else None,
                            'source_prompt': p.id,
                            'created_by': approved_by,
                        }
                        # assign tag if requested
                        if child_tag_prefix:
                            child_payload['tag_no'] = f"{child_tag_prefix}-{tag_counter:06d}"
                        child_serializer = FixedAssetCreateSerializer(data=child_payload)
                        if child_serializer.is_valid():
                            child = child_serializer.save()
                            child_assets.append(child)
                        else:
                            # record error on prompt
                            p.override_reason = f"Child asset creation failed: {child_serializer.errors}"
                            p.save()
                        tag_counter += 1

            # Mark all prompts in group as approved and link to master
            from django.utils import timezone
            for p in prompts:
                p.approval_status = 'approved'
                p.approved_by = approved_by
                p.approved_at = timezone.now()
                p.bulk_group_ref = bulk_ref
                p.save()

            created_assets = [master_asset] + child_assets
            return Response({'created': FixedAssetListSerializer(created_assets, many=True).data, 'master_id': master_asset.id}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Phase 4 — Fixed Asset Register & Lifecycle Management Views
# =============================================================================

from .models import FixedAsset, AssetStatusHistory, AssetMaintenance
from .serializers import (
    FixedAssetListSerializer, FixedAssetDetailSerializer,
    FixedAssetCreateSerializer, FixedAssetStatusTransitionSerializer,
    FixedAssetDisposalSerializer,
    AssetStatusHistorySerializer, AssetMaintenanceSerializer,
    AssetMaintenanceCreateSerializer,
)

class DisposalApprovalView(APIView):
    """POST /assets/disposals/<pk>/approve/ — approve or reject a disposal record.

    When approved with `post_write_off=True`, posts a write-off GL entry (if finance integration available),
    updates asset qty/NBV proportionally for partial disposals or marks disposed for full disposals,
    and records audit info.
    """
    def post(self, request, pk, *args, **kwargs):
        from rest_framework import status
        from .serializers import DisposalApprovalSerializer, AssetDisposalRecordSerializer
        try:
            record = AssetDisposalRecord.objects.get(pk=pk)
        except AssetDisposalRecord.DoesNotExist:
            return Response({'error': 'disposal record not found'}, status=404)

        serializer = DisposalApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        # permission check: approver role required
        user = request.user
        is_approver = False
        try:
            if user.is_staff or user.is_superuser:
                is_approver = True
            else:
                is_approver = user.groups.filter(name='AssetApprover').exists()
        except Exception:
            is_approver = False
        if not is_approver:
            return Response({'detail': 'Forbidden - approver role required'}, status=403)

        # apply approval
        from django.utils import timezone
        record.approval_status = data['approval_status']
        record.committee_reference = data.get('committee_reference') or record.committee_reference
        record.proceeds = data.get('proceeds') or 0
        record.approved_by = data.get('approved_by')
        record.approved_at = timezone.now()
        record.save()

        # If approved and write-off requested, perform accounting and asset adjustments
        if record.approval_status == 'approved' and data.get('post_write_off'):
            try:
                # Post write-off to GL if finance integration available
                try:
                    from roles.finance.views import _post_gl
                    from roles.finance.models import AccountingPeriod, ChartOfAccount
                except Exception:
                    _post_gl = None

                # Determine asset and proportional adjustments
                asset = record.asset
                disposed_qty = int(record.disposed_qty or 0)
                if disposed_qty <= 0:
                    raise ValueError('disposed_qty must be positive to post write-off')

                # Compute proportion and adjust asset
                ratio = disposed_qty / (asset.qty or 1)
                cost_reduction = float((asset.total_cost or 0) * ratio)
                nbv_reduction = float((asset.nbv or asset.total_cost or 0) * ratio)

                # If partial disposal, reduce asset qty and costs
                if disposed_qty < asset.qty:
                    asset.qty = asset.qty - disposed_qty
                    asset.total_cost = float((asset.total_cost or 0) - cost_reduction)
                    asset.accumulated_depreciation = float((asset.accumulated_depreciation or 0) - nbv_reduction + (cost_reduction - nbv_reduction))
                    asset.nbv = float((asset.nbv or 0) - nbv_reduction)
                    asset.save()
                else:
                    # full disposal
                    asset.status = 'disposed'
                    asset.disposal_status = record.disposal_status
                    asset.disposal_date = record.disposal_date
                    asset.disposal_value = record.disposal_value
                    asset.disposal_reason = record.reason
                    asset.save()

                # Post GL: debit accumulated depreciation / credit asset cost difference as write-off/proceeds entries
                if _post_gl is not None:
                    period = AccountingPeriod.objects.filter(status=AccountingPeriod.STATUS_OPEN).first()
                    if period:
                        from decimal import Decimal
                        # configure accounts via settings if available
                        from django.conf import settings
                        acc_cost = getattr(settings, 'FIXED_ASSET_ACCOUNT', None)
                        acc_accum = getattr(settings, 'ACCUMULATED_DEPR_ACCOUNT', None)
                        acc_loss = getattr(settings, 'DISPOSAL_LOSS_ACCOUNT', None)
                        acc_proceeds = getattr(settings, 'DISPOSAL_PROCEEDS_ACCOUNT', None)

                        # Build lines: reverse accumulated depreciation, record proceeds, loss/gain
                        lines = []
                        # debit accumulated depreciation
                        try:
                            accum_acc = ChartOfAccount.objects.get(code=acc_accum) if acc_accum else None
                            cost_acc = ChartOfAccount.objects.get(code=acc_cost) if acc_cost else None
                            loss_acc = ChartOfAccount.objects.get(code=acc_loss) if acc_loss else None
                            proceeds_acc = ChartOfAccount.objects.get(code=acc_proceeds) if acc_proceeds else None
                        except Exception:
                            accum_acc = cost_acc = loss_acc = proceeds_acc = None

                        amt_accum = Decimal(str(nbv_reduction))
                        amt_cost = Decimal(str(cost_reduction))
                        amt_proceeds = Decimal(str(record.proceeds or 0))

                        if accum_acc:
                            lines.append({'account': accum_acc, 'description': f'Reverse accumulated depr {asset.assetCode}', 'debit': amt_accum, 'credit': Decimal('0.00')})
                        if proceeds_acc and amt_proceeds > 0:
                            lines.append({'account': proceeds_acc, 'description': f'Disposal proceeds {asset.assetCode}', 'debit': Decimal('0.00'), 'credit': amt_proceeds})
                        # loss = cost less accumulated less proceeds
                        loss_amt = amt_cost - amt_accum - amt_proceeds
                        if loss_amt > 0 and loss_acc:
                            lines.append({'account': loss_acc, 'description': f'Disposal loss {asset.assetCode}', 'debit': loss_amt, 'credit': Decimal('0.00')})

                        if period and lines:
                            voucher_ref = f'DISP{record.id}:{asset.assetCode}'
                            _post_gl(period, record.disposal_date or timezone.now().date(), 'disposal', voucher_ref, f'Disposal {asset.assetCode}', lines)
                            record.write_off_posted = True
                            record.save()

                # log status history
                AssetStatusHistory.objects.create(
                    asset=asset,
                    from_status=asset.status,
                    to_status=asset.status if asset.status == 'disposed' else 'active',
                    changed_by=record.approved_by or '',
                    reason=f'Disposal approved via committee {record.committee_reference or ""}'
                )

            except Exception as e:
                return Response({'error': str(e)}, status=400)

        return Response(AssetDisposalRecordSerializer(record).data, status=200)


class FixedAssetListView(generics.ListCreateAPIView):
    """
    GET /assets/ — List all fixed assets.
    POST /assets/ — Create a new fixed asset.
    """
    queryset = FixedAsset.objects.all().order_by('-createdAt')
    serializer_class = FixedAssetListSerializer

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FixedAssetCreateSerializer
        return FixedAssetListSerializer

    def perform_create(self, serializer):
        asset = serializer.save()
        # Log initial status in history
        AssetStatusHistory.objects.create(
            asset=asset,
            from_status='',
            to_status=asset.status,
            changed_by=asset.created_by or '',
            reason='Asset created',
        )


class FixedAssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /assets/<id>/ — Get full detail of a fixed asset.
    PUT/PATCH /assets/<id>/ — Update a fixed asset.
    DELETE /assets/<id>/ — Delete a fixed asset.
    """
    queryset = FixedAsset.objects.all()
    serializer_class = FixedAssetDetailSerializer
    lookup_field = 'id'


class FixedAssetStatusTransitionView(APIView):
    """
    POST /assets/<id>/transition/ — Transition asset status with audit trail.
    """
    def post(self, request, id, format=None):
        from rest_framework import status
        try:
            asset = FixedAsset.objects.get(id=id)
        except FixedAsset.DoesNotExist:
            return Response({'detail': 'Asset not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FixedAssetStatusTransitionSerializer(
            data=request.data,
            context={'asset': asset},
        )
        if serializer.is_valid():
            new_status = serializer.validated_data['new_status']
            changed_by = serializer.validated_data.get('changed_by', '')
            reason = serializer.validated_data.get('reason', '')

            old_status = asset.status
            asset.status = new_status
            # If transitioning to deployed, set depreciation_start_date according to capitalization settings
            if new_status == 'deployed' and not asset.depreciation_start_date:
                try:
                    cap = CapitalizationSetting.objects.first()
                    from datetime import date
                    if cap and cap.depreciation_start_rule:
                        rule = cap.depreciation_start_rule
                        start_src = asset.acq_date or asset.purchaseDate or date.today()
                        if rule == 'date_of_acquisition':
                            asset.depreciation_start_date = start_src
                        elif rule == 'month_after_acquisition':
                            # first day of next month after acquisition
                            import datetime
                            y = start_src.year
                            m = start_src.month + 1
                            if m > 12:
                                m = 1
                                y += 1
                            asset.depreciation_start_date = datetime.date(y, m, 1)
                        elif rule == 'quarter_after_acquisition':
                            import datetime
                            month = ((start_src.month - 1) // 3 + 1) * 3 + 1
                            year = start_src.year
                            if month > 12:
                                month = 1
                                year += 1
                            asset.depreciation_start_date = datetime.date(year, month, 1)
                        else:
                            asset.depreciation_start_date = date.today()
                    else:
                        from datetime import date
                        asset.depreciation_start_date = date.today()
                except Exception:
                    # do not block status transition on settings lookup failures
                    pass

            asset.save()

            # Log status change
            AssetStatusHistory.objects.create(
                asset=asset,
                from_status=old_status,
                to_status=new_status,
                changed_by=changed_by,
                reason=reason,
            )

            result_serializer = FixedAssetDetailSerializer(asset)
            return Response(result_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FixedAssetDisposalView(APIView):
    """
    POST /assets/<id>/dispose/ — Dispose an asset (full or partial).
    For partial disposal, creates a child asset for the remaining portion.
    """
    def post(self, request, id, format=None):
        from rest_framework import status
        try:
            asset = FixedAsset.objects.get(id=id)
        except FixedAsset.DoesNotExist:
            return Response({'detail': 'Asset not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FixedAssetDisposalSerializer(
            data=request.data,
            context={'asset': asset},
        )
        if serializer.is_valid():
            disposal_status = serializer.validated_data['disposal_status']
            disposal_date = serializer.validated_data['disposal_date']
            disposal_value = serializer.validated_data.get('disposal_value', 0)
            disposal_reason = serializer.validated_data['disposal_reason']
            disposed_qty = serializer.validated_data.get('disposed_qty', None)
            changed_by = serializer.validated_data.get('changed_by', '')

            # Require supporting attachments for any disposal (partial or full)
            from common.messaging.models import DocumentAttachment
            has_attachments = DocumentAttachment.objects.filter(
                entity_type='fixed_asset', entity_id=str(asset.id), is_active=True
            ).exists()
            if not has_attachments:
                return Response({'error': 'Supporting attachments required for disposal. Attach at least one document.'}, status=status.HTTP_400_BAD_REQUEST)

            if disposed_qty is not None and disposed_qty < asset.qty:
                # Partial disposal: split the asset
                calc = asset.calculate_nbv_after_partial_disposal(disposed_qty)

                # capture previous status for history
                prev_status = asset.status

                # Create child asset for the remaining portion
                child_asset = FixedAsset.objects.create(
                    name=asset.name,
                    tag_no=asset.tag_no,
                    category=asset.category,
                    category_type=asset.category_type,
                    asset_type=asset.asset_type,
                    description=asset.description,
                    serial_no=asset.serial_no,
                    unit=asset.unit,
                    qty=calc['remaining_qty'],
                    unit_cost=asset.unit_cost,
                    total_cost=calc['remaining_cost'],
                    purchaseDate=asset.purchaseDate,
                    acq_date=asset.acq_date,
                    purchaseCost=asset.purchaseCost,
                    supplier_id=asset.supplier_id,
                    supplier_name=asset.supplier_name,
                    funding_source=asset.funding_source,
                    dept_id=asset.dept_id,
                    dept_name=asset.dept_name,
                    custodian_id=asset.custodian_id,
                    custodian=asset.custodian,
                    location_id=asset.location_id,
                    location=asset.location,
                    useful_life=asset.useful_life,
                    residual_value=asset.residual_value,
                    depreciation_method=asset.depreciation_method,
                    accumulated_depreciation=round(asset.accumulated_depreciation * calc['ratio'], 2) if asset.accumulated_depreciation else 0,
                    nbv=calc['remaining_nbv'],
                    status='active',
                    parent_asset=asset.parent_asset or asset,
                    source_item=asset.source_item,
                    source_prompt=asset.source_prompt,
                    notes=f"Remaining portion after partial disposal of {disposed_qty} units. {asset.notes or ''}",
                    created_by=changed_by or asset.created_by,
                )

                # Update original asset to disposed portion
                asset.qty = disposed_qty
                asset.total_cost = calc['cost_reduction']
                asset.nbv = calc['nbv_reduction']
                asset.disposal_status = disposal_status
                asset.disposal_date = disposal_date
                asset.disposal_value = disposal_value
                asset.disposal_reason = disposal_reason
                asset.status = 'disposed'
                asset.save()

                # Record disposal event for audit/reporting
                try:
                    from .models import AssetDisposalRecord
                    AssetDisposalRecord.objects.create(
                        asset=asset,
                        disposed_qty=disposed_qty,
                        disposal_value=disposal_value or 0,
                        disposal_status=disposal_status,
                        disposal_date=disposal_date,
                        reason=disposal_reason,
                        created_by=changed_by or '',
                    )
                except Exception:
                    pass

                # Log status change for original (from previous status → disposed)
                AssetStatusHistory.objects.create(
                    asset=asset,
                    from_status=prev_status,
                    to_status='disposed',
                    changed_by=changed_by,
                    reason=f"Partial disposal: {disposed_qty} units. {disposal_reason}",
                )

                # Log creation/history for remaining child asset
                AssetStatusHistory.objects.create(
                    asset=child_asset,
                    from_status='',
                    to_status=child_asset.status,
                    changed_by=child_asset.created_by or '',
                    reason=f"Created as remaining portion after partial disposal of {disposed_qty} units.",
                )

                return Response({
                    'disposed_asset': FixedAssetDetailSerializer(asset).data,
                    'remaining_asset': FixedAssetDetailSerializer(child_asset).data,
                    'calculation': calc,
                }, status=status.HTTP_200_OK)
            else:
                # Full disposal
                old_status = asset.status
                asset.disposal_status = disposal_status
                asset.disposal_date = disposal_date
                asset.disposal_value = disposal_value
                asset.disposal_reason = disposal_reason
                asset.status = 'disposed'
                asset.save()

                # Record disposal event for audit/reporting
                try:
                    from .models import AssetDisposalRecord
                    AssetDisposalRecord.objects.create(
                        asset=asset,
                        disposed_qty=asset.qty,
                        disposal_value=disposal_value or 0,
                        disposal_status=disposal_status,
                        disposal_date=disposal_date,
                        reason=disposal_reason,
                        created_by=changed_by or '',
                    )
                except Exception:
                    pass

                AssetStatusHistory.objects.create(
                    asset=asset,
                    from_status=old_status,
                    to_status='disposed',
                    changed_by=changed_by,
                    reason=disposal_reason,
                )

                result_serializer = FixedAssetDetailSerializer(asset)
                return Response(result_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FixedAssetStatusHistoryView(generics.ListAPIView):
    """
    GET /assets/<asset_id>/history/ — Get status change history for an asset.
    """
    serializer_class = AssetStatusHistorySerializer

    def get_queryset(self):
        asset_id = self.kwargs.get('asset_id')
        return AssetStatusHistory.objects.filter(asset_id=asset_id).order_by('-createdAt')


class FixedAssetMaintenanceListView(generics.ListCreateAPIView):
    """
    GET /assets/<asset_id>/maintenance/ — List maintenance records for an asset.
    POST /assets/<asset_id>/maintenance/ — Schedule new maintenance.
    """
    serializer_class = AssetMaintenanceSerializer

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AssetMaintenanceCreateSerializer
        return AssetMaintenanceSerializer

    def get_queryset(self):
        asset_id = self.kwargs.get('asset_id')
        return AssetMaintenance.objects.filter(asset_id=asset_id).order_by('-scheduled_date')

    def perform_create(self, serializer):
        asset_id = self.kwargs.get('asset_id')
        try:
            asset = FixedAsset.objects.get(id=asset_id)
        except FixedAsset.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Asset not found.')
        serializer.save(asset=asset)


class FixedAssetMaintenanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /assets/<asset_id>/maintenance/<pk>/ — Manage a maintenance record.
    """
    serializer_class = AssetMaintenanceSerializer

    def get_queryset(self):
        asset_id = self.kwargs.get('asset_id')
        return AssetMaintenance.objects.filter(asset_id=asset_id)


class FixedAssetStatsView(APIView):
    """
    GET /assets/stats/ — Aggregated stats for fixed assets dashboard.
    """
    def get(self, request, format=None):
        total = FixedAsset.objects.count()
        active = FixedAsset.objects.filter(status='active').count()
        deployed = FixedAsset.objects.filter(status='deployed').count()
        maintenance = FixedAsset.objects.filter(status='maintenance').count()
        disposed = FixedAsset.objects.filter(status='disposed').count()
        damaged = FixedAsset.objects.filter(status='damaged').count()

        total_value_agg = FixedAsset.objects.aggregate(
            total=models.Sum('total_cost'),
            total_nbv=models.Sum('nbv'),
        )
        total_cost = total_value_agg.get('total') or 0
        total_nbv = total_value_agg.get('total_nbv') or 0

        return Response({
            'total': total,
            'active': active,
            'deployed': deployed,
            'under_maintenance': maintenance,
            'disposed': disposed,
            'damaged': damaged,
            'total_cost': float(total_cost),
            'total_nbv': float(total_nbv),
        })


class DepreciationRunTriggerView(APIView):
    """POST /assets/depreciation/run/ — Trigger a manual depreciation run."""
    def post(self, request, *args, **kwargs):
        year = request.data.get('year')
        month = request.data.get('month')
        run_type = request.data.get('type', 'monthly')
        user = getattr(request, 'user', None)
        username = user.username if user and not user.is_anonymous else 'api'

        if not year:
            return Response({'error': 'year is required'}, status=400)
        try:
            year = int(year)
            month = int(month) if month else None
        except Exception:
            return Response({'error': 'invalid year/month'}, status=400)

        try:
            from .depreciation import run_depreciation
            run = run_depreciation(run_type, year, month, created_by=username)
            return Response({'run_code': run.run_code, 'status': run.status, 'total': float(run.total_depreciation)})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class AssetRegisterReportView(APIView):
    """GET /assets/reports/register/ - return the asset register as JSON"""
    def get(self, request, *args, **kwargs):
        from .models import FixedAsset
        assets = FixedAsset.objects.all().order_by('assetCode')
        rows = []
        for a in assets:
            rows.append({
                'id': a.id,
                'assetCode': a.assetCode,
                'name': a.name,
                'category': a.category,
                'acquisitionDate': a.acq_date.isoformat() if a.acq_date else None,
                'cost': float(a.total_cost or 0),
                'nbv': float(a.nbv or 0),
                'status': a.status,
                'dept': a.dept_name,
                'location': a.location,
                'custodian': a.custodian,
            })
        return Response({'count': len(rows), 'results': rows})


class DepreciationScheduleView(APIView):
    """GET /assets/reports/depreciation/?asset_id=<id>&periods=<n>"""
    def get(self, request, *args, **kwargs):
        asset_id = request.query_params.get('asset_id')
        periods = int(request.query_params.get('periods') or 0)
        from decimal import Decimal
        from .models import FixedAsset
        if not asset_id:
            return Response({'error': 'asset_id query param required'}, status=400)
        try:
            asset = FixedAsset.objects.get(id=asset_id)
        except FixedAsset.DoesNotExist:
            return Response({'error': 'asset not found'}, status=404)

        useful = int(asset.useful_life or 0)
        months = periods if periods > 0 else useful
        if months <= 0:
            return Response({'error': 'asset has no useful_life set'}, status=400)

        base = (asset.total_cost or Decimal('0')) - (asset.residual_value or Decimal('0'))
        if base <= 0:
            return Response({'schedule': [], 'notes': 'No depreciable base'})

        monthly = (Decimal(base) / Decimal(useful)) if useful else Decimal('0')
        schedule = []
        acc = Decimal(asset.accumulated_depreciation or 0)
        nbv = Decimal(asset.nbv or asset.total_cost or 0)
        start = asset.acq_date
        from datetime import timedelta
        y = start.year if start else None
        m = start.month if start else None
        for i in range(months):
            amt = float(monthly.quantize(Decimal('0.01')))
            acc = (acc + Decimal(str(amt))).quantize(Decimal('0.01'))
            nbv = (Decimal(asset.total_cost or 0) - acc).quantize(Decimal('0.01'))
            schedule.append({'period_index': i+1, 'monthly_depreciation': amt, 'accumulated_depreciation': float(acc), 'nbv': float(nbv)})
        return Response({'asset': asset.id, 'schedule': schedule})


class NetBookValueReportView(APIView):
    """GET /assets/reports/nbv/ - return NBV per asset and totals"""
    def get(self, request, *args, **kwargs):
        from .models import FixedAsset
        from django.db.models import Sum
        assets = FixedAsset.objects.all().order_by('assetCode')
        rows = []
        for a in assets:
            rows.append({'id': a.id, 'assetCode': a.assetCode, 'name': a.name, 'nbv': float(a.nbv or 0), 'accumulated_depreciation': float(a.accumulated_depreciation or 0), 'cost': float(a.total_cost or 0)})
        totals = assets.aggregate(total_cost=Sum('total_cost'), total_nbv=Sum('nbv'), total_accum=Sum('accumulated_depreciation'))
        return Response({'count': len(rows), 'totals': {'total_cost': float(totals.get('total_cost') or 0), 'total_nbv': float(totals.get('total_nbv') or 0), 'total_accumulated': float(totals.get('total_accum') or 0)}, 'results': rows})


class AssetMovementReportView(APIView):
    """GET /assets/reports/movements/?asset_id=<id>&from=<date>&to=<date>"""
    def get(self, request, *args, **kwargs):
        asset_id = request.query_params.get('asset_id')
        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        from .models import FixedAsset, AssetStatusHistory, LedgerReceipt, LedgerIssue
        movements = []
        if asset_id:
            try:
                asset = FixedAsset.objects.get(id=asset_id)
            except FixedAsset.DoesNotExist:
                return Response({'error': 'asset not found'}, status=404)
            # status history
            for h in AssetStatusHistory.objects.filter(asset=asset).order_by('createdAt'):
                movements.append({'type': 'status_change', 'date': h.createdAt.isoformat(), 'from': h.from_status, 'to': h.to_status, 'by': h.changed_by, 'reason': h.reason})
            # ledger movements via source_item link
            if asset.source_item:
                ledger_qs = LedgerReceipt.objects.filter(ledger__item=asset.source_item)
                for r in ledger_qs.order_by('date'):
                    movements.append({'type': 'receipt', 'date': r.date.isoformat() if r.date else None, 'grn': r.grnNo, 'qty': r.qty, 'total': float(r.totalCost)})
                issue_qs = LedgerIssue.objects.filter(ledger__item=asset.source_item)
                for it in issue_qs.order_by('date'):
                    movements.append({'type': 'issue', 'date': it.date.isoformat() if it.date else None, 's13': it.s13No, 'qty': it.qty, 'total': float(it.totalCost)})
        else:
            # return recent status changes across assets
            for h in AssetStatusHistory.objects.all().order_by('-createdAt')[:200]:
                movements.append({'asset': h.asset.assetCode if h.asset else None, 'type': 'status_change', 'date': h.createdAt.isoformat(), 'from': h.from_status, 'to': h.to_status, 'by': h.changed_by})

        # optional date filtering
        if date_from or date_to:
            import datetime
            def in_range(d):
                if not d:
                    return True
                try:
                    dt = datetime.date.fromisoformat(d.split('T')[0])
                except Exception:
                    return True
                if date_from:
                    if dt < datetime.date.fromisoformat(date_from):
                        return False
                if date_to:
                    if dt > datetime.date.fromisoformat(date_to):
                        return False
                return True
            movements = [m for m in movements if in_range(m.get('date'))]

        return Response({'count': len(movements), 'results': movements})
