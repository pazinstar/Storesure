from rest_framework import serializers
from .models import (
    Student, Distribution, NotCollected, Replacement,
    FeeStructure, FeeStructureItem,
    StudentBill, StudentBillLine,
    Bursary,
)


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'admission_no', 'first_name', 'middle_name', 'last_name',
            'date_of_birth', 'gender', 'nemis_no', 'pathway', 'class_name', 'stream',
            'admission_date', 'parent_name', 'parent_phone', 'parent_email',
            'address', 'status', 'photo_url', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DistributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distribution
        fields = [
            'id', 'date', 'class_name', 'stream', 'item_type', 'item_name',
            'quantity_issued', 'students_count', 'issued_by', 'received_by',
            'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotCollectedSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotCollected
        fields = ['id', 'adm_no', 'name', 'class_name', 'item', 'reason', 'days_overdue']


class ReplacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Replacement
        fields = ['id', 'date', 'adm_no', 'name', 'class_name', 'item', 'reason', 'approved_by', 'status']
        read_only_fields = ['id']


# ─── Fee Structure ───────────────────────────────────────────────────────────

class FeeStructureItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructureItem
        fields = ['id', 'vote_head', 'gok_amount', 'parent_amount', 'annual_amount', 'funding_type']
        read_only_fields = ['annual_amount', 'funding_type']


class FeeStructureSerializer(serializers.ModelSerializer):
    items = FeeStructureItemSerializer(many=True)
    annual_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'effective_from', 'effective_to', 'student_category',
            'term1_pct', 'term2_pct', 'term3_pct',
            'is_active', 'approved_by', 'approval_ref', 'allow_update',
            'notes', 'items', 'annual_total',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        fs = FeeStructure.objects.create(**validated_data)
        for item in items_data:
            FeeStructureItem.objects.create(fee_structure=fs, **item)
        return fs

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                FeeStructureItem.objects.create(fee_structure=instance, **item)
        return instance


class FeeStructureListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer without nested items."""
    annual_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'effective_from', 'effective_to', 'student_category',
            'term1_pct', 'term2_pct', 'term3_pct',
            'is_active', 'approved_by', 'approval_ref',
            'annual_total', 'item_count',
            'created_at',
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ─── Student Billing ─────────────────────────────────────────────────────────

class StudentBillLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentBillLine
        fields = ['id', 'vote_head', 'amount', 'paid', 'balance']
        read_only_fields = ['balance']


class StudentBillSerializer(serializers.ModelSerializer):
    lines = StudentBillLineSerializer(many=True, read_only=True)
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentBill
        fields = [
            'id', 'bill_number', 'student', 'student_name', 'admission_no',
            'class_name', 'fee_structure', 'term', 'year', 'bill_date',
            'total_amount', 'status', 'lines', 'created_at',
        ]
        read_only_fields = ['id', 'bill_number', 'total_amount', 'created_at']

    def get_student_name(self, obj):
        return f'{obj.student.first_name} {obj.student.last_name}'

    def get_admission_no(self, obj):
        return obj.student.admission_no

    def get_class_name(self, obj):
        return obj.student.class_name


# ─── Bursary ─────────────────────────────────────────────────────────────────

class BursarySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    admission_no = serializers.SerializerMethodField()

    class Meta:
        model = Bursary
        fields = [
            'id', 'bursary_ref', 'bursary_type', 'sponsor',
            'student', 'student_name', 'admission_no',
            'acknowledged_amount', 'paid_to_student', 'received_as_fees',
            'status', 'narration', 'date',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f'{obj.student.first_name} {obj.student.last_name}'

    def get_admission_no(self, obj):
        return obj.student.admission_no
