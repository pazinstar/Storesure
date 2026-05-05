from django.contrib import admin
from .models import (
    AdminKPI,
    School, SchoolBranding, SystemSetup,
    StoreLocation, Library, Department, Stream,
    Permission, Role, RoleModulePermission, RoleModuleLink,
    RolePermission, InspectionCommittee, InspectionCommitteeMember,
)


# ─── Inlines ──────────────────────────────────────────────────────────────────

class SchoolBrandingInline(admin.StackedInline):
    model = SchoolBranding
    extra = 0
    can_delete = False


class SystemSetupInline(admin.StackedInline):
    model = SystemSetup
    extra = 0
    can_delete = False


class RoleModuleLinkInline(admin.TabularInline):
    model = RoleModuleLink
    extra = 0


class RoleModulePermissionInline(admin.TabularInline):
    model = RoleModulePermission
    extra = 0
    show_change_link = True


class InspectionCommitteeMemberInline(admin.TabularInline):
    model = InspectionCommitteeMember
    extra = 1
    ordering = ['order']


# ─── School ───────────────────────────────────────────────────────────────────

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'status', 'subscription_plan', 'expiry_date', 'headteacher_name', 'created_at']
    list_filter = ['status', 'subscription_plan', 'type', 'county']
    search_fields = ['name', 'code', 'email', 'headteacher_name', 'headteacher_email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [SchoolBrandingInline, SystemSetupInline]
    fieldsets = (
        ('School Info', {
            'fields': ('id', 'name', 'code', 'type', 'category', 'county', 'status')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'website', 'address')
        }),
        ('Subscription', {
            'fields': ('subscription_plan', 'expiry_date')
        }),
        ('Headteacher', {
            'fields': ('headteacher_name', 'headteacher_email', 'headteacher_phone')
        }),
        ('Academic', {
            'fields': ('academic_year', 'current_term')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SchoolBranding)
class SchoolBrandingAdmin(admin.ModelAdmin):
    list_display = ['school', 'primary_color', 'secondary_color', 'updated_at']
    search_fields = ['school__name']
    readonly_fields = ['updated_at']


@admin.register(SystemSetup)
class SystemSetupAdmin(admin.ModelAdmin):
    list_display = ['school', 'academic_year', 'current_term', 'require_approval_for_requisitions', 'updated_at']
    search_fields = ['school__name']
    readonly_fields = ['updated_at']


# ─── Infrastructure ───────────────────────────────────────────────────────────

@admin.register(StoreLocation)
class StoreLocationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'location', 'managerName', 'status']
    list_filter = ['status']
    search_fields = ['name', 'code', 'location', 'managerName']
    readonly_fields = ['id', 'createdAt']


@admin.register(Library)
class LibraryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'location', 'managerName', 'capacity', 'status']
    list_filter = ['status']
    search_fields = ['name', 'code', 'location', 'managerName']
    readonly_fields = ['id', 'createdAt']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'status']
    list_filter = ['status']
    search_fields = ['name', 'code']
    readonly_fields = ['id', 'createdAt']


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'status']
    list_filter = ['status']
    search_fields = ['name', 'code']
    readonly_fields = ['id', 'createdAt']


# ─── Roles & Permissions ──────────────────────────────────────────────────────

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'is_deletable', 'created_at']
    list_filter = ['type', 'is_deletable']
    search_fields = ['name', 'id']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [RoleModulePermissionInline]


@admin.register(RoleModulePermission)
class RoleModulePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'module_name', 'enabled', 'can_view', 'can_create', 'can_edit', 'can_delete']
    list_filter = ['enabled', 'role']
    search_fields = ['module_name', 'role__name']
    inlines = [RoleModuleLinkInline]


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'module']
    list_filter = ['module']
    search_fields = ['name', 'code', 'module']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'roleLabel']
    search_fields = ['role', 'roleLabel']


# ─── Inspection Committee ─────────────────────────────────────────────────────

@admin.register(InspectionCommittee)
class InspectionCommitteeAdmin(admin.ModelAdmin):
    list_display = ['id', 'is_active', 'updated_at']
    readonly_fields = ['updated_at']
    inlines = [InspectionCommitteeMemberInline]


# ─── KPIs ─────────────────────────────────────────────────────────────────────

@admin.register(AdminKPI)
class AdminKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'trendUp', 'type']
    search_fields = ['title']
