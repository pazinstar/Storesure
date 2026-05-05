from django.urls import path
from .views import (
    # Master & Control
    FinancialYearListCreateView, FinancialYearDetailView,
    AccountingPeriodListCreateView, AccountingPeriodDetailView, AccountingPeriodSetStatusView,
    FundListCreateView, FundDetailView,
    # Chart of Accounts & Banking
    ChartOfAccountListCreateView, ChartOfAccountDetailView,
    BankAccountListCreateView, BankAccountDetailView,
    CashPointListCreateView, CashPointDetailView,
    # Subledger
    EntityListCreateView, EntityDetailView,
    # Budget
    BudgetListCreateView, BudgetDetailView,
    # Receipts
    ReceiptListCreateView, ReceiptDetailView,
    ReceiptPrintAndPostView, ReceiptReverseView,
    # Payments
    PaymentListCreateView, PaymentDetailView,
    PaymentPrintAndPostView, PaymentReverseView,
    # Journals
    JournalVoucherListCreateView, JournalVoucherDetailView,
    JournalVoucherPrintAndPostView, JournalVoucherReverseView,
    # Contra
    ContraVoucherListCreateView, ContraVoucherDetailView, ContraVoucherPrintAndPostView,
    # AP
    APInvoiceListCreateView, APInvoiceDetailView, APInvoicePrintAndPostView,
    APAllocationListCreateView,
    # GL & Reports
    GLEntryListView, GeneralLedgerView, TrialBalanceView, CashFlowView,
)

urlpatterns = [
    # ── Financial Years ───────────────────────────────────────────────────────
    path('financial-years/', FinancialYearListCreateView.as_view(), name='finance-financial-years'),
    path('financial-years/<int:pk>/', FinancialYearDetailView.as_view(), name='finance-financial-year-detail'),

    # ── Accounting Periods ────────────────────────────────────────────────────
    path('periods/', AccountingPeriodListCreateView.as_view(), name='finance-periods'),
    path('periods/<int:pk>/', AccountingPeriodDetailView.as_view(), name='finance-period-detail'),
    path('periods/<int:pk>/set-status/', AccountingPeriodSetStatusView.as_view(), name='finance-period-set-status'),

    # ── Funds ─────────────────────────────────────────────────────────────────
    path('funds/', FundListCreateView.as_view(), name='finance-funds'),
    path('funds/<int:pk>/', FundDetailView.as_view(), name='finance-fund-detail'),

    # ── Chart of Accounts ─────────────────────────────────────────────────────
    path('accounts/', ChartOfAccountListCreateView.as_view(), name='finance-accounts'),
    path('accounts/<str:id>/', ChartOfAccountDetailView.as_view(), name='finance-account-detail'),

    # ── Bank Accounts & Cash Points ───────────────────────────────────────────
    path('bank-accounts/', BankAccountListCreateView.as_view(), name='finance-bank-accounts'),
    path('bank-accounts/<int:pk>/', BankAccountDetailView.as_view(), name='finance-bank-account-detail'),
    path('cash-points/', CashPointListCreateView.as_view(), name='finance-cash-points'),
    path('cash-points/<int:pk>/', CashPointDetailView.as_view(), name='finance-cash-point-detail'),

    # ── Entities (subledger parties) ──────────────────────────────────────────
    path('entities/', EntityListCreateView.as_view(), name='finance-entities'),
    path('entities/<int:pk>/', EntityDetailView.as_view(), name='finance-entity-detail'),

    # ── Budget ────────────────────────────────────────────────────────────────
    path('budgets/', BudgetListCreateView.as_view(), name='finance-budgets'),
    path('budgets/<str:id>/', BudgetDetailView.as_view(), name='finance-budget-detail'),

    # ── Receipts ──────────────────────────────────────────────────────────────
    path('receipts/', ReceiptListCreateView.as_view(), name='finance-receipts'),
    path('receipts/<str:id>/', ReceiptDetailView.as_view(), name='finance-receipt-detail'),
    path('receipts/<str:id>/post/', ReceiptPrintAndPostView.as_view(), name='finance-receipt-post'),
    path('receipts/<str:id>/reverse/', ReceiptReverseView.as_view(), name='finance-receipt-reverse'),

    # ── Payments ──────────────────────────────────────────────────────────────
    path('payments/', PaymentListCreateView.as_view(), name='finance-payments'),
    path('payments/<str:id>/', PaymentDetailView.as_view(), name='finance-payment-detail'),
    path('payments/<str:id>/post/', PaymentPrintAndPostView.as_view(), name='finance-payment-post'),
    path('payments/<str:id>/reverse/', PaymentReverseView.as_view(), name='finance-payment-reverse'),

    # ── Journal Vouchers ──────────────────────────────────────────────────────
    path('journals/', JournalVoucherListCreateView.as_view(), name='finance-journals'),
    path('journals/<str:id>/', JournalVoucherDetailView.as_view(), name='finance-journal-detail'),
    path('journals/<str:id>/post/', JournalVoucherPrintAndPostView.as_view(), name='finance-journal-post'),
    path('journals/<str:id>/reverse/', JournalVoucherReverseView.as_view(), name='finance-journal-reverse'),

    # ── Contra Vouchers ───────────────────────────────────────────────────────
    path('contra/', ContraVoucherListCreateView.as_view(), name='finance-contra'),
    path('contra/<str:id>/', ContraVoucherDetailView.as_view(), name='finance-contra-detail'),
    path('contra/<str:id>/post/', ContraVoucherPrintAndPostView.as_view(), name='finance-contra-post'),

    # ── AP Invoices ───────────────────────────────────────────────────────────
    path('ap-invoices/', APInvoiceListCreateView.as_view(), name='finance-ap-invoices'),
    path('ap-invoices/<str:id>/', APInvoiceDetailView.as_view(), name='finance-ap-invoice-detail'),
    path('ap-invoices/<str:id>/post/', APInvoicePrintAndPostView.as_view(), name='finance-ap-invoice-post'),
    path('ap-allocations/', APAllocationListCreateView.as_view(), name='finance-ap-allocations'),

    # ── GL & Reports ──────────────────────────────────────────────────────────
    path('gl/entries/', GLEntryListView.as_view(), name='finance-gl-entries'),
    path('reports/general-ledger/', GeneralLedgerView.as_view(), name='finance-general-ledger'),
    path('reports/trial-balance/', TrialBalanceView.as_view(), name='finance-trial-balance'),
    path('reports/cash-flow/', CashFlowView.as_view(), name='finance-cash-flow'),
]
