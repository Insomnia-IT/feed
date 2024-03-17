
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models


class PhotoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Photo.objects.all()
    serializer_class = serializers.PhotoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person', ]
