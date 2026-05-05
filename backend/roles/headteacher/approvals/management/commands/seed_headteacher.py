from django.core.management.base import BaseCommand
from roles.headteacher.dashboard.models import HeadteacherKPI

class Command(BaseCommand):
    help = 'Seeds the database with headteacher-specific data and KPIs'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing Headteacher KPIs...')
        HeadteacherKPI.objects.all().delete()
        
        self.stdout.write('Seeding Headteacher KPIs...')
        kpi_data = [
            {"title": "Pending Approvals", "value": "12", "trend": "Needs attention", "trendUp": False, "type": "FileText"},
            {"title": "Approved This Week", "value": "45", "trend": "On track", "trendUp": True, "type": "CheckCircle"},
            {"title": "Budget Utilization", "value": "68%", "trend": "Within limits", "trendUp": True, "type": "PieChart"},
            {"title": "Urgent Requisitions", "value": "3", "trend": "High priority", "trendUp": False, "type": "AlertTriangle"},
        ]
        
        for k in kpi_data:
            HeadteacherKPI.objects.create(**k)

        self.stdout.write(self.style.SUCCESS('Headteacher database models successfully seeded!'))
