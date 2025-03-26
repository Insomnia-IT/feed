from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from feeder.models import Wash
from feeder.serializers import WashSerializer
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

class WashFilter(django_filters.FilterSet):
    volunteer = django_filters.NumberFilter(field_name="volunteer_id", lookup_expr="exact")
    actor = django_filters.NumberFilter(field_name="actor_id", lookup_expr="exact")

    class Meta:
        model = Wash
        fields = ["volunteer", "actor"]

class WashViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Wash.objects.all()
    serializer_class = WashSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at'] 
    filterset_class = WashFilter

