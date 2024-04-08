
from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models


class EngagementFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Engagement
        fields = []


class DirectionViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Engagement.objects.all()
    serializer_class = serializers.EngagementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EngagementFilter
    search_fields = ['name', ]


class EngagementRoleViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.EngagementRole.objects.all()
    serializer_class = serializers.EngagementRoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
