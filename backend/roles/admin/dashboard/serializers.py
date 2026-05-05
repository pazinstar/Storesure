from rest_framework import serializers
from .models import (
    AdminKPI,
    School, SchoolBranding, SystemSetup,
    StoreLocation, Library, Department, Stream,
    Permission, Role, RoleModulePermission, RoleModuleLink,
    RolePermission, InspectionCommittee, InspectionCommitteeMember,
)


# ─── Admin KPI ────────────────────────────────────────────────────────────────

class AdminKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminKPI
        fields = ['id', 'title', 'value', 'trend', 'trendUp', 'type']


# ─── School ───────────────────────────────────────────────────────────────────

class SchoolBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolBranding
        fields = [
            'logo_url', 'logo_text',
            'primary_color', 'secondary_color',
            'tagline', 'motto', 'updated_at',
        ]
        read_only_fields = ['updated_at']


class SystemSetupSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetup
        fields = [
            'academic_year', 'current_term',
            'modules_enabled',
            'require_approval_for_requisitions',
            'require_approval_for_lpos',
            'max_requisition_value',
            'allow_self_registration',
            'updated_at', 'updated_by',
        ]
        read_only_fields = ['updated_at']


class SchoolSerializer(serializers.ModelSerializer):
    branding = SchoolBrandingSerializer(read_only=True)
    setup = SystemSetupSerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'email', 'phone', 'website',
            'address', 'county', 'type', 'category',
            'academic_year', 'current_term',
            'status', 'subscription_plan', 'expiry_date',
            'headteacher_name', 'headteacher_email', 'headteacher_phone',
            'created_at', 'updated_at',
            'branding', 'setup',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolListSerializer(serializers.ModelSerializer):
    """List serializer — includes setup so modules_enabled is available."""
    setup = SystemSetupSerializer(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'code', 'email', 'phone', 'website',
            'county', 'type', 'category', 'academic_year', 'current_term',
            'status', 'subscription_plan', 'expiry_date',
            'headteacher_name', 'headteacher_email', 'headteacher_phone',
            'created_at', 'setup',
        ]
        read_only_fields = ['id', 'created_at']


# ─── Store Location ───────────────────────────────────────────────────────────

class StoreLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreLocation
        fields = [
            'id', 'name', 'code', 'location',
            'managerId', 'managerName',
            'status', 'createdAt', 'description',
        ]
        read_only_fields = ['id', 'createdAt']


# ─── Library ──────────────────────────────────────────────────────────────────

class LibrarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Library
        fields = [
            'id', 'name', 'code', 'location',
            'managerId', 'managerName',
            'status', 'capacity', 'createdAt', 'description',
        ]
        read_only_fields = ['id', 'createdAt']


# ─── Department ───────────────────────────────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'status', 'createdAt', 'description']
        read_only_fields = ['id', 'createdAt']


class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ['id', 'name', 'code', 'status', 'createdAt', 'description']
        read_only_fields = ['id', 'createdAt']


# ─── Permission (legacy) ──────────────────────────────────────────────────────

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'


# ─── Role & Module Permissions ────────────────────────────────────────────────

class RoleModuleLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleModuleLink
        fields = ['id', 'name', 'href', 'enabled']
        read_only_fields = ['id']


class RoleModulePermissionSerializer(serializers.ModelSerializer):
    crud = serializers.SerializerMethodField()
    links = RoleModuleLinkSerializer(many=True, read_only=True)

    class Meta:
        model = RoleModulePermission
        fields = ['id', 'module_id', 'module_name', 'enabled', 'crud', 'links']
        read_only_fields = ['id']

    def get_crud(self, obj):
        return {
            'view': obj.can_view,
            'create': obj.can_create,
            'edit': obj.can_edit,
            'delete': obj.can_delete,
        }


class RoleSerializer(serializers.ModelSerializer):
    permissions = RoleModulePermissionSerializer(
        many=True, read_only=True, source='module_permissions',
    )
    module_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'name', 'description', 'type',
            'is_deletable', 'created_at', 'updated_at',
            'module_count', 'permissions',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_module_count(self, obj):
        return obj.module_permissions.filter(enabled=True).count()

    # ── Nested write helpers ──────────────────────────────────────────────────

    def _save_permissions(self, role, permissions_data):
        """Delete and recreate all module permissions for a role."""
        role.module_permissions.all().delete()
        for perm_data in permissions_data:
            crud = perm_data.get('crud', {})
            links_data = perm_data.get('links', [])
            perm = RoleModulePermission.objects.create(
                role=role,
                module_id=perm_data['module_id'],
                module_name=perm_data['module_name'],
                enabled=perm_data.get('enabled', False),
                can_view=crud.get('view', False),
                can_create=crud.get('create', False),
                can_edit=crud.get('edit', False),
                can_delete=crud.get('delete', False),
            )
            for link in links_data:
                RoleModuleLink.objects.create(
                    module_permission=perm,
                    name=link['name'],
                    href=link['href'],
                    enabled=link.get('enabled', False),
                )

    def create(self, validated_data):
        permissions_data = self.initial_data.get('permissions', [])
        role = Role.objects.create(**validated_data)
        self._save_permissions(role, permissions_data)
        return role

    def update(self, instance, validated_data):
        permissions_data = self.initial_data.get('permissions', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if permissions_data:
            self._save_permissions(instance, permissions_data)
        return instance


# ─── RolePermission (legacy JSON) ─────────────────────────────────────────────

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'


# ─── Inspection Committee ─────────────────────────────────────────────────────

class InspectionCommitteeMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionCommitteeMember
        fields = ['user_id', 'user_name', 'designation', 'order']


class InspectionCommitteeSerializer(serializers.ModelSerializer):
    members = InspectionCommitteeMemberSerializer(many=True)

    class Meta:
        model = InspectionCommittee
        fields = ['id', 'members', 'is_active', 'updated_at']
        read_only_fields = ['id', 'updated_at']

    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        committee = InspectionCommittee.objects.create(**validated_data)
        for m in members_data:
            InspectionCommitteeMember.objects.create(committee=committee, **m)
        return committee

    def update(self, instance, validated_data):
        members_data = validated_data.pop('members', None)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        if members_data is not None:
            instance.members.all().delete()
            for m in members_data:
                InspectionCommitteeMember.objects.create(committee=instance, **m)
        return instance


# StudentSerializer lives in roles.students.serializers
