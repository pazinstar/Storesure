from django.urls import path
from .views import HeadteacherKPIsView

urlpatterns = [
    path('kpis/', HeadteacherKPIsView.as_view(), name='headteacher-kpis'),
]
