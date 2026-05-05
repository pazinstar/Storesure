from rest_framework import generics
from roles.storekeeper.stores.models import PurchaseOrder, Requisition
from .serializers import (
    HeadteacherPurchaseOrderSerializer,
    HeadteacherRequisitionSerializer
)

class HeadteacherPurchaseOrderListView(generics.ListAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = HeadteacherPurchaseOrderSerializer

class HeadteacherRequisitionListView(generics.ListAPIView):
    queryset = Requisition.objects.all()
    serializer_class = HeadteacherRequisitionSerializer
