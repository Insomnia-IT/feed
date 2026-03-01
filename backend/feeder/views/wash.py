from feeder.views.mixins import MultiSerializerViewSetMixin
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from feeder.models import Wash
from feeder.serializers import WashSerializer, WashListSerializer
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from feeder.views.xlsx import build_xlsx_response

class WashFilter(django_filters.FilterSet):
    volunteer = django_filters.NumberFilter(field_name="volunteer_id", lookup_expr="exact")
    actor = django_filters.NumberFilter(field_name="actor_id", lookup_expr="exact")

    class Meta:
        model = Wash
        fields = ["volunteer", "actor"]

class WashViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Wash.objects.all()
    serializer_class = WashSerializer
    serializer_action_classes = {
        'list': WashListSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at'] 
    filterset_class = WashFilter

    @action(detail=False, methods=['get'], url_path='export-xlsx')
    def export_xlsx(self, request):
        queryset = (
            self.filter_queryset(self.get_queryset())
            .select_related("volunteer", "actor")
            .prefetch_related("volunteer__directions", "volunteer__arrivals__status")
        )

        active_statuses = {"ARRIVED", "STARTED", "JOINED"}

        rows = []

        for wash in queryset.iterator(chunk_size=2000):
            wash_date = timezone.localtime(wash.created_at).date()
            current_arrival = next(
                (
                    arrival
                    for arrival in wash.volunteer.arrivals.all()
                    if arrival.status_id in active_statuses
                    and arrival.arrival_date < wash_date
                    and arrival.departure_date >= wash_date
                ),
                None,
            )

            if current_arrival:
                days_on_field = abs((wash_date - current_arrival.arrival_date).days)
            else:
                days_on_field = ""

            rows.append(
                [
                    wash.id,
                    wash.volunteer.name or "",
                    " ".join([name for name in [wash.volunteer.first_name, wash.volunteer.last_name] if name]),
                    ",".join(direction.name for direction in wash.volunteer.directions.all()),
                    days_on_field,
                    wash_date.strftime("%d.%m.%Y"),
                    wash.wash_count,
                    wash.actor.name or "",
                ]
            )

        return build_xlsx_response(
            filename="washes",
            worksheet_name="Washes",
            header=[
                "ID",
                "Call Sign",
                "Full Name",
                "Directions",
                "Days On Field",
                "Wash Date",
                "Wash Number",
                "Owl",
            ],
            rows=rows,
        )
