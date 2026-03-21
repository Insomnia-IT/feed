from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from feeder.views.mixins import SoftDeleteViewSetMixin
from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving
from .serializers import (
    StorageSerializer, BinSerializer, ItemSerializer,
    StorageItemPositionSerializer, IssuanceSerializer, ReceivingSerializer
)

class StorageViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Storage.objects.all()
    serializer_class = StorageSerializer
    permission_classes = [IsAuthenticated]

class BinViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Bin.objects.all()
    serializer_class = BinSerializer
    permission_classes = [IsAuthenticated]

class ItemViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

class StoragePositionViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = StorageItemPosition.objects.all()
    serializer_class = StorageItemPositionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        storage_id = serializer.validated_data.get('storage').id
        bin_id = serializer.validated_data.get('bin').id
        item = serializer.validated_data.get('item')
        count = serializer.validated_data.get('count')
        description = serializer.validated_data.get('description')
        volunteer_id = request.data.get('volunteer')

        if not item.is_unique:
            existing_position = StorageItemPosition.objects.filter(
                storage_id=storage_id,
                bin_id=bin_id,
                item=item
            ).first()

            if existing_position:
                with transaction.atomic():
                    existing_position.count += count
                    if description:
                        existing_position.description = (existing_position.description + "\n" + description).strip() if existing_position.description else description
                    existing_position.save()

                    Receiving.objects.create(
                        position=existing_position,
                        volunteer_id=volunteer_id,
                        count=count,
                        notes=description
                    )
                return Response(self.get_serializer(existing_position).data, status=status.HTTP_201_CREATED)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        with transaction.atomic():
            position = serializer.save()
            Receiving.objects.create(
                position=position,
                volunteer_id=self.request.data.get('volunteer'),
                count=position.count,
                notes=position.description
            )

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        position = self.get_object()
        count = int(request.data.get('count', 0))
        volunteer_id = request.data.get('volunteer')
        notes = request.data.get('notes', '')

        if count <= 0:
            return Response({'error': 'Count must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            position.count += count
            position.save()

            Receiving.objects.create(
                position=position,
                volunteer_id=volunteer_id,
                count=count,
                notes=notes
            )

        return Response(self.get_serializer(position).data)

    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        position = self.get_object()
        count = int(request.data.get('count', 0))
        volunteer_id = request.data.get('volunteer')
        notes = request.data.get('notes', '')

        if count <= 0:
            return Response({'error': 'Count must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        if not position.item.is_unique and position.count < count:
            return Response({'error': 'Insufficient count in position'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if position.item.is_unique:
                # For unique items, we always issue the whole position (count is always 1)
                if position.count < 1:
                    return Response({'error': 'Unique item already issued'}, status=status.HTTP_400_BAD_REQUEST)
                position.count = 0
            else:
                position.count -= count

            position.save()

            Issuance.objects.create(
                position=position,
                volunteer_id=volunteer_id,
                count=count if not position.item.is_unique else 1,
                notes=notes
            )

            if position.item.is_anonymous and position.count == 0:
                position.delete()

        return Response(self.get_serializer(position).data)

class IssuanceViewSet(SoftDeleteViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Issuance.objects.all()
    serializer_class = IssuanceSerializer
    permission_classes = [IsAuthenticated]

class ReceivingViewSet(SoftDeleteViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Receiving.objects.all()
    serializer_class = ReceivingSerializer
    permission_classes = [IsAuthenticated]
