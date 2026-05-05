from django.urls import path
from .views import LibrarianKPIsView

urlpatterns = [
    path('kpis/', LibrarianKPIsView.as_view(), name='librarian-kpis'),
]
