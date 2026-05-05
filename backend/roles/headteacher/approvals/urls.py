from django.urls import path
from .views import (
    HeadteacherPurchaseOrderListView,
    HeadteacherRequisitionListView
)

urlpatterns = [
    path('lpos/', HeadteacherPurchaseOrderListView.as_view(), name='headteacher-lpos'),
    path('requisitions/', HeadteacherRequisitionListView.as_view(), name='headteacher-requisitions'),
]
