from django.core.management.base import BaseCommand
from django.contrib.auth.models import User as DjangoUser
from django.contrib.auth.hashers import make_password

from roles.admin.users.models import SystemUser
from roles.admin.dashboard.models import School


DEFAULT_PASSWORD = 'password123'


class Command(BaseCommand):
    help = 'Seeds Django auth users and SystemUsers. Roles/permissions are managed by seed_admin.'

    def handle(self, *args, **kwargs):
        school1 = School.objects.first()
        school2 = School.objects.exclude(id=school1.id).first() if school1 and School.objects.count() > 1 else None

        # ── Django Users + SystemUsers ───────────────────────────────────────
        # Roles come from seed_admin — we only create the login credentials here.
        self.stdout.write('Seeding users ...')

        # (email, name, role_id, school)
        users = [
            ('admin@storesure.ac.ke',        'Super Admin',        'admin',               None),
            ('headteacher@school.ac.ke',     'Dr. Jane Mwangi',    'headteacher',         school1),
            ('storekeeper@school.ac.ke',     'Mary Wanjiku',       'storekeeper',         school1),
            ('procurement@school.ac.ke',     'David Kipchoge',     'procurement_officer', school1),
            ('bursar@school.ac.ke',          'Peter Ochieng',      'bursar',              school1),
            ('librarian@school.ac.ke',       'John Kamau',         'librarian',           school1),
            ('auditor@school.ac.ke',         'Sarah Njeri',        'auditor',             school1),
            ('head@riverside.edu',           'Mr. Peter Ochieng',  'headteacher',         school2),
            ('librarian2@school.ac.ke',      'Grace Muthoni',      'librarian',           school2),
        ]

        hashed = make_password(DEFAULT_PASSWORD)
        for email, name, role_id, school in users:
            username = email.split('@')[0]

            # Django User (for JWT)
            dj, _ = DjangoUser.objects.get_or_create(username=username, defaults={'email': email})
            dj.email = email
            dj.set_password(DEFAULT_PASSWORD)
            if role_id == 'admin':
                dj.is_staff = True
                dj.is_superuser = True
            dj.save()

            # SystemUser (app profile) — role must already exist in DB from seed_admin
            SystemUser.objects.update_or_create(
                email=email,
                defaults={
                    'name': name, 'username': username,
                    'password': hashed, 'role': role_id,
                    'school': school, 'status': 'Active',
                },
            )
            school_name = school.name if school else 'no school'
            self.stdout.write(f'  {email:<40} role={role_id:<22} school={school_name}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Login password for all accounts: {DEFAULT_PASSWORD}'
        ))
