from django.contrib import admin
from .models import (
    FinancialYear, AccountingPeriod, Fund,
    ChartOfAccount, BankAccount, CashPoint,
    Entity, Budget,
    Receipt, ReceiptLine,
    Payment, PaymentLine,
    JournalVoucher, JournalVoucherLine,
    ContraVoucher,
    APInvoice, APInvoiceLine, APAllocation,
    GLEntry, GLLine,
)


@admin.register(FinancialYear)
class FinancialYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'is_current']
    ordering = ['-name']


@admin.register(AccountingPeriod)
class AccountingPeriodAdmin(admin.ModelAdmin):
    list_display = ['financial_year', 'period_no', 'name', 'start_date', 'end_date', 'status']
    list_filter = ['financial_year', 'status']
    ordering = ['financial_year', 'period_no']


@admin.register(Fund)
class FundAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active']
    search_fields = ['code', 'name']


@admin.register(ChartOfAccount)
class ChartOfAccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_class', 'posting_allowed', 'is_control_account', 'is_active']
    list_filter = ['account_class', 'posting_allowed', 'is_control_account', 'is_active']
    search_fields = ['code', 'name']
    ordering = ['code']


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'bank_name', 'account_number', 'coa_account', 'is_active']
    search_fields = ['code', 'name', 'bank_name', 'account_number']


@admin.register(CashPoint)
class CashPointAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'coa_account', 'is_active']
    search_fields = ['code', 'name']


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ['code', 'entity_type', 'name', 'linked_control_account', 'is_active']
    list_filter = ['entity_type', 'is_active']
    search_fields = ['code', 'name', 'admission_number', 'email']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['id', 'financial_year', 'budget_version', 'account', 'fund', 'original_budget', 'supplementary_budget']
    list_filter = ['financial_year', 'budget_version']
    search_fields = ['account__name', 'account__code']


class ReceiptLineInline(admin.TabularInline):
    model = ReceiptLine
    extra = 1


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'receipt_number', 'receipt_date', 'received_from', 'mode_of_receipt', 'status']
    list_filter = ['status', 'payer_type', 'mode_of_receipt']
    search_fields = ['receipt_number', 'received_from', 'reference_number']
    date_hierarchy = 'receipt_date'
    inlines = [ReceiptLineInline]
    readonly_fields = ['receipt_number', 'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at']


class PaymentLineInline(admin.TabularInline):
    model = PaymentLine
    extra = 1


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'voucher_number', 'voucher_date', 'payee', 'payment_mode', 'status']
    list_filter = ['status', 'payee_type', 'payment_mode']
    search_fields = ['voucher_number', 'payee', 'cheque_eft_reference']
    date_hierarchy = 'voucher_date'
    inlines = [PaymentLineInline]
    readonly_fields = ['voucher_number', 'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at']


class JournalVoucherLineInline(admin.TabularInline):
    model = JournalVoucherLine
    extra = 2


@admin.register(JournalVoucher)
class JournalVoucherAdmin(admin.ModelAdmin):
    list_display = ['id', 'journal_number', 'journal_date', 'journal_type', 'status']
    list_filter = ['status', 'journal_type']
    search_fields = ['journal_number', 'reason', 'reference']
    date_hierarchy = 'journal_date'
    inlines = [JournalVoucherLineInline]
    readonly_fields = ['journal_number', 'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at']


@admin.register(ContraVoucher)
class ContraVoucherAdmin(admin.ModelAdmin):
    list_display = ['id', 'contra_number', 'contra_date', 'from_account', 'to_account', 'amount', 'status']
    list_filter = ['status']
    search_fields = ['contra_number', 'narration']
    date_hierarchy = 'contra_date'
    readonly_fields = ['contra_number', 'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at']


class APInvoiceLineInline(admin.TabularInline):
    model = APInvoiceLine
    extra = 1


@admin.register(APInvoice)
class APInvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'invoice_number', 'invoice_date', 'supplier', 'invoice_type', 'status']
    list_filter = ['status', 'invoice_type']
    search_fields = ['invoice_number', 'supplier__name', 'related_grn', 'related_lpo']
    date_hierarchy = 'invoice_date'
    inlines = [APInvoiceLineInline]
    readonly_fields = ['status', 'posted_by', 'posted_at']


@admin.register(APAllocation)
class APAllocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'invoice', 'payment', 'amount', 'allocation_date']
    search_fields = ['invoice__invoice_number', 'payment__voucher_number']
    date_hierarchy = 'allocation_date'


class GLLineInline(admin.TabularInline):
    model = GLLine
    extra = 0
    readonly_fields = ['account', 'entity', 'fund', 'description', 'debit', 'credit']
    can_delete = False


@admin.register(GLEntry)
class GLEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'posting_date', 'voucher_type', 'voucher_ref', 'accounting_period', 'is_reversal']
    list_filter = ['voucher_type', 'is_reversal', 'accounting_period']
    search_fields = ['voucher_ref', 'description']
    date_hierarchy = 'posting_date'
    inlines = [GLLineInline]
    readonly_fields = ['id', 'accounting_period', 'posting_date', 'voucher_type', 'voucher_ref', 'description', 'is_reversal', 'created_at']
