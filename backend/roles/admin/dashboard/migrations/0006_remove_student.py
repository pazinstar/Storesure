"""
Migration 0006 – Remove Student model from admin_dashboard.
Student is now its own app at roles.students.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('admin_dashboard', '0005_student_expansion'),
    ]

    operations = [
        migrations.DeleteModel(name='Student'),
    ]
