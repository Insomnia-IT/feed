
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models


class StayingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Staying.objects.all()
    serializer_class = serializers.StayingSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'volunteer', '']
