from rest_framework import generics
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Staff
from .serializers import StaffSerializer
from roles.admin.users.models import SystemUser


def _make_username(name: str, email: str, inventory_number: str) -> str:
    """Derive a username: email prefix if available, else inventory number."""
    if email and "@" in email:
        return email.split("@")[0].lower()
    return inventory_number.lower()


class StaffListCreateView(generics.ListCreateAPIView):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'status', 'department', 'gender']
    search_fields = ['name', 'inventory_number', 'tsc_number', 'staff_number', 'id_number', 'designation']
    ordering_fields = ['name', 'department', 'type', 'status', 'date_joined', 'created_at']

    def perform_create(self, serializer):
        staff = serializer.save()

        # Create a corresponding SystemUser with default password
        username = _make_username(staff.name, staff.email, staff.inventory_number)
        user = SystemUser.objects.create(
            name=staff.name,
            username=username,
            email=staff.email or f"{username}@staff.local",
            password="1234",
            role="staff",
            department=staff.department,
            status="Active",
        )

        # Store the link back on the staff record
        staff.user_id = user.id
        staff.save(update_fields=["user_id"])


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    lookup_field = 'id'

    def perform_destroy(self, instance):
        # Deactivate the linked system user instead of deleting it
        if instance.user_id:
            SystemUser.objects.filter(id=instance.user_id).update(status="Inactive")
        instance.delete()

    def perform_update(self, serializer):
        staff = serializer.save()
        # Keep system user name/email/department in sync
        if staff.user_id:
            SystemUser.objects.filter(id=staff.user_id).update(
                name=staff.name,
                email=staff.email or SystemUser.objects.get(id=staff.user_id).email,
                department=staff.department,
            )
