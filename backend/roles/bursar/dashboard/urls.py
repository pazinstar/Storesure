from django.urls import path
from .views import BursarKPIsView

urlpatterns = [
    path('kpis/', BursarKPIsView.as_view(), name='bursar-kpis'),
]
