import datetime
from decimal import Decimal
from django.db import models


def _next_student_id(prefix, model_class, id_field='id'):
    year = datetime.date.today().year
    key = f'{prefix}{year}'
    last = model_class.objects.filter(**{f'{id_field}__startswith': key}).order_by(f'-{id_field}').first()
    num = int(getattr(last, id_field)[len(key):]) + 1 if last else 1
    return f'{key}{num:04d}'


# ─── Fee Structure ───────────────────────────────────────────────────────────

class FeeStructure(models.Model):
    """Fee structure header — one active per student category per period."""
    CATEGORY_CHOICES = [
        ('boarder', 'Boarder'),
        ('day_scholar', 'Day Scholar'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    name = models.CharField(max_length=255, help_text='e.g. FS-2025-CATB-01')
    effective_from = models.DateField()
    effective_to = models.DateField()
    student_category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='boarder')
    term1_pct = models.IntegerField(default=50, help_text='Term 1 percentage')
    term2_pct = models.IntegerField(default=30, help_text='Term 2 percentage')
    term3_pct = models.IntegerField(default=20, help_text='Term 3 percentage')
    is_active = models.BooleanField(default=True)
    approved_by = models.CharField(max_length=255, blank=True, default='')
    approval_ref = models.CharField(max_length=100, blank=True, default='')
    allow_update = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_from']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_student_id('FS', FeeStructure)
        super().save(*args, **kwargs)

    @property
    def annual_total(self):
        return self.items.aggregate(t=models.Sum('annual_amount'))['t'] or Decimal('0')

    def __str__(self):
        return f'{self.name} ({self.student_category})'


class FeeStructureItem(models.Model):
    """Individual vote-head line within a fee structure."""
    FUNDING_CHOICES = [
        ('GOK', 'GOK'),
        ('Parent', 'Parent'),
        ('Mixed', 'Mixed'),
    ]

    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='items')
    vote_head = models.CharField(max_length=255)
    gok_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    parent_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    annual_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                         help_text='Auto-computed: GOK + Parent')
    funding_type = models.CharField(max_length=10, choices=FUNDING_CHOICES, default='Mixed')

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        self.annual_amount = self.gok_amount + self.parent_amount
        # Derive funding type
        if self.gok_amount > 0 and self.parent_amount > 0:
            self.funding_type = 'Mixed'
        elif self.gok_amount > 0:
            self.funding_type = 'GOK'
        else:
            self.funding_type = 'Parent'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.vote_head}: {self.annual_amount}'


# ─── Student Billing ─────────────────────────────────────────────────────────

