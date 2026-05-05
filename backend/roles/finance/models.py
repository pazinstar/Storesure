import datetime
from decimal import Decimal
from django.db import models


# ── Helpers ───────────────────────────────────────────────────────────────────

def _next_id(prefix, qs, id_field='id'):
    year = datetime.date.today().year
    key = f'{prefix}{year}'
    last = qs.filter(**{f'{id_field}__startswith': key}).order_by(f'-{id_field}').first()
    num = int(getattr(last, id_field)[len(key):]) + 1 if last else 1
    return f'{key}{num:04d}'


# ── SECTION 1: Master & Control ───────────────────────────────────────────────

class FinancialYear(models.Model):
    name = models.CharField(max_length=20, unique=True)      # e.g. "2026"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-name']

    def __str__(self):
        return self.name


class AccountingPeriod(models.Model):
    STATUS_OPEN = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_LOCKED = 'locked'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_LOCKED, 'Locked'),
    ]

    financial_year = models.ForeignKey(
        FinancialYear, on_delete=models.PROTECT, related_name='periods'
    )
    period_no = models.PositiveIntegerField()
    name = models.CharField(max_length=50)        # e.g. "January 2026"
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['financial_year', 'period_no']
        unique_together = [('financial_year', 'period_no')]

    def __str__(self):
        return f'{self.financial_year.name} – {self.name}'


class Fund(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


class ChartOfAccount(models.Model):
    CLASS_ASSET = 'asset'
    CLASS_LIABILITY = 'liability'
    CLASS_EQUITY = 'equity'
    CLASS_REVENUE = 'revenue'
    CLASS_EXPENSE = 'expense'
    CLASS_STORES = 'stores_consumption'
    ACCOUNT_CLASSES = [
        (CLASS_ASSET, 'Asset'),
        (CLASS_LIABILITY, 'Liability'),
        (CLASS_EQUITY, 'Net Assets / Equity'),
        (CLASS_REVENUE, 'Revenue'),
        (CLASS_EXPENSE, 'Expense'),
        (CLASS_STORES, 'Stores Consumption'),
    ]

    FS_SFP = 'sfp'        # Statement of Financial Position
    FS_SFPERF = 'sfperf'  # Statement of Financial Performance
    FS_SCNE = 'scne'      # Statement of Changes in Net Assets
    FS_CFS = 'cfs'        # Cash Flow Statement
    FS_BVA = 'bva'        # Budget vs Actual
    FS_CHOICES = [
        (FS_SFP, 'Statement of Financial Position'),
        (FS_SFPERF, 'Statement of Financial Performance'),
        (FS_SCNE, 'Statement of Changes in Net Assets'),
        (FS_CFS, 'Cash Flow Statement'),
        (FS_BVA, 'Budget vs Actual'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    account_class = models.CharField(max_length=30, choices=ACCOUNT_CLASSES)
    category = models.CharField(max_length=100, blank=True, default='')
    sub_category = models.CharField(max_length=100, blank=True, default='')
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children'
    )
    description = models.TextField(blank=True, default='')
    posting_allowed = models.BooleanField(default=False, help_text='Leaf/posting-level accounts only')
    is_control_account = models.BooleanField(default=False, help_text='AR/AP/Bank/Cash/Inventory etc.')
    is_contra_account = models.BooleanField(default=False, help_text='Accumulated depreciation/amortization')
    fs_mapping = models.CharField(max_length=10, choices=FS_CHOICES, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('COA', ChartOfAccount.objects)
        super().save(*args, **kwargs)

    @property
    def level(self):
        """Depth from root: 0 = top-level."""
        depth, node = 0, self
        while node.parent_id:
            depth += 1
            node = node.parent
        return depth

    def __str__(self):
        return f'{self.code} – {self.name}'


class BankAccount(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=255, blank=True, default='')
    account_number = models.CharField(max_length=50, blank=True, default='')
    branch = models.CharField(max_length=255, blank=True, default='')
    coa_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='bank_accounts',
        help_text='Linked GL bank control account'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


class CashPoint(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    coa_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='cash_points',
        help_text='Linked GL cash control account'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


# ── SECTION 2: Subledger Parties ──────────────────────────────────────────────

class Entity(models.Model):
    TYPE_STUDENT = 'student'
    TYPE_SUPPLIER = 'supplier'
    TYPE_STAFF = 'staff'
    TYPE_DONOR = 'donor'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_STUDENT, 'Student'),
        (TYPE_SUPPLIER, 'Supplier'),
        (TYPE_STAFF, 'Staff'),
        (TYPE_DONOR, 'Donor'),
        (TYPE_OTHER, 'Other'),
    ]

    code = models.CharField(max_length=20, unique=True, blank=True)
    entity_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    name = models.CharField(max_length=255)
    linked_control_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='entities'
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    # Student-specific
    admission_number = models.CharField(max_length=50, blank=True, default='')
    student_class = models.CharField(max_length=50, blank=True, default='')
    guardian = models.CharField(max_length=255, blank=True, default='')
    # Supplier-specific
    kra_pin = models.CharField(max_length=50, blank=True, default='')
    payment_terms = models.CharField(max_length=100, blank=True, default='')
    bank_details = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['entity_type', 'name']
        verbose_name_plural = 'entities'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = _next_id('ENT', Entity.objects, id_field='code')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} – {self.name}'


# ── SECTION 3: Budget ─────────────────────────────────────────────────────────

class Budget(models.Model):
    id = models.CharField(max_length=20, primary_key=True, blank=True)
    financial_year = models.ForeignKey(
        FinancialYear, on_delete=models.PROTECT, related_name='budgets'
    )
    budget_version = models.CharField(max_length=50, default='Original')
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='budgets'
    )
    fund = models.ForeignKey(
        Fund, null=True, blank=True, on_delete=models.SET_NULL, related_name='budgets'
    )
    original_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    supplementary_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-financial_year__name', 'account__code']
        unique_together = [('financial_year', 'budget_version', 'account', 'fund')]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('BDG', Budget.objects)
        super().save(*args, **kwargs)

    @property
    def total_budget(self):
        return self.original_budget + self.supplementary_budget

    def __str__(self):
        return f'{self.financial_year.name} – {self.account.name} ({self.budget_version})'


