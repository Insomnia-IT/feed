
from rest_framework import viewsets, permissions, filters

from feeder import serializers, models


class PersonViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Person.objects.all()
    serializer_class = serializers.PersonSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'name', 'nickname', 'other_names', 'telegram', 'phone', 'email']
