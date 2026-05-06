"""
Phase 4 — Fixed Asset Register enhancements: new fields, status choices, FKs.
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0030_phase4_fixed_asset_register'),
    ]

    operations = [
        # Add new fields to FixedAsset
        migrations.AddField(
            model_name='fixedasset',
            name='tag_no',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='serial_no',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='qty',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='unit_cost',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='total_cost',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='acq_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='supplier_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='supplier_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='funding_source',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='dept_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='dept_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='custodian_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='location_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='useful_life',
            field=models.IntegerField(default=0, help_text='Useful life in months'),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='residual_value',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='depreciation_method',
            field=models.CharField(
                choices=[
                    ('straight_line', 'Straight Line'),
                    ('declining_balance', 'Declining Balance'),
                    ('sum_of_years', 'Sum of Years Digits'),
                    ('units_of_production', 'Units of Production'),
                    ('none', 'No Depreciation'),
                ],
                default='straight_line',
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='accumulated_depreciation',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='nbv',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12, help_text='Net Book Value'),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='warranty_expiry',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='next_maintenance',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='disposal_status',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='disposal_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='disposal_value',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='disposal_reason',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='parent_asset',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='child_assets',
                to='stores.fixedasset',
            ),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='source_item',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='fixed_assets',
                to='stores.inventoryitem',
            ),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='source_prompt',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='fixed_assets',
                to='stores.capitalizationprompt',
            ),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='category_type',
            field=models.CharField(
                blank=True, default='', max_length=20,
                choices=[
                    ('consumable', 'Consumable'),
                    ('expendable', 'Expendable'),
                    ('permanent', 'Permanent'),
                    ('fixed_asset', 'Fixed Asset'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='asset_type',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='unit',
            field=models.CharField(blank=True, default='', max_length=50),
        ),
        migrations.AddField(
            model_name='fixedasset',
            name='created_by',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        # Update status choices
        migrations.AlterField(
            model_name='fixedasset',
            name='status',
            field=models.CharField(
                choices=[
                    ('procured', 'Procured'),
                    ('in_stores', 'In Stores'),
                    ('deployed', 'Deployed'),
                    ('active', 'Active'),
                    ('maintenance', 'Under Maintenance'),
                    ('damaged', 'Damaged'),
                    ('lost', 'Lost'),
                    ('obsolete', 'Obsolete'),
                    ('disposed', 'Disposed'),
                ],
                default='procured',
                max_length=50,
            ),
        ),
        # Add FKs from new models to FixedAsset
        migrations.AddField(
            model_name='assetstatushistory',
            name='asset',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='status_history',
                to='stores.fixedasset',
            ),
        ),
        migrations.AddField(
            model_name='assetmaintenance',
            name='asset',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='maintenance_records',
                to='stores.fixedasset',
            ),
        ),
    ]