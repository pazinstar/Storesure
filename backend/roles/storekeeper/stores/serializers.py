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
    ledger = serializers.SerializerMethodField(read_only=True)
    is_depreciable = serializers.SerializerMethodField(read_only=True)
    requires_custodian = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = InventoryItem
        fields = '__all__'  # plus derived read-only properties

    def validate_category_type(self, value):
        """Enforce only the 4 allowed item types and reject custom/unknown values."""
        if value not in VALID_ITEM_TYPES:
            raise ValidationError(
                f"Invalid item type '{value}'. Must be one of: {', '.join(sorted(VALID_ITEM_TYPES))}."
            )
        return value

    def get_ledger(self, obj):
        try:
            return obj.ledger
        except Exception:
            return None

    def get_is_depreciable(self, obj):
        try:
            return obj.is_depreciable
        except Exception:
            return False

    def get_requires_custodian(self, obj):
        try:
            return obj.requires_custodian
        except Exception:
            return False

    def validate(self, data):
        # Enforce minimum useful life for permanent and fixed assets
        ct = data.get('category_type') or (self.instance.category_type if self.instance else None)
        min_life = data.get('min_useful_life') if 'min_useful_life' in data else (self.instance.min_useful_life if self.instance else None)
        if ct in (ItemTypeChoices.PERMANENT, ItemTypeChoices.FIXED_ASSET):
            if not min_life or int(min_life) <= 0:
                raise ValidationError({
                    'min_useful_life': 'Permanent and Fixed Asset items must set `min_useful_life` (months) > 0.'
                })
        return data

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


# =============================================================================
# Phase 2 — S2 Ledger & Core Stores Workflows Serializers
# =============================================================================

from .models import S2Transaction, S2Ledger
from .services import (
    post_s2_receipt, post_s2_issue, post_s2_transfer,
    post_s2_return, post_s2_damage, reverse_s2_transaction,
    validate_s2_post,
)


class S2TransactionListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for S2 transactions."""
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    item_name = serializers.CharField(read_only=True)
    item_code = serializers.CharField(read_only=True)

    class Meta:
        model = S2Transaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'status', 'status_display', 'ref_no', 'date',
            'item_code', 'item_name', 'category',
            'qty_received', 'qty_issued',
            'running_balance_before', 'running_balance_after',
            'unit_cost', 'total_value',
            'supplier_name', 'custodian_name', 'dept_name',
            'condition', 'remarks', 'created_by',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = fields


class S2TransactionDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for a single S2 transaction."""
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = S2Transaction
        fields = '__all__'
        read_only_fields = [
            'id', 'running_balance_before', 'running_balance_after',
            'status', 'createdAt', 'updatedAt', 'reversed_by',
        ]


class S2LedgerSerializer(serializers.ModelSerializer):
    """Serializer for S2Ledger summary view."""
    class Meta:
        model = S2Ledger
        fields = [
            'id', 'itemCode', 'itemName', 'category', 'category_type',
            'unit', 'openingBalance', 'receiptsQty', 'receiptsValue',
            'issuesQty', 'issuesValue', 'transfersOutQty', 'transfersOutValue',
            'transfersInQty', 'transfersInValue', 'returnsQty', 'returnsValue',
            'damagesQty', 'damagesValue', 'closingBalance', 'closingValue',
            'lastTransactionDate', 'createdAt', 'updatedAt',
        ]


class S2ReceiptSerializer(serializers.Serializer):
    """Serializer for posting a GRN→Store receipt."""
    item_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    qty = serializers.IntegerField(required=True, min_value=1)
    unit_cost = serializers.DecimalField(required=True, max_digits=12, decimal_places=2, min_value=0)
    supplier_id = serializers.CharField(required=False, allow_blank=True, default='')
    supplier_name = serializers.CharField(required=False, allow_blank=True, default='')
    ref_no = serializers.CharField(required=False, allow_blank=True, default='')
    condition = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        return post_s2_receipt(item=item, qty=qty, unit_cost=unit_cost, **validated_data)


class S2IssueSerializer(serializers.Serializer):
    """Serializer for posting a Store→Department issue."""
    item_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    qty = serializers.IntegerField(required=True, min_value=1)
    unit_cost = serializers.DecimalField(required=True, max_digits=12, decimal_places=2, min_value=0)
    custodian_id = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_name = serializers.CharField(required=False, allow_blank=True, default='')
    dept_id = serializers.CharField(required=False, allow_blank=True, default='')
    dept_name = serializers.CharField(required=False, allow_blank=True, default='')
    ref_no = serializers.CharField(required=False, allow_blank=True, default='')
    condition = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        return post_s2_issue(item=item, qty=qty, unit_cost=unit_cost, **validated_data)


