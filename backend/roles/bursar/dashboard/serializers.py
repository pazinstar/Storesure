from rest_framework import serializers
from .models import BursarKPI

class BursarKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = BursarKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
