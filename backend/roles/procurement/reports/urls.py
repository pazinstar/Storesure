from django.urls import path
from .views import (
    ProcurementKPIsView,
    ProcurementMonthlySpendView,
    ProcurementCategoryBreakdownView,
    ProcurementVendorPerformanceView,
    ProcurementStandardReportsView,
    ProcurementGenerateReportView
)

urlpatterns = [
    path('kpis', ProcurementKPIsView.as_view(), name='procurement-reports-kpis'),
    path('kpis/', ProcurementKPIsView.as_view(), name='procurement-reports-kpis-slash'),
    path('monthly-spend', ProcurementMonthlySpendView.as_view(), name='procurement-reports-monthly-spend'),
    path('monthly-spend/', ProcurementMonthlySpendView.as_view(), name='procurement-reports-monthly-spend-slash'),
    path('category-breakdown', ProcurementCategoryBreakdownView.as_view(), name='procurement-reports-category-breakdown'),
    path('category-breakdown/', ProcurementCategoryBreakdownView.as_view(), name='procurement-reports-category-breakdown-slash'),
    path('vendor-performance', ProcurementVendorPerformanceView.as_view(), name='procurement-reports-vendor-performance'),
    path('vendor-performance/', ProcurementVendorPerformanceView.as_view(), name='procurement-reports-vendor-performance-slash'),
    path('standard-reports', ProcurementStandardReportsView.as_view(), name='procurement-reports-standard-reports'),
    path('standard-reports/', ProcurementStandardReportsView.as_view(), name='procurement-reports-standard-reports-slash'),
    path('generate', ProcurementGenerateReportView.as_view(), name='procurement-reports-generate'),
    path('generate/', ProcurementGenerateReportView.as_view(), name='procurement-reports-generate-slash'),
]
