from rest_framework import serializers
from .models import LibrarianKPI

class LibrarianKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = LibrarianKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
