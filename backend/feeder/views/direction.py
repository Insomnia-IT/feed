
from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models


class DirectionFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Direction
        fields = []


class DirectionViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Direction.objects.all()
    serializer_class = serializers.DirectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DirectionFilter
    search_fields = ['name', 'type', 'first_year', 'last_year', 'notion_id']


class DirectionTypeViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.DirectionType.objects.all()
    serializer_class = serializers.DirectionTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DirectionFilter
    search_fields = ['name', ]


class DepartmentFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Department
        fields = []

class DepartmentViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Department.objects.all()
    serializer_class = serializers.DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DepartmentFilter
    search_fields = ['name', ]


class LocationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
