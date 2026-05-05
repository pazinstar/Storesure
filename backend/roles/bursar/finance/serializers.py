from rest_framework import serializers
from roles.storekeeper.stores.models import PurchaseOrder, Requisition, Delivery

class BursarPurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'lpoNumber', 'status', 'paymentStatus']

class BursarRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Requisition
        fields = ['id', 'status']

class BursarDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['id', 'status']
