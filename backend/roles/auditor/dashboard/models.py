from django.db import models

class AuditorKPI(models.Model):
    title = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    trend = models.CharField(max_length=100)
    trendUp = models.BooleanField(default=True)
    type = models.CharField(max_length=50)

    def __str__(self):
        return self.title
