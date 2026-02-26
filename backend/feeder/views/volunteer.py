from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from django import forms
from django.db.models import Exists, OuterRef

from feeder import serializers, models
from feeder.views.mixins import MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, \
    SaveHistoryDataViewSetMixin, VolunteerExtraFilterMixin, auto_tag_viewset


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass

class VolunteerFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')
    first_name = django_filters.CharFilter(field_name="first_name", lookup_expr='icontains')
    last_name = django_filters.CharFilter(field_name="last_name", lookup_expr='icontains')
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')
    phone = django_filters.CharFilter(field_name="phone", lookup_expr='icontains')
    email = django_filters.CharFilter(field_name="email", lookup_expr='icontains')
    qr = django_filters.CharFilter(field_name="qr", lookup_expr='iexact')
    printing_batch = django_filters.CharFilter(field_name="printing_batch", lookup_expr='iexact')
    badge_number = django_filters.CharFilter(field_name="badge_number", lookup_expr='icontains')
    comment = django_filters.CharFilter(field_name="comment", lookup_expr='icontains')
    is_blocked = django_filters.BooleanFilter(field_name='is_blocked')
    is_ticket_received = django_filters.BooleanFilter(method='filter_is_ticket_received')
    is_vegan = django_filters.BooleanFilter(field_name='is_vegan')
    updated_at__from = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr='gte')

    direction_id = django_filters.CharFilter(field_name="directions__id", lookup_expr='iexact')
    direction_name = django_filters.CharFilter(field_name="directions__name", lookup_expr='icontains')
    directions = django_filters.ModelMultipleChoiceFilter(queryset=models.Direction.objects.all())
    scanner_comment = django_filters.CharFilter(field_name="scanner_comment", lookup_expr='icontains')
    responsible_id = django_filters.CharFilter(field_name="responsible_id", lookup_expr='exact')
    supervisor_id = django_filters.CharFilter(field_name="supervisor_id", lookup_expr='exact')
    has_supervisor = django_filters.BooleanFilter(method='filter_has_supervisor')
    is_supervisor = django_filters.BooleanFilter(method='filter_is_supervisor')
    infant = django_filters.BooleanFilter(field_name='infant')

    def filter_has_supervisor(self, queryset, name, value):
        if value is None:
            return queryset

        return queryset.filter(supervisor_id__isnull=not value)

    def filter_is_supervisor(self, queryset, name, value):
        if value is None:
            return queryset

        supervisees_qs = models.Volunteer.objects.filter(supervisor_id=OuterRef('pk'))
        queryset = queryset.annotate(is_supervisor=Exists(supervisees_qs))

        return queryset.filter(is_supervisor=value)

    def filter_is_ticket_received(self, queryset, name, value):
        if value:
            return queryset.filter(is_ticket_received=True)
        return queryset.exclude(is_ticket_received=True)

    class Meta:
        model = models.Volunteer
        fields = ['feed_type', 'kitchen', 'group_badge', 'main_role', 'access_role', 'uuid']


class VolunteerCustomFieldValueFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')

    class Meta:
        model = models.VolunteerCustomFieldValue
        fields = ['custom_field', 'volunteer']

@auto_tag_viewset("Volunteer")
class VolunteerViewSet(VolunteerExtraFilterMixin, SoftDeleteViewSetMixin,
                       MultiSerializerViewSetMixin, SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Volunteer.objects.all()
    serializer_class = serializers.VolunteerSerializer
    serializer_action_classes = {
        'list': serializers.VolunteerListSerializer,
        'retrieve': serializers.RetrieveVolunteerSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr', 'uuid',
                     'person__name', 'person__last_name', 'person__first_name', 'person__nickname', 'person__other_names', 'person__telegram']
    filterset_class = VolunteerFilter


@auto_tag_viewset("Volunteer Custom Field")
class VolunteerCustomFieldViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomField.objects.all()
    serializer_class = serializers.VolunteerCustomFieldSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]

@auto_tag_viewset("Volunteer Custom Field Value")
class VolunteerCustomFieldValueViewSet(SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomFieldValue.objects.all()
    serializer_class = serializers.VolunteerCustomFieldValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = VolunteerCustomFieldValueFilter

@auto_tag_viewset("Volunteer Role")
class VolunteerRoleViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerRole.objects.all()
    serializer_class = serializers.VolunteerRoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]

@auto_tag_viewset("Access Role")
class AccessRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.AccessRole.objects.all()
    serializer_class = serializers.AccessRoleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
