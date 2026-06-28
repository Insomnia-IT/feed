from rest_framework import viewsets, permissions, filters, status
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.mixins import DisabledViewSetMixin, MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, auto_tag_viewset


class GroupBadgeFilter(django_filters.FilterSet):
    created_at__from = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr='gte')
    with_disabled = django_filters.BooleanFilter(method='filter_with_disabled')
    
    def filter_with_disabled(self, queryset, name, value):
        if value:
            return queryset
        return queryset.filter(is_disabled=False)


@auto_tag_viewset("GroupBadges")
class GroupBadgeViewSet(MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, DisabledViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.GroupBadge.objects.prefetch_related('group_badge_planning_cells').all()
    serializer_class = serializers.GroupBadgeSerializer
    serializer_action_classes = {
        'list': serializers.GroupBadgeListSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
    filterset_class = GroupBadgeFilter

@auto_tag_viewset("GroupBadgePlanningCells")
class GroupBadgePlanningCellsViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.GroupBadgePlanningCells.objects.select_related('group_badge')
    serializer_class = serializers.GroupBadgePlanningCellsSerializer
    http_method_names = ['post', 'patch', 'delete', 'head', 'options']
