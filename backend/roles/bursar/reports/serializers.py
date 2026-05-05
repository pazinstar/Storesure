from rest_framework import serializers
from .models import FinancialMetric
from roles.storekeeper.stores.models import StoreReport

class FinancialMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialMetric
        fields = ['label', 'value', 'change']

class BursarStoreReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreReport
        fields = ['id', 'title', 'description', 'date', 'type', 'iconName']
