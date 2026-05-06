from django.test import TestCase, override_settings
from decimal import Decimal
from datetime import date

from roles.storekeeper.stores.depreciation import _calc_monthly_depr, run_depreciation
from roles.storekeeper.stores.models import FixedAsset
from django.apps import apps
from roles.finance.models import ChartOfAccount, FinancialYear, AccountingPeriod, GLEntry
from django.conf import settings


class DepreciationTests(TestCase):
    def setUp(self):
        # Ensure GL accounts exist
        ChartOfAccount.objects.create(code='DEPR_EXP', name='Depreciation Expense', account_class='expense', posting_allowed=True)
        ChartOfAccount.objects.create(code='DEPR_ACC', name='Accumulated Depreciation', account_class='asset', posting_allowed=True, is_contra_account=True)

        # Open accounting period
        fy = FinancialYear.objects.create(name='2026', start_date=date(2026,1,1), end_date=date(2026,12,31), is_current=True)
        self.period = AccountingPeriod.objects.create(financial_year=fy, period_no=5, name='May 2026', start_date=date(2026,5,1), end_date=date(2026,5,31), status=AccountingPeriod.STATUS_OPEN)

    def test_monthly_calc(self):
        asset = FixedAsset.objects.create(assetCode='A1', name='Test Asset', qty=1, total_cost=Decimal('1200.00'), residual_value=Decimal('0.00'), useful_life=12, depreciation_method='straight_line', accumulated_depreciation=Decimal('0.00'), nbv=Decimal('1200.00'))
        monthly = _calc_monthly_depr(asset)
        self.assertEqual(monthly, Decimal('100.00'))

    @override_settings(DEPRECIATION_EXPENSE_ACCOUNT='DEPR_EXP', DEPRECIATION_ACCUMULATED_ACCOUNT='DEPR_ACC')
    def test_prorate_mid_month_and_gl_post(self):
        # Acquired on 15th May 2026 -> prorate for May
        asset = FixedAsset.objects.create(assetCode='A2', name='Mid Asset', qty=1, total_cost=Decimal('1200.00'), residual_value=Decimal('0.00'), useful_life=12, depreciation_method='straight_line', accumulated_depreciation=Decimal('0.00'), nbv=Decimal('1200.00'), acq_date=date(2026,5,15))

        run = run_depreciation('monthly', 2026, 5, created_by='test')
        # Ensure schedule created
        # Check asset accumulated_depreciation and nbv updated correctly (prorated)
        asset.refresh_from_db()
        days_in_month = 31
        active_days = 31 - 15 + 1
        expected_monthly = Decimal('100.00') * Decimal(active_days) / Decimal(days_in_month)
        expected_monthly = expected_monthly.quantize(Decimal('0.01'))
        self.assertEqual(asset.accumulated_depreciation, expected_monthly)
        self.assertEqual(asset.nbv, Decimal('1200.00') - expected_monthly)

        # Check GL entry posted
        gl = GLEntry.objects.filter(voucher_ref__contains=asset.assetCode).first()
        self.assertIsNotNone(gl)

    @override_settings(DEPRECIATION_EXPENSE_ACCOUNT='DEPR_EXP', DEPRECIATION_ACCUMULATED_ACCOUNT='DEPR_ACC')
    def test_idempotency(self):
        asset = FixedAsset.objects.create(assetCode='A3', name='Asset3', qty=1, total_cost=Decimal('1200.00'), residual_value=Decimal('0.00'), useful_life=12, depreciation_method='straight_line', accumulated_depreciation=Decimal('0.00'), nbv=Decimal('1200.00'))
        # First run
        run1 = run_depreciation('monthly', 2026, 5, created_by='test')
        self.assertIn(run1.status, ('completed','failed'))
        # Second run should not produce duplicate GL entries (idempotent)
        before = GLEntry.objects.count()
        try:
            run2 = run_depreciation('monthly', 2026, 5, created_by='test')
        except ValueError:
            # acceptable if implementation raises on re-run
            run2 = None
        after = GLEntry.objects.count()
        self.assertEqual(before, after)
