from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('admission_no', models.CharField(max_length=100, unique=True)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('gender', models.CharField(
                    choices=[('male', 'Male'), ('female', 'Female')],
                    default='male', max_length=10,
                )),
                ('class_name', models.CharField(max_length=50)),
                ('stream', models.CharField(blank=True, max_length=50, null=True)),
                ('admission_date', models.DateField(blank=True, null=True)),
                ('parent_name', models.CharField(blank=True, default='', max_length=255)),
                ('parent_phone', models.CharField(blank=True, default='', max_length=50)),
                ('parent_email', models.EmailField(blank=True, null=True)),
                ('address', models.TextField(blank=True, default='')),
                ('status', models.CharField(
                    choices=[
                        ('active', 'Active'), ('inactive', 'Inactive'),
                        ('transferred', 'Transferred'), ('graduated', 'Graduated'),
                    ],
                    default='active', max_length=20,
                )),
                ('photo_url', models.URLField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['class_name', 'last_name', 'first_name']},
        ),
    ]
