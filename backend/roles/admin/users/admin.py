from django.contrib import admin
from .models import SystemUser


@admin.register(SystemUser)
class SystemUserAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "role", "school", "status", "lastLogin")
    list_filter = ("role", "status", "school")
    search_fields = ("id", "name", "email", "username")
    readonly_fields = ("id", "createdAt", "lastLogin")
    ordering = ("id",)
    fieldsets = (
        ("Identity", {"fields": ("id", "name", "username", "email")}),
        ("Role & Access", {"fields": ("role", "school", "department", "assignedStores")}),
        ("Status", {"fields": ("status", "lastLogin", "createdAt")}),
    )
