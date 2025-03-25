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
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    pagination_class = None 
    filterset_class = WashFilter

class WashFilter(filters.FilterSet):
    volunteer = filters.NumberFilter(field_name="volunteer_id", lookup_expr="exact")
    actor = filters.NumberFilter(field_name="actor_id", lookup_expr="exact")

    class Meta:
        model = Wash
        fields = ["volunteer", "actor", "created_at_from", "created_at_to"]
