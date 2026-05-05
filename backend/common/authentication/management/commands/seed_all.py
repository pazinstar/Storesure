from django.core.management import call_command
from django.core.management.base import BaseCommand


# Ordered by foreign-key dependency:
#   seed_admin  → creates Schools, Roles, Locations, Libraries, Departments
#   seed_auth   → creates Django Users + SystemUsers (needs Schools & Roles)
#   seed_storekeeper → Suppliers, Items, Deliveries, Requisitions, RIAs
#   seed_procurement → ProcurementKPIs, PO Items (needs POs from storekeeper)
#   seed_librarian   → Books, Loans (needs Library from admin)
#   seed_students    → Students, Distributions (no hard deps)
#   seed_bursar      → BursarKPIs, FinancialMetrics (needs StoreReport from storekeeper)
#   seed_headteacher → HeadteacherKPIs (no deps)
#   seed_auditor     → AuditorKPIs (no deps)

SEED_COMMANDS = [
    ('seed_admin',        'Admin: schools, roles, locations, departments'),
    ('seed_auth',         'Auth: Django users + system users'),
    ('seed_storekeeper',  'Stores: suppliers, items, deliveries, requisitions, RIAs'),
    ('seed_procurement',  'Procurement: KPIs, purchase order items'),
    ('seed_librarian',    'Library: books, copies, loans'),
    ('seed_students',     'Students: register, distributions'),
    ('seed_bursar',       'Bursar: KPIs, financial metrics'),
    ('seed_headteacher',  'Headteacher: KPIs'),
    ('seed_auditor',      'Auditor: KPIs'),
]


class Command(BaseCommand):
    help = 'Run all seed commands in dependency order.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip',
            nargs='+',
            metavar='COMMAND',
            help='One or more seed command names to skip (e.g. --skip seed_students seed_librarian)',
        )

    def handle(self, *args, **options):
        skip = set(options.get('skip') or [])
        total = len(SEED_COMMANDS)
        passed = []
        failed = []

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'\n{"─" * 60}\n  StoreSure — running {total} seed commands\n{"─" * 60}'
        ))

        for idx, (command, description) in enumerate(SEED_COMMANDS, 1):
            prefix = f'[{idx}/{total}]'

            if command in skip:
                self.stdout.write(self.style.WARNING(f'{prefix} SKIPPED  {command}  ({description})'))
                continue

            self.stdout.write(f'\n{prefix} {self.style.MIGRATE_LABEL(command)}  — {description}')
            self.stdout.write('─' * 60)

            try:
                call_command(command, stdout=self.stdout, stderr=self.stderr)
                passed.append(command)
                self.stdout.write(self.style.SUCCESS(f'{prefix} OK  {command}'))
            except Exception as exc:
                failed.append((command, exc))
                self.stdout.write(self.style.ERROR(f'{prefix} FAILED  {command}: {exc}'))

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING(f'\n{"─" * 60}\n  Seed summary\n{"─" * 60}'))
        self.stdout.write(self.style.SUCCESS(f'  Passed : {len(passed)}'))

        if skip:
            self.stdout.write(self.style.WARNING(f'  Skipped: {len(skip)}  ({", ".join(skip)})'))

        if failed:
            self.stdout.write(self.style.ERROR(f'  Failed : {len(failed)}'))
            for cmd, exc in failed:
                self.stdout.write(self.style.ERROR(f'    • {cmd}: {exc}'))
            raise SystemExit(1)
        else:
            self.stdout.write(self.style.SUCCESS('\n  All seeds completed successfully.\n'))