class S2TransferSerializer(serializers.Serializer):
    """Serializer for posting a department transfer."""
    item_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    qty = serializers.IntegerField(required=True, min_value=1)
    unit_cost = serializers.DecimalField(required=True, max_digits=12, decimal_places=2, min_value=0)
    from_dept_id = serializers.CharField(required=False, allow_blank=True, default='')
    from_dept_name = serializers.CharField(required=False, allow_blank=True, default='')
    to_dept_id = serializers.CharField(required=False, allow_blank=True, default='')
    to_dept_name = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_id = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_name = serializers.CharField(required=False, allow_blank=True, default='')
    ref_no = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        out_txn, in_txn = post_s2_transfer(
            item=item, qty=qty, unit_cost=unit_cost, **validated_data
        )
        return out_txn


class S2ReturnSerializer(serializers.Serializer):
    """Serializer for posting a Return to Store."""
    item_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    qty = serializers.IntegerField(required=True, min_value=1)
    unit_cost = serializers.DecimalField(required=True, max_digits=12, decimal_places=2, min_value=0)
    dept_id = serializers.CharField(required=False, allow_blank=True, default='')
    dept_name = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_id = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_name = serializers.CharField(required=False, allow_blank=True, default='')
    ref_no = serializers.CharField(required=False, allow_blank=True, default='')
    condition = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        return post_s2_return(item=item, qty=qty, unit_cost=unit_cost, **validated_data)


class S2DamageSerializer(serializers.Serializer):
    """Serializer for posting a Damage/Loss/Condemn transaction."""
    item_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    qty = serializers.IntegerField(required=True, min_value=1)
    unit_cost = serializers.DecimalField(required=True, max_digits=12, decimal_places=2, min_value=0)
    custodian_id = serializers.CharField(required=False, allow_blank=True, default='')
    custodian_name = serializers.CharField(required=False, allow_blank=True, default='')
    dept_id = serializers.CharField(required=False, allow_blank=True, default='')
    dept_name = serializers.CharField(required=False, allow_blank=True, default='')
    ref_no = serializers.CharField(required=False, allow_blank=True, default='')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        return post_s2_damage(item=item, qty=qty, unit_cost=unit_cost, **validated_data)


class S2ReversalSerializer(serializers.Serializer):
    """Serializer for reversing a posted S2 transaction."""
    transaction_id = serializers.CharField(required=True)
    reason = serializers.CharField(required=True, allow_blank=False)
    reversed_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_transaction_id(self, value):
        try:
            txn = S2Transaction.objects.get(id=value)
        except S2Transaction.DoesNotExist:
            raise ValidationError(f"Transaction with id '{value}' not found.")
        if txn.status == 'reversed':
            raise ValidationError("Transaction has already been reversed.")
        return txn

    def create(self, validated_data):
        txn = validated_data.pop('transaction_id')
        reason = validated_data.pop('reason')
        reversed_by = validated_data.pop('reversed_by', '')
        return reverse_s2_transaction(txn, reversed_by=reversed_by, reason=reason)


# =============================================================================
# Phase 3 — Capitalization Rules Engine & Decision Assistant Serializers
# =============================================================================

from .models import CapitalizationRule, CapitalizationSetting, CapitalizationPrompt
from .capitalization_engine import classify_item, log_classification_prompt, apply_override


class CapitalizationRuleSerializer(serializers.ModelSerializer):
    """Serializer for CRUD on capitalization rules."""
    category_type_display = serializers.CharField(
        source='get_categoryType_display', read_only=True
    )
    action_display = serializers.CharField(
        source='get_action_display', read_only=True
    )

    class Meta:
        model = CapitalizationRule
        fields = [
            'id', 'rule_code', 'categoryType', 'category_type_display',
            'rule_label', 'minCost', 'minUsefulLifeMonths',
            'bulkThreshold', 'bulkMateriality', 'action', 'action_display',
            'description', 'priority', 'isActive', 'createdAt',
        ]
        read_only_fields = ['id', 'rule_code', 'createdAt']


