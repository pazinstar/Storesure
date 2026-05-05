from django.core.management.base import BaseCommand
from roles.admin.dashboard.models import (
    AdminKPI,
    School, SchoolBranding, SystemSetup,
    StoreLocation, Library, Department,
    Role, RoleModulePermission, RoleModuleLink,
)
from roles.admin.users.models import SystemUser


# ─── Module & Link definitions ────────────────────────────────────────────────

MODULES = {
    'stores': {
        'name': 'Stores',
        'links': [
            ('Store Dashboard',          '/stores'),
            ('Suppliers Register',        '/procurement/suppliers'),
            ('Item Master',              '/stores/items'),
            ('Requisition',              '/stores/s12'),
            ('Purchase Orders (LPO)',     '/stores/lpo'),
            ('Delivery Logging',         '/stores/delivery'),
            ('Inspection & Acceptance',  '/stores/inspection'),
            ('Receive Stock (GRN)',       '/stores/receive'),
            ('Issue Stock',              '/stores/issue'),
            ('Routine Issue Authorities', '/stores/ria'),
            ('Consumables Ledger',        '/stores/ledger'),
            ('Store Reports',            '/stores/reports'),
        ],
    },
    'library': {
        'name': 'Library',
        'links': [
            ('Library Dashboard',     '/library'),
            ('Receive (Books In)',     '/library/receive'),
            ('Catalogue / Register',  '/library/catalogue'),
            ('Issue/Return',          '/library/circulation'),
            ('Library Reports',       '/library/reports'),
        ],
    },
    'students': {
        'name': 'Students',
        'links': [
            ('Student Register',       '/students'),
            ('Student Distribution',   '/students/distribution'),
            ('Distribution Reports',   '/students/distribution-reports'),
        ],
    },
    'staff': {
        'name': 'Staff',
        'links': [
            ('Staff Register', '/staff'),
        ],
    },
    'administration': {
        'name': 'Administration',
        'links': [
            ('Setup',               '/admin/control-panel'),
            ('Schools Management',  '/admin/client-setup'),
            ('School Branding',     '/admin/branding'),
            ('User Management',     '/admin/users'),
            ('Role Management',     '/admin/roles'),
        ],
    },
    'procurement': {
        'name': 'Procurement',
        'links': [
            ('Procurement Dashboard', '/procurement'),
            ('Requisitions',          '/procurement/requisitions'),
            ('Tenders',               '/procurement/tenders'),
            ('LPO Management',        '/procurement/lpo'),
            ('Contract Register',     '/procurement/contracts'),
            ('Procurement Reports',   '/procurement/reports'),
        ],
    },
    'assets': {
        'name': 'Assets',
        'links': [
            ('Asset Register',   '/assets'),
            ('Asset Movement',   '/assets/movement'),
            ('Board of Survey',  '/assets/survey'),
            ('Disposal',         '/assets/disposal'),
            ('Asset Reports',    '/assets/reports'),
        ],
    },
    'finance': {
        'name': 'Finance',
        'links': [
            ('Chart of Accounts',     '/finance/chart-of-accounts'),
            ('Budgeting',             '/finance/budgeting'),
            ('Procurement Plan',      '/finance/procurement-plan'),
            ('Receipting',            '/finance/receipting'),
            ('Cash Book',             '/finance/cash-book'),
            ('Payments',              '/finance/payments'),
            ('Reports',               '/finance/reports'),
        ],
    },
}


def _full(module_id, link_filter=None):
    """Return a permission spec with all CRUD enabled + optional link filter."""
    return {
        'module_id': module_id,
        'enabled': True,
        'can_view': True, 'can_create': True, 'can_edit': True, 'can_delete': True,
        'links': link_filter,  # None = all links enabled
    }


def _view(module_id, link_filter=None):
    """Return a read-only permission spec."""
    return {
        'module_id': module_id,
        'enabled': True,
        'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False,
        'links': link_filter,
    }


