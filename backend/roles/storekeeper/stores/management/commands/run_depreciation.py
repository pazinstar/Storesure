from django.core.management.base import BaseCommand
from datetime import datetime

from roles.storekeeper.stores.depreciation import run_depreciation


class Command(BaseCommand):
    help = 'Run depreciation for a given year/month. Usage: run_depreciation --year 2026 --month 1'

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, required=True)
        parser.add_argument('--month', type=int, required=False)
        parser.add_argument('--type', type=str, choices=['monthly', 'annual', 'manual'], default='monthly')
        parser.add_argument('--user', type=str, default='management')

    def handle(self, *args, **options):
        year = options['year']
        month = options.get('month')
        run_type = options.get('type')
        user = options.get('user')
        self.stdout.write(f'Running depreciation: {run_type} {year}/{month or ""} by {user}')
        try:
            run = run_depreciation(run_type, year, month, created_by=user)
            self.stdout.write(self.style.SUCCESS(f'Completed run {run.run_code} status={run.status} total={run.total_depreciation}'))
            if run.error_log:
                self.stdout.write('Errors:\n' + run.error_log)
        except Exception as e:
            self.stderr.write(str(e))