"""
Migration 0004 – Inspection Committee

Adds:
  - InspectionCommittee  (singleton)
  - InspectionCommitteeMember  (up to 3 per committee)
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_dashboard', '0003_school_branding_setup_role_permissions'),
    ]

    operations = [
        # ── InspectionCommittee ───────────────────────────────────────────────
        migrations.CreateModel(
            name='InspectionCommittee',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),

        # ── InspectionCommitteeMember ─────────────────────────────────────────
        migrations.CreateModel(
            name='InspectionCommitteeMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('committee', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='members',
                    to='admin_dashboard.inspectioncommittee',
                )),
                ('user_id', models.CharField(max_length=50)),
                ('user_name', models.CharField(max_length=255)),
                ('designation', models.CharField(blank=True, max_length=255)),
                ('order', models.IntegerField(default=1)),
            ],
            options={
                'ordering': ['order'],
                'unique_together': {('committee', 'user_id')},
            },
        ),
    ]
