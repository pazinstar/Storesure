from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Staff',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('tsc_number', models.CharField(blank=True, max_length=100, null=True)),
                ('staff_number', models.CharField(blank=True, max_length=100, null=True)),
                ('inventory_number', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(blank=True, default='')),
                ('phone', models.CharField(blank=True, default='', max_length=50)),
                ('type', models.CharField(
                    choices=[('teaching', 'Teaching'), ('non-teaching', 'Non-Teaching')],
                    max_length=20,
                )),
                ('designation', models.CharField(max_length=100)),
                ('department', models.CharField(max_length=100)),
                ('date_joined', models.DateField()),
                ('status', models.CharField(
                    choices=[('active', 'Active'), ('inactive', 'Inactive'), ('on_leave', 'On Leave')],
                    default='active', max_length=20,
                )),
                ('id_number', models.CharField(blank=True, max_length=50, null=True)),
                ('gender', models.CharField(
                    blank=True,
                    choices=[('male', 'Male'), ('female', 'Female')],
                    max_length=10, null=True,
                )),
                ('subjects', models.JSONField(blank=True, default=list)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['name']},
        ),
    ]
