from rest_framework import generics
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from feeder.models import Wash
from feeder.serializers import WashSerializer

class WashCreateView(generics.CreateAPIView):
    queryset = Wash.objects.all()
    serializer_class = WashSerializer


class VolunteerWashesView(generics.ListAPIView):
    serializer_class = WashSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        volunteer_id = self.kwargs['id']
        limit = self.request.query_params.get('limit', None)
        
        queryset = Wash.objects.filter(volunteer_id=volunteer_id).order_by('-created_at')
        
        if limit is not None:
            queryset = queryset[:int(limit)]  
        
        return queryset
