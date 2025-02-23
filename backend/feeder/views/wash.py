from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from feeder.models import Wash
from feeder.serializers import WashSerializer
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import LimitOffsetPagination

class WashViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Wash.objects.all()
    serializer_class = WashSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['volunteer_id', 'actor_id']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        volunteer_id = self.kwargs.get('id')
        limit = self.request.query_params.get('limit', None)
        
        queryset = Wash.objects.filter(volunteer_id=volunteer_id).order_by('-created_at')

        if limit is not None:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass
        
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(queryset),
            'results': serializer.data
        })
