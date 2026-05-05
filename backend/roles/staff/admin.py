from django.contrib import admin
from .models import Staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'designation', 'department', 'status', 'date_joined']
    list_filter = ['type', 'status', 'department']
    search_fields = ['id', 'name', 'email', 'tsc_number', 'staff_number', 'inventory_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'date_joined'
