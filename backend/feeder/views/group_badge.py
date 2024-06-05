from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.mixins import MultiSerializerViewSetMixin


class GroupBadgeFilter(django_filters.FilterSet):
    created_at__from = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr='gte')


class GroupBadgeViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.GroupBadge.objects.all()
    serializer_class = serializers.GroupBadgeSerializer
    serializer_action_classes = {
        'list': serializers.GroupBadgeListSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
    filterset_class = GroupBadgeFilter
