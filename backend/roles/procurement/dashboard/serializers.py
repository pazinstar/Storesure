from rest_framework import serializers
from .models import ProcurementKPI

class ProcurementKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcurementKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
