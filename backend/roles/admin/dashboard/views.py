from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    AdminKPI,
    School, SchoolBranding, SystemSetup,
    StoreLocation, Library, Department, Stream,
    Permission, Role, RoleModulePermission,
    RolePermission, InspectionCommittee,
)
from .serializers import (
    AdminKPISerializer,
    SchoolSerializer, SchoolListSerializer,
    SchoolBrandingSerializer, SystemSetupSerializer,
    StoreLocationSerializer, LibrarySerializer, DepartmentSerializer,
    StreamSerializer,
    PermissionSerializer, RoleSerializer,
    RolePermissionSerializer, InspectionCommitteeSerializer,
)


# ─── Admin KPI ────────────────────────────────────────────────────────────────

class AdminKPIsView(generics.ListAPIView):
    queryset = AdminKPI.objects.all()
    serializer_class = AdminKPISerializer


# ─── Schools ──────────────────────────────────────────────────────────────────

class SchoolListCreateView(generics.ListCreateAPIView):
    queryset = School.objects.all().order_by('name')
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'type', 'county']
    search_fields = ['name', 'code', 'email', 'county']
    ordering_fields = ['name', 'created_at', 'status']

    def get_serializer_class(self):
        return SchoolListSerializer if self.request.method == 'GET' else SchoolSerializer


class SchoolDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    lookup_field = 'id'


# ─── School Branding ──────────────────────────────────────────────────────────

class SchoolBrandingView(APIView):
    """GET / PUT for a school's branding. Creates record on first PUT."""

    def _get_school(self, school_id):
        try:
            return School.objects.get(id=school_id)
        except School.DoesNotExist:
            return None

    def get(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        branding, _ = SchoolBranding.objects.get_or_create(school=school)
        return Response(SchoolBrandingSerializer(branding).data)

    def put(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        branding, created = SchoolBranding.objects.get_or_create(school=school)
        serializer = SchoolBrandingSerializer(branding, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        branding, _ = SchoolBranding.objects.get_or_create(school=school)
        serializer = SchoolBrandingSerializer(branding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ─── System Setup ─────────────────────────────────────────────────────────────

class SystemSetupView(APIView):
    """GET / PUT for a school's system setup. Creates record on first PUT."""

    def _get_school(self, school_id):
        try:
            return School.objects.get(id=school_id)
        except School.DoesNotExist:
            return None

    def get(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        setup, _ = SystemSetup.objects.get_or_create(school=school)
        return Response(SystemSetupSerializer(setup).data)

    def put(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        setup, _ = SystemSetup.objects.get_or_create(school=school)
        serializer = SystemSetupSerializer(setup, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=str(request.user))
        return Response(serializer.data)

    def patch(self, request, school_id):
        school = self._get_school(school_id)
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        setup, _ = SystemSetup.objects.get_or_create(school=school)
        serializer = SystemSetupSerializer(setup, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=str(request.user))
        return Response(serializer.data)


# ─── Store Locations ──────────────────────────────────────────────────────────

class StoreLocationListCreateView(generics.ListCreateAPIView):
    queryset = StoreLocation.objects.all().order_by('name')
    serializer_class = StoreLocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'location', 'managerName']
    ordering_fields = ['name', 'createdAt', 'status']


class StoreLocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StoreLocation.objects.all()
    serializer_class = StoreLocationSerializer
    lookup_field = 'id'


# ─── Libraries ────────────────────────────────────────────────────────────────

class LibraryListCreateView(generics.ListCreateAPIView):
    queryset = Library.objects.all().order_by('name')
    serializer_class = LibrarySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'location', 'managerName']
    ordering_fields = ['name', 'createdAt', 'status']


class LibraryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Library.objects.all()
    serializer_class = LibrarySerializer
    lookup_field = 'id'


# ─── Departments ──────────────────────────────────────────────────────────────

class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'createdAt', 'status']


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    lookup_field = 'id'


# ─── Streams ─────────────────────────────────────────────────────────────────

class StreamListCreateView(generics.ListCreateAPIView):
    queryset = Stream.objects.all().order_by('name')
    serializer_class = StreamSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'createdAt', 'status']


class StreamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer
    lookup_field = 'id'


# ─── Permissions (legacy) ─────────────────────────────────────────────────────

class AdminPermissionsView(generics.ListAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer


# ─── Roles ────────────────────────────────────────────────────────────────────

class RoleListCreateView(generics.ListCreateAPIView):
    queryset = Role.objects.prefetch_related(
        'module_permissions__links'
    ).order_by('name')
    serializer_class = RoleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['type']
    search_fields = ['name', 'description']


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.prefetch_related('module_permissions__links')
    serializer_class = RoleSerializer
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if not role.is_deletable:
            return Response(
                {'detail': 'System roles cannot be deleted.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


# ─── RolePermission (legacy JSON) ─────────────────────────────────────────────

class AdminRolePermissionsView(generics.ListAPIView):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer


# ─── Inspection Committee ─────────────────────────────────────────────────────

class InspectionCommitteeView(APIView):
    """Singleton resource — GET / PUT / DELETE."""

    def get(self, request):
        committee = InspectionCommittee.objects.prefetch_related('members').first()
        if not committee:
            return Response({'id': None, 'members': [], 'is_active': False, 'updated_at': None})
        return Response(InspectionCommitteeSerializer(committee).data)

    def put(self, request):
        committee = InspectionCommittee.objects.prefetch_related('members').first()
        if committee:
            serializer = InspectionCommitteeSerializer(committee, data=request.data)
        else:
            serializer = InspectionCommitteeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        InspectionCommittee.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Student views live in roles.students.views
