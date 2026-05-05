from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='staff',
            name='user_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