# ── SECTION 4: Voucher status shared constants ────────────────────────────────

VOUCHER_DRAFT = 'draft'
VOUCHER_POSTED = 'posted'
VOUCHER_REVERSED = 'reversed'
VOUCHER_STATUS_CHOICES = [
    (VOUCHER_DRAFT, 'Draft'),
    (VOUCHER_POSTED, 'Posted'),
    (VOUCHER_REVERSED, 'Reversed'),
]


# ── SECTION 5: Source Vouchers ────────────────────────────────────────────────

class Receipt(models.Model):
    PAYER_STUDENT = 'student'
    PAYER_DONOR = 'donor'
    PAYER_GOVERNMENT = 'government'
    PAYER_OTHER = 'other'
    PAYER_TYPE_CHOICES = [
        (PAYER_STUDENT, 'Student'),
        (PAYER_DONOR, 'Donor'),
        (PAYER_GOVERNMENT, 'Government'),
        (PAYER_OTHER, 'Other'),
    ]

    MODE_CASH = 'cash'
    MODE_BANK = 'bank'
    MODE_MOBILE = 'mobile'
    MODE_CHEQUE = 'cheque'
    MODE_CHOICES = [
        (MODE_CASH, 'Cash'),
        (MODE_BANK, 'Bank'),
        (MODE_MOBILE, 'Mobile'),
        (MODE_CHEQUE, 'Cheque'),
    ]

    ALLOC_PRIORITY = 'priority'
    ALLOC_RATIO = 'ratio'
    ALLOC_DIRECT = 'direct'
    ALLOC_CHOICES = [
        (ALLOC_PRIORITY, 'Priority'),
        (ALLOC_RATIO, 'Ratio'),
        (ALLOC_DIRECT, 'Direct'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    receipt_number = models.CharField(
        max_length=30, blank=True, default='', help_text='Assigned on Print and Post'
    )
    receipt_date = models.DateField()
    received_from = models.CharField(max_length=255)
    entity = models.ForeignKey(
        Entity, null=True, blank=True, on_delete=models.SET_NULL, related_name='receipts'
    )
    payer_type = models.CharField(max_length=20, choices=PAYER_TYPE_CHOICES, default=PAYER_OTHER)
    mode_of_receipt = models.CharField(max_length=20, choices=MODE_CHOICES)
    bank_cash_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='receipts_bank_cash',
        help_text='Bank or cash control account (debited on post)'
    )
    reference_number = models.CharField(max_length=100, blank=True, default='')
    fund = models.ForeignKey(
        Fund, null=True, blank=True, on_delete=models.SET_NULL, related_name='receipts'
    )
    narration = models.TextField()
    allocation_method = models.CharField(
        max_length=20, choices=ALLOC_CHOICES, default=ALLOC_DIRECT
    )
    accounting_period = models.ForeignKey(
        AccountingPeriod, null=True, blank=True, on_delete=models.SET_NULL, related_name='receipts'
    )
    status = models.CharField(max_length=10, choices=VOUCHER_STATUS_CHOICES, default=VOUCHER_DRAFT)
    posted_by = models.CharField(max_length=255, blank=True, default='')
    posted_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.CharField(max_length=255, blank=True, default='')
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversal_of = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='reversed_by_voucher'
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-receipt_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('RCP', Receipt.objects)
        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        return self.lines.aggregate(t=models.Sum('amount'))['t'] or Decimal('0')

    def __str__(self):
        return f'{self.receipt_number or self.id} – {self.received_from}'


class ReceiptLine(models.Model):
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='receipt_lines'
    )
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f'{self.receipt_id} – {self.account.code} – {self.amount}'


