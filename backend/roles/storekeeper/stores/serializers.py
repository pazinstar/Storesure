from rest_framework import serializers
from .models import (
    InventoryItem, 
    Delivery, 
    Requisition, 
    RequisitionItem, 
    IssueHistory, 
    ReceivingHistory
)

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class StoreItemSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source='id')

    class Meta:
        model = InventoryItem
        fields = ['id', 'code', 'description', 'unit', 'assetType', 'category', 'minimumStockLevel', 'reorderLevel']

class DeliverySerializer(serializers.ModelSerializer):
    remarks = serializers.CharField(source='overallRemarks', required=False, allow_blank=True)

    class Meta:
        model = Delivery
        fields = '__all__'
        read_only_fields = ['id', 'deliveryId', 'status', 'createdAt', 'updatedAt']

class DeliveryItemsUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['items']

class DeliveryDecisionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['decision', 'overallRemarks', 'status']

class RequisitionItemSerializer(serializers.ModelSerializer):
    itemCode = serializers.PrimaryKeyRelatedField(queryset=InventoryItem.objects.all())
    
    class Meta:
        model = RequisitionItem
        fields = ['id', 'itemCode', 'description', 'unit', 'quantityRequested', 'quantityApproved', 'quantityIssued', 'unitPrice']
        read_only_fields = ['id']
        
    def to_representation(self, instance):
        # The frontend mock returned a string itemCode, so let's override it in representation
        ret = super().to_representation(instance)
        ret['itemCode'] = instance.itemCode.id if instance.itemCode else None
        return ret


class RequisitionSerializer(serializers.ModelSerializer):
    items = RequisitionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Requisition
        fields = '__all__'

class S12RequisitionSerializer(serializers.ModelSerializer):
    items = RequisitionItemSerializer(many=True, required=False)

    class Meta:
        model = Requisition
        fields = '__all__'
        read_only_fields = ['id', 's12Number', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'status': {'required': False}
        }
        
    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'requestDate' in data_copy and isinstance(data_copy['requestDate'], str) and len(data_copy['requestDate']) > 10:
            data_copy['requestDate'] = data_copy['requestDate'][:10]
        return super().to_internal_value(data_copy)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        requisition = Requisition.objects.create(**validated_data)
        for item_data in items_data:
            from .models import RequisitionItem
            RequisitionItem.objects.create(requisition=requisition, **item_data)
        return requisition
        
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            from .models import RequisitionItem
            for item_data in items_data:
                item_code = item_data.get('itemCode')
                if item_code:
                    req_item = RequisitionItem.objects.filter(requisition=instance, itemCode=item_code).first()
                    if req_item:
                        for item_attr, item_value in item_data.items():
                            setattr(req_item, item_attr, item_value)
                        req_item.save()
                    else:
                        RequisitionItem.objects.create(requisition=instance, **item_data)
        return instance


class IssueHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueHistory
        fields = '__all__'
        read_only_fields = ['id']

class ReceivingHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceivingHistory
        fields = '__all__'
        read_only_fields = ['id']

from .models import (
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    RoutineIssueAuthority,
    RiaItem,
    InventoryLedger,
    LedgerReceipt,
    LedgerIssue,
    StoreReport
)

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'description', 'unit', 'assetType', 'quantity', 'unitPrice', 'deliveredQty']
        read_only_fields = ['id']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['id', 'lpoNumber', 'preparedAt', 'approvedBy', 'approvedAt', 'totalValue', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'status': {'required': False},
            'supplierName': {'required': False}
        }
        
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        total_value = sum(item.get('quantity', 0) * item.get('unitPrice', 0) for item in items_data)
        validated_data['totalValue'] = total_value
        lpo = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            from .models import PurchaseOrderItem
            PurchaseOrderItem.objects.create(purchaseOrder=lpo, **item_data)
        return lpo
        
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if items_data is not None:
            from .models import PurchaseOrderItem
            total_value = sum(item.get('quantity', 0) * item.get('unitPrice', 0) for item in items_data)
            instance.totalValue = total_value
            
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchaseOrder=instance, **item_data)
                
        instance.save()
        return instance

class RiaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiaItem
        fields = ['itemCode', 'itemName', 'unit', 'approvedQty', 'usedQty']