def _crud(module_id, view, create, edit, delete, link_filter=None):
    return {
        'module_id': module_id,
        'enabled': True,
        'can_view': view, 'can_create': create, 'can_edit': edit, 'can_delete': delete,
        'links': link_filter,
    }


def _off(module_id):
    """Return a disabled module spec."""
    return {
        'module_id': module_id,
        'enabled': False,
        'can_view': False, 'can_create': False, 'can_edit': False, 'can_delete': False,
        'links': [],
    }


# ─── Role definitions ─────────────────────────────────────────────────────────

ROLES = [
    {
        'id': 'admin',
        'name': 'Administrator',
        'description': 'Full system access across all modules.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _full('stores'),
            _full('library'),
            _full('students'),
            _full('staff'),
            _full('administration'),
            _full('procurement'),
            _full('assets'),
            _full('finance'),
        ],
    },
    {
        'id': 'auditor',
        'name': 'Auditor',
        'description': 'Read-only access to ledgers and reports.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _view('stores',       ['/stores/ledger', '/stores/reports']),
            _view('library',      ['/library/reports']),
            _view('procurement',  ['/procurement/reports', '/procurement/contracts']),
            _off('students'),
            _off('staff'),
            _off('administration'),
            _off('assets'),
            _view('finance', ['/finance/reports']),
        ],
    },
    {
        'id': 'bursar',
        'name': 'Bursar',
        'description': 'Finance and procurement: manage LPOs, suppliers, requisitions.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _crud('stores', True, True, False, False, [
                '/stores', '/procurement/suppliers', '/stores/s12',
                '/stores/lpo', '/stores/ria',
            ]),
            _view('students'),
            _view('staff'),
            _off('library'),
            _off('administration'),
            _off('procurement'),
            _off('assets'),
            _full('finance'),
        ],
    },
    {
        'id': 'headteacher',
        'name': 'Headteacher',
        'description': 'School management: approve requisitions, view reports, configure users.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _view('stores', ['/stores', '/stores/s12', '/stores/inspection', '/stores/ria']),
            _view('library', ['/library', '/library/reports']),
            _view('students'),
            _view('staff'),
            _crud('administration', True, False, False, False, [
                '/admin/control-panel', '/admin/users',
            ]),
            _view('procurement', ['/procurement/reports', '/procurement/contracts']),
            _view('assets'),
            _view('finance', ['/finance/budgeting', '/finance/procurement-plan', '/finance/reports']),
        ],
    },
    {
        'id': 'librarian',
        'name': 'Librarian',
        'description': 'Library operations: catalogue, issue/return, receive books.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _full('library'),
            _view('students'),
            _off('stores'),
            _off('staff'),
            _off('administration'),
            _off('procurement'),
            _off('assets'),
            _off('finance'),
        ],
    },
    {
        'id': 'procurement_officer',
        'name': 'Procurement Officer',
        'description': 'Manages supplier relationships and procurement records.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _full('procurement'),
            _off('stores'),
            _off('library'),
            _off('students'),
            _off('staff'),
            _off('administration'),
            _off('assets'),
            _off('finance'),
        ],
    },
    {
        'id': 'storekeeper',
        'name': 'Storekeeper',
        'description': 'Day-to-day store operations: receive, issue, inspect stock.',
        'type': 'system',
        'is_deletable': False,
        'permissions': [
            _crud('stores', True, True, True, False, [
                '/stores', '/stores/items', '/stores/delivery',
                '/stores/inspection', '/stores/receive',
                '/stores/issue', '/stores/ledger',
            ]),
            _view('students'),
            _off('library'),
            _off('staff'),
            _off('administration'),
            _off('procurement'),
            _off('assets'),
            _off('finance'),
        ],
    },
]


