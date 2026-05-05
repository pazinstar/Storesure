from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ProcurementKPI
from .serializers import ProcurementKPISerializer

class ProcurementKPIsView(generics.ListAPIView):
    queryset = ProcurementKPI.objects.all()
    serializer_class = ProcurementKPISerializer

class ProcurementDashboardView(APIView):
    def get(self, request, *args, **kwargs):
        data = {
            "kpis": [
                {
                    "title": "Total Requisitions",
                    "value": "124",
                    "change": "+12% from last month",
                    "iconName": "FileText",
                    "color": "text-primary"
                },
                {
                    "title": "Active LPOs",
                    "value": "45",
                    "change": "5 pending delivery",
                    "iconName": "ShoppingCart",
                    "color": "text-secondary"
                }
            ],
            "monthlyProcurement": [
                { "month": "Jan", "requisitions": 45, "lpos": 38 },
                { "month": "Feb", "requisitions": 52, "lpos": 41 }
            ],
            "workflowStatus": [
                { "name": "Pending Approval", "value": 12, "color": "#f59e0b" },
                { "name": "Approved", "value": 45, "color": "#10b981" }
            ],
            "pendingApprovals": [
                {
                    "id": "REQ-2025-001",
                    "type": "Requisition",
                    "item": "Desktop Computers",
                    "department": "ICT",
                    "value": "KSh 450,000",
                    "urgency": "high"
                }
            ]
        }
        return Response(data)
