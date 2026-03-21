# storage/views.py

"""ViewSets for the Storage Management feature.
All endpoints are read‑write and use ``IsAuthenticated`` permission (no admin‑only restriction).
"""

from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from feeder.models import Volunteer
from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving
from .serializers import (
    StorageSerializer,
    BinSerializer,
    ItemSerializer,
    StorageItemPositionSerializer,
    IssuanceSerializer,
    ReceivingSerializer,
)


class StorageViewSet(viewsets.ModelViewSet):
    queryset = Storage.objects.all()
    serializer_class = StorageSerializer

    # No special behavior needed


class BinViewSet(viewsets.ModelViewSet):
    serializer_class = BinSerializer

    def get_queryset(self):
        # Nested under storage – filter by storage_pk (lookup name used by nested router)
        storage_id = self.kwargs.get("storage_pk")
        if storage_id:
            return Bin.objects.filter(storage_id=storage_id)
        return Bin.objects.all()

    def perform_create(self, serializer):
        storage_id = self.kwargs.get("storage_pk") or self.request.data.get("storage")
        serializer.save(storage_id=storage_id)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


class StoragePositionViewSet(viewsets.ModelViewSet):
    serializer_class = StorageItemPositionSerializer

    def get_queryset(self):
        # Nested under storage – optional filtering by storage_pk
        storage_id = self.kwargs.get("storage_pk")
        if storage_id:
            return StorageItemPosition.objects.filter(storage_id=storage_id)
        return StorageItemPosition.objects.all()

    def perform_create(self, serializer):
        # Associate with the parent storage from URL kwargs or request body
        storage_id = self.kwargs.get("storage_pk") or self.request.data.get("storage")
        serializer.save(storage_id=storage_id)
        # Create a Receiving record if volunteer info is provided in the request
        volunteer_id = self.request.data.get("volunteer")
        count = serializer.validated_data.get("count")
        if volunteer_id and count:
            try:
                volunteer = Volunteer.objects.get(pk=volunteer_id)
                Receiving.objects.create(
                    position=serializer.instance,
                    volunteer=volunteer,
                    count=count,
                )
            except Volunteer.DoesNotExist:
                pass  # ignore – client can handle validation separately

    @action(detail=True, methods=["post"], url_path="receive")
    def receive(self, request, pk=None):
        """Receive items for a position.
        Expected payload: {"count": int, "volunteer": <volunteer_id>, "notes": "optional"}
        """
        position = self.get_object()
        count = request.data.get("count")
        volunteer_id = request.data.get("volunteer")
        notes = request.data.get("notes", "")
        if not count or int(count) <= 0:
            return Response({"detail": "Count must be a positive integer"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            volunteer = Volunteer.objects.get(pk=volunteer_id)
        except Volunteer.DoesNotExist:
            return Response({"detail": "Volunteer not found"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            # Increment the position count atomically
            StorageItemPosition.objects.filter(pk=position.pk).update(count=F("count") + int(count))
            # Refresh in‑memory instance
            position.refresh_from_db()
            Receiving.objects.create(
                position=position,
                volunteer=volunteer,
                count=int(count),
                notes=notes,
            )
        serializer = self.get_serializer(position)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="issue")
    def issue(self, request, pk=None):
        """Issue items from a position.
        Expected payload: {"count": int, "volunteer": <volunteer_id>, "notes": "optional"}
        For unique items ``count`` is ignored and the position is soft‑deleted.
        """
        position = self.get_object()
        count = request.data.get("count")
        volunteer_id = request.data.get("volunteer")
        notes = request.data.get("notes", "")
        if not volunteer_id:
            return Response({"detail": "Volunteer is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            volunteer = Volunteer.objects.get(pk=volunteer_id)
        except Volunteer.DoesNotExist:
            return Response({"detail": "Volunteer not found"}, status=status.HTTP_400_BAD_REQUEST)
        if position.item.is_unique:
            # Unique item – issue the whole position and soft‑delete it
            with transaction.atomic():
                Issuance.objects.create(
                    position=position,
                    volunteer=volunteer,
                    count=1,
                    notes=notes,
                )
                position.delete()
            return Response({"detail": "Unique item issued and position removed"}, status=status.HTTP_200_OK)
        # Non‑unique handling
        if not count or int(count) <= 0:
            return Response({"detail": "Count must be a positive integer"}, status=status.HTTP_400_BAD_REQUEST)
        if int(count) > position.count:
            return Response({"detail": "Not enough items in position"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            StorageItemPosition.objects.filter(pk=position.pk).update(count=F("count") - int(count))
            position.refresh_from_db()
            Issuance.objects.create(
                position=position,
                volunteer=volunteer,
                count=int(count),
                notes=notes,
            )
        serializer = self.get_serializer(position)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IssuanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Issuance.objects.all()
    serializer_class = IssuanceSerializer

    # List and retrieve only – creation is handled via the ``issue`` action on positions


class ReceivingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Receiving.objects.all()
    serializer_class = ReceivingSerializer

    # List and retrieve only – creation is handled via the ``receive`` action on positions
