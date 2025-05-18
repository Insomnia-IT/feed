import arrow

from rest_framework import serializers, viewsets, permissions, filters, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from feeder import serializers
from feeder.utils import calculate_statistics, STAT_DATE_FORMAT


class Statistics(APIView):
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.FilterStatisticsSerializer,
        responses={
            200: serializers.StatisticsSerializer(many=True)
        },
    )
    def get(self, request):
        today = arrow.now().format(STAT_DATE_FORMAT)

        serializer = serializers.FilterStatisticsSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)

        result = calculate_statistics(
            serializer.validated_data.get('date_from', today),
            serializer.validated_data.get('date_to', today),
            serializer.validated_data.get('anonymous'),
            serializer.validated_data.get('group_badge'),
            serializer.validated_data.get('prediction_alg'),
            serializer.validated_data.get('apply_history')
        )

        return Response(
            serializers.StatisticsSerializer(result, many=True).data
        )
