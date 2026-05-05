from django.contrib import admin
from .models import HeadteacherKPI


@admin.register(HeadteacherKPI)
class HeadteacherKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
