from django.urls import path
from .views import SystemUserListCreateView, SystemUserDetailView

urlpatterns = [
    path('', SystemUserListCreateView.as_view(), name='admin-users-root'),
    path('<str:id>/', SystemUserDetailView.as_view(), name='admin-users-detail'),
]