class StudentBill(models.Model):
    """One bill per student per term — auto-generated from fee structure."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('posted', 'Posted'),
    ]
    TERM_CHOICES = [
        ('T1', 'Term 1'),
        ('T2', 'Term 2'),
        ('T3', 'Term 3'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    bill_number = models.CharField(max_length=50, blank=True, default='')
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='bills')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.PROTECT, related_name='bills')
    term = models.CharField(max_length=5, choices=TERM_CHOICES)
    year = models.CharField(max_length=10)
    bill_date = models.DateField()
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-bill_date', '-created_at']
        unique_together = [('student', 'fee_structure', 'term')]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_student_id('FB', StudentBill)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.bill_number or self.id} — {self.student} {self.term}'


class StudentBillLine(models.Model):
    """One line per vote head per bill."""
    bill = models.ForeignKey(StudentBill, on_delete=models.CASCADE, related_name='lines')
    vote_head = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        self.balance = self.amount - self.paid
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.vote_head}: {self.amount} (paid {self.paid})'


# ─── Bursary ─────────────────────────────────────────────────────────────────

class Bursary(models.Model):
    """Track school-based and external bursaries."""
    TYPE_CHOICES = [
        ('school_based', 'School-Based'),
        ('external', 'External'),
    ]
    STATUS_CHOICES = [
        ('acknowledged', 'Acknowledged'),
        ('paid_to_student', 'Paid to Student'),
        ('received_as_fees', 'Received as Fees'),
        ('pending', 'Pending'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    bursary_ref = models.CharField(max_length=100, blank=True, default='')
    bursary_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    sponsor = models.CharField(max_length=255)
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='bursaries')
    acknowledged_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_to_student = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    received_as_fees = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    narration = models.TextField(blank=True, default='')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name_plural = 'bursaries'

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_student_id('BUR', Bursary)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.bursary_ref or self.id} — {self.student} ({self.sponsor})'


class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'), ('inactive', 'Inactive'),
        ('transferred', 'Transferred'), ('graduated', 'Graduated'),
    ]
    GENDER_CHOICES = [('male', 'Male'), ('female', 'Female')]
    PATHWAY_CHOICES = [
        ('STEM', 'STEM'),
        ('Social Sciences', 'Social Sciences'),
        ('Arts and Sports Science', 'Arts and Sports Science'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    admission_no = models.CharField(max_length=100, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    nemis_no = models.CharField(max_length=100, unique=True, null=True, blank=True)
    pathway = models.CharField(max_length=50, choices=PATHWAY_CHOICES, null=True, blank=True)
    class_name = models.CharField(max_length=50)
    stream = models.CharField(max_length=50, null=True, blank=True)
    admission_date = models.DateField(null=True, blank=True)
    parent_name = models.CharField(max_length=255, blank=True, default='')
    parent_phone = models.CharField(max_length=50, blank=True, default='')
    parent_email = models.EmailField(null=True, blank=True)
    address = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    photo_url = models.URLField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['class_name', 'last_name', 'first_name']

    def save(self, *args, **kwargs):
        if not self.id:
            year = datetime.date.today().year
            last = Student.objects.filter(id__startswith=f'STU{year}').order_by('-id').first()
            num = int(last.id[7:]) + 1 if last else 1
            self.id = f'STU{year}{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.admission_no})'


# ─── Distributions ────────────────────────────────────────────────────────────

class Distribution(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'), ('Submitted', 'Submitted'), ('Approved', 'Approved'),
        ('Distributed', 'Distributed'), ('Locked', 'Locked'),
    ]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    date = models.DateField()
    class_name = models.CharField(max_length=50)
    stream = models.CharField(max_length=50, blank=True, default='')
    item_type = models.CharField(max_length=100)
    item_name = models.CharField(max_length=255)
    quantity_issued = models.IntegerField(default=0)
    students_count = models.IntegerField(default=0)
    issued_by = models.CharField(max_length=100, blank=True, default='')
    received_by = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            year = datetime.date.today().year
            last = Distribution.objects.filter(id__startswith=f'DIST-{year}-').order_by('-id').first()
            num = int(last.id.split('-')[-1]) + 1 if last else 1
            self.id = f'DIST-{year}-{num:03d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.id} — {self.class_name} {self.stream}'


class NotCollected(models.Model):
    adm_no = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    class_name = models.CharField(max_length=100)
    item = models.CharField(max_length=255)
    reason = models.CharField(max_length=255, blank=True, default='')
    days_overdue = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-days_overdue']

    def __str__(self):
        return f'{self.name} — {self.item}'


class Replacement(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Issued', 'Issued'), ('Rejected', 'Rejected')]

    id = models.CharField(max_length=50, primary_key=True, blank=True)
    date = models.DateField()
    adm_no = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    class_name = models.CharField(max_length=100)
    item = models.CharField(max_length=255)
    reason = models.CharField(max_length=255, blank=True, default='')
    approved_by = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.id:
            year = datetime.date.today().year
            last = Replacement.objects.filter(id__startswith=f'RPL-{year}-').order_by('-id').first()
            num = int(last.id.split('-')[-1]) + 1 if last else 1
            self.id = f'RPL-{year}-{num:03d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.id} — {self.name}'
