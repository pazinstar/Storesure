from rest_framework import serializers
from django.utils import timezone
from roles.storekeeper.stores.models import (
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    Requisition,
    Delivery,
    PurchaseRequisition,
    Tender,
    Quotation,
    ProcurementReference,
    ProcurementContract,
    ContractMilestone
)

class ProcurementSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'taxPin', 'contactPerson', 'phone', 'email', 
            'physicalAddress', 'category', 'paymentTerms', 'status', 
            'rating', 'county', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

class ProcurementPurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'description', 'unit', 'assetType', 'quantity', 'unitPrice', 'deliveredQty']
        read_only_fields = ['id']

class ProcurementPurchaseOrderSerializer(serializers.ModelSerializer):
    items = ProcurementPurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'lpoNumber', 'date', 'supplierId', 'supplierName', 
            'supplierAddress', 'supplierPhone', 'supplierEmail', 'supplierTaxPin', 
            'storeLocation', 'items', 'totalValue', 'status', 'paymentStatus', 
            'paymentTerms', 'expectedDeliveryDate', 'preparedBy', 'createdAt'
        ]
        read_only_fields = ['id', 'lpoNumber', 'preparedAt', 'createdAt']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchaseOrder=purchase_order, **item_data)
        return purchase_order

class ProcurementRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requisition
        fields = ['id', 's12Number', 'status']

class ProcurementDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['id', 'status']

class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisition
        fields = '__all__'
        read_only_fields = ['id', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'approvedBy': {'required': False},
            'approvedDate': {'required': False},
            'rejectionReason': {'required': False},
            'processedBy': {'required': False},
            'processedDate': {'required': False},
            'status': {'required': False}
        }

class TenderSerializer(serializers.ModelSerializer):
    daysLeft = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = '__all__'
        read_only_fields = ['id', 'bids', 'status', 'createdAt']

    def get_daysLeft(self, obj):
        if obj.closingDate:
            delta = (obj.closingDate - timezone.now().date()).days
            return max(0, delta)
        return 0

class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = '__all__'
        read_only_fields = ['id', 'status', 'createdAt']

class ProcurementReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementReference
        fields = '__all__'
        read_only_fields = ['id', 'referenceNumber', 'createdAt']

class ContractMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractMilestone
        fields = '__all__'
        read_only_fields = ['id', 'contract', 'createdAt']

class ProcurementContractSerializer(serializers.ModelSerializer):
    paymentMilestones = ContractMilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = ProcurementContract
        fields = '__all__'
        read_only_fields = ['id', 'contractNumber', 'createdAt']
