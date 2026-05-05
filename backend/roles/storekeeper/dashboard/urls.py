from django.urls import path
from .views import StorekeeperKPIsView

urlpatterns = [
    path('kpis/', StorekeeperKPIsView.as_view(), name='storekeeper-kpis'),
]
