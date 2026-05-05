from rest_framework import generics
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

from .models import InventorySetting

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
            serializer.validated_data['status'] = status_map[decision]
        serializer.save()

class DeliverySignDecisionView(APIView):
    def post(self, request, pk, format=None):
        from .models import Delivery
        from rest_framework import status
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
        signatures = delivery.signatures
        if not isinstance(signatures, list):
            signatures = []
            
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
            delivery.status = "Accepted"
            
            # Government Ledger Generation Logic
            if not delivery.grnGenerated:
                import uuid
                from .models import InventoryLedger, LedgerReceipt, InventoryItem
                import json
                
                delivery.grnGenerated = True
                delivery.grnId = f"GRN-{timezone.now().year}-{str(uuid.uuid4())[:4].upper()}"
                
                items = delivery.items if isinstance(delivery.items, list) else []
                if isinstance(items, str):
                    try:
                        items = json.loads(items)
                    except:
                        items = []
                        
                for item_data in items:
                    item_code = item_data.get('itemCode') or item_data.get('id')
                    try:
                        qty = int(item_data.get('quantity', item_data.get('qty', 0)))
                        unit_cost = float(item_data.get('unitPrice', item_data.get('unitCost', item_data.get('rate', 0))))
                    except (ValueError, TypeError):
                        qty, unit_cost = 0, 0
                        
                    if item_code and qty > 0:
                        inventory_item = InventoryItem.objects.filter(id=item_code).first()
                        item_name = inventory_item.name if inventory_item else item_data.get('itemName', item_code)
                        unit = inventory_item.unit if inventory_item else item_data.get('unit', 'Unit')
                        
                        # Find or create ledger
                        ledger, created = InventoryLedger.objects.get_or_create(
                            itemCode=item_code,
                            defaults={
                                'itemName': item_name,
                                'unit': unit,
                                'openingQty': 0, 'openingValue': 0,
                                'totalReceiptsQty': 0, 'totalReceiptsValue': 0,
                                'totalIssuesQty': 0, 'totalIssuesValue': 0,
                                'closingQty': 0, 'closingValue': 0,
                            }
                        )
                        
                        new_balance = ledger.closingQty + qty
                        total_cost = qty * unit_cost
                        
                        # Create LedgerReceipt first to trigger immutability hooks, etc
                        LedgerReceipt.objects.create(
                            ledger=ledger,
                            date=timezone.now().date(),
                            grnNo=delivery.grnId,
                            qty=qty,
                            unitCost=unit_cost,
                            totalCost=total_cost,
                            supplierName=delivery.supplierName,
                            requisitionNo=delivery.lpoReference, # Usually mapped via LPO when req missing
                            balanceInStock=new_balance,
                            signatures=json.dumps(signatures)
                        )

                        # Update Ledger Aggregates
                        ledger.totalReceiptsQty += qty
                        ledger.totalReceiptsValue += total_cost
                        ledger.closingQty = new_balance
                        ledger.closingValue += total_cost
                        ledger.save()
            
        delivery.save()
        
        # Return updated delivery details
        from .serializers import DeliverySerializer
        serializer = DeliverySerializer(delivery)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RequisitionsListView(generics.ListAPIView):
    queryset = Requisition.objects.all()
    serializer_class = RequisitionSerializer

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
        
        instance = self.get_object()
        was_not_fully_signed = not (instance.receiverSignature and instance.issuerSignature)
        
        updated_instance = serializer.save()
        
        is_fully_signed = updated_instance.receiverSignature and updated_instance.issuerSignature
        
        # When both rules hold, generate immutable LedgerIssue entries
        # Ensures Rule 2 (Transactions create ledger lines) & Rule 4 (Mandatory Signatures)
        if was_not_fully_signed and is_fully_signed:
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
                    
                    ledger, _ = InventoryLedger.objects.get_or_create(
                        itemCode=item_code,
                        defaults={
                            'itemName': req_item.itemCode.name,
                            'unit': req_item.unit,
                            'openingQty': 0, 'openingValue': 0,
                            'totalReceiptsQty': 0, 'totalReceiptsValue': 0,
                            'totalIssuesQty': 0, 'totalIssuesValue': 0,
                            'closingQty': 0, 'closingValue': 0,
                        }
                    )
                    
                    new_balance = ledger.closingQty - qty
                    
                    if new_balance < 0:
                        from rest_framework.exceptions import ValidationError
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
            
            updated_instance.status = "Fully Issued"
            updated_instance.save()

class IssueHistoryListView(generics.ListCreateAPIView):
    queryset = IssueHistory.objects.all().order_by('-createdAt', '-id')
    serializer_class = IssueHistorySerializer

class ReceivingHistoryListView(generics.ListCreateAPIView):
    queryset = ReceivingHistory.objects.all().order_by('-createdAt', '-id')
    serializer_class = ReceivingHistorySerializer

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

class SupplierListView(generics.ListAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class LpoListCreateView(generics.ListCreateAPIView):
    from .serializers import PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all().order_by('-createdAt', '-id')
    serializer_class = PurchaseOrderSerializer

class LpoDetailView(generics.RetrieveUpdateDestroyAPIView):
    from .serializers import PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    lookup_field = 'id'

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


class S2LedgerListView(generics.ListAPIView):
    """
    Read-only list of S2 (Permanent & Expendable) ledger entries.
    Supports filters: ?item=<itemCode>&type=<RECEIPT|ISSUE|TRANSFER|RETURN|DAMAGE_LOSS>
    """
    from .models import S2LedgerEntry
    from .serializers import S2LedgerEntrySerializer
    serializer_class = S2LedgerEntrySerializer

    def get_queryset(self):
        from .models import S2LedgerEntry
        qs = S2LedgerEntry.objects.all().order_by('date', 'id')
        item = self.request.query_params.get('item')
        txn_type = self.request.query_params.get('type')
        if item and item != 'ALL':
            qs = qs.filter(itemCode=item)
        if txn_type and txn_type != 'ALL':
            qs = qs.filter(txnType=txn_type)
        return qs
