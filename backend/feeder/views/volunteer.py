from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class MultiSerializerViewSetMixin(object):
    def get_serializer_class(self):
        """
        Смотрим на serializer class в self.serializer_action_classes, который представляет из себя
        dict mapping action name (key) в serializer class (value), например::
        class MyViewSet(MultiSerializerViewSetMixin, ViewSet):
            serializer_class = MyDefaultSerializer
            serializer_action_classes = {
               'list': MyListSerializer,
               'my_action': MyActionSerializer,
            }

            @action
            def my_action:
                ...

        Если подходящих вхождений в action нет тогда просто fallback к обычному
        get_serializer_class lookup: self.serializer_class, DefaultSerializer.
        """
        try:
            return self.serializer_action_classes[self.action]
        except (KeyError, AttributeError):
            return super(MultiSerializerViewSetMixin, self).get_serializer_class()


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

    class Meta:
        model = models.Volunteer
        fields = ['color_type', 'feed_type', 'kitchen', 'group_badge']


class VolunteerCustomFieldValueFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')

    class Meta:
        model = models.VolunteerCustomFieldValue
        fields = ['custom_field', 'volunteer']


class VolunteerViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Volunteer.objects.all()
    serializer_class = serializers.VolunteerSerializer
    serializer_action_classes = {
        'list': serializers.VolunteerListSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr']
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
