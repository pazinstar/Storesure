from django.urls import path
from .views import AuditorKPIsView

urlpatterns = [
    path('kpis/', AuditorKPIsView.as_view(), name='auditor-kpis'),
]
