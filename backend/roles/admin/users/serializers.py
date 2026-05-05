from django.contrib.auth.hashers import make_password, is_password_usable
from rest_framework import serializers
from .models import SystemUser


class SystemUserSerializer(serializers.ModelSerializer):
    school_id = serializers.CharField(source='school.id', read_only=True, allow_null=True)
    school_name = serializers.CharField(source='school.name', read_only=True, allow_null=True)
    school = serializers.PrimaryKeyRelatedField(
        queryset=__import__('roles.admin.dashboard.models', fromlist=['School']).School.objects.all(),
        allow_null=True, required=False,
    )

    class Meta:
        model = SystemUser
        fields = [
            'id', 'name', 'username', 'email', 'password',
            'role', 'school', 'school_id', 'school_name',
            'department', 'assignedStores',
            'lastLogin', 'createdAt', 'status',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }
        read_only_fields = ['id', 'lastLogin', 'createdAt', 'school_id', 'school_name']

    def create(self, validated_data):
        raw_password = validated_data.get('password')
        if raw_password and not is_password_usable(raw_password):
            validated_data['password'] = make_password(raw_password)
        elif raw_password:
            # Already hashed — keep as-is; if plain text hash it
            if not raw_password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
                validated_data['password'] = make_password(raw_password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_password = validated_data.get('password')
        if raw_password:
            if not raw_password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
                validated_data['password'] = make_password(raw_password)
        return super().update(instance, validated_data)
