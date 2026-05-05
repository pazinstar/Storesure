"""
Migration 0002 – Library module expansion

Adds:
  - BookTitle   (catalogue)
  - BookCopy    (physical copies with accession numbers)
  - LoanTransaction  (issue / return history)
  - LibraryReceipt + LibraryReceiptItem  (receive books in)
"""

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('librarian_library', '0001_initial'),
    ]

    operations = [
        # ── BookTitle ─────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='BookTitle',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('category', models.CharField(
                    choices=[
                        ('Textbook', 'Textbook'), ('Reference', 'Reference'),
                        ('Fiction', 'Fiction'), ('Non-Fiction', 'Non-Fiction'),
                        ('Periodical', 'Periodical'), ('Other', 'Other'),
                    ],
                    default='Textbook', max_length=100,
                )),
                ('isbn', models.CharField(blank=True, max_length=50, null=True)),
                ('publisher', models.CharField(blank=True, max_length=255, null=True)),
                ('subject', models.CharField(blank=True, max_length=100, null=True)),
                ('year', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),

        # ── BookCopy ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='BookCopy',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('accession_no', models.CharField(max_length=50, unique=True)),
                ('title_ref', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='copies', to='librarian_library.booktitle',
                )),
                ('book_title', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=100)),
                ('isbn', models.CharField(blank=True, max_length=50, null=True)),
                ('status', models.CharField(
                    choices=[
                        ('Available', 'Available'), ('Issued', 'Issued'),
                        ('Overdue', 'Overdue'), ('Lost', 'Lost'), ('Damaged', 'Damaged'),
                    ],
                    default='Available', max_length=50,
                )),
                ('location', models.CharField(default='Main Library', max_length=255)),
                ('received_date', models.DateField()),
                ('receipt_id', models.CharField(blank=True, max_length=50, null=True)),
                ('status_remarks', models.TextField(blank=True, null=True)),
                ('current_borrower_id', models.CharField(blank=True, max_length=100, null=True)),
                ('current_borrower_name', models.CharField(blank=True, max_length=255, null=True)),
                ('current_borrower_type', models.CharField(blank=True, max_length=50, null=True)),
                ('current_borrower_class', models.CharField(blank=True, max_length=100, null=True)),
                ('issue_date', models.DateField(blank=True, null=True)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),

        # ── LoanTransaction ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='LoanTransaction',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('transaction_no', models.CharField(blank=True, max_length=50, unique=True)),
                ('accession_no', models.CharField(max_length=50)),
                ('book_title', models.CharField(max_length=255)),
                ('book_author', models.CharField(max_length=255)),
                ('book_category', models.CharField(max_length=100)),
                ('borrower_id', models.CharField(max_length=100)),
                ('borrower_name', models.CharField(max_length=255)),
                ('borrower_type', models.CharField(max_length=50)),
                ('borrower_class', models.CharField(blank=True, max_length=100, null=True)),
                ('issue_date', models.DateField()),
                ('due_date', models.DateField()),
                ('return_date', models.DateField(blank=True, null=True)),
                ('return_condition', models.CharField(
                    blank=True,
                    choices=[
                        ('Good', 'Good'), ('Fair', 'Fair'),
                        ('Poor', 'Poor'), ('Damaged', 'Damaged'),
                    ],
                    max_length=50, null=True,
                )),
                ('late_days', models.IntegerField(default=0)),
                ('status', models.CharField(
                    choices=[
                        ('Active', 'Active'), ('Returned', 'Returned'), ('Overdue', 'Overdue'),
                    ],
                    default='Active', max_length=50,
                )),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),

        # ── LibraryReceipt ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='LibraryReceipt',
            fields=[
                ('id', models.CharField(blank=True, max_length=50, primary_key=True, serialize=False)),
                ('receipt_no', models.CharField(blank=True, max_length=50, unique=True)),
                ('source_type', models.CharField(
                    choices=[
                        ('Supplier', 'Supplier'), ('Donor', 'Donor'), ('Transfer', 'Transfer'),
                    ],
                    max_length=50,
                )),
                ('source_name', models.CharField(max_length=255)),
                ('reference', models.CharField(blank=True, max_length=100, null=True)),
                ('date_received', models.DateField()),
                ('library_branch', models.CharField(max_length=255)),
                ('signed_by', models.CharField(max_length=255)),
                ('signed_at', models.DateTimeField()),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),

        # ── LibraryReceiptItem ────────────────────────────────────────────────
        migrations.CreateModel(
            name='LibraryReceiptItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('receipt', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='items', to='librarian_library.libraryreceipt',
                )),
                ('title', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('category', models.CharField(max_length=100)),
                ('isbn', models.CharField(blank=True, max_length=50, null=True)),
                ('quantity_received', models.IntegerField()),
                ('accession_numbers', models.JSONField(default=list)),
            ],
        ),
    ]
