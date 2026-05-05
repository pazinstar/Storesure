from django.contrib import admin
from .models import FinancialMetric


@admin.register(FinancialMetric)
class FinancialMetricAdmin(admin.ModelAdmin):
    list_display = ['label', 'value', 'change']
    search_fields = ['label']
