"""
Phase 4 — Fixed Asset Register & Lifecycle Management.
Enhances FixedAsset model with full lifecycle fields, status history, grouped assets, maintenance tracking.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0029_phase3_capitalization_engine'),
    ]

    operations = [
        # Create AssetStatusHistory model
        migrations.CreateModel(
            name='AssetStatusHistory',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('from_status', models.CharField(blank=True, default='', max_length=50)),
                ('to_status', models.CharField(max_length=50)),
                ('changed_by', models.CharField(blank=True, default='', max_length=255)),
                ('reason', models.TextField(blank=True, default='')),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'stores_asset_status_history',
                'verbose_name': 'Asset Status History',
                'verbose_name_plural': 'Asset Status Histories',
                'ordering': ['-createdAt'],
            },
        ),
        # Create AssetMaintenance model
        migrations.CreateModel(
            name='AssetMaintenance',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('maintenance_type', models.CharField(blank=True, default='', max_length=100)),
                ('description', models.TextField(blank=True, default='')),
                ('scheduled_date', models.DateField(blank=True, null=True)),
                ('completed_date', models.DateField(blank=True, null=True)),
                ('cost', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('vendor', models.CharField(blank=True, default='', max_length=255)),
                ('status', models.CharField(default='scheduled', max_length=50)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_by', models.CharField(blank=True, default='', max_length=255)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'stores_asset_maintenance',
                'verbose_name': 'Asset Maintenance',
                'verbose_name_plural': 'Asset Maintenances',
                'ordering': ['-scheduled_date'],
            },
        ),
    ]