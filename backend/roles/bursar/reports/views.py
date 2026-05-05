from rest_framework import generics
from .models import FinancialMetric
from roles.storekeeper.stores.models import StoreReport
from .serializers import FinancialMetricSerializer, BursarStoreReportSerializer

class BursarStoreReportListView(generics.ListAPIView):
    queryset = StoreReport.objects.all()
    serializer_class = BursarStoreReportSerializer

class FinancialMetricListView(generics.ListAPIView):
    queryset = FinancialMetric.objects.all()
    serializer_class = FinancialMetricSerializer
