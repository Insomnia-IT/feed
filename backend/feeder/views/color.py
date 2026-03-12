
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models
from feeder.views.mixins import auto_tag_viewset

@auto_tag_viewset("Color")
class ColorViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
