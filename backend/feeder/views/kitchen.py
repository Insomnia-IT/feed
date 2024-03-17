
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models


class KitchenViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Kitchen.objects.all()
    serializer_class = serializers.KitchenSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
