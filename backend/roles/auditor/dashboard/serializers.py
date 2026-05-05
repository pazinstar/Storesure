from rest_framework import serializers
from .models import AuditorKPI

class AuditorKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditorKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
