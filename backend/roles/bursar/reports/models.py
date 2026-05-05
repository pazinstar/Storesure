from django.db import models

class FinancialMetric(models.Model):
    label = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    change = models.CharField(max_length=100)

    def __str__(self):
        return self.label
