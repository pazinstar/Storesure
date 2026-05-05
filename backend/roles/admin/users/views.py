from rest_framework import generics
from .models import SystemUser
from .serializers import SystemUserSerializer

class SystemUserListCreateView(generics.ListCreateAPIView):
    queryset = SystemUser.objects.all().order_by('-id')
    serializer_class = SystemUserSerializer

class SystemUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SystemUser.objects.all()
    serializer_class = SystemUserSerializer
    lookup_field = 'id'
