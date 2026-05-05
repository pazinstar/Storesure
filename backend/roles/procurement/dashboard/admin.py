from django.contrib import admin
from .models import ProcurementKPI


@admin.register(ProcurementKPI)
class ProcurementKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
