import datetime
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Q
from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
    VOUCHER_DRAFT, VOUCHER_POSTED, VOUCHER_REVERSED,
    _next_id,
)
from .serializers import (
    FinancialYearSerializer, AccountingPeriodSerializer, FundSerializer,
    ChartOfAccountSerializer, BankAccountSerializer, CashPointSerializer,
    EntitySerializer, BudgetSerializer,
    ReceiptSerializer, PaymentSerializer,
    JournalVoucherSerializer, ContraVoucherSerializer,
    APInvoiceSerializer, APAllocationSerializer,
    GLEntrySerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_open_period(accounting_period_id):
    """Return the period or raise a validation error if not open."""
    try:
        period = AccountingPeriod.objects.get(pk=accounting_period_id)
    except AccountingPeriod.DoesNotExist:
        return None, 'Accounting period not found.'
    if period.status != AccountingPeriod.STATUS_OPEN:
        return None, f'Accounting period "{period.name}" is {period.status}. Only OPEN periods accept postings.'
    return period, None


def _post_gl(period, posting_date, voucher_type, voucher_ref, description, lines, is_reversal=False):
    """
    Create a GLEntry with GLLines.
    `lines` is a list of dicts: {account, description, debit, credit, entity=None, fund=None}
    """
    entry = GLEntry.objects.create(
        accounting_period=period,
        posting_date=posting_date,
        voucher_type=voucher_type,
        voucher_ref=voucher_ref,
        description=description,
        is_reversal=is_reversal,
    )
    for ln in lines:
        GLLine.objects.create(
            entry=entry,
            account=ln['account'],
            entity=ln.get('entity'),
            fund=ln.get('fund'),
            description=ln['description'],
            debit=ln.get('debit', Decimal('0')),
            credit=ln.get('credit', Decimal('0')),
        )
    return entry


def _assign_voucher_number(prefix, model, field):
    """Generate and assign the next human-readable voucher number."""
    year = datetime.date.today().year
    key = f'{prefix}{year}'
    last = model.objects.filter(**{f'{field}__startswith': key}).order_by(f'-{field}').first()
    num = int(getattr(last, field)[len(key):]) + 1 if last and getattr(last, field) else 1
    return f'{key}{num:04d}'


# ── Master & Control ──────────────────────────────────────────────────────────

class FinancialYearListCreateView(generics.ListCreateAPIView):
    queryset = FinancialYear.objects.all()
    serializer_class = FinancialYearSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']


class FinancialYearDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FinancialYear.objects.all()
    serializer_class = FinancialYearSerializer


class AccountingPeriodListCreateView(generics.ListCreateAPIView):
    queryset = AccountingPeriod.objects.select_related('financial_year').all()
    serializer_class = AccountingPeriodSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'financial_year__name']
    ordering_fields = ['financial_year', 'period_no']

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get('financial_year')
        status_param = self.request.query_params.get('status')
        if year:
            qs = qs.filter(financial_year__name=year)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AccountingPeriodDetailView(generics.RetrieveUpdateAPIView):
    queryset = AccountingPeriod.objects.select_related('financial_year').all()
    serializer_class = AccountingPeriodSerializer


class AccountingPeriodSetStatusView(APIView):
    """POST /periods/<pk>/set-status/ with body {"status": "open|closed|locked"}"""
    def post(self, request, pk):
        try:
            period = AccountingPeriod.objects.get(pk=pk)
        except AccountingPeriod.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in (AccountingPeriod.STATUS_OPEN, AccountingPeriod.STATUS_CLOSED, AccountingPeriod.STATUS_LOCKED):
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        period.status = new_status
        period.save()
        return Response(AccountingPeriodSerializer(period).data)


class FundListCreateView(generics.ListCreateAPIView):
    queryset = Fund.objects.all()
    serializer_class = FundSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']


class FundDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fund.objects.all()
    serializer_class = FundSerializer


# ── Chart of Accounts ─────────────────────────────────────────────────────────

