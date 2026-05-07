from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
import os

from roles.admin.users.models import SystemUser
from .models import Message
from .serializers import MessageSerializer, ComposeSerializer


def _get_system_user(request):
    """Resolve the SystemUser from the JWT-authenticated Django User."""
    try:
        return SystemUser.objects.select_related('school').get(
            email__iexact=request.user.email
        )
    except SystemUser.DoesNotExist:
        return None


class InboxView(generics.ListAPIView):
    """GET /api/v1/messages/inbox/"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        su = _get_system_user(self.request)
        if not su:
            return Message.objects.none()
        return Message.objects.filter(
            recipient=su, recipient_deleted=False,
        ).select_related('sender', 'recipient')


class SentView(generics.ListAPIView):
    """GET /api/v1/messages/sent/"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        su = _get_system_user(self.request)
        if not su:
            return Message.objects.none()
        return Message.objects.filter(
            sender=su, sender_deleted=False,
        ).select_related('sender', 'recipient')


class StarredView(generics.ListAPIView):
    """GET /api/v1/messages/starred/"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        su = _get_system_user(self.request)
        if not su:
            return Message.objects.none()
        return Message.objects.filter(
            recipient=su, recipient_deleted=False, starred=True,
        ).select_related('sender', 'recipient')


class MessageDetailView(generics.RetrieveAPIView):
    """GET /api/v1/messages/<id>/"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        su = _get_system_user(self.request)
        if not su:
            return Message.objects.none()
        return Message.objects.filter(
            Q(sender=su) | Q(recipient=su)
        ).select_related('sender', 'recipient')


class ComposeView(APIView):
    """POST /api/v1/messages/compose/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        su = _get_system_user(request)
        if not su:
            return Response(
                {'detail': 'User profile not found.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ComposeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            recipient = SystemUser.objects.get(
                id=data['recipient_id'], status__iexact='active',
            )
        except SystemUser.DoesNotExist:
            return Response(
                {'detail': 'Recipient not found or inactive.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if recipient.id == su.id:
            return Response(
                {'detail': 'Cannot send a message to yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parent = None
        if data.get('parent_id'):
            parent = Message.objects.filter(
                id=data['parent_id'],
            ).filter(Q(sender=su) | Q(recipient=su)).first()

        msg = Message.objects.create(
            sender=su,
            recipient=recipient,
            school=su.school,
            subject=data['subject'],
            content=data['content'],
            priority=data.get('priority', 'normal'),
            parent=parent,
        )

        return Response(
            MessageSerializer(msg).data,
            status=status.HTTP_201_CREATED,
        )


class MarkReadView(APIView):
    """POST /api/v1/messages/<id>/read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        su = _get_system_user(request)
        if not su:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            msg = Message.objects.get(pk=pk, recipient=su)
        except Message.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        msg.read = True
        msg.read_at = timezone.now()
        msg.save(update_fields=['read', 'read_at'])
        return Response(MessageSerializer(msg).data)


class MarkAllReadView(APIView):
    """POST /api/v1/messages/mark-all-read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        su = _get_system_user(request)
        if not su:
            return Response(status=status.HTTP_403_FORBIDDEN)
        count = Message.objects.filter(
            recipient=su, read=False, recipient_deleted=False,
        ).update(read=True, read_at=timezone.now())
        return Response({'marked': count})


class ToggleStarView(APIView):
    """POST /api/v1/messages/<id>/star/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        su = _get_system_user(request)
        if not su:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            msg = Message.objects.get(pk=pk, recipient=su)
        except Message.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        msg.starred = not msg.starred
        msg.save(update_fields=['starred'])
        return Response(MessageSerializer(msg).data)


class DeleteMessageView(APIView):
    """DELETE /api/v1/messages/<id>/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        su = _get_system_user(request)
        if not su:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            msg = Message.objects.get(
                Q(sender=su) | Q(recipient=su), pk=pk,
            )
        except Message.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if msg.sender_id == su.id:
            msg.sender_deleted = True
        if msg.recipient_id == su.id:
            msg.recipient_deleted = True
        msg.save(update_fields=['sender_deleted', 'recipient_deleted'])

        # Hard-delete if both sides removed
        if msg.sender_deleted and msg.recipient_deleted:
            msg.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UnreadCountView(APIView):
    """GET /api/v1/messages/unread-count/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        su = _get_system_user(request)
        if not su:
            return Response({'unread': 0})
        count = Message.objects.filter(
            recipient=su, read=False, recipient_deleted=False,
        ).count()
        return Response({'unread': count})


class ThreadView(generics.ListAPIView):
    """GET /api/v1/messages/thread/?user_id=USR002"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        su = _get_system_user(self.request)
        other_id = self.request.query_params.get('user_id')
        if not su or not other_id:
            return Message.objects.none()
        return Message.objects.filter(
            Q(sender=su, recipient_id=other_id, sender_deleted=False) |
            Q(recipient=su, sender_id=other_id, recipient_deleted=False)
        ).select_related('sender', 'recipient').order_by('created_at')


class AttachmentUploadView(APIView):
    """POST /api/v1/messages/attachments/ - upload an attachment and create DocumentAttachment"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        from .models import DocumentAttachment
        su = _get_system_user(request)
        if not su:
            return Response({'detail': 'User profile not found.'}, status=status.HTTP_403_FORBIDDEN)

        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')
        doc_type = request.data.get('doc_type') or request.data.get('type')
        upload = request.FILES.get('file')

        if not entity_type or not entity_id or not upload:
            return Response({'error': 'entity_type, entity_id and file are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file using default storage under attachments/
        save_dir = os.path.join('attachments', entity_type)
        filename = default_storage.save(os.path.join(save_dir, upload.name), upload)
        # Get a path/URL to store in file_path. Prefer relative path.
        file_path = filename

        att = DocumentAttachment.objects.create(
            entity_type=entity_type,
            entity_id=str(entity_id),
            file_path=file_path,
            doc_type=doc_type,
            uploaded_by=(su.email or str(su.id)),
            is_active=True,
        )

        return Response({
            'id': att.id,
            'entity_type': att.entity_type,
            'entity_id': att.entity_id,
            'file_path': att.file_path,
            'doc_type': att.doc_type,
            'uploaded_by': att.uploaded_by,
            'uploaded_at': att.uploaded_at,
        }, status=status.HTTP_201_CREATED)
