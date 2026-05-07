from django.urls import path
from .views import (
    InboxView, SentView, StarredView,
    MessageDetailView, ComposeView,
    MarkReadView, MarkAllReadView,
    ToggleStarView, DeleteMessageView,
    UnreadCountView, ThreadView,
    AttachmentUploadView,
    AuditLogListView,
)

urlpatterns = [
    path('inbox/', InboxView.as_view(), name='messages-inbox'),
    path('sent/', SentView.as_view(), name='messages-sent'),
    path('starred/', StarredView.as_view(), name='messages-starred'),
    path('compose/', ComposeView.as_view(), name='messages-compose'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='messages-mark-all-read'),
    path('unread-count/', UnreadCountView.as_view(), name='messages-unread-count'),
    path('thread/', ThreadView.as_view(), name='messages-thread'),
    path('<int:pk>/', MessageDetailView.as_view(), name='messages-detail'),
    path('<int:pk>/read/', MarkReadView.as_view(), name='messages-mark-read'),
    path('<int:pk>/star/', ToggleStarView.as_view(), name='messages-toggle-star'),
    path('<int:pk>/delete/', DeleteMessageView.as_view(), name='messages-delete'),
    path('attachments/', AttachmentUploadView.as_view(), name='messages-attachments'),
    path('audit/', AuditLogListView.as_view(), name='messages-audit'),
]