class CapitalizationSettingSerializer(serializers.ModelSerializer):
    """Serializer for reading/updating global capitalization settings."""
    class Meta:
        model = CapitalizationSetting
        fields = [
            'id', 'threshold', 'bulk_materiality', 'min_useful_life',
            'depreciation_start_rule', 'default_residual_pct',
            'asset_classes', 'updated_by', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class CapitalizationPromptListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for capitalization prompts."""
    suggested_action_display = serializers.CharField(
        source='get_suggested_action_display', read_only=True
    )
    approval_status_display = serializers.CharField(
        source='get_approval_status_display', read_only=True
    )

    class Meta:
        model = CapitalizationPrompt
        fields = [
            'id', 'item_code', 'item_name', 'category_type',
            'unit_cost', 'quantity', 'total_value',
            'applied_rule', 'suggested_action', 'suggested_action_display',
            'suggested_category_type', 'is_bulk', 'approval_status',
            'approval_status_display', 'override_required',
            'created_by', 'createdAt',
        ]
        read_only_fields = fields


class CapitalizationPromptDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for a capitalization prompt with override support."""
    suggested_action_display = serializers.CharField(
        source='get_suggested_action_display', read_only=True
    )
    approval_status_display = serializers.CharField(
        source='get_approval_status_display', read_only=True
    )

    class Meta:
        model = CapitalizationPrompt
        fields = '__all__'
        read_only_fields = [
            'id', 'item_code', 'item_name', 'category_type',
            'unit_cost', 'quantity', 'total_value',
            'applied_rule', 'suggested_action', 'suggested_category_type',
            'is_bulk', 'bulk_group_ref', 'created_by', 'createdAt', 'updatedAt',
        ]


class ClassifyItemSerializer(serializers.Serializer):
    """Serializer for triggering auto-classification on an item/GRN."""
    item_id = serializers.CharField(required=True)
    qty = serializers.IntegerField(min_value=1, default=1)
    unit_cost = serializers.DecimalField(
        required=True, max_digits=12, decimal_places=2, min_value=0
    )
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_item_id(self, value):
        try:
            item = InventoryItem.objects.get(id=value)
        except InventoryItem.DoesNotExist:
            raise ValidationError(f"Item with id '{value}' not found.")
        return item

    def create(self, validated_data):
        item = validated_data.pop('item_id')
        qty = validated_data.pop('qty')
        unit_cost = validated_data.pop('unit_cost')
        created_by = validated_data.pop('created_by', '')

        result = classify_item(item, qty=qty, unit_cost=unit_cost, created_by=created_by)
        prompt = log_classification_prompt(
            item=item, qty=qty, unit_cost=unit_cost,
            classification=result, created_by=created_by,
        )
        return {
            'prompt': prompt,
            'classification': result,
        }


class BulkCapitalizationSerializer(serializers.Serializer):
    """Serializer for creating grouped/bulk capitalization prompts."""
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)
    created_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        # Validate each item dict contains required fields
        validated = []
        for idx, itm in enumerate(data['items']):
            if 'item_id' not in itm:
                raise ValidationError(f"items[{idx}].item_id is required")
            if 'qty' not in itm:
                raise ValidationError(f"items[{idx}].qty is required")
            if 'unit_cost' not in itm:
                raise ValidationError(f"items[{idx}].unit_cost is required")
            # ensure item exists
            try:
                item = InventoryItem.objects.get(id=itm['item_id'])
            except InventoryItem.DoesNotExist:
                raise ValidationError(f"Item with id '{itm['item_id']}' not found")
            validated.append({
                'item': item,
                'qty': int(itm['qty']),
                'unit_cost': Decimal(str(itm['unit_cost'])),
            })
        data['validated_items'] = validated
        return data


class BulkProcessSerializer(serializers.Serializer):
    """Serializer for processing/approving a bulk group into assets.

    Supports options to create a single master asset representing the group
    and optionally materialize child assets (one-per-unit) with tagging.
    """
    bulk_group_ref = serializers.CharField(required=True)
    approved_by = serializers.CharField(required=True)
    create_children = serializers.BooleanField(required=False, default=False)
    child_tag_prefix = serializers.CharField(required=False, allow_blank=True, default='')
    group_name = serializers.CharField(required=False, allow_blank=True, default='')


class OverrideDecisionSerializer(serializers.Serializer):
    """Serializer for applying a user override on a capitalization prompt."""
    prompt_id = serializers.CharField(required=True)
    override_decision = serializers.ChoiceField(
        required=True,
        choices=['expense', 'capitalize', 'reclassify'],
    )
    reason = serializers.CharField(required=True, allow_blank=False)
    override_by = serializers.CharField(required=True, allow_blank=False)
    approval_status = serializers.ChoiceField(
        required=False, default='approved',
        choices=['approved', 'rejected', 'pending'],
    )
    approved_by = serializers.CharField(required=False, allow_blank=True, default='')
    approval_notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_prompt_id(self, value):
        try:
            prompt = CapitalizationPrompt.objects.get(id=value)
        except CapitalizationPrompt.DoesNotExist:
            raise ValidationError(f"Prompt with id '{value}' not found.")
        if prompt.approval_status == 'approved':
            raise ValidationError("Prompt has already been approved.")
        return value

    def create(self, validated_data):
        prompt_id = validated_data.pop('prompt_id')
        return apply_override(prompt_id=prompt_id, **validated_data)


# =============================================================================
# Phase 4 — Fixed Asset Register & Lifecycle Management Serializers
# =============================================================================