class ChartOfAccountListCreateView(generics.ListCreateAPIView):
    queryset = ChartOfAccount.objects.all()
    serializer_class = ChartOfAccountSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'account_class', 'category']
    ordering_fields = ['code', 'name', 'account_class']

    def get_queryset(self):
        qs = super().get_queryset()
        account_class = self.request.query_params.get('account_class')
        posting_only = self.request.query_params.get('posting_only')
        control_only = self.request.query_params.get('control_only')
        active_only = self.request.query_params.get('active_only')
        if account_class:
            qs = qs.filter(account_class=account_class)
        if posting_only == 'true':
            qs = qs.filter(posting_allowed=True)
        if control_only == 'true':
            qs = qs.filter(is_control_account=True)
        if active_only == 'true':
            qs = qs.filter(is_active=True)
        return qs


class ChartOfAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChartOfAccount.objects.all()
    serializer_class = ChartOfAccountSerializer
    lookup_field = 'id'


class BankAccountListCreateView(generics.ListCreateAPIView):
    queryset = BankAccount.objects.select_related('coa_account').all()
    serializer_class = BankAccountSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name', 'bank_name', 'account_number']


class BankAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BankAccount.objects.select_related('coa_account').all()
    serializer_class = BankAccountSerializer


class CashPointListCreateView(generics.ListCreateAPIView):
    queryset = CashPoint.objects.select_related('coa_account').all()
    serializer_class = CashPointSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']


class CashPointDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CashPoint.objects.select_related('coa_account').all()
    serializer_class = CashPointSerializer


# ── Subledger Parties ─────────────────────────────────────────────────────────

