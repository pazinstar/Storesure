from rest_framework import generics
from .models import BursarKPI
from .serializers import BursarKPISerializer

class BursarKPIsView(generics.ListAPIView):
    queryset = BursarKPI.objects.all()
    serializer_class = BursarKPISerializer
