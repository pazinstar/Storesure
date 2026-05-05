from django.urls import path, include
from .views import (
    AdminKPIsView,
    SchoolListCreateView, SchoolDetailView,
    SchoolBrandingView, SystemSetupView,
    StoreLocationListCreateView, StoreLocationDetailView,
    LibraryListCreateView, LibraryDetailView,
    DepartmentListCreateView, DepartmentDetailView,
    StreamListCreateView, StreamDetailView,
    AdminPermissionsView,
    RoleListCreateView, RoleDetailView,
    AdminRolePermissionsView,
    InspectionCommitteeView,
)

urlpatterns = [
    # KPIs
    path('kpis/', AdminKPIsView.as_view(), name='admin-kpis'),

    # Schools
    path('schools/', SchoolListCreateView.as_view(), name='admin-schools'),
    path('schools/<str:id>/', SchoolDetailView.as_view(), name='admin-schools-detail'),
    path('schools/<str:school_id>/branding/', SchoolBrandingView.as_view(), name='admin-school-branding'),
    path('schools/<str:school_id>/setup/', SystemSetupView.as_view(), name='admin-school-setup'),

    # Store Locations
    path('stores/', StoreLocationListCreateView.as_view(), name='admin-stores'),
    path('stores/<str:id>/', StoreLocationDetailView.as_view(), name='admin-stores-detail'),

    # Libraries
    path('libraries/', LibraryListCreateView.as_view(), name='admin-libraries'),
    path('libraries/<str:id>/', LibraryDetailView.as_view(), name='admin-libraries-detail'),

    # Departments
    path('departments/', DepartmentListCreateView.as_view(), name='admin-departments'),
    path('departments/<str:id>/', DepartmentDetailView.as_view(), name='admin-departments-detail'),

    # Streams
    path('streams/', StreamListCreateView.as_view(), name='admin-streams'),
    path('streams/<str:id>/', StreamDetailView.as_view(), name='admin-streams-detail'),

    # Permissions (legacy)
    path('permissions/', AdminPermissionsView.as_view(), name='admin-permissions'),

    # Roles
    path('roles/', RoleListCreateView.as_view(), name='admin-roles'),
    path('roles/<str:id>/', RoleDetailView.as_view(), name='admin-roles-detail'),

    # Role Permissions (legacy JSON)
    path('role-permissions/', AdminRolePermissionsView.as_view(), name='admin-role-permissions'),

    # Inspection Committee (singleton)
    path('committee/', InspectionCommitteeView.as_view(), name='admin-committee'),

    # Users (delegated to users app)
    path('users/', include('roles.admin.users.urls')),
]
