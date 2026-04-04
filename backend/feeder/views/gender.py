
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models
from feeder.views.mixins import auto_tag_viewset

@auto_tag_viewset("Gender")
class GenderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Gender.objects.all()
    serializer_class = serializers.GenderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
