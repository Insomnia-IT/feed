import datetime

from django.db.models import Q
from django_filters import FilterSet
from django_filters.rest_framework import filters
from rest_framework import viewsets, permissions, mixins

from history.models import History
from history.serializers import HistorySerializer


class HistoryFilter(FilterSet):
    date = filters.DateFilter(method='filter_date', label='history date', input_formats=['%d.%m.%y', '%d.%m.%Y'])
    date_start = filters.DateFilter(field_name='action_at', lookup_expr='gte', input_formats=['%d.%m.%y', '%d.%m.%Y'])
    date_end = filters.DateFilter(field_name='action_at', lookup_expr='lte', input_formats=['%d.%m.%y', '%d.%m.%Y'])
    object_id = filters.CharFilter(method='filter_object')

    class Meta:
        model = History
        fields = ['object_name', 'object_id', 'status', 'date', 'date_start', 'date_end', 'volunteer_uuid']

    def filter_date(self, queryset, name, value):
        date_end = value + datetime.timedelta(days=1)
        return queryset.filter(Q(action_at__lte=date_end) & Q(action_at__gte=value))

    def filter_object(self, queryset, name, value):
        return queryset.filter(data__id=value)


class HistoryViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = History.objects.all()
    serializer_class = HistorySerializer
    filterset_class = HistoryFilter