def _seed_role(role_def):
    role, _ = Role.objects.update_or_create(
        id=role_def['id'],
        defaults={
            'name': role_def['name'],
            'description': role_def['description'],
            'type': role_def['type'],
            'is_deletable': role_def['is_deletable'],
        },
    )

    # Rebuild module permissions from scratch
    role.module_permissions.all().delete()

    for perm_def in role_def['permissions']:
        module_id = perm_def['module_id']
        module_meta = MODULES[module_id]
        all_links = module_meta['links']  # list of (name, href)
        allowed_hrefs = perm_def['links']  # None = all, [] = none, list = subset

        mod_perm = RoleModulePermission.objects.create(
            role=role,
            module_id=module_id,
            module_name=module_meta['name'],
            enabled=perm_def['enabled'],
            can_view=perm_def['can_view'],
            can_create=perm_def['can_create'],
            can_edit=perm_def['can_edit'],
            can_delete=perm_def['can_delete'],
        )

        for link_name, link_href in all_links:
            if allowed_hrefs is None:
                enabled = perm_def['enabled']
            elif isinstance(allowed_hrefs, list) and len(allowed_hrefs) == 0:
                enabled = False
            else:
                enabled = link_href in allowed_hrefs

            RoleModuleLink.objects.create(
                module_permission=mod_perm,
                name=link_name,
                href=link_href,
                enabled=enabled,
            )