class RoutineIssueAuthoritySerializer(serializers.ModelSerializer):
    items = RiaItemSerializer(many=True, required=False)
    
    class Meta:
        model = RoutineIssueAuthority
        fields = '__all__'
        read_only_fields = ['id', 'number', 'createdAt']
        extra_kwargs = {
            'status': {'required': False}
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        ria = RoutineIssueAuthority.objects.create(**validated_data)
        for item_data in items_data:
            RiaItem.objects.create(ria=ria, **item_data)
        return ria

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                RiaItem.objects.create(ria=instance, **item_data)
                
        return instance

class LedgerReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerReceipt
        fields = ['date', 'grnNo', 'qty', 'unitCost', 'totalCost']

class LedgerIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerIssue
        fields = ['date', 's13No', 'qty', 'dept', 'unitCost', 'totalCost', 'riaNo']

class InventoryLedgerSerializer(serializers.ModelSerializer):
    receipts = LedgerReceiptSerializer(many=True, read_only=True)
    issues = LedgerIssueSerializer(many=True, read_only=True)

    class Meta:
        model = InventoryLedger
        fields = '__all__'

class StockBalanceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='itemCode')
    name = serializers.CharField(source='itemName')
    opening = serializers.IntegerField(source='openingQty')
    received = serializers.IntegerField(source='totalReceiptsQty')
    issued = serializers.IntegerField(source='totalIssuesQty')
    closing = serializers.IntegerField(source='closingQty')
    value = serializers.DecimalField(source='closingValue', max_digits=12, decimal_places=2)
    category = serializers.SerializerMethodField()

    class Meta:
        model = InventoryLedger
        fields = ['id', 'name', 'category', 'unit', 'opening', 'received', 'issued', 'closing', 'value']

    def get_category(self, obj):
        try:
            return obj.item.category
        except Exception:
            # Fallback if there's no reverse relationship mapped cleanly or item is missing
            from .models import InventoryItem
            item = InventoryItem.objects.filter(id=obj.itemCode).first()
            return item.category if item else 'Uncategorized'

class StoreReportSerializer(serializers.ModelSerializer):
    icon = serializers.CharField(source='iconName', required=False)
    category = serializers.CharField(source='type', required=False)
    lastGenerated = serializers.CharField(source='date', required=False)

    class Meta:
        model = StoreReport
        fields = ['id', 'title', 'description', 'icon', 'category', 'lastGenerated']

class StockAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import StockAdjustment
        model = StockAdjustment
        fields = '__all__'
        read_only_fields = ['id', 'status', 'approvedBy', 'createdAt']
        extra_kwargs = {
            'status': {'required': False},
            'approvedBy': {'required': False}
        }

class StoreTransferSerializer(serializers.ModelSerializer):
    # Mapping custom DRF names back and forth natively:
    from_store = serializers.CharField(required=False)  
    to_store = serializers.CharField(required=False)
    
    # We must explicitly define 'from' and 'to' so DRF outputs them accurately.
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Re-map key names for frontend output
        ret['from'] = ret.pop('from_store', None)
        ret['to'] = ret.pop('to_store', None)
        return ret
        
    def to_internal_value(self, data):
        # When creating, check if frontend sent 'from' and 'to', map they correctly back to schema native names
        if 'from' in data:
            data['from_store'] = data.pop('from')
        if 'to' in data:
            data['to_store'] = data.pop('to')
        return super().to_internal_value(data)

    class Meta:
        from .models import StoreTransfer
        model = StoreTransfer
        fields = ['id', 'date', 'from_store', 'to_store', 'items', 'status']
        read_only_fields = ['id', 'status']
        extra_kwargs = {
            'status': {'required': False}
        }

class FileMovementSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import FileMovement
        model = FileMovement
        fields = '__all__'
        read_only_fields = ['id', 'status', 'createdAt']
        extra_kwargs = {
            'status': {'required': False},
            'actualReturnDate': {'required': False},
            'notes': {'required': False},
            'borrowerSignature': {'required': False},
            'returnSignature': {'required': False}
        }

class RetentionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import RetentionRecord
        model = RetentionRecord
        fields = '__all__'
        read_only_fields = ['id', 'recordCode', 'expiryDate', 'createdAt', 'updatedAt', 'status']
        extra_kwargs = {
            'status': {'required': False}
        }

class AppraisalWorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import AppraisalWorkflow
        model = AppraisalWorkflow
        fields = '__all__'
        read_only_fields = ['id', 'status', 'createdAt']
        extra_kwargs = {
            'status': {'required': False}
        }

class DisposalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import DisposalRecord
        model = DisposalRecord
        fields = '__all__'
        read_only_fields = ['id', 'certificateNumber', 'createdAt']

from .models import InventorySetting

class InventorySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventorySetting
        fields = '__all__'


class S2LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        from .models import S2LedgerEntry
        model = S2LedgerEntry
        fields = '__all__'
        read_only_fields = ['id', 'createdAt']
