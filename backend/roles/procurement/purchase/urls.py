from django.urls import path
from .views import (
    ProcurementSupplierListCreateView,
    ProcurementSupplierDetailView,
    ProcurementPurchaseOrderListView,
    ProcurementRequisitionListView,
    ProcurementDeliveryListView,
    PurchaseRequisitionListCreateView,
    PurchaseRequisitionDetailView
)

urlpatterns = [
    path('suppliers/', ProcurementSupplierListCreateView.as_view(), name='procurement-suppliers'),
    path('suppliers/<str:id>/', ProcurementSupplierDetailView.as_view(), name='procurement-suppliers-detail'),
    path('lpos/', ProcurementPurchaseOrderListView.as_view(), name='procurement-lpos'),
    path('requisitions/', ProcurementRequisitionListView.as_view(), name='procurement-requisitions'),
    path('deliveries/', ProcurementDeliveryListView.as_view(), name='procurement-deliveries'),
    path('purchase-requisitions/', PurchaseRequisitionListCreateView.as_view(), name='procurement-purchase-requisitions'),
    path('purchase-requisitions/<str:id>/', PurchaseRequisitionDetailView.as_view(), name='procurement-purchase-requisitions-detail'),
]