class Payment(models.Model):
    PAYEE_SUPPLIER = 'supplier'
    PAYEE_STAFF = 'staff'
    PAYEE_OTHER = 'other'
    PAYEE_TYPE_CHOICES = [
        (PAYEE_SUPPLIER, 'Supplier'),
        (PAYEE_STAFF, 'Staff'),
        (PAYEE_OTHER, 'Other'),
    ]

    MODE_CASH = 'cash'
    MODE_BANK = 'bank'
    MODE_CHEQUE = 'cheque'
    MODE_EFT = 'eft'
    MODE_CHOICES = [
        (MODE_CASH, 'Cash'),
        (MODE_BANK, 'Bank'),
        (MODE_CHEQUE, 'Cheque'),
        (MODE_EFT, 'EFT'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    voucher_number = models.CharField(
        max_length=30, blank=True, default='', help_text='Assigned on Print and Post'
    )
    voucher_date = models.DateField()
    payee = models.CharField(max_length=255)
    entity = models.ForeignKey(
        Entity, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments'
    )
    payee_type = models.CharField(max_length=20, choices=PAYEE_TYPE_CHOICES, default=PAYEE_OTHER)
    payment_mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    bank_cash_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='payments_bank_cash',
        help_text='Bank or cash control account (credited on post)'
    )
    cheque_eft_reference = models.CharField(max_length=100, blank=True, default='')
    lpo_lso_number = models.CharField(
        max_length=100, blank=True, default='',
        help_text='Local Purchase Order / Local Service Order reference'
    )
    fund = models.ForeignKey(
        Fund, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments'
    )
    narration = models.TextField()
    amount_in_words = models.CharField(max_length=500, blank=True, default='')
    accounting_period = models.ForeignKey(
        AccountingPeriod, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments'
    )
    status = models.CharField(max_length=10, choices=VOUCHER_STATUS_CHOICES, default=VOUCHER_DRAFT)
    posted_by = models.CharField(max_length=255, blank=True, default='')
    posted_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.CharField(max_length=255, blank=True, default='')
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversal_of = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='reversed_by_voucher'
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-voucher_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('PMT', Payment.objects)
        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        return self.lines.aggregate(t=models.Sum('amount'))['t'] or Decimal('0')

    def __str__(self):
        return f'{self.voucher_number or self.id} – {self.payee}'


class PaymentLine(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='lines')
    ap_invoice = models.ForeignKey(
        'APInvoice', null=True, blank=True, on_delete=models.SET_NULL, related_name='payment_lines'
    )
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='payment_lines'
    )
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f'{self.payment_id} – {self.account.code} – {self.amount}'


