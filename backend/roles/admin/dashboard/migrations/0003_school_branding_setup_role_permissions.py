"""
Migration 0003 – Administration module expansion

Adds:
  - School, SchoolBranding, SystemSetup
  - Role, RoleModulePermission, RoleModuleLink

Also marks the id fields on StoreLocation, Library, and Department
as blank=True so the model's save() method can auto-generate them.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_dashboard', '0002_department_library_permission_rolepermission_and_more'),
    ]

    operations = [
        # ── Allow blank IDs on existing models (auto-generated in save()) ────
        migrations.AlterField(
            model_name='storelocation',
            name='id',
            field=models.CharField(blank=True, max_length=50, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='library',
            name='id',
            field=models.CharField(blank=True, max_length=50, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='department',
            name='id',
            field=models.CharField(blank=True, max_length=50, primary_key=True, serialize=False),
        ),

        # ── School ────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='School',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('address', models.TextField(blank=True, null=True)),
                ('county', models.CharField(blank=True, max_length=100, null=True)),
                ('type', models.CharField(
                    choices=[
                        ('primary', 'Primary'), ('secondary', 'Secondary'),
                        ('tertiary', 'Tertiary'), ('mixed', 'Mixed'),
                    ],
                    default='secondary', max_length=50,
                )),
                ('academic_year', models.CharField(blank=True, max_length=20, null=True)),
                ('current_term', models.CharField(
                    blank=True,
                    choices=[('term_1', 'Term 1'), ('term_2', 'Term 2'), ('term_3', 'Term 3')],
                    max_length=20, null=True,
                )),
                ('status', models.CharField(
                    choices=[
                        ('active', 'Active'), ('inactive', 'Inactive'), ('suspended', 'Suspended'),
                    ],
                    default='active', max_length=50,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),

        # ── School Branding ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='SchoolBranding',
            fields=[
                ('school', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True, related_name='branding',
                    serialize=False, to='admin_dashboard.school',
                )),
                ('logo_url', models.URLField(blank=True, null=True)),
                ('logo_text', models.CharField(blank=True, max_length=100, null=True)),
                ('primary_color', models.CharField(default='#166534', max_length=20)),
                ('secondary_color', models.CharField(default='#15803d', max_length=20)),
                ('tagline', models.CharField(blank=True, max_length=255, null=True)),
                ('motto', models.CharField(blank=True, max_length=255, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),

        # ── System Setup ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='SystemSetup',
            fields=[
                ('school', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    primary_key=True, related_name='setup',
                    serialize=False, to='admin_dashboard.school',
                )),
                ('academic_year', models.CharField(blank=True, max_length=20, null=True)),
                ('current_term', models.CharField(
                    blank=True,
                    choices=[('term_1', 'Term 1'), ('term_2', 'Term 2'), ('term_3', 'Term 3')],
                    max_length=20, null=True,
                )),
                ('modules_enabled', models.JSONField(default=list)),
                ('require_approval_for_requisitions', models.BooleanField(default=True)),
                ('require_approval_for_lpos', models.BooleanField(default=True)),
                ('max_requisition_value', models.DecimalField(
                    blank=True, decimal_places=2, max_digits=12, null=True,
                )),
                ('allow_self_registration', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),

        # ── Role ──────────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('type', models.CharField(
                    choices=[('system', 'System'), ('custom', 'Custom')],
                    default='system', max_length=20,
                )),
                ('is_deletable', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),

        # ── Role Module Permission ─────────────────────────────────────────────
        migrations.CreateModel(
            name='RoleModulePermission',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True, serialize=False, verbose_name='ID',
                )),
                ('role', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='module_permissions', to='admin_dashboard.role',
                )),
                ('module_id', models.CharField(max_length=100)),
                ('module_name', models.CharField(max_length=255)),
                ('enabled', models.BooleanField(default=False)),
                ('can_view', models.BooleanField(default=False)),
                ('can_create', models.BooleanField(default=False)),
                ('can_edit', models.BooleanField(default=False)),
                ('can_delete', models.BooleanField(default=False)),
            ],
            options={
                'unique_together': {('role', 'module_id')},
            },
        ),

        # ── Role Module Link ──────────────────────────────────────────────────
        migrations.CreateModel(
            name='RoleModuleLink',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True, serialize=False, verbose_name='ID',
                )),
                ('module_permission', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='links', to='admin_dashboard.rolemodulepermission',
                )),
                ('name', models.CharField(max_length=255)),
                ('href', models.CharField(max_length=255)),
                ('enabled', models.BooleanField(default=False)),
            ],
            options={
                'unique_together': {('module_permission', 'href')},
            },
        ),
    ]
