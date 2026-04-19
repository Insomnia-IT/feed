import arrow

from rest_framework import serializers, viewsets, permissions, filters, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from feeder import serializers
from feeder.calculate_statistic import calculate_statistics, STAT_DATE_FORMAT


class Statistics(APIView):
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='date_from',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Начальная дата',
                required=True,
            ),
            OpenApiParameter(
                name='date_to',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Конечная дата',
                required=True,
            ),
            OpenApiParameter(
                name='anonymous',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
            OpenApiParameter(
                name='group_badge',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
            OpenApiParameter(
                name='prediction_alg',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
            OpenApiParameter(
                name='apply_history',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
        ],
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
