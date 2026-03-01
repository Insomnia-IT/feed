
from django.utils import timezone
from rest_framework import serializers, viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models
from feeder.views.xlsx import build_xlsx_response


#@extend_schema(tags=['feed', ])
class FeedTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.FeedType.objects.all()
    serializer_class = serializers.FeedTypeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class FeedTransactionFilter(django_filters.FilterSet):
    dtime_from = django_filters.IsoDateTimeFilter(field_name="dtime", lookup_expr='gte')
    dtime_to = django_filters.IsoDateTimeFilter(field_name="dtime", lookup_expr='lte')
    meal_time = django_filters.CharFilter(field_name="meal_time", lookup_expr="exact")
    group_badge = django_filters.NumberFilter(field_name="group_badge")
    anonymous = django_filters.BooleanFilter(method="filter_anonymous")
    is_group_badge = django_filters.BooleanFilter(method="filter_is_group_badge")
    is_anomaly = django_filters.BooleanFilter(field_name="is_anomaly")

    def filter_anonymous(self, queryset, name, value):
        if value:
            return queryset.filter(volunteer__isnull=True)
        return queryset.filter(volunteer__isnull=False)

    def filter_is_group_badge(self, queryset, name, value):
        if value:
            return queryset.filter(group_badge__isnull=False)
        return queryset.filter(group_badge__isnull=True)

    class Meta:
        model = models.FeedTransaction
        fields = ['kitchen', 'volunteer', 'is_anomaly']


#@extend_schema(tags=['feed', ])
class FeedTransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.FeedTransaction.objects.all()
    serializer_class = serializers.FeedTransactionDisplaySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['volunteer__name', 'volunteer__first_name', 'volunteer__last_name']
    filterset_class = FeedTransactionFilter
    ordering = ('-dtime')

    def get_serializer_class(self):
        if self.action in ['create', ]:
            return serializers.FeedTransactionSerializer
        return serializers.FeedTransactionDisplaySerializer

    @action(detail=False, methods=['get'], url_path='export-xlsx')
    def export_xlsx(self, request):
        meal_map = {
            "breakfast": "Breakfast",
            "lunch": "Lunch",
            "dinner": "Dinner",
            "night": "Night"
        }

        queryset = (
            self.filter_queryset(self.get_queryset())
            .select_related("volunteer", "kitchen", "group_badge")
            .prefetch_related("volunteer__directions")
        )

        rows = []

        for tx in queryset.iterator(chunk_size=2000):
            local_dtime = timezone.localtime(tx.dtime) if tx.dtime else None
            volunteer_full_name = " ".join(
                [name for name in [getattr(tx.volunteer, "last_name", None), getattr(tx.volunteer, "first_name", None)] if name]
            )
            directions = ""
            if tx.volunteer_id:
                directions = ",".join(direction.name for direction in tx.volunteer.directions.all())

            rows.append(
                [
                    local_dtime.strftime("%d.%m.%Y") if local_dtime else "",
                    local_dtime.strftime("%H:%M:%S") if local_dtime else "",
                    tx.volunteer_id or "",
                    getattr(tx.volunteer, "name", None) or "Anonymous",
                    volunteer_full_name,
                    "" if tx.is_vegan is None else ("Vegan" if tx.is_vegan else "Meat"),
                    meal_map.get(tx.meal_time, tx.meal_time),
                    getattr(tx.kitchen, "name", None) or "",
                    tx.amount,
                    tx.reason or "",
                    getattr(tx.group_badge, "name", None) or "",
                    directions,
                ]
            )

        return build_xlsx_response(
            filename="feed-transactions",
            worksheet_name="Transactions log",
            header=[
                "Date",
                "Time",
                "Volunteer ID",
                "Call Sign",
                "Name",
                "Food Type",
                "Meal",
                "Kitchen",
                "Amount",
                "Reason",
                "Group Badge",
                "Directions",
            ],
            rows=rows,
        )


#@extend_schema(tags=['feed', ], summary="Массовое добавление приёмов пищи")
class FeedTransactionBulk(APIView):
    """
    Работа с массивом кормёжек
    """
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.FeedTransactionSerializer(many=True),
        responses={200: serializers.SimpleResponse},
    )
    def post(self, request):

        serializer = serializers.FeedTransactionSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializers.SimpleResponse({'success': True}).data
        )
