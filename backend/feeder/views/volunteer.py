from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from django import forms
from distutils.util import strtobool


from feeder import serializers, models
from feeder.views.mixins import MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, \
    SaveHistoryDataViewSetMixin, VolunteerExtraFilterMixin


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class TypedChoiceFilter(django_filters.Filter):
    field_class = forms.TypedChoiceField

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
    is_blocked = TypedChoiceFilter(choices=[('true','true'),('false','false')], coerce=strtobool)
    is_ticket_received = TypedChoiceFilter(choices=[('true','true'),('false','false')], coerce=strtobool)
    is_vegan = TypedChoiceFilter(choices=[('true','true'),('false','false')], coerce=strtobool)
    updated_at__from = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr='gte')

    direction_id = django_filters.CharFilter(field_name="directions__id", lookup_expr='iexact')
    direction_name = django_filters.CharFilter(field_name="directions__name", lookup_expr='icontains')
    directions = django_filters.ModelMultipleChoiceFilter(queryset=models.Direction.objects.all())

    class Meta:
        model = models.Volunteer
        fields = ['color_type', 'feed_type', 'kitchen', 'group_badge', 'main_role', 'access_role', 'uuid', 'is_ticket_received']


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
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr', 'uuid']
    filterset_class = VolunteerFilter


class VolunteerCustomFieldViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomField.objects.all()
    serializer_class = serializers.VolunteerCustomFieldSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class VolunteerCustomFieldValueViewSet(SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
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
