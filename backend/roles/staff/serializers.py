from rest_framework import serializers
from .models import Staff


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            'id', 'tsc_number', 'staff_number', 'inventory_number',
            'name', 'email', 'phone', 'type', 'designation', 'department',
            'date_joined', 'status', 'id_number', 'gender', 'subjects', 'notes',
            'user_id', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']
