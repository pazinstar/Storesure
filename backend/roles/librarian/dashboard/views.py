from rest_framework import generics
from .models import LibrarianKPI
from .serializers import LibrarianKPISerializer

class LibrarianKPIsView(generics.ListAPIView):
    queryset = LibrarianKPI.objects.all()
    serializer_class = LibrarianKPISerializer
