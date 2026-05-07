from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0027_phase1_foundation_data_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='lsorecord',
            name='requisition',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lsos', to='stores.requisition'),
        ),
    ]
