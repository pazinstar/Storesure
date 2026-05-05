from django.contrib import admin
from .models import LibrarianKPI


@admin.register(LibrarianKPI)
class LibrarianKPIAdmin(admin.ModelAdmin):
    list_display = ['title', 'value', 'trend', 'type']
    search_fields = ['title']
