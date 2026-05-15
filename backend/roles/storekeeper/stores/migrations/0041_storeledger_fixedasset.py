# Generated migration for StoreLedger and FixedAsset
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0040_capitalizationpolicy_inventoryitem_approved_by_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='StoreLedger',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('ledger_type', models.CharField(default='s1_consumable', max_length=50)),
                ('balance_qty', models.IntegerField(default=0)),
                ('balance_value', models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='ledgers', to='stores.item')),
            ],
            options={'db_table': 'stores_storeledger'},
        ),
    ]
