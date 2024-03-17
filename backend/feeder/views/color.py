
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models


class ColorViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
