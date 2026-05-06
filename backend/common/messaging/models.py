from django.db import models
from roles.admin.users.models import SystemUser
from roles.admin.dashboard.models import School


class Message(models.Model):
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    sender = models.ForeignKey(
        SystemUser,
        related_name='sent_messages',
        on_delete=models.CASCADE,
    )
    recipient = models.ForeignKey(
        SystemUser,
        related_name='received_messages',
        on_delete=models.CASCADE,
    )
    school = models.ForeignKey(
        School,
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    subject = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
    )
    parent = models.ForeignKey(
        'self',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='replies',
    )

    # Read/star flags (per recipient)
    read = models.BooleanField(default=False)
    starred = models.BooleanField(default=False)

    # Soft-delete per side
    sender_deleted = models.BooleanField(default=False)
    recipient_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
        ]

    def __str__(self):
        return f"{self.sender.name} -> {self.recipient.name}: {self.subject}"


class AuditLog(models.Model):
    entity = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    action = models.CharField(max_length=50)  # create|update|delete
    user_id = models.CharField(max_length=100, blank=True, null=True)
    old_values = models.JSONField(blank=True, null=True)
    new_values = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']


class DocumentAttachment(models.Model):
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    file_path = models.CharField(max_length=1024)
    doc_type = models.CharField(max_length=100, blank=True, null=True)
    uploaded_by = models.CharField(max_length=100, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.doc_type or 'attachment'}"
