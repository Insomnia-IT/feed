from django.urls import path

from synchronization.views import SyncWithNotion

urlpatterns = [
    path('notion-sync', SyncWithNotion.as_view()),
]
