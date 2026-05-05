from rest_framework import generics
from .models import AuditorKPI
from .serializers import AuditorKPISerializer

class AuditorKPIsView(generics.ListAPIView):
    queryset = AuditorKPI.objects.all()
    serializer_class = AuditorKPISerializer
