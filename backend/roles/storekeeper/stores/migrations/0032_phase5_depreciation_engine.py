"""
Phase 5 — Depreciation Engine & Financial Integration.
Creates DepreciationSchedule and DepreciationRun models.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0031_phase4_fixed_asset_enhance'),
    ]

    operations = [
        migrations.CreateModel(
            name='DepreciationRun',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('run_code', models.CharField(max_length=50, unique=True)),
                ('period_year', models.IntegerField()),
                ('period_month', models.IntegerField(blank=True, null=True, help_text='Null for annual runs')),
                ('run_type', models.CharField(
                    max_length=10,
                    choices=[('monthly', 'Monthly'), ('annual', 'Annual'), ('manual', 'Manual')],
                    default='monthly',
                )),
                ('status', models.CharField(
                    max_length=20,
                    choices=[
                        ('pending', 'Pending'), ('running', 'Running'),
                        ('completed', 'Completed'), ('failed', 'Failed'),
                        ('reversed', 'Reversed'),
                    ],
                    default='pending',
                )),
                ('assets_processed', models.IntegerField(default=0)),
                ('total_depreciation', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('error_log', models.TextField(blank=True, default='')),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('reversed_at', models.DateTimeField(blank=True, null=True)),
                ('reversed_by', models.CharField(blank=True, default='', max_length=255)),
                ('reversal_reason', models.TextField(blank=True, default='')),
                ('created_by', models.CharField(blank=True, default='', max_length=255)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'stores_depreciation_run',
                'verbose_name': 'Depreciation Run',
                'verbose_name_plural': 'Depreciation Runs',
                'ordering': ['-period_year', '-period_month'],
            },
        ),
        migrations.CreateModel(
            name='DepreciationSchedule',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('year', models.IntegerField()),
                ('month', models.IntegerField()),
                ('annual_depreciation', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('monthly_depreciation', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('accumulated_depr_before', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('accumulated_depr_after', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('nbv_before', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('nbv_after', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('posted_status', models.CharField(
                    max_length=20,
                    choices=[
                        ('pending', 'Pending'),
                        ('posted', 'Posted'),
                        ('skipped', 'Skipped'),
                        ('reversed', 'Reversed'),
                    ],
                    default='pending',
                )),
                ('posting_date', models.DateTimeField(blank=True, null=True)),
                ('reversal_date', models.DateTimeField(blank=True, null=True)),
                ('reversal_reason', models.TextField(blank=True, default='')),
                ('is_mid_year_acquisition', models.BooleanField(default=False)),
                ('mid_year_start_month', models.IntegerField(blank=True, null=True,
                    help_text='If mid-year, the month depreciation started')),
                ('partial_qty_ratio', models.DecimalField(
                    decimal_places=4, default=1.0, max_digits=6,
                    help_text='Ratio for partial disposal (1.0 = full)',
                )),
                ('notes', models.TextField(blank=True, default='')),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('asset', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='depreciation_schedules',
                    to='stores.fixedasset',
                )),
                ('depreciation_run', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='schedules',
                    to='stores.depreciationrun',
                )),
            ],
            options={
                'db_table': 'stores_depreciation_schedule',
                'verbose_name': 'Depreciation Schedule',
                'verbose_name_plural': 'Depreciation Schedules',
                'ordering': ['asset', 'year', 'month'],
                'unique_together': {('asset', 'year', 'month')},
            },
        ),
        migrations.AddIndex(
            model_name='depreciationschedule',
            index=models.Index(fields=['asset', 'posted_status'], name='stores_depr_asset_status_idx'),
        ),
        migrations.AddIndex(
            model_name='depreciationschedule',
            index=models.Index(fields=['year', 'month', 'posted_status'], name='stores_depr_period_status_idx'),
        ),
    ]
