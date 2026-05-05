from rest_framework import generics
from roles.storekeeper.stores.models import PurchaseOrder, Requisition, Delivery
from .serializers import (
    BursarPurchaseOrderSerializer,
    BursarRequisitionSerializer,
    BursarDeliverySerializer
)

class BursarPurchaseOrderListView(generics.ListAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = BursarPurchaseOrderSerializer

class BursarRequisitionListView(generics.ListAPIView):
    queryset = Requisition.objects.all()
    serializer_class = BursarRequisitionSerializer

class BursarDeliveryListView(generics.ListAPIView):
    queryset = Delivery.objects.all()
    serializer_class = BursarDeliverySerializer