class JournalVoucher(models.Model):
    TYPE_ACCRUAL = 'accrual'
    TYPE_RECLASS = 'reclass'
    TYPE_DEPRECIATION = 'depreciation'
    TYPE_CORRECTION = 'correction'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_ACCRUAL, 'Accrual'),
        (TYPE_RECLASS, 'Reclassification'),
        (TYPE_DEPRECIATION, 'Depreciation'),
        (TYPE_CORRECTION, 'Correction'),
        (TYPE_OTHER, 'Other'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    journal_number = models.CharField(
        max_length=30, blank=True, default='', help_text='Assigned on Print and Post'
    )
    journal_date = models.DateField()
    journal_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reason = models.TextField()
    reference = models.CharField(max_length=100, blank=True, default='')
    accounting_period = models.ForeignKey(
        AccountingPeriod, null=True, blank=True, on_delete=models.SET_NULL, related_name='journals'
    )
    status = models.CharField(max_length=10, choices=VOUCHER_STATUS_CHOICES, default=VOUCHER_DRAFT)
    posted_by = models.CharField(max_length=255, blank=True, default='')
    posted_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.CharField(max_length=255, blank=True, default='')
    reversed_at = models.DateTimeField(null=True, blank=True)
    reversal_of = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='reversed_by_voucher'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-journal_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('JV', JournalVoucher.objects)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.journal_number or self.id} – {self.get_journal_type_display()}'


class JournalVoucherLine(models.Model):
    journal = models.ForeignKey(JournalVoucher, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='journal_lines'
    )
    description = models.CharField(max_length=500)
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f'{self.journal_id} – {self.account.code} Dr:{self.debit} Cr:{self.credit}'


class ContraVoucher(models.Model):
    id = models.CharField(max_length=20, primary_key=True, blank=True)
    contra_number = models.CharField(
        max_length=30, blank=True, default='', help_text='Assigned on Print and Post'
    )
    contra_date = models.DateField()
    from_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='contra_from',
        help_text='Cash/bank account being reduced (credited)'
    )
    to_account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='contra_to',
        help_text='Cash/bank account being increased (debited)'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True, default='')
    narration = models.TextField()
    accounting_period = models.ForeignKey(
        AccountingPeriod, null=True, blank=True, on_delete=models.SET_NULL, related_name='contras'
    )
    status = models.CharField(max_length=10, choices=VOUCHER_STATUS_CHOICES, default=VOUCHER_DRAFT)
    posted_by = models.CharField(max_length=255, blank=True, default='')
    posted_at = models.DateTimeField(null=True, blank=True)
    reversed_by = models.CharField(max_length=255, blank=True, default='')
    reversed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-contra_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('CNT', ContraVoucher.objects)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.contra_number or self.id} – {self.amount}'


# ── SECTION 6: AP Subledger ───────────────────────────────────────────────────

