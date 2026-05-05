from rest_framework import serializers
from roles.storekeeper.stores.models import InventoryItem

class AuditorInventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'unit', 'minimumStockLevel', 'reorderLevel', 'openingBalance', 'status']
