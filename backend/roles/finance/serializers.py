from rest_framework import serializers
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


# ── Master & Control ──────────────────────────────────────────────────────────

class FinancialYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AccountingPeriodSerializer(serializers.ModelSerializer):
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)

    class Meta:
        model = AccountingPeriod
        fields = [
            'id', 'financial_year', 'financial_year_name',
            'period_no', 'name', 'start_date', 'end_date', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fund
        fields = ['id', 'code', 'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChartOfAccountSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)

    class Meta:
        model = ChartOfAccount
        fields = [
            'id', 'code', 'name', 'account_class', 'category', 'sub_category',
            'parent', 'parent_name', 'level', 'description',
            'posting_allowed', 'is_control_account', 'is_contra_account',
            'fs_mapping', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'level', 'created_at', 'updated_at']


class BankAccountSerializer(serializers.ModelSerializer):
    coa_code = serializers.CharField(source='coa_account.code', read_only=True)
    coa_name = serializers.CharField(source='coa_account.name', read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id', 'code', 'name', 'bank_name', 'account_number', 'branch',
            'coa_account', 'coa_code', 'coa_name', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CashPointSerializer(serializers.ModelSerializer):
    coa_code = serializers.CharField(source='coa_account.code', read_only=True)
    coa_name = serializers.CharField(source='coa_account.name', read_only=True)

    class Meta:
        model = CashPoint
        fields = [
            'id', 'code', 'name', 'coa_account', 'coa_code', 'coa_name',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ── Subledger Parties ─────────────────────────────────────────────────────────

class EntitySerializer(serializers.ModelSerializer):
    control_account_name = serializers.CharField(
        source='linked_control_account.name', read_only=True
    )
    control_account_code = serializers.CharField(
        source='linked_control_account.code', read_only=True
    )

    class Meta:
        model = Entity
        fields = [
            'id', 'code', 'entity_type', 'name',
            'linked_control_account', 'control_account_name', 'control_account_code',
            'phone', 'email', 'address', 'is_active',
            'admission_number', 'student_class', 'guardian',
            'kra_pin', 'payment_terms', 'bank_details',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']


# ── Budget ────────────────────────────────────────────────────────────────────

class BudgetSerializer(serializers.ModelSerializer):
    financial_year_name = serializers.CharField(source='financial_year.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    fund_name = serializers.CharField(source='fund.name', read_only=True, default=None)
    total_budget = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'financial_year', 'financial_year_name',
            'budget_version', 'account', 'account_code', 'account_name',
            'fund', 'fund_name',
            'original_budget', 'supplementary_budget', 'total_budget',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_budget', 'created_at', 'updated_at']


# ── Receipt ───────────────────────────────────────────────────────────────────

class ReceiptLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = ReceiptLine
        fields = ['id', 'account', 'account_code', 'account_name', 'description', 'amount']


class ReceiptSerializer(serializers.ModelSerializer):
    lines = ReceiptLineSerializer(many=True, required=False)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    bank_cash_account_name = serializers.CharField(
        source='bank_cash_account.name', read_only=True
    )
    entity_name = serializers.CharField(source='entity.name', read_only=True, default=None)
    period_name = serializers.CharField(
        source='accounting_period.name', read_only=True, default=None
    )
    fund_name = serializers.CharField(source='fund.name', read_only=True, default=None)

    class Meta:
        model = Receipt
        fields = [
            'id', 'receipt_number', 'receipt_date',
            'received_from', 'entity', 'entity_name', 'payer_type',
            'mode_of_receipt', 'bank_cash_account', 'bank_cash_account_name',
            'reference_number', 'fund', 'fund_name', 'narration', 'allocation_method',
            'accounting_period', 'period_name',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at', 'reversal_of',
            'lines', 'total_amount', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'receipt_number', 'total_amount',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        receipt = Receipt.objects.create(**validated_data)
        for line in lines_data:
            ReceiptLine.objects.create(receipt=receipt, **line)
        return receipt

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line in lines_data:
                ReceiptLine.objects.create(receipt=instance, **line)
        return instance


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = PaymentLine
        fields = [
            'id', 'ap_invoice', 'account', 'account_code', 'account_name',
            'description', 'amount',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    lines = PaymentLineSerializer(many=True, required=False)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    bank_cash_account_name = serializers.CharField(
        source='bank_cash_account.name', read_only=True
    )
    entity_name = serializers.CharField(source='entity.name', read_only=True, default=None)
    period_name = serializers.CharField(
        source='accounting_period.name', read_only=True, default=None
    )
    fund_name = serializers.CharField(source='fund.name', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = [
            'id', 'voucher_number', 'voucher_date',
            'payee', 'entity', 'entity_name', 'payee_type',
            'payment_mode', 'bank_cash_account', 'bank_cash_account_name',
            'cheque_eft_reference', 'lpo_lso_number',
            'fund', 'fund_name', 'narration', 'amount_in_words',
            'accounting_period', 'period_name',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at', 'reversal_of',
            'lines', 'total_amount', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'voucher_number', 'total_amount',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at',
            'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        payment = Payment.objects.create(**validated_data)
        for line in lines_data:
            PaymentLine.objects.create(payment=payment, **line)
        return payment

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line in lines_data:
                PaymentLine.objects.create(payment=instance, **line)
        return instance


# ── Journal Voucher ───────────────────────────────────────────────────────────

class JournalVoucherLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalVoucherLine
        fields = [
            'id', 'account', 'account_code', 'account_name',
            'description', 'debit', 'credit',
        ]


class JournalVoucherSerializer(serializers.ModelSerializer):
    lines = JournalVoucherLineSerializer(many=True, required=False)
    period_name = serializers.CharField(
        source='accounting_period.name', read_only=True, default=None
    )
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()
    difference = serializers.SerializerMethodField()

    class Meta:
        model = JournalVoucher
        fields = [
            'id', 'journal_number', 'journal_date', 'journal_type',
            'reason', 'reference', 'accounting_period', 'period_name',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at', 'reversal_of',
            'lines', 'total_debit', 'total_credit', 'difference',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'journal_number', 'total_debit', 'total_credit', 'difference',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at',
            'created_at', 'updated_at',
        ]

    def get_total_debit(self, obj):
        from decimal import Decimal
        return sum((l.debit for l in obj.lines.all()), Decimal('0'))

    def get_total_credit(self, obj):
        from decimal import Decimal
        return sum((l.credit for l in obj.lines.all()), Decimal('0'))

    def get_difference(self, obj):
        return self.get_total_debit(obj) - self.get_total_credit(obj)

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        journal = JournalVoucher.objects.create(**validated_data)
        for line in lines_data:
            JournalVoucherLine.objects.create(journal=journal, **line)
        return journal

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line in lines_data:
                JournalVoucherLine.objects.create(journal=instance, **line)
        return instance


# ── Contra Voucher ────────────────────────────────────────────────────────────

class ContraVoucherSerializer(serializers.ModelSerializer):
    from_account_name = serializers.CharField(source='from_account.name', read_only=True)
    to_account_name = serializers.CharField(source='to_account.name', read_only=True)
    period_name = serializers.CharField(
        source='accounting_period.name', read_only=True, default=None
    )

    class Meta:
        model = ContraVoucher
        fields = [
            'id', 'contra_number', 'contra_date',
            'from_account', 'from_account_name', 'to_account', 'to_account_name',
            'amount', 'reference', 'narration', 'accounting_period', 'period_name',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'contra_number',
            'status', 'posted_by', 'posted_at', 'reversed_by', 'reversed_at',
            'created_at', 'updated_at',
        ]


# ── AP Invoice ────────────────────────────────────────────────────────────────

class APInvoiceLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = APInvoiceLine
        fields = ['id', 'account', 'account_code', 'account_name', 'description', 'amount']


class APInvoiceSerializer(serializers.ModelSerializer):
    invoice_lines = APInvoiceLineSerializer(many=True, required=False)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    period_name = serializers.CharField(
        source='accounting_period.name', read_only=True, default=None
    )
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    settled_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    outstanding_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = APInvoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'due_date',
            'supplier', 'supplier_name', 'invoice_type',
            'related_grn', 'related_lpo', 'accounting_period', 'period_name',
            'status', 'posted_by', 'posted_at',
            'invoice_lines', 'total_amount', 'settled_amount', 'outstanding_amount',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'total_amount', 'settled_amount', 'outstanding_amount',
            'status', 'posted_by', 'posted_at', 'created_at', 'updated_at',
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('invoice_lines', [])
        invoice = APInvoice.objects.create(**validated_data)
        for line in lines_data:
            APInvoiceLine.objects.create(invoice=invoice, **line)
        return invoice

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('invoice_lines', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lines_data is not None:
            instance.invoice_lines.all().delete()
            for line in lines_data:
                APInvoiceLine.objects.create(invoice=instance, **line)
        return instance


class APAllocationSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    payment_ref = serializers.CharField(source='payment.voucher_number', read_only=True)

    class Meta:
        model = APAllocation
        fields = [
            'id', 'invoice', 'invoice_number', 'payment', 'payment_ref',
            'amount', 'allocation_date', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ── General Ledger ────────────────────────────────────────────────────────────

class GLLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True, default=None)
    fund_name = serializers.CharField(source='fund.name', read_only=True, default=None)

    class Meta:
        model = GLLine
        fields = [
            'id', 'account', 'account_code', 'account_name',
            'entity', 'entity_name', 'fund', 'fund_name',
            'description', 'debit', 'credit',
        ]


class GLEntrySerializer(serializers.ModelSerializer):
    lines = GLLineSerializer(many=True, read_only=True)
    period_name = serializers.CharField(source='accounting_period.name', read_only=True)
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()

    class Meta:
        model = GLEntry
        fields = [
            'id', 'accounting_period', 'period_name', 'posting_date',
            'voucher_type', 'voucher_ref', 'description', 'is_reversal',
            'lines', 'total_debit', 'total_credit', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_debit(self, obj):
        from decimal import Decimal
        return sum((l.debit for l in obj.lines.all()), Decimal('0'))

    def get_total_credit(self, obj):
        from decimal import Decimal
        return sum((l.credit for l in obj.lines.all()), Decimal('0'))