class EntityListCreateView(generics.ListCreateAPIView):
    queryset = Entity.objects.select_related('linked_control_account').all()
    serializer_class = EntitySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'admission_number', 'email']
    ordering_fields = ['entity_type', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return qs


class EntityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Entity.objects.select_related('linked_control_account').all()
    serializer_class = EntitySerializer


# ── Budget ────────────────────────────────────────────────────────────────────

class BudgetListCreateView(generics.ListCreateAPIView):
    queryset = Budget.objects.select_related('financial_year', 'account', 'fund').all()
    serializer_class = BudgetSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['account__name', 'account__code', 'financial_year__name', 'budget_version']
    ordering_fields = ['financial_year__name', 'account__code']

    def get_queryset(self):
        qs = super().get_queryset()
        year = self.request.query_params.get('financial_year')
        if year:
            qs = qs.filter(financial_year__name=year)
        return qs


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Budget.objects.select_related('financial_year', 'account', 'fund').all()
    serializer_class = BudgetSerializer
    lookup_field = 'id'


# ── Receipt ───────────────────────────────────────────────────────────────────

class ReceiptListCreateView(generics.ListCreateAPIView):
    queryset = Receipt.objects.select_related(
        'bank_cash_account', 'entity', 'fund', 'accounting_period'
    ).prefetch_related('lines').all()
    serializer_class = ReceiptSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['receipt_number', 'received_from', 'reference_number', 'narration']
    ordering_fields = ['receipt_date', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        period = self.request.query_params.get('period')
        if status_param:
            qs = qs.filter(status=status_param)
        if period:
            qs = qs.filter(accounting_period=period)
        return qs


class ReceiptDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Receipt.objects.select_related(
        'bank_cash_account', 'entity', 'fund', 'accounting_period'
    ).prefetch_related('lines').all()
    serializer_class = ReceiptSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft receipts can be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft receipts can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class ReceiptPrintAndPostView(APIView):
    """POST /receipts/<id>/post/ — validate, assign number, write GL, lock."""
    @transaction.atomic
    def post(self, request, id):
        try:
            receipt = Receipt.objects.select_related(
                'bank_cash_account', 'entity', 'fund', 'accounting_period'
            ).prefetch_related('lines').get(pk=id)
        except Receipt.DoesNotExist:
            return Response({'error': 'Receipt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if receipt.status != VOUCHER_DRAFT:
            return Response(
                {'error': f'Receipt is already {receipt.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Period validation
        if not receipt.accounting_period_id:
            return Response(
                {'error': 'Accounting period is required before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, err = _get_open_period(receipt.accounting_period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        # Lines validation
        lines = list(receipt.lines.all())
        if not lines:
            return Response(
                {'error': 'Receipt must have at least one line before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = sum(l.amount for l in lines)
        if total <= 0:
            return Response(
                {'error': 'Receipt total must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Assign receipt number
        receipt_number = _assign_voucher_number('RCP', Receipt, 'receipt_number')

        # Build GL lines:
        # DR bank_cash_account (full total)
        # CR each receipt line account
        gl_lines = [
            {
                'account': receipt.bank_cash_account,
                'entity': receipt.entity,
                'fund': receipt.fund,
                'description': receipt.narration,
                'debit': total,
                'credit': Decimal('0'),
            }
        ]
        for ln in lines:
            gl_lines.append({
                'account': ln.account,
                'entity': receipt.entity,
                'fund': receipt.fund,
                'description': ln.description,
                'debit': Decimal('0'),
                'credit': ln.amount,
            })

        _post_gl(
            period=period,
            posting_date=receipt.receipt_date,
            voucher_type=GLEntry.VTYPE_RECEIPT,
            voucher_ref=receipt_number,
            description=f'Receipt: {receipt.received_from} – {receipt.narration[:100]}',
            lines=gl_lines,
        )

        receipt.receipt_number = receipt_number
        receipt.status = VOUCHER_POSTED
        receipt.posted_by = request.user.username if request.user.is_authenticated else 'system'
        receipt.posted_at = datetime.datetime.now()
        receipt.save()

        return Response(ReceiptSerializer(receipt).data, status=status.HTTP_200_OK)


class ReceiptReverseView(APIView):
    """POST /receipts/<id>/reverse/ — create mirror reversal GL entry."""
    @transaction.atomic
    def post(self, request, id):
        try:
            receipt = Receipt.objects.select_related(
                'bank_cash_account', 'entity', 'fund', 'accounting_period'
            ).prefetch_related('lines').get(pk=id)
        except Receipt.DoesNotExist:
            return Response({'error': 'Receipt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if receipt.status != VOUCHER_POSTED:
            return Response(
                {'error': 'Only posted receipts can be reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(receipt, 'reversed_by_voucher'):
            return Response(
                {'error': 'This receipt has already been reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get reversal period
        period_id = request.data.get('accounting_period', receipt.accounting_period_id)
        period, err = _get_open_period(period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        reversal_date = request.data.get('reversal_date', str(datetime.date.today()))

        # Create the reversal receipt (mirror)
        lines = list(receipt.lines.all())
        total = sum(l.amount for l in lines)
        reversal_number = _assign_voucher_number('RCP', Receipt, 'receipt_number')

        reversal = Receipt.objects.create(
            receipt_date=reversal_date,
            received_from=receipt.received_from,
            entity=receipt.entity,
            payer_type=receipt.payer_type,
            mode_of_receipt=receipt.mode_of_receipt,
            bank_cash_account=receipt.bank_cash_account,
            reference_number=receipt.receipt_number,
            fund=receipt.fund,
            narration=f'REVERSAL of {receipt.receipt_number}: {receipt.narration}',
            allocation_method=receipt.allocation_method,
            accounting_period=period,
            receipt_number=reversal_number,
            status=VOUCHER_POSTED,
            posted_by=request.user.username if request.user.is_authenticated else 'system',
            posted_at=datetime.datetime.now(),
            reversal_of=receipt,
        )
        for ln in lines:
            ReceiptLine.objects.create(
                receipt=reversal, account=ln.account,
                description=ln.description, amount=ln.amount,
            )

        # Reversal GL: swap DR/CR
        gl_lines = [
            {
                'account': receipt.bank_cash_account,
                'entity': receipt.entity,
                'fund': receipt.fund,
                'description': f'Reversal: {receipt.narration}',
                'debit': Decimal('0'),
                'credit': total,
            }
        ]
        for ln in lines:
            gl_lines.append({
                'account': ln.account,
                'entity': receipt.entity,
                'fund': receipt.fund,
                'description': ln.description,
                'debit': ln.amount,
                'credit': Decimal('0'),
            })

        _post_gl(
            period=period,
            posting_date=reversal_date,
            voucher_type=GLEntry.VTYPE_RECEIPT,
            voucher_ref=reversal_number,
            description=f'Reversal of {receipt.receipt_number}',
            lines=gl_lines,
            is_reversal=True,
        )

        receipt.status = VOUCHER_REVERSED
        receipt.reversed_by = request.user.username if request.user.is_authenticated else 'system'
        receipt.reversed_at = datetime.datetime.now()
        receipt.save()

        return Response(ReceiptSerializer(reversal).data, status=status.HTTP_201_CREATED)


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.select_related(
        'bank_cash_account', 'entity', 'fund', 'accounting_period'
    ).prefetch_related('lines').all()
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['voucher_number', 'payee', 'cheque_eft_reference', 'narration']
    ordering_fields = ['voucher_date', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        period = self.request.query_params.get('period')
        if status_param:
            qs = qs.filter(status=status_param)
        if period:
            qs = qs.filter(accounting_period=period)
        return qs


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Payment.objects.select_related(
        'bank_cash_account', 'entity', 'fund', 'accounting_period'
    ).prefetch_related('lines').all()
    serializer_class = PaymentSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft payments can be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft payments can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class PaymentPrintAndPostView(APIView):
    """POST /payments/<id>/post/"""
    @transaction.atomic
    def post(self, request, id):
        try:
            payment = Payment.objects.select_related(
                'bank_cash_account', 'entity', 'fund', 'accounting_period'
            ).prefetch_related('lines').get(pk=id)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status != VOUCHER_DRAFT:
            return Response(
                {'error': f'Payment is already {payment.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not payment.accounting_period_id:
            return Response(
                {'error': 'Accounting period is required before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, err = _get_open_period(payment.accounting_period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        lines = list(payment.lines.all())
        if not lines:
            return Response(
                {'error': 'Payment must have at least one line before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = sum(l.amount for l in lines)
        if total <= 0:
            return Response(
                {'error': 'Payment total must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voucher_number = _assign_voucher_number('PMT', Payment, 'voucher_number')

        # GL: DR each line account, CR bank_cash_account
        gl_lines = []
        for ln in lines:
            gl_lines.append({
                'account': ln.account,
                'entity': payment.entity,
                'fund': payment.fund,
                'description': ln.description,
                'debit': ln.amount,
                'credit': Decimal('0'),
            })
        gl_lines.append({
            'account': payment.bank_cash_account,
            'entity': payment.entity,
            'fund': payment.fund,
            'description': payment.narration,
            'debit': Decimal('0'),
            'credit': total,
        })

        _post_gl(
            period=period,
            posting_date=payment.voucher_date,
            voucher_type=GLEntry.VTYPE_PAYMENT,
            voucher_ref=voucher_number,
            description=f'Payment: {payment.payee} – {payment.narration[:100]}',
            lines=gl_lines,
        )

        payment.voucher_number = voucher_number
        payment.status = VOUCHER_POSTED
        payment.posted_by = request.user.username if request.user.is_authenticated else 'system'
        payment.posted_at = datetime.datetime.now()
        payment.save()

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)


class PaymentReverseView(APIView):
    """POST /payments/<id>/reverse/"""
    @transaction.atomic
    def post(self, request, id):
        try:
            payment = Payment.objects.select_related(
                'bank_cash_account', 'entity', 'fund', 'accounting_period'
            ).prefetch_related('lines').get(pk=id)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.status != VOUCHER_POSTED:
            return Response(
                {'error': 'Only posted payments can be reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(payment, 'reversed_by_voucher'):
            return Response(
                {'error': 'This payment has already been reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        period_id = request.data.get('accounting_period', payment.accounting_period_id)
        period, err = _get_open_period(period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        reversal_date = request.data.get('reversal_date', str(datetime.date.today()))
        lines = list(payment.lines.all())
        total = sum(l.amount for l in lines)
        reversal_number = _assign_voucher_number('PMT', Payment, 'voucher_number')

        reversal = Payment.objects.create(
            voucher_date=reversal_date,
            payee=payment.payee,
            entity=payment.entity,
            payee_type=payment.payee_type,
            payment_mode=payment.payment_mode,
            bank_cash_account=payment.bank_cash_account,
            cheque_eft_reference=payment.voucher_number,
            fund=payment.fund,
            narration=f'REVERSAL of {payment.voucher_number}: {payment.narration}',
            accounting_period=period,
            voucher_number=reversal_number,
            status=VOUCHER_POSTED,
            posted_by=request.user.username if request.user.is_authenticated else 'system',
            posted_at=datetime.datetime.now(),
            reversal_of=payment,
        )
        for ln in lines:
            PaymentLine.objects.create(
                payment=reversal, account=ln.account,
                description=ln.description, amount=ln.amount,
            )

        # Reversal GL: swap DR/CR
        gl_lines = []
        for ln in lines:
            gl_lines.append({
                'account': ln.account,
                'entity': payment.entity,
                'fund': payment.fund,
                'description': ln.description,
                'debit': Decimal('0'),
                'credit': ln.amount,
            })
        gl_lines.append({
            'account': payment.bank_cash_account,
            'entity': payment.entity,
            'fund': payment.fund,
            'description': f'Reversal: {payment.narration}',
            'debit': total,
            'credit': Decimal('0'),
        })

        _post_gl(
            period=period,
            posting_date=reversal_date,
            voucher_type=GLEntry.VTYPE_PAYMENT,
            voucher_ref=reversal_number,
            description=f'Reversal of {payment.voucher_number}',
            lines=gl_lines,
            is_reversal=True,
        )

        payment.status = VOUCHER_REVERSED
        payment.reversed_by = request.user.username if request.user.is_authenticated else 'system'
        payment.reversed_at = datetime.datetime.now()
        payment.save()

        return Response(PaymentSerializer(reversal).data, status=status.HTTP_201_CREATED)


# ── Journal Voucher ───────────────────────────────────────────────────────────

class JournalVoucherListCreateView(generics.ListCreateAPIView):
    queryset = JournalVoucher.objects.select_related('accounting_period').prefetch_related('lines').all()
    serializer_class = JournalVoucherSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['journal_number', 'reason', 'reference']
    ordering_fields = ['journal_date', 'journal_type', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        journal_type = self.request.query_params.get('journal_type')
        if status_param:
            qs = qs.filter(status=status_param)
        if journal_type:
            qs = qs.filter(journal_type=journal_type)
        return qs


class JournalVoucherDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = JournalVoucher.objects.select_related('accounting_period').prefetch_related('lines').all()
    serializer_class = JournalVoucherSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft journals can be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft journals can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class JournalVoucherPrintAndPostView(APIView):
    """POST /journals/<id>/post/ — debit must equal credit."""
    @transaction.atomic
    def post(self, request, id):
        try:
            journal = JournalVoucher.objects.select_related('accounting_period').prefetch_related('lines').get(pk=id)
        except JournalVoucher.DoesNotExist:
            return Response({'error': 'Journal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if journal.status != VOUCHER_DRAFT:
            return Response(
                {'error': f'Journal is already {journal.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not journal.accounting_period_id:
            return Response(
                {'error': 'Accounting period is required before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, err = _get_open_period(journal.accounting_period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        lines = list(journal.lines.all())
        if not lines:
            return Response(
                {'error': 'Journal must have at least one line before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total_debit = sum(l.debit for l in lines)
        total_credit = sum(l.credit for l in lines)
        if total_debit != total_credit:
            return Response(
                {
                    'error': 'Journal does not balance.',
                    'total_debit': total_debit,
                    'total_credit': total_credit,
                    'difference': total_debit - total_credit,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        journal_number = _assign_voucher_number('JV', JournalVoucher, 'journal_number')

        gl_lines = [
            {
                'account': ln.account,
                'description': ln.description,
                'debit': ln.debit,
                'credit': ln.credit,
            }
            for ln in lines
        ]

        _post_gl(
            period=period,
            posting_date=journal.journal_date,
            voucher_type=GLEntry.VTYPE_JOURNAL,
            voucher_ref=journal_number,
            description=f'Journal ({journal.get_journal_type_display()}): {journal.reason[:100]}',
            lines=gl_lines,
        )

        journal.journal_number = journal_number
        journal.status = VOUCHER_POSTED
        journal.posted_by = request.user.username if request.user.is_authenticated else 'system'
        journal.posted_at = datetime.datetime.now()
        journal.save()

        return Response(JournalVoucherSerializer(journal).data, status=status.HTTP_200_OK)


class JournalVoucherReverseView(APIView):
    """POST /journals/<id>/reverse/"""
    @transaction.atomic
    def post(self, request, id):
        try:
            journal = JournalVoucher.objects.select_related('accounting_period').prefetch_related('lines').get(pk=id)
        except JournalVoucher.DoesNotExist:
            return Response({'error': 'Journal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if journal.status != VOUCHER_POSTED:
            return Response(
                {'error': 'Only posted journals can be reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(journal, 'reversed_by_voucher'):
            return Response(
                {'error': 'This journal has already been reversed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        period_id = request.data.get('accounting_period', journal.accounting_period_id)
        period, err = _get_open_period(period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        reversal_date = request.data.get('reversal_date', str(datetime.date.today()))
        lines = list(journal.lines.all())
        reversal_number = _assign_voucher_number('JV', JournalVoucher, 'journal_number')

        reversal = JournalVoucher.objects.create(
            journal_date=reversal_date,
            journal_type=journal.journal_type,
            reason=f'REVERSAL of {journal.journal_number}: {journal.reason}',
            reference=journal.journal_number,
            accounting_period=period,
            journal_number=reversal_number,
            status=VOUCHER_POSTED,
            posted_by=request.user.username if request.user.is_authenticated else 'system',
            posted_at=datetime.datetime.now(),
            reversal_of=journal,
        )
        for ln in lines:
            JournalVoucherLine.objects.create(
                journal=reversal, account=ln.account, description=ln.description,
                debit=ln.credit, credit=ln.debit,  # swap
            )

        # Reversal GL: swap DR/CR
        gl_lines = [
            {
                'account': ln.account,
                'description': ln.description,
                'debit': ln.credit,
                'credit': ln.debit,
            }
            for ln in lines
        ]

        _post_gl(
            period=period,
            posting_date=reversal_date,
            voucher_type=GLEntry.VTYPE_JOURNAL,
            voucher_ref=reversal_number,
            description=f'Reversal of {journal.journal_number}',
            lines=gl_lines,
            is_reversal=True,
        )

        journal.status = VOUCHER_REVERSED
        journal.reversed_by = request.user.username if request.user.is_authenticated else 'system'
        journal.reversed_at = datetime.datetime.now()
        journal.save()

        return Response(JournalVoucherSerializer(reversal).data, status=status.HTTP_201_CREATED)


# ── Contra Voucher ────────────────────────────────────────────────────────────

class ContraVoucherListCreateView(generics.ListCreateAPIView):
    queryset = ContraVoucher.objects.select_related(
        'from_account', 'to_account', 'accounting_period'
    ).all()
    serializer_class = ContraVoucherSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['contra_number', 'narration', 'reference']
    ordering_fields = ['contra_date', 'status']


class ContraVoucherDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ContraVoucher.objects.select_related(
        'from_account', 'to_account', 'accounting_period'
    ).all()
    serializer_class = ContraVoucherSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != VOUCHER_DRAFT:
            return Response(
                {'error': 'Only draft contra vouchers can be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)


class ContraVoucherPrintAndPostView(APIView):
    """POST /contra/<id>/post/"""
    @transaction.atomic
    def post(self, request, id):
        try:
            contra = ContraVoucher.objects.select_related(
                'from_account', 'to_account', 'accounting_period'
            ).get(pk=id)
        except ContraVoucher.DoesNotExist:
            return Response({'error': 'Contra voucher not found.'}, status=status.HTTP_404_NOT_FOUND)

        if contra.status != VOUCHER_DRAFT:
            return Response(
                {'error': f'Contra voucher is already {contra.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not contra.accounting_period_id:
            return Response(
                {'error': 'Accounting period is required before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, err = _get_open_period(contra.accounting_period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        if contra.amount <= 0:
            return Response(
                {'error': 'Amount must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contra_number = _assign_voucher_number('CNT', ContraVoucher, 'contra_number')

        # GL: DR to_account, CR from_account (no P&L impact)
        gl_lines = [
            {
                'account': contra.to_account,
                'description': contra.narration,
                'debit': contra.amount,
                'credit': Decimal('0'),
            },
            {
                'account': contra.from_account,
                'description': contra.narration,
                'debit': Decimal('0'),
                'credit': contra.amount,
            },
        ]

        _post_gl(
            period=period,
            posting_date=contra.contra_date,
            voucher_type=GLEntry.VTYPE_CONTRA,
            voucher_ref=contra_number,
            description=f'Contra: {contra.narration[:100]}',
            lines=gl_lines,
        )

        contra.contra_number = contra_number
        contra.status = VOUCHER_POSTED
        contra.posted_by = request.user.username if request.user.is_authenticated else 'system'
        contra.posted_at = datetime.datetime.now()
        contra.save()

        return Response(ContraVoucherSerializer(contra).data, status=status.HTTP_200_OK)


# ── AP Invoice ────────────────────────────────────────────────────────────────

class APInvoiceListCreateView(generics.ListCreateAPIView):
    queryset = APInvoice.objects.select_related(
        'supplier', 'accounting_period'
    ).prefetch_related('invoice_lines').all()
    serializer_class = APInvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'supplier__name', 'related_grn', 'related_lpo']
    ordering_fields = ['invoice_date', 'due_date', 'status']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        supplier = self.request.query_params.get('supplier')
        if status_param:
            qs = qs.filter(status=status_param)
        if supplier:
            qs = qs.filter(supplier=supplier)
        return qs


class APInvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = APInvoice.objects.select_related(
        'supplier', 'accounting_period'
    ).prefetch_related('invoice_lines').all()
    serializer_class = APInvoiceSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != APInvoice.STATUS_DRAFT:
            return Response(
                {'error': 'Only draft invoices can be edited.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)


class APInvoicePrintAndPostView(APIView):
    """POST /ap-invoices/<id>/post/"""
    @transaction.atomic
    def post(self, request, id):
        try:
            invoice = APInvoice.objects.select_related(
                'supplier__linked_control_account', 'accounting_period'
            ).prefetch_related('invoice_lines').get(pk=id)
        except APInvoice.DoesNotExist:
            return Response({'error': 'AP Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)

        if invoice.status != APInvoice.STATUS_DRAFT:
            return Response(
                {'error': f'Invoice is already {invoice.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not invoice.accounting_period_id:
            return Response(
                {'error': 'Accounting period is required before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        period, err = _get_open_period(invoice.accounting_period_id)
        if err:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        lines = list(invoice.invoice_lines.all())
        if not lines:
            return Response(
                {'error': 'Invoice must have at least one line before posting.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = sum(l.amount for l in lines)
        ap_control = invoice.supplier.linked_control_account

        # GL: DR each line account (expense/inventory/PPE), CR AP control
        gl_lines = []
        for ln in lines:
            gl_lines.append({
                'account': ln.account,
                'entity': invoice.supplier,
                'description': ln.description,
                'debit': ln.amount,
                'credit': Decimal('0'),
            })
        gl_lines.append({
            'account': ap_control,
            'entity': invoice.supplier,
            'description': f'AP: {invoice.supplier.name} – {invoice.invoice_number}',
            'debit': Decimal('0'),
            'credit': total,
        })

        _post_gl(
            period=period,
            posting_date=invoice.invoice_date,
            voucher_type=GLEntry.VTYPE_AP_INVOICE,
            voucher_ref=invoice.id,
            description=f'AP Invoice: {invoice.supplier.name} – {invoice.invoice_number}',
            lines=gl_lines,
        )

        invoice.status = APInvoice.STATUS_POSTED
        invoice.posted_by = request.user.username if request.user.is_authenticated else 'system'
        invoice.posted_at = datetime.datetime.now()
        invoice.save()

        return Response(APInvoiceSerializer(invoice).data, status=status.HTTP_200_OK)


class APAllocationListCreateView(generics.ListCreateAPIView):
    queryset = APAllocation.objects.select_related('invoice', 'payment').all()
    serializer_class = APAllocationSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['allocation_date']

    def get_queryset(self):
        qs = super().get_queryset()
        invoice = self.request.query_params.get('invoice')
        payment = self.request.query_params.get('payment')
        if invoice:
            qs = qs.filter(invoice=invoice)
        if payment:
            qs = qs.filter(payment=payment)
        return qs


# ── General Ledger Inquiry ────────────────────────────────────────────────────

class GLEntryListView(generics.ListAPIView):
    queryset = GLEntry.objects.select_related('accounting_period').prefetch_related('lines__account', 'lines__entity').all()
    serializer_class = GLEntrySerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['posting_date', 'voucher_type']

    def get_queryset(self):
        qs = super().get_queryset()
        period = self.request.query_params.get('period')
        voucher_type = self.request.query_params.get('voucher_type')
        account = self.request.query_params.get('account')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if period:
            qs = qs.filter(accounting_period=period)
        if voucher_type:
            qs = qs.filter(voucher_type=voucher_type)
        if account:
            qs = qs.filter(lines__account=account).distinct()
        if date_from:
            qs = qs.filter(posting_date__gte=date_from)
        if date_to:
            qs = qs.filter(posting_date__lte=date_to)
        return qs


class GeneralLedgerView(APIView):
    """Account-level GL inquiry with running balance."""
    def get(self, request):
        account_id = request.query_params.get('account')
        period = request.query_params.get('period')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        fund = request.query_params.get('fund')

        qs = GLLine.objects.select_related('entry', 'entry__accounting_period', 'account', 'entity', 'fund')

        if account_id:
            qs = qs.filter(account=account_id)
        if period:
            qs = qs.filter(entry__accounting_period=period)
        if date_from:
            qs = qs.filter(entry__posting_date__gte=date_from)
        if date_to:
            qs = qs.filter(entry__posting_date__lte=date_to)
        if fund:
            qs = qs.filter(fund=fund)

        qs = qs.order_by('entry__posting_date', 'entry__created_at')

        running_balance = Decimal('0')
        rows = []
        for ln in qs:
            running_balance += ln.debit - ln.credit
            rows.append({
                'date': ln.entry.posting_date,
                'voucher_type': ln.entry.voucher_type,
                'voucher_ref': ln.entry.voucher_ref,
                'account_code': ln.account.code,
                'account_name': ln.account.name,
                'description': ln.description,
                'debit': ln.debit,
                'credit': ln.credit,
                'running_balance': running_balance,
                'is_reversal': ln.entry.is_reversal,
            })

        return Response({'entries': rows, 'closing_balance': running_balance})


class TrialBalanceView(APIView):
    """Debit/credit totals per account from the GL."""
    def get(self, request):
        period = request.query_params.get('period')
        financial_year = request.query_params.get('financial_year')

        qs = GLLine.objects.select_related('account')
        if period:
            qs = qs.filter(entry__accounting_period=period)
        if financial_year:
            qs = qs.filter(entry__accounting_period__financial_year__name=financial_year)

        from django.db.models import Sum as DSum
        rows_qs = (
            qs.values('account__code', 'account__name', 'account__account_class')
            .annotate(total_debit=DSum('debit'), total_credit=DSum('credit'))
            .order_by('account__code')
        )

        total_debit = Decimal('0')
        total_credit = Decimal('0')
        rows = []
        for r in rows_qs:
            dr = r['total_debit'] or Decimal('0')
            cr = r['total_credit'] or Decimal('0')
            rows.append({
                'account_code': r['account__code'],
                'account_name': r['account__name'],
                'account_class': r['account__account_class'],
                'debit': dr,
                'credit': cr,
                'net': dr - cr,
            })
            total_debit += dr
            total_credit += cr

        return Response({
            'rows': rows,
            'total_debit': total_debit,
            'total_credit': total_credit,
            'balanced': total_debit == total_credit,
        })


class CashFlowView(APIView):
    """Cash inflow vs outflow from GL bank/cash accounts."""
    def get(self, request):
        period = request.query_params.get('period')
        financial_year = request.query_params.get('financial_year')

        bank_cash_accounts = ChartOfAccount.objects.filter(
            is_control_account=True,
            account_class__in=[ChartOfAccount.CLASS_ASSET],
            is_active=True,
        )

        qs = GLLine.objects.filter(account__in=bank_cash_accounts)
        if period:
            qs = qs.filter(entry__accounting_period=period)
        if financial_year:
            qs = qs.filter(entry__accounting_period__financial_year__name=financial_year)

        totals = qs.aggregate(total_debit=Sum('debit'), total_credit=Sum('credit'))
        inflow = totals['total_debit'] or Decimal('0')
        outflow = totals['total_credit'] or Decimal('0')

        return Response({
            'total_inflow': inflow,
            'total_outflow': outflow,
            'net_cash_flow': inflow - outflow,
        })
