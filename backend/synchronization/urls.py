from django.urls import path

from synchronization.views import SyncStatus, SyncWithNotion

urlpatterns = [
    path('notion-sync', SyncWithNotion.as_view()),
    path('sync-status', SyncStatus.as_view()),
]
