from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from roles.storekeeper.stores.models import (
    Supplier,
    PurchaseOrder,
    Requisition,
    Delivery,
    PurchaseRequisition,
    Tender,
    Quotation,
    ProcurementReference,
    ProcurementContract,
    ContractMilestone
)
from .serializers import (
    ProcurementSupplierSerializer,
    ProcurementPurchaseOrderSerializer,
    ProcurementRequisitionSerializer,
    ProcurementDeliverySerializer,
    PurchaseRequisitionSerializer,
    TenderSerializer,
    QuotationSerializer,
    ProcurementReferenceSerializer,
    ProcurementContractSerializer,
    ContractMilestoneSerializer
)

class ProcurementSupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all().order_by("-id")
    serializer_class = ProcurementSupplierSerializer

class ProcurementSupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = ProcurementSupplierSerializer
    lookup_field = "id"

class ProcurementPurchaseOrderListView(generics.ListAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = ProcurementPurchaseOrderSerializer

class ProcurementRequisitionListView(generics.ListAPIView):
    queryset = Requisition.objects.all()
    serializer_class = ProcurementRequisitionSerializer

class ProcurementDeliveryListView(generics.ListAPIView):
    queryset = Delivery.objects.all()
    serializer_class = ProcurementDeliverySerializer

class PurchaseRequisitionListCreateView(generics.ListCreateAPIView):
    queryset = PurchaseRequisition.objects.all().order_by('-createdAt')
    serializer_class = PurchaseRequisitionSerializer

class PurchaseRequisitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    lookup_field = 'id'

class TenderListCreateView(generics.ListCreateAPIView):
    queryset = Tender.objects.all().order_by('-createdAt')
    serializer_class = TenderSerializer

class QuotationListCreateView(generics.ListCreateAPIView):
    queryset = Quotation.objects.all().order_by('-createdAt')
    serializer_class = QuotationSerializer

class LPOListCreateView(generics.ListCreateAPIView):
    queryset = PurchaseOrder.objects.all().order_by('-createdAt')
    serializer_class = ProcurementPurchaseOrderSerializer

class LPODetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseOrder.objects.all()
    serializer_class = ProcurementPurchaseOrderSerializer
    lookup_field = 'id'

class LPOStatsView(APIView):
    def get(self, request):
        qs = PurchaseOrder.objects.all()
        total = qs.count()
        pendingDelivery = qs.exclude(status='Delivered').exclude(status='Draft').count()
        pendingPayment = qs.filter(paymentStatus='Pending').count()
        totalValue = qs.aggregate(Sum('totalValue'))['totalValue__sum'] or 0

        return Response({
            "total": total,
            "pendingDelivery": pendingDelivery,
            "pendingPayment": pendingPayment,
            "totalValue": totalValue
        })


class SupplierStatsView(APIView):
    """Return aggregate counts for suppliers (total and status breakdown)."""
    def get(self, request):
        qs = Supplier.objects.all()
        total = qs.count()
        active = qs.filter(status__iexact='Active').count()
        inactive = qs.filter(status__iexact='Inactive').count()
        blacklisted = qs.filter(status__iexact='Blacklisted').count()
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'blacklisted': blacklisted
        })

class ProcurementReferenceListCreateView(generics.ListCreateAPIView):
    queryset = ProcurementReference.objects.all().order_by('-createdAt')
    serializer_class = ProcurementReferenceSerializer

class ProcurementReferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProcurementReference.objects.all()
    serializer_class = ProcurementReferenceSerializer
    lookup_field = 'id'

class ProcurementReferenceClearView(APIView):
    def delete(self, request):
        count, _ = ProcurementReference.objects.all().delete()
        return Response({"message": f"Successfully deleted {count} procurement references."})

class ProcurementContractListCreateView(generics.ListCreateAPIView):
    queryset = ProcurementContract.objects.all().order_by('-createdAt')
    serializer_class = ProcurementContractSerializer

class ProcurementContractDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProcurementContract.objects.all()
    serializer_class = ProcurementContractSerializer
    lookup_field = 'id'

class ProcurementContractClearView(APIView):
    def delete(self, request):
        count, _ = ProcurementContract.objects.all().delete()
        return Response({"message": f"Successfully deleted {count} procurement contracts."})

class ContractMilestoneCreateView(generics.CreateAPIView):
    serializer_class = ContractMilestoneSerializer
    
    def perform_create(self, serializer):
        contract_id = self.kwargs.get('contract_id')
        contract = generics.get_object_or_404(ProcurementContract, id=contract_id)
        serializer.save(contract=contract)

class ContractMilestonePayView(generics.UpdateAPIView):
    queryset = ContractMilestone.objects.all()
    serializer_class = ContractMilestoneSerializer
    lookup_url_kwarg = 'milestone_id'
    
    def perform_update(self, serializer):
        serializer.save(status='Paid')
