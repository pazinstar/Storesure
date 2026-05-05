from rest_framework.views import APIView
from rest_framework.response import Response

class ProcurementKPIsView(APIView):
    def get(self, request):
        return Response({
            "totalValue": 9050000,
            "utilization": 78.5,
            "processingTime": 8.2,
            "compliance": 96.8
        })

class ProcurementMonthlySpendView(APIView):
    def get(self, request):
        return Response([
            {"month": "Jul", "planned": 850000, "actual": 820000},
            {"month": "Aug", "planned": 900000, "actual": 880000},
            {"month": "Sep", "planned": 950000, "actual": 920000},
            {"month": "Oct", "planned": 800000, "actual": 850000},
            {"month": "Nov", "planned": 1100000, "actual": 1050000},
            {"month": "Dec", "planned": 1200000, "actual": 1150000}
        ])

class ProcurementCategoryBreakdownView(APIView):
    def get(self, request):
        return Response([
            {"name": "Stationery", "value": 2500000, "color": "#3b82f6"},
            {"name": "IT Equipment", "value": 3200000, "color": "#10b981"},
            {"name": "Furniture", "value": 1500000, "color": "#f59e0b"},
            {"name": "Maintenance", "value": 1850000, "color": "#ef4444"}
        ])

class ProcurementVendorPerformanceView(APIView):
    def get(self, request):
        return Response([
            {"vendor": "Kenya Office Supplies Ltd", "orders": 45, "value": "KES 2.1M", "onTime": 95, "quality": 98},
            {"vendor": "Tech Solutions EA", "orders": 28, "value": "KES 4.5M", "onTime": 88, "quality": 95},
            {"vendor": "Modern Furniture Mart", "orders": 15, "value": "KES 1.2M", "onTime": 92, "quality": 90},
            {"vendor": "General Maintenance Co", "orders": 32, "value": "KES 850K", "onTime": 85, "quality": 88}
        ])

class ProcurementStandardReportsView(APIView):
    def get(self, request):
        return Response([
            {"name": "PPADA Quarterly Report", "description": "Mandatory procurement reporting format for Q3 2024 compliance", "format": "PDF", "icon": "FileText"},
            {"name": "AGPO Reservations", "description": "Summary of tenders awarded to youth, women, and PWD enterprises", "format": "Excel", "icon": "FileSpreadsheet"},
            {"name": "Contract Implementation Status", "description": "Progress tracking and milestone payments for ongoing contracts", "format": "PDF", "icon": "FileText"},
            {"name": "Vendor Registration Register", "description": "List of all actively prequalified suppliers per category", "format": "Excel", "icon": "FileSpreadsheet"}
        ])

class ProcurementGenerateReportView(APIView):
    def post(self, request):
        report_type = request.query_params.get('type', 'summary')
        date_range = request.query_params.get('dateRange', 'q1')
        format_type = request.query_params.get('format', 'pdf')
        
        return Response({
            "url": f"/downloads/report_{report_type}_{date_range}.{format_type}"
        })
