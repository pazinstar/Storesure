from rest_framework import serializers
from .models import StorekeeperKPI

class StorekeeperKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = StorekeeperKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
