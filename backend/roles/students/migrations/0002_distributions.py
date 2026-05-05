from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Distribution',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('class_name', models.CharField(max_length=50)),
                ('stream', models.CharField(blank=True, default='', max_length=50)),
                ('item_type', models.CharField(max_length=100)),
                ('item_name', models.CharField(max_length=255)),
                ('quantity_issued', models.IntegerField(default=0)),
                ('students_count', models.IntegerField(default=0)),
                ('issued_by', models.CharField(blank=True, default='', max_length=100)),
                ('received_by', models.CharField(blank=True, default='', max_length=100)),
                ('status', models.CharField(
                    choices=[
                        ('Draft', 'Draft'), ('Submitted', 'Submitted'), ('Approved', 'Approved'),
                        ('Distributed', 'Distributed'), ('Locked', 'Locked'),
                    ],
                    default='Draft', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-date', '-created_at']},
        ),
        migrations.CreateModel(
            name='NotCollected',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('adm_no', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=255)),
                ('class_name', models.CharField(max_length=100)),
                ('item', models.CharField(max_length=255)),
                ('reason', models.CharField(blank=True, default='', max_length=255)),
                ('days_overdue', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-days_overdue']},
        ),
        migrations.CreateModel(
            name='Replacement',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('adm_no', models.CharField(max_length=100)),
                ('name', models.CharField(max_length=255)),
                ('class_name', models.CharField(max_length=100)),
                ('item', models.CharField(max_length=255)),
                ('reason', models.CharField(blank=True, default='', max_length=255)),
                ('approved_by', models.CharField(blank=True, default='', max_length=100)),
                ('status', models.CharField(
                    choices=[('Pending', 'Pending'), ('Issued', 'Issued'), ('Rejected', 'Rejected')],
                    default='Pending', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-date']},
        ),
    ]
