from django.contrib import admin
from .models import AuditorKPI


@admin.register(AuditorKPI)
class AuditorKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
