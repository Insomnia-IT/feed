from django.urls import path, include
from rest_framework import routers
from .views import (
    StorageViewSet, BinViewSet, ItemViewSet,
    StoragePositionViewSet, IssuanceViewSet, ReceivingViewSet,
    MovementViewSet, VolunteerInventoryView
)

router = routers.DefaultRouter()
router.register(r'storages', StorageViewSet)
router.register(r'storage-bins', BinViewSet)
router.register(r'storage-items', ItemViewSet)
router.register(r'storage-positions', StoragePositionViewSet)
router.register(r'storage-issuances', IssuanceViewSet)
router.register(r'storage-receivings', ReceivingViewSet)
router.register(r'storage-movements', MovementViewSet)

urlpatterns = [
    path('volunteer-inventory/<int:volunteer_id>', VolunteerInventoryView.as_view()),
    path('', include(router.urls)),
]
