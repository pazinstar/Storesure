from rest_framework import serializers
from roles.storekeeper.stores.models import PurchaseOrder, Requisition, RequisitionItem

class HeadteacherRequisitionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequisitionItem
        fields = ['id', 'description', 'quantity', 'unit', 'unitPrice']

class HeadteacherRequisitionSerializer(serializers.ModelSerializer):
    items = HeadteacherRequisitionItemSerializer(many=True, read_only=True, source='requisitionitem_set')
    
    class Meta:
        model = Requisition
        fields = ['id', 's12Number', 'requestedBy', 'status', 'items']

class HeadteacherPurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'lpoNumber', 'supplierName', 'totalValue', 'status']
