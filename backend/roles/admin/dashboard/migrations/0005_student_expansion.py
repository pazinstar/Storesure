"""
Migration 0005 – Expand Student model to full schema.
Drops the minimal (name, admissionNumber) fields and replaces with
the full student record matching the frontend Student interface.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_dashboard', '0004_inspection_committee'),
    ]

    operations = [
        # Drop old minimal fields
        migrations.RemoveField(model_name='student', name='name'),
        migrations.RemoveField(model_name='student', name='admissionNumber'),

        # Make id blank=True so save() can auto-generate it
        migrations.AlterField(
            model_name='student',
            name='id',
            field=models.CharField(blank=True, max_length=50, primary_key=True, serialize=False),
        ),

        # Add full set of fields
        migrations.AddField(model_name='student', name='admission_no',
            field=models.CharField(default='', max_length=100, unique=True), preserve_default=False),
        migrations.AddField(model_name='student', name='first_name',
            field=models.CharField(default='', max_length=100), preserve_default=False),
        migrations.AddField(model_name='student', name='last_name',
            field=models.CharField(default='', max_length=100), preserve_default=False),
        migrations.AddField(model_name='student', name='date_of_birth',
            field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name='student', name='gender',
            field=models.CharField(choices=[('male', 'Male'), ('female', 'Female')], default='male', max_length=10)),
        migrations.AddField(model_name='student', name='class_name',
            field=models.CharField(default='', max_length=50), preserve_default=False),
        migrations.AddField(model_name='student', name='stream',
            field=models.CharField(blank=True, max_length=50, null=True)),
        migrations.AddField(model_name='student', name='admission_date',
            field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name='student', name='parent_name',
            field=models.CharField(blank=True, default='', max_length=255)),
        migrations.AddField(model_name='student', name='parent_phone',
            field=models.CharField(blank=True, default='', max_length=50)),
        migrations.AddField(model_name='student', name='parent_email',
            field=models.EmailField(blank=True, null=True)),
        migrations.AddField(model_name='student', name='address',
            field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='student', name='status',
            field=models.CharField(
                choices=[('active', 'Active'), ('inactive', 'Inactive'),
                         ('transferred', 'Transferred'), ('graduated', 'Graduated')],
                default='active', max_length=20)),
        migrations.AddField(model_name='student', name='photo_url',
            field=models.URLField(blank=True, null=True)),
        migrations.AddField(model_name='student', name='notes',
            field=models.TextField(blank=True, null=True)),
        migrations.AddField(model_name='student', name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True)),
        migrations.AddField(model_name='student', name='updated_at',
            field=models.DateTimeField(auto_now=True)),
    ]
