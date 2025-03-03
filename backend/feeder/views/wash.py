from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from feeder.models import Wash
from feeder.serializers import WashSerializer
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

class WashViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Wash.objects.all()
    serializer_class = WashSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['volunteer_id', 'actor_id']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

