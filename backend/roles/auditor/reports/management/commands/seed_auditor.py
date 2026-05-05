from django.core.management.base import BaseCommand
from roles.auditor.dashboard.models import AuditorKPI

class Command(BaseCommand):
    help = 'Seeds the database with auditor-specific data and KPIs'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing Auditor KPIs...')
        AuditorKPI.objects.all().delete()
        
        self.stdout.write('Seeding Auditor KPIs...')
        kpi_data = [
            {"title": "Pending Audits", "value": "5", "trend": "This month", "trendUp": False, "type": "FileText"},
            {"title": "Discrepancies Found", "value": "12", "trend": "Requires review", "trendUp": False, "type": "AlertTriangle"},
            {"title": "Total Value Audited", "value": "KES 4.2M", "trend": "+15% from last month", "trendUp": True, "type": "DollarSign"},
            {"title": "Compliance Score", "value": "94%", "trend": "Excellent", "trendUp": True, "type": "CheckCircle"},
        ]
        
        for k in kpi_data:
            AuditorKPI.objects.create(**k)

        self.stdout.write(self.style.SUCCESS('Auditor database models successfully seeded!'))
