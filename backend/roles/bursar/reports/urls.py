from django.urls import path
from .views import BursarStoreReportListView, FinancialMetricListView

urlpatterns = [
    path('', BursarStoreReportListView.as_view(), name='bursar-reports-list'),
    path('stats/', FinancialMetricListView.as_view(), name='bursar-reports-stats'),
]