class Command(BaseCommand):
    help = 'Seeds the database with administration module data'

    def handle(self, *args, **kwargs):
        self.stdout.write('── Clearing existing admin data …')
        AdminKPI.objects.all().delete()
        SystemUser.objects.all().delete()
        Role.objects.all().delete()           # cascades to RoleModulePermission / RoleModuleLink
        School.objects.all().delete()         # cascades to SchoolBranding / SystemSetup
        StoreLocation.objects.all().delete()
        Library.objects.all().delete()
        Department.objects.all().delete()

        # ── KPIs ──────────────────────────────────────────────────────────────
        self.stdout.write('Seeding KPIs …')
        kpis = [
            {'title': 'Total Users',      'value': '154', 'trend': '+12 this week',     'trendUp': True,  'type': 'Users'},
            {'title': 'Active Sessions',  'value': '42',  'trend': 'Peak hours',         'trendUp': True,  'type': 'Activity'},
            {'title': 'System Uptime',    'value': '99.9%','trend': 'Last 30 days',      'trendUp': True,  'type': 'Server'},
            {'title': 'Pending Errors',   'value': '3',   'trend': 'Requires attention', 'trendUp': False, 'type': 'AlertTriangle'},
        ]
        for k in kpis:
            AdminKPI.objects.create(**k)

        # ── Schools ───────────────────────────────────────────────────────────
        self.stdout.write('Seeding Schools …')
        schools_data = [
            {
                'id': 'SCH001',
                'name': 'Greenfield Secondary School',
                'code': 'GSS',
                'email': 'admin@greenfield.sc.ke',
                'phone': '+254 700 100 001',
                'address': '100 Greenfield Road, Nairobi',
                'county': 'Nairobi',
                'type': 'secondary',
                'academic_year': '2025/2026',
                'current_term': 'term_1',
                'status': 'active',
            },
            {
                'id': 'SCH002',
                'name': 'Sunrise Primary School',
                'code': 'SPS',
                'email': 'admin@sunrise.sc.ke',
                'phone': '+254 700 100 002',
                'address': '45 Sunrise Avenue, Mombasa',
                'county': 'Mombasa',
                'type': 'primary',
                'academic_year': '2025/2026',
                'current_term': 'term_1',
                'status': 'active',
            },
        ]
        for s in schools_data:
            school = School.objects.create(**s)

            SchoolBranding.objects.create(
                school=school,
                logo_text=s['name'][:3].upper(),
                primary_color='#166534',
                secondary_color='#15803d',
                tagline=f'Excellence in Education — {s["name"]}',
                motto='Knowledge is Power',
            )

            SystemSetup.objects.create(
                school=school,
                academic_year=s['academic_year'],
                current_term=s['current_term'],
                modules_enabled=['stores', 'library', 'students', 'staff', 'administration', 'finance'],
                require_approval_for_requisitions=True,
                require_approval_for_lpos=True,
                max_requisition_value=50000.00,
                allow_self_registration=False,
                updated_by='seed_admin',
            )

        # ── Store Locations ────────────────────────────────────────────────────
        self.stdout.write('Seeding Store Locations …')
        stores_data = [
            {'id': 'STR001', 'name': 'Main Store',       'code': 'MS',  'location': 'Block A, Ground Floor', 'status': 'active'},
            {'id': 'STR002', 'name': 'Science Lab Store', 'code': 'SLS', 'location': 'Block B, Room 12',      'status': 'active'},
            {'id': 'STR003', 'name': 'Sports Store',     'code': 'SS',  'location': 'Gymnasium Annex',       'status': 'active'},
        ]
        for s in stores_data:
            StoreLocation.objects.create(**s)

        # ── Libraries ─────────────────────────────────────────────────────────
        self.stdout.write('Seeding Libraries …')
        libraries_data = [
            {'id': 'LIB001', 'name': 'Main Library',       'code': 'ML',  'location': 'Block C, First Floor',  'capacity': 500,  'status': 'active'},
            {'id': 'LIB002', 'name': 'Reference Library',  'code': 'RL',  'location': 'Admin Block, Room 5',    'capacity': 200,  'status': 'active'},
        ]
        for lib in libraries_data:
            Library.objects.create(**lib)

        # ── Departments ───────────────────────────────────────────────────────
        self.stdout.write('Seeding Departments …')
        departments_data = [
            {'id': 'DEP001', 'name': 'Mathematics',    'code': 'MATH',  'status': 'active'},
            {'id': 'DEP002', 'name': 'Sciences',       'code': 'SCI',   'status': 'active'},
            {'id': 'DEP003', 'name': 'Languages',      'code': 'LANG',  'status': 'active'},
            {'id': 'DEP004', 'name': 'Humanities',     'code': 'HUM',   'status': 'active'},
            {'id': 'DEP005', 'name': 'Technical',      'code': 'TECH',  'status': 'active'},
        ]
        for d in departments_data:
            Department.objects.create(**d)

        # ── Roles & Permissions ────────────────────────────────────────────────
        self.stdout.write('Seeding Roles & Permissions …')
        for role_def in ROLES:
            _seed_role(role_def)
            self.stdout.write(f'  ✓ {role_def["name"]}')

        # ── System Users ──────────────────────────────────────────────────────
        self.stdout.write('Seeding System Users …')
        users_data = [
            {'id': 'USR001', 'name': 'System Admin',      'username': 'admin_master',    'email': 'admin@storesure.local',    'role': 'admin',               'status': 'Active'},
            {'id': 'USR002', 'name': 'John Doe',          'username': 'jdoe',            'email': 'jdoe@storesure.local',     'role': 'storekeeper',         'status': 'Active'},
            {'id': 'USR003', 'name': 'Alice Smith',       'username': 'asmith',          'email': 'asmith@storesure.local',   'role': 'procurement_officer', 'status': 'Active'},
            {'id': 'USR004', 'name': 'Bob White',         'username': 'bwhite',          'email': 'bwhite@storesure.local',   'role': 'bursar',              'status': 'Inactive'},
            {'id': 'USR005', 'name': 'Carol Green',       'username': 'cgreen',          'email': 'cgreen@storesure.local',   'role': 'headteacher',         'status': 'Active'},
            {'id': 'USR006', 'name': 'Diana Omondi',      'username': 'domondi',         'email': 'domondi@storesure.local',  'role': 'librarian',           'status': 'Active'},
            {'id': 'USR007', 'name': 'Evans Kipchoge',    'username': 'ekipchoge',       'email': 'ekipchoge@storesure.local','role': 'auditor',             'status': 'Active'},
        ]
        for u in users_data:
            SystemUser.objects.create(**u)

        self.stdout.write(self.style.SUCCESS('\n✔ Administration module seeded successfully.'))
