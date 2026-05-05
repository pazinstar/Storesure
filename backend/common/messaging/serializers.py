from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.CharField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    recipient_id = serializers.CharField(source='recipient.id', read_only=True)
    recipient_name = serializers.SerializerMethodField()
    recipient_role = serializers.CharField(source='recipient.role', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender_id', 'sender_name', 'sender_role',
            'recipient_id', 'recipient_name', 'recipient_role',
            'subject', 'content', 'priority',
            'parent', 'read', 'starred',
            'created_at', 'read_at',
        ]

    def get_sender_name(self, obj):
        return obj.sender.name or obj.sender.username or obj.sender.email

    def get_recipient_name(self, obj):
        return obj.recipient.name or obj.recipient.username or obj.recipient.email


class ComposeSerializer(serializers.Serializer):
    recipient_id = serializers.CharField()
    subject = serializers.CharField(max_length=200)
    content = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=['normal', 'high', 'urgent'],
        default='normal',
    )
    parent_id = serializers.IntegerField(required=False, allow_null=True)
