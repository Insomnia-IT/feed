from rest_framework import viewsets, permissions, filters

from feeder import serializers, models
from feeder.views.mixins import SaveHistoryDataViewSetMixin


class ArrivalViewSet(SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Arrival.objects.all()
    serializer_class = serializers.ArrivalSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'volunteer', '']
