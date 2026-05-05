from django.contrib import admin
from .models import Student, Distribution, NotCollected, Replacement


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['id', 'admission_no', 'first_name', 'last_name', 'class_name', 'stream', 'gender', 'status']
    list_filter = ['status', 'gender', 'class_name']
    search_fields = ['id', 'admission_no', 'first_name', 'last_name', 'parent_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'admission_date'


@admin.register(Distribution)
class DistributionAdmin(admin.ModelAdmin):
    list_display = ['id', 'date', 'class_name', 'stream', 'item_name', 'quantity_issued', 'students_count', 'issued_by']
    list_filter = ['class_name', 'item_type']
    search_fields = ['id', 'item_name', 'class_name', 'issued_by']
    readonly_fields = ['id']
    date_hierarchy = 'date'


@admin.register(NotCollected)
class NotCollectedAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']


@admin.register(Replacement)
class ReplacementAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']
