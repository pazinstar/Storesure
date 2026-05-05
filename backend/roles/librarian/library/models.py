from django.db import models
from datetime import date


def _next_id(model_class, prefix):
    last = model_class.objects.filter(id__startswith=prefix).order_by('-id').first()
    num = 1
    if last:
        try:
            num = int(last.id[len(prefix):]) + 1
        except (ValueError, TypeError):
            num = 1
    return f'{prefix}{num:03d}'


# ─── Book Title (Catalogue) ───────────────────────────────────────────────────

class BookTitle(models.Model):
    CATEGORY_CHOICES = [
        ('Textbook', 'Textbook'),
        ('Reference', 'Reference'),
        ('Fiction', 'Fiction'),
        ('Non-Fiction', 'Non-Fiction'),
        ('Periodical', 'Periodical'),
        ('Other', 'Other'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Textbook')
    isbn = models.CharField(max_length=50, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(BookTitle, 'BTL')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.title} — {self.author}'


# ─── Book Copy ────────────────────────────────────────────────────────────────

class BookCopy(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Issued', 'Issued'),
        ('Overdue', 'Overdue'),
        ('Lost', 'Lost'),
        ('Damaged', 'Damaged'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    accession_no = models.CharField(max_length=50, unique=True)
    title_ref = models.ForeignKey(
        BookTitle, on_delete=models.SET_NULL,
        related_name='copies', null=True, blank=True,
    )
    book_title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    isbn = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Available')
    location = models.CharField(max_length=255, default='Main Library')
    received_date = models.DateField(default=date.today)
    receipt_id = models.CharField(max_length=50, blank=True, null=True)
    status_remarks = models.TextField(blank=True, null=True)

    # Denormalised borrower info (cleared on return)
    current_borrower_id = models.CharField(max_length=100, blank=True, null=True)
    current_borrower_name = models.CharField(max_length=255, blank=True, null=True)
    current_borrower_type = models.CharField(max_length=50, blank=True, null=True)
    current_borrower_class = models.CharField(max_length=100, blank=True, null=True)
    issue_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(BookCopy, 'CPY')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.accession_no} — {self.book_title}'


# ─── Loan Transaction ─────────────────────────────────────────────────────────

class LoanTransaction(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Returned', 'Returned'),
        ('Overdue', 'Overdue'),
    ]
    CONDITION_CHOICES = [
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
        ('Damaged', 'Damaged'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    transaction_no = models.CharField(max_length=50, unique=True, blank=True)
    accession_no = models.CharField(max_length=50)
    book_title = models.CharField(max_length=255)
    book_author = models.CharField(max_length=255)
    book_category = models.CharField(max_length=100)
    borrower_id = models.CharField(max_length=100)
    borrower_name = models.CharField(max_length=255)
    borrower_type = models.CharField(max_length=50)
    borrower_class = models.CharField(max_length=100, blank=True, null=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    return_condition = models.CharField(
        max_length=50, choices=CONDITION_CHOICES, blank=True, null=True,
    )
    late_days = models.IntegerField(default=0)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(LoanTransaction, 'TXN')
        if not self.transaction_no:
            year = date.today().year
            count = LoanTransaction.objects.filter(
                transaction_no__startswith=f'TXN/{year}/'
            ).count() + 1
            self.transaction_no = f'TXN/{year}/{count:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.transaction_no} — {self.book_title}'


# ─── Library Receipt ──────────────────────────────────────────────────────────

class LibraryReceipt(models.Model):
    SOURCE_CHOICES = [
        ('Supplier', 'Supplier'),
        ('Donor', 'Donor'),
        ('Transfer', 'Transfer'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    receipt_no = models.CharField(max_length=50, unique=True, blank=True)
    source_type = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    source_name = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, blank=True, null=True)
    date_received = models.DateField()
    library_branch = models.CharField(max_length=255)
    signed_by = models.CharField(max_length=255)
    signed_at = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id(LibraryReceipt, 'RCT')
        if not self.receipt_no:
            year = date.today().year
            count = LibraryReceipt.objects.filter(
                receipt_no__startswith=f'LRN/{year}/'
            ).count() + 1
            self.receipt_no = f'LRN/{year}/{count:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.receipt_no


class LibraryReceiptItem(models.Model):
    receipt = models.ForeignKey(
        LibraryReceipt, on_delete=models.CASCADE, related_name='items',
    )
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    isbn = models.CharField(max_length=50, blank=True, null=True)
    quantity_received = models.IntegerField()
    accession_numbers = models.JSONField(default=list)

    def __str__(self):
        return f'{self.receipt.receipt_no} — {self.title}'


# ─── Legacy Book (kept so 0001_initial migration still works) ─────────────────

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=50)
    status = models.CharField(max_length=50)

    def __str__(self):
        return f'{self.title} by {self.author}'
