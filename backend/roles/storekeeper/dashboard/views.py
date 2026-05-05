from rest_framework import generics
from .models import StorekeeperKPI
from .serializers import StorekeeperKPISerializer

class StorekeeperKPIsView(generics.ListAPIView):
    queryset = StorekeeperKPI.objects.all()
    serializer_class = StorekeeperKPISerializer
