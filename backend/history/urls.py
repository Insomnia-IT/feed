from django.urls import path, include
from rest_framework import routers

from history.views import HistoryViewSet


router = routers.DefaultRouter()
router.register(r'history', HistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