class APInvoice(models.Model):
    TYPE_EXPENSE = 'expense'
    TYPE_INVENTORY = 'inventory'
    TYPE_PPE = 'ppe'
    TYPE_CHOICES = [
        (TYPE_EXPENSE, 'Expense'),
        (TYPE_INVENTORY, 'Inventory'),
        (TYPE_PPE, 'PPE / Fixed Asset'),
    ]

    STATUS_DRAFT = 'draft'
    STATUS_POSTED = 'posted'
    STATUS_PART_SETTLED = 'part_settled'
    STATUS_SETTLED = 'settled'
    STATUS_REVERSED = 'reversed'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_POSTED, 'Posted'),
        (STATUS_PART_SETTLED, 'Partially Settled'),
        (STATUS_SETTLED, 'Settled'),
        (STATUS_REVERSED, 'Reversed'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    invoice_number = models.CharField(max_length=100)
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    supplier = models.ForeignKey(Entity, on_delete=models.PROTECT, related_name='ap_invoices')
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    related_grn = models.CharField(max_length=50, blank=True, default='')
    related_lpo = models.CharField(max_length=50, blank=True, default='')
    accounting_period = models.ForeignKey(
        AccountingPeriod, null=True, blank=True, on_delete=models.SET_NULL, related_name='ap_invoices'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    posted_by = models.CharField(max_length=255, blank=True, default='')
    posted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('API', APInvoice.objects)
        super().save(*args, **kwargs)

    @property
    def total_amount(self):
        return self.invoice_lines.aggregate(t=models.Sum('amount'))['t'] or Decimal('0')

    @property
    def settled_amount(self):
        return self.allocations.aggregate(t=models.Sum('amount'))['t'] or Decimal('0')

    @property
    def outstanding_amount(self):
        return self.total_amount - self.settled_amount

    def __str__(self):
        return f'{self.id} – {self.supplier.name} – {self.invoice_number}'


class APInvoiceLine(models.Model):
    invoice = models.ForeignKey(APInvoice, on_delete=models.CASCADE, related_name='invoice_lines')
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='ap_invoice_lines'
    )
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f'{self.invoice_id} – {self.account.code} – {self.amount}'


class APAllocation(models.Model):
    id = models.CharField(max_length=20, primary_key=True, blank=True)
    invoice = models.ForeignKey(APInvoice, on_delete=models.PROTECT, related_name='allocations')
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='ap_allocations')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    allocation_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('APA', APAllocation.objects)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.id} – {self.invoice_id} ← {self.payment_id} – {self.amount}'


# ── SECTION 7: General Ledger ──────────────────────────────────────────────────

class GLEntry(models.Model):
    """One GL entry per posted voucher; holds the balanced double-entry lines."""
    VTYPE_RECEIPT = 'receipt'
    VTYPE_PAYMENT = 'payment'
    VTYPE_JOURNAL = 'journal'
    VTYPE_CONTRA = 'contra'
    VTYPE_AP_INVOICE = 'ap_invoice'
    VTYPE_CHOICES = [
        (VTYPE_RECEIPT, 'Receipt'),
        (VTYPE_PAYMENT, 'Payment'),
        (VTYPE_JOURNAL, 'Journal'),
        (VTYPE_CONTRA, 'Contra'),
        (VTYPE_AP_INVOICE, 'AP Invoice'),
    ]

    id = models.CharField(max_length=20, primary_key=True, blank=True)
    accounting_period = models.ForeignKey(
        AccountingPeriod, on_delete=models.PROTECT, related_name='gl_entries'
    )
    posting_date = models.DateField()
    voucher_type = models.CharField(max_length=20, choices=VTYPE_CHOICES)
    voucher_ref = models.CharField(max_length=30, help_text='Human-readable voucher number')
    description = models.CharField(max_length=500)
    is_reversal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-posting_date', '-created_at']
        verbose_name_plural = 'GL entries'

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _next_id('GLE', GLEntry.objects)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.id} – {self.voucher_type} – {self.voucher_ref}'


class GLLine(models.Model):
    """Individual debit/credit line within a GL entry."""
    entry = models.ForeignKey(GLEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(
        ChartOfAccount, on_delete=models.PROTECT, related_name='gl_lines'
    )
    entity = models.ForeignKey(
        Entity, null=True, blank=True, on_delete=models.SET_NULL, related_name='gl_lines'
    )
    fund = models.ForeignKey(
        Fund, null=True, blank=True, on_delete=models.SET_NULL, related_name='gl_lines'
    )
    description = models.CharField(max_length=500)
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f'{self.entry_id} – {self.account.code} Dr:{self.debit} Cr:{self.credit}'
