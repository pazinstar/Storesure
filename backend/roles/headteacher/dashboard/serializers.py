from rest_framework import serializers
from .models import HeadteacherKPI

class HeadteacherKPISerializer(serializers.ModelSerializer):
    class Meta:
        model = HeadteacherKPI
        fields = ['title', 'value', 'trend', 'trendUp', 'type']
