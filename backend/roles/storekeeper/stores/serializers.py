from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import (
    InventoryItem, 
    Delivery, 
    Requisition, 
    RequisitionItem, 
    IssueHistory, 
    ReceivingHistory
)
from .models import ItemTypeChoices

VALID_ITEM_TYPES = {choice.value for choice in ItemTypeChoices}

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

    def validate_category_type(self, value):
        """Enforce only the 4 allowed item types and reject custom/unknown values."""
        if value not in VALID_ITEM_TYPES:
            raise ValidationError(
                f"Invalid item type '{value}'. Must be one of: {', '.join(sorted(VALID_ITEM_TYPES))}."
            )
        return value

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

    def create(self, validated_data):
        # Ensure we persist exactly what the client provided for IssueHistory
        # (avoid any accidental mapping issues). Log incoming payload for debugging.
        try:
            import logging
            logging.getLogger('django.request').debug(f"Creating IssueHistory with: {validated_data}")
        except Exception:
            pass
        return IssueHistory.objects.create(**validated_data)

class ReceivingHistorySerializer(serializers.ModelSerializer):
    # Expose both `amount` (legacy string) and `totalValue` (numeric) and signaturePlacement
    lpoReference = serializers.CharField(write_only=True, required=False, allow_null=True)
    signatureConfirmed = serializers.BooleanField(write_only=True, required=False)
    totalValue = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    signaturePlacement = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = ReceivingHistory
        fields = '__all__'
        read_only_fields = ['id']

    def create(self, validated_data):
        # Pull out write-only fields
        lpo_ref = validated_data.pop('lpoReference', None)
        # Remove write-only helper fields so they are not passed to model create
        sig_confirmed = validated_data.pop('signatureConfirmed', False)

        # If an LPO reference was provided, load PurchaseOrder to populate items and totalValue
        if lpo_ref:
            from .models import PurchaseOrder
            try:
                po = PurchaseOrder.objects.prefetch_related('items').get(lpoNumber=lpo_ref)
                # Sum quantities from LPO items for items count
                items_count = sum(int(i.quantity or 0) for i in po.items.all())
                validated_data['items'] = items_count
                # Use numeric totalValue from PurchaseOrder if present
                validated_data['totalValue'] = po.totalValue or validated_data.get('totalValue')
            except PurchaseOrder.DoesNotExist:
                # ignore, frontend may provide explicit values
                pass

        # If signature was confirmed at creation, set signer info from request user if available
        request = self.context.get('request') if self.context else None
        if sig_confirmed and request and getattr(request, 'user', None) and not request.user.is_anonymous:
            try:
                name = f"{request.user.get_full_name() or getattr(request.user, 'username', '')}"
            except Exception:
                name = str(request.user)
            validated_data['storekeeperSignature'] = name
            # store user id/identifier for reference
            try:
                user_id = getattr(request.user, 'id', None) or getattr(request.user, 'pk', None) or str(request.user)
            except Exception:
                user_id = str(request.user)
            validated_data['storekeeperId'] = str(user_id)
            from django.utils import timezone
            validated_data['signedAt'] = timezone.now().isoformat()

        return super().create(validated_data)

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
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'taxPin': {'required': False, 'allow_blank': True},
            'category': {'required': False},
            'status': {'required': False},
        }

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
        # Prefer explicit FK relation when available
        try:
            if getattr(obj, 'item', None):
                return obj.item.category
        except Exception:
            pass
        # Fallback to lookup by itemCode string
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
