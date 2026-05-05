from rest_framework import generics
from roles.storekeeper.stores.models import InventoryItem
from .serializers import AuditorInventoryItemSerializer

class AuditorInventoryItemListView(generics.ListAPIView):
    queryset = InventoryItem.objects.all()
    serializer_class = AuditorInventoryItemSerializer
