from django.core.management.base import BaseCommand
from django.utils import timezone
from roles.bursar.dashboard.models import BursarKPI
from roles.bursar.reports.models import FinancialMetric
from roles.storekeeper.stores.models import StoreReport

class Command(BaseCommand):
    help = 'Seeds the database with bursar-specific data and KPIs'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing Bursar KPIs and Metrics...')
        BursarKPI.objects.all().delete()
        FinancialMetric.objects.all().delete()
        
        self.stdout.write('Seeding Bursar KPIs...')
        kpi_data = [
            {"title": "Monthly Expenditure", "value": "KES 2.8M", "trend": "-12% under budget", "trendUp": True, "type": "DollarSign"},
            {"title": "Pending Payments", "value": "KES 450K", "trend": "+5% from last week", "trendUp": False, "type": "CreditCard"},
            {"title": "Approved LPOs Value", "value": "KES 1.2M", "trend": "This month", "trendUp": True, "type": "FileText"},
            {"title": "Budget Utilization", "value": "68%", "trend": "On track", "trendUp": True, "type": "PieChart"},
        ]
        
        for k in kpi_data:
            BursarKPI.objects.create(**k)

        self.stdout.write('Seeding Financial Metrics...')
        metrics_data = [
            {"label": "Total Items Value", "value": "KES 12.5M", "change": "+12%"},
            {"label": "Consumables Cost", "value": "KES 4.2M", "change": "-5%"},
            {"label": "Asset Depreciation", "value": "KES 850K", "change": "+2%"},
        ]

        for m in metrics_data:
            FinancialMetric.objects.create(**m)

        self.stdout.write('Updating Store Reports with Bursar fields...')
        reports = StoreReport.objects.all()
        for i, report in enumerate(reports):
            report.date = f"Month {i+1} 2024"
            report.save()

        self.stdout.write(self.style.SUCCESS('Bursar database models successfully seeded!'))
