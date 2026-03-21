from django.urls import include, path
from rest_framework import routers

from storage import views


router = routers.DefaultRouter()
router.register(r'storages', views.StorageViewSet)
router.register(r'storage-bins', views.BinViewSet, basename='storage-bins')
router.register(r'storage-items', views.ItemViewSet)
router.register(r'storage-positions', views.StoragePositionViewSet, basename='storage-positions')
router.register(r'storage-issuances', views.IssuanceViewSet)
router.register(r'storage-receivings', views.ReceivingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