from .models import FixedAsset, AssetStatusHistory, AssetMaintenance, ASSET_STATUS_CHOICES


class AssetStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for asset status change audit trail."""
    class Meta:
        model = AssetStatusHistory
        fields = '__all__'
        read_only_fields = ['id', 'createdAt']


class AssetMaintenanceSerializer(serializers.ModelSerializer):
    """Serializer for asset maintenance records."""
    class Meta:
        model = AssetMaintenance
        fields = '__all__'
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AssetMaintenanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new maintenance record."""
    class Meta:
        model = AssetMaintenance
        fields = [
            'asset', 'maintenance_type', 'description',
            'scheduled_date', 'cost', 'vendor', 'notes', 'created_by',
        ]


class FixedAssetListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for fixed assets."""
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    depreciation_method_display = serializers.CharField(
        source='get_depreciation_method_display', read_only=True
    )

    class Meta:
        model = FixedAsset
        fields = [
            'id', 'assetCode', 'tag_no', 'name', 'category', 'category_type',
            'asset_type', 'serial_no', 'qty', 'unit_cost', 'total_cost',
            'status', 'status_display', 'location', 'custodian',
            'depreciation_method', 'depreciation_method_display',
            'accumulated_depreciation', 'nbv', 'acq_date',
            'warranty_expiry', 'next_maintenance',
            'parent_asset', 'createdAt', 'updatedAt',
        ]
        read_only_fields = fields


class FixedAssetDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for a single fixed asset."""
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    depreciation_method_display = serializers.CharField(
        source='get_depreciation_method_display', read_only=True
    )
    allowed_transitions = serializers.SerializerMethodField()
    status_history = AssetStatusHistorySerializer(many=True, read_only=True)
    maintenance_records = AssetMaintenanceSerializer(many=True, read_only=True)
    child_assets = serializers.SerializerMethodField()

    class Meta:
        model = FixedAsset
        fields = '__all__'
        read_only_fields = [
            'id', 'assetCode', 'nbv', 'accumulated_depreciation',
            'createdAt', 'updatedAt',
        ]

    def get_allowed_transitions(self, obj):
        return obj.get_allowed_transitions()

    def get_child_assets(self, obj):
        children = obj.child_assets.all()
        return FixedAssetListSerializer(children, many=True).data


class FixedAssetCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new fixed asset."""
    class Meta:
        model = FixedAsset
        fields = [
            'name', 'tag_no', 'category', 'category_type', 'asset_type',
            'description', 'serial_no', 'unit',
            'qty', 'unit_cost', 'total_cost',
            'purchaseDate', 'acq_date', 'purchaseCost',
            'supplier_id', 'supplier_name', 'funding_source',
            'dept_id', 'dept_name', 'custodian_id', 'custodian',
            'location_id', 'location',
            'useful_life', 'residual_value', 'depreciation_method',
            'warranty_expiry', 'next_maintenance',
            'parent_asset', 'source_item', 'source_prompt',
            'notes', 'created_by',
        ]


class FixedAssetStatusTransitionSerializer(serializers.Serializer):
    """Serializer for transitioning an asset's status."""
    new_status = serializers.ChoiceField(
        required=True, choices=[c[0] for c in ASSET_STATUS_CHOICES],
    )
    changed_by = serializers.CharField(required=False, allow_blank=True, default='')
    reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        asset = self.context.get('asset')
        new_status = data.get('new_status')
        if asset and not asset.can_transition_to(new_status):
            allowed = asset.get_allowed_transitions()
            raise ValidationError(
                f"Cannot transition from '{asset.status}' to '{new_status}'. "
                f"Allowed transitions: {', '.join(allowed) if allowed else 'none (terminal state)'}"
            )
        return data


class FixedAssetDisposalSerializer(serializers.Serializer):
    """Serializer for disposing an asset (full or partial)."""
    disposal_status = serializers.ChoiceField(
        required=True, choices=['disposed', 'lost', 'obsolete'],
    )
    disposal_date = serializers.DateField(required=True)
    disposal_value = serializers.DecimalField(
        required=False, max_digits=12, decimal_places=2, default=0,
    )
    disposal_reason = serializers.CharField(required=True, allow_blank=False)
    disposed_qty = serializers.IntegerField(
        required=False, default=None, allow_null=True,
        help_text="For partial disposal, specify qty to dispose. Omit for full disposal.",
    )
    changed_by = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_disposed_qty(self, value):
        asset = self.context.get('asset')
        if value is not None and asset:
            if value <= 0:
                raise ValidationError("disposed_qty must be positive.")
            if value >= asset.qty:
                raise ValidationError(
                    f"disposed_qty ({value}) must be less than total qty ({asset.qty}). "
                    "Use full disposal instead."
                )
        return value
