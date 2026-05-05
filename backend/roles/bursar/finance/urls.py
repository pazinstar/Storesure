from django.urls import path
from .views import (
    BursarPurchaseOrderListView,
    BursarRequisitionListView,
    BursarDeliveryListView
)

urlpatterns = [
    path('lpos/', BursarPurchaseOrderListView.as_view(), name='bursar-lpos'),
    path('requisitions/', BursarRequisitionListView.as_view(), name='bursar-requisitions'),
    path('deliveries/', BursarDeliveryListView.as_view(), name='bursar-deliveries'),
]
