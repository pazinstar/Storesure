from roles.storekeeper.stores.depreciation import run_depreciation
from roles.finance.models import GLEntry, AccountingPeriod, FinancialYear, ChartOfAccount
from roles.storekeeper.stores.models import FixedAsset
from datetime import date
from decimal import Decimal

# ensure accounts and period exist
ChartOfAccount.objects.get_or_create(code='DEPR_EXP', defaults={'name':'Depreciation Expense','account_class':'expense','posting_allowed':True})
ChartOfAccount.objects.get_or_create(code='DEPR_ACC', defaults={'name':'Accumulated Depreciation','account_class':'asset','posting_allowed':True,'is_contra_account':True})
fy, _ = FinancialYear.objects.get_or_create(name='2026', defaults={'start_date':date(2026,1,1),'end_date':date(2026,12,31),'is_current':True})
period, _ = AccountingPeriod.objects.get_or_create(financial_year=fy, period_no=5, defaults={'name':'May 2026','start_date':date(2026,5,1),'end_date':date(2026,5,31),'status':AccountingPeriod.STATUS_OPEN})
FixedAsset.objects.filter(assetCode='DBG1').delete()
FixedAsset.objects.create(assetCode='DBG1', name='dbg', qty=1, total_cost=Decimal('1200.00'), residual_value=Decimal('0.00'), useful_life=12, depreciation_method='straight_line', accumulated_depreciation=Decimal('0.00'), nbv=Decimal('1200.00'))
run_depreciation('monthly', 2026, 5, created_by='test')
print('GLEntry after first run:', list(GLEntry.objects.values('voucher_ref','voucher_type','posting_date')))
try:
    run_depreciation('monthly', 2026, 5, created_by='test')
    print('Second run succeeded')
except Exception as e:
    print('Second run raised', type(e), e)
