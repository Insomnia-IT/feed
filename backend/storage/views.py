from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder.views.mixins import SoftDeleteViewSetMixin
from .models import Storage, Bin, Item, StorageItemPosition, Issuance, Receiving
from .serializers import (
    StorageSerializer, BinSerializer, ItemSerializer,
    StorageItemPositionSerializer, IssuanceSerializer, ReceivingSerializer
)


class StoragePositionFilter(django_filters.FilterSet):
    storage = django_filters.NumberFilter(field_name='storage_id', lookup_expr='exact')
    bin = django_filters.NumberFilter(field_name='bin_id', lookup_expr='exact')
    item = django_filters.NumberFilter(field_name='item_id', lookup_expr='exact')
    storage_name = django_filters.CharFilter(field_name='storage__name', lookup_expr='icontains')
    bin_name = django_filters.CharFilter(field_name='bin__name', lookup_expr='icontains')
    item_name = django_filters.CharFilter(field_name='item__name', lookup_expr='icontains')
    is_unique = django_filters.BooleanFilter(field_name='item__is_unique')
    is_anonymous = django_filters.BooleanFilter(field_name='item__is_anonymous')

    class Meta:
        model = StorageItemPosition
        fields = ['storage', 'bin', 'item', 'storage_name', 'bin_name', 'item_name', 'is_unique', 'is_anonymous']


class ReceivingFilter(django_filters.FilterSet):
    position = django_filters.NumberFilter(field_name='position_id', lookup_expr='exact')
    position__storage = django_filters.NumberFilter(field_name='position__storage_id', lookup_expr='exact')
    position__bin = django_filters.NumberFilter(field_name='position__bin_id', lookup_expr='exact')
    position__item = django_filters.NumberFilter(field_name='position__item_id', lookup_expr='exact')
    volunteer = django_filters.NumberFilter(field_name='volunteer_id', lookup_expr='exact')

    class Meta:
        model = Receiving
        fields = ['position', 'position__storage', 'position__bin', 'position__item', 'volunteer']


class IssuanceFilter(django_filters.FilterSet):
    position = django_filters.NumberFilter(field_name='position_id', lookup_expr='exact')
    position__storage = django_filters.NumberFilter(field_name='position__storage_id', lookup_expr='exact')
    position__bin = django_filters.NumberFilter(field_name='position__bin_id', lookup_expr='exact')
    position__item = django_filters.NumberFilter(field_name='position__item_id', lookup_expr='exact')
    volunteer = django_filters.NumberFilter(field_name='volunteer_id', lookup_expr='exact')

    class Meta:
        model = Issuance
        fields = ['position', 'position__storage', 'position__bin', 'position__item', 'volunteer']

class StorageViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Storage.objects.all()
    serializer_class = StorageSerializer
    permission_classes = [IsAuthenticated]

class BinViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Bin.objects.all()
    serializer_class = BinSerializer
    permission_classes = [IsAuthenticated]

class ItemFilter(django_filters.FilterSet):
    storage = django_filters.NumberFilter(method='filter_storage')
    is_unique = django_filters.BooleanFilter(field_name='is_unique')
    is_anonymous = django_filters.BooleanFilter(field_name='is_anonymous')
    has_storage = django_filters.BooleanFilter(method='filter_has_storage')

    def filter_storage(self, queryset, name, value):
        return queryset.filter(Q(storage__isnull=True) | Q(storage__exact=value))
    
    def filter_has_storage(self, queryset, name, value):
        if value:
            return queryset.filter(storage__isnull=False)
        return queryset.filter(storage__isnull=True)

    class Meta:
        model = Item
        fields = ['storage', 'is_unique', 'is_anonymous', 'has_storage']


class ItemViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ItemFilter

class StoragePositionViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = StorageItemPosition.objects.all()
    serializer_class = StorageItemPositionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = StoragePositionFilter

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
    ordering = ('-id')
    serializer_class = IssuanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = IssuanceFilter

class ReceivingViewSet(SoftDeleteViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Receiving.objects.all()
    ordering = ('-id')
    serializer_class = ReceivingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ReceivingFilter
