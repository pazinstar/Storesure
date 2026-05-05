from django.urls import path
from .views import AuditorInventoryItemListView

urlpatterns = [
    path('inventory/', AuditorInventoryItemListView.as_view(), name='auditor-inventory-reports'),
]
