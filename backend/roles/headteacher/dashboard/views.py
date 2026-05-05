from rest_framework import generics
from .models import HeadteacherKPI
from .serializers import HeadteacherKPISerializer

class HeadteacherKPIsView(generics.ListAPIView):
    queryset = HeadteacherKPI.objects.all()
    serializer_class = HeadteacherKPISerializer
