import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime
from django.conf import settings
from django.db import transaction

from roles.storekeeper.stores.models import FixedAsset
from django.apps import apps

from roles.finance.views import _post_gl
from roles.finance.models import AccountingPeriod


def _quantize(v):
    return Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _get_open_accounting_period():
    return AccountingPeriod.objects.filter(status=AccountingPeriod.STATUS_OPEN).first()


def _calc_monthly_depr(asset: FixedAsset) -> Decimal:
    """Straight-line monthly depreciation: (cost - residual) / useful_life_months"""
    useful = int(asset.useful_life or 0)
    if useful <= 0:
        return Decimal('0.00')
    base = (asset.total_cost or Decimal('0')) - (asset.residual_value or Decimal('0'))
    if base <= 0:
        return Decimal('0.00')
    monthly = Decimal(base) / Decimal(useful)
    return _quantize(monthly)


@transaction.atomic
def run_depreciation(run_type: str, year: int, month: int = None, created_by: str = ''):
    """Run depreciation for a period.

    - run_type: 'monthly'|'annual'|'manual'
    - year, month: target period (month required for monthly runs)
    """
    try:
        DepreciationRun = apps.get_model('stores', 'DepreciationRun')
        DepreciationSchedule = apps.get_model('stores', 'DepreciationSchedule')
    except LookupError:
        DepreciationRun = None
        DepreciationSchedule = None

    # Generate compact deterministic run code early so fallback GL checks can detect prior postings
    # Format: DEPR{R|M|A}{YYYY}{MM} e.g. DEPRM202405
    rt = (run_type[0].upper() if run_type else 'M')
    run_code = f'DEPR{rt}{year}{(month or 0):02d}'

    # Idempotency: if model exists, ensure no completed run of same period exists
    if DepreciationRun is not None:
        existing = DepreciationRun.objects.filter(run_type=run_type, period_year=year, period_month=month, status='completed').first()
        if existing:
            raise ValueError('Depreciation for this period already completed. Reverse before re-running.')
    else:
        # Fallback idempotency: if any GL depreciation entries already exist for this run_code, prevent re-run
        try:
            from roles.finance.models import GLEntry
        except ImportError:
            GLEntry = None

        if GLEntry is not None:
            # Look for any previously posted depreciation entries in the same period
            exists = GLEntry.objects.filter(voucher_type__iexact='depreciation', posting_date__year=year, posting_date__month=month or 1).exists()
            if exists:
                raise ValueError('Depreciation for this period already completed (GL postings exist). Reverse before re-running.')

    if DepreciationRun is not None:
        run = DepreciationRun.objects.create(
            run_code=run_code,
            period_year=year,
            period_month=month,
            run_type=run_type,
            status='running',
            started_at=datetime.utcnow(),
            created_by=created_by,
        )
    else:
        # fallback run object
        from types import SimpleNamespace
        run = SimpleNamespace(run_code=run_code, period_year=year, period_month=month, run_type=run_type, status='running', started_at=datetime.utcnow(), created_by=created_by, total_depreciation=Decimal('0.00'), error_log='')

    total_depr = Decimal('0.00')
    errors = []

    assets = FixedAsset.objects.exclude(status='disposed').filter(depreciation_method='straight_line')

    for asset in assets:
        try:
            # Mid-year handling: if asset.acq_date after period, skip
            if run_type == 'monthly' and asset.acq_date:
                if asset.acq_date.year > year or (asset.acq_date.year == year and asset.acq_date.month > month):
                    continue

            monthly = _calc_monthly_depr(asset)
            if monthly == 0:
                continue

            # Prorate for mid-month acquisition
            prorate_ratio = Decimal('1.0')
            is_mid = False
            mid_start_month = None
            if run_type == 'monthly' and asset.acq_date and asset.acq_date.year == year and asset.acq_date.month == month:
                days_in_month = calendar.monthrange(year, month)[1]
                active_days = days_in_month - asset.acq_date.day + 1
                prorate_ratio = Decimal(active_days) / Decimal(days_in_month)
                prorate_ratio = Decimal(prorate_ratio).quantize(Decimal('0.0001'))
                is_mid = True
                mid_start_month = asset.acq_date.month

            monthly_amount = _quantize(monthly * prorate_ratio)

            # Idempotency per-schedule
            if DepreciationSchedule is not None:
                sch, created = DepreciationSchedule.objects.get_or_create(
                asset=asset,
                year=year,
                month=month or 0,
                defaults={
                    'annual_depreciation': _quantize(monthly * 12),
                    'monthly_depreciation': monthly_amount,
                    'accumulated_depr_before': asset.accumulated_depreciation or Decimal('0.00'),
                    'accumulated_depr_after': _quantize((asset.accumulated_depreciation or Decimal('0.00')) + monthly_amount),
                    'nbv_before': asset.nbv or Decimal('0.00'),
                    'nbv_after': _quantize((asset.nbv or Decimal('0.00')) - monthly_amount),
                    'is_mid_year_acquisition': is_mid,
                    'mid_year_start_month': mid_start_month,
                    'partial_qty_ratio': Decimal('1.0'),
                    'depreciation_run': run if DepreciationRun is not None else None,
                }
            )
            else:
                sch = None
                created = True

            if not created:
                # If schedule already exists and is posted, do not re-run
                if sch.posted_status == 'posted':
                    errors.append(f'Asset {asset.assetCode} already posted for {year}/{month}')
                    continue
                # Update schedule values for this run
                sch.monthly_depreciation = monthly_amount
                sch.annual_depreciation = _quantize(monthly * 12)
                sch.accumulated_depr_before = asset.accumulated_depreciation or Decimal('0.00')
                sch.accumulated_depr_after = _quantize((asset.accumulated_depreciation or Decimal('0.00')) + monthly_amount)
                sch.nbv_before = asset.nbv or Decimal('0.00')
                sch.nbv_after = _quantize((asset.nbv or Decimal('0.00')) - monthly_amount)
                sch.depreciation_run = run
                sch.save()

            # Auto-post to GL if accounting period is open and accounts configured
            period = _get_open_accounting_period()
            if period:
                try:
                    expense_acc_code = getattr(settings, 'DEPRECIATION_EXPENSE_ACCOUNT', None)
                    accum_acc_code = getattr(settings, 'DEPRECIATION_ACCUMULATED_ACCOUNT', None)
                    if expense_acc_code and accum_acc_code:
                        from roles.finance.models import ChartOfAccount
                        expense_acc = ChartOfAccount.objects.get(code=expense_acc_code)
                        accum_acc = ChartOfAccount.objects.get(code=accum_acc_code)

                        # include run code to make GL postings idempotent and traceable
                        voucher_ref = f'{run.run_code}:{asset.assetCode}:{year}-{month or 0}'
                        lines = [
                            {'account': expense_acc, 'description': f'Depreciation {asset.assetCode}', 'debit': monthly_amount, 'credit': Decimal('0.00')},
                            {'account': accum_acc, 'description': f'Accumulated Depreciation {asset.assetCode}', 'debit': Decimal('0.00'), 'credit': monthly_amount},
                        ]
                        _post_gl(period, date(year, month or 1, 1), 'depreciation', voucher_ref, f'Depreciation for {asset.assetCode}', lines)
                        if DepreciationSchedule is not None and sch is not None:
                            sch.posted_status = 'posted'
                            sch.posting_date = datetime.utcnow()
                            sch.save()

                        # Update asset's accumulated and nbv (use computed values)
                        acc_after = (_quantize((asset.accumulated_depreciation or Decimal('0.00')) + monthly_amount))
                        nbv_after = _quantize((asset.nbv or Decimal('0.00')) - monthly_amount)
                        asset.accumulated_depreciation = acc_after
                        asset.nbv = nbv_after
                        asset.save()
                        total_depr += monthly_amount
                    else:
                        errors.append('Depreciation GL accounts not configured in settings; skipping GL post.')
                except Exception as e:
                    errors.append(str(e))
            else:
                errors.append('No open accounting period found; skipping GL post.')

        except Exception as e:
            errors.append(f'Asset {asset.assetCode}: {str(e)}')

    if DepreciationRun is not None:
        run.total_depreciation = _quantize(total_depr)
        run.error_log = '\n'.join(errors)
        run.status = 'completed' if not errors else 'failed'
        run.completed_at = datetime.utcnow()
        run.save()
        return run
    else:
        # fallback object
        run.total_depreciation = _quantize(total_depr)
        run.error_log = '\n'.join(errors)
        run.status = 'completed' if not errors else 'failed'
        run.completed_at = datetime.utcnow()
        return run
