from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.mixins import auto_tag_viewset

@auto_tag_viewset("Transport")
class TransportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Transport.objects.all()
    serializer_class = serializers.TransportSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
