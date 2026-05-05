from django.contrib import admin
from .models import BursarKPI


@admin.register(BursarKPI)
class BursarKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
