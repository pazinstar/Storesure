from django.urls import path
from .views import ProcurementKPIsView, ProcurementDashboardView

urlpatterns = [
    path('', ProcurementDashboardView.as_view(), name='procurement-dashboard-root'),
    path('kpis/', ProcurementKPIsView.as_view(), name='procurement-kpis'),
]
