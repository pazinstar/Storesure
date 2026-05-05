from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'recipient', 'subject', 'priority', 'read', 'starred', 'created_at']
    list_filter = ['priority', 'read', 'starred', 'created_at']
    search_fields = ['subject', 'content', 'sender__name', 'recipient__name']
    raw_id_fields = ['sender', 'recipient', 'parent', 'school']
