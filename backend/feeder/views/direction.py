
from feeder.views.mixins import MultiSerializerViewSetMixin
from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.mixins import auto_tag_viewset


class DirectionFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Direction
        fields = []

@auto_tag_viewset("Direction")
class DirectionViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Direction.objects.all()
    serializer_class = serializers.DirectionSerializer
    serializer_action_classes = {
        'list': serializers.ViewDirectionSerializer,
        'retrieve': serializers.ViewDirectionSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DirectionFilter
    search_fields = ['name', 'type', 'first_year', 'last_year']

@auto_tag_viewset("Direction Type")
class DirectionTypeViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.DirectionType.objects.all()
    serializer_class = serializers.DirectionTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


