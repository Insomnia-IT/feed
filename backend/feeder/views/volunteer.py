from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.mixins import MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, \
    SaveHistoryDataViewSetMixin, VolunteerExtraFilterMixin


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
    is_active = django_filters.CharFilter(field_name="is_active", lookup_expr='iexact')
    updated_at__from = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr='gte')

    direction_id = django_filters.CharFilter(field_name="directions__id", lookup_expr='iexact')
    direction_name = django_filters.CharFilter(field_name="directions__name", lookup_expr='icontains')
    directions = django_filters.ModelMultipleChoiceFilter(queryset=models.Direction.objects.all())

    class Meta:
        model = models.Volunteer
        fields = ['color_type', 'feed_type', 'kitchen', 'group_badge']


class VolunteerCustomFieldValueFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')

    class Meta:
        model = models.VolunteerCustomFieldValue
        fields = ['custom_field', 'volunteer']


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
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr',
                     'person__name', 'person__last_name', 'person__first_name', 'person__nickname', 'person__other_names']
    filterset_class = VolunteerFilter


class VolunteerCustomFieldViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomField.objects.all()
    serializer_class = serializers.VolunteerCustomFieldSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class VolunteerCustomFieldValueViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomFieldValue.objects.all()
    serializer_class = serializers.VolunteerCustomFieldValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = VolunteerCustomFieldValueFilter


class VolunteerRoleViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerRole.objects.all()
    serializer_class = serializers.VolunteerRoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]

class AccessRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.AccessRole.objects.all()
    serializer_class = serializers.AccessRoleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
