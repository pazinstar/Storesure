from django.contrib import admin
from .models import StorekeeperKPI


@admin.register(StorekeeperKPI)
class StorekeeperKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
