
from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models


class ParticipationFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = models.Participation
        fields = []


class DirectionViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Participation.objects.all()
    serializer_class = serializers.ParticipationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ParticipationFilter
    search_fields = ['name', ]


class ParticipationRoleViewSet(viewsets.ModelViewSet):
    # authentication_classes = [authentication.KitchenPinAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.ParticipationRole.objects.all()
    serializer_class = serializers.ParticipationRoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
