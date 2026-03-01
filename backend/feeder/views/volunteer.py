from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from django import forms
from django.db.models import Exists, OuterRef
from django.utils import timezone
from datetime import timedelta
import re
from distutils.util import strtobool


from feeder import serializers, models
from feeder.views.mixins import MultiSerializerViewSetMixin, SoftDeleteViewSetMixin, \
    SaveHistoryDataViewSetMixin, VolunteerExtraFilterMixin
from feeder.views.xlsx import build_xlsx_response


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class TypedChoiceFilter(django_filters.Filter):
    field_class = forms.TypedChoiceField

class VolunteerFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')
    first_name = django_filters.CharFilter(field_name="first_name", lookup_expr='icontains')
    last_name = django_filters.CharFilter(field_name="last_name", lookup_expr='icontains')
    name = django_filters.CharFilter(field_name="name", lookup_expr='icontains')
    phone = django_filters.CharFilter(field_name="phone", lookup_expr='icontains')
    email = django_filters.CharFilter(field_name="email", lookup_expr='icontains')
    qr = django_filters.CharFilter(field_name="qr", lookup_expr='iexact')
    printing_batch = django_filters.CharFilter(field_name="printing_batch", lookup_expr='iexact')
    badge_number = django_filters.CharFilter(field_name="badge_number", lookup_expr='icontains')
    comment = django_filters.CharFilter(field_name="comment", lookup_expr='icontains')
    is_blocked = TypedChoiceFilter(choices=[('true','true'),('false','false')], coerce=strtobool)
    is_ticket_received = django_filters.BooleanFilter(method='filter_is_ticket_received')
    is_vegan = TypedChoiceFilter(choices=[('true','true'),('false','false')], coerce=strtobool)
    updated_at__from = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr='gte')

    direction_id = django_filters.CharFilter(field_name="directions__id", lookup_expr='iexact')
    direction_name = django_filters.CharFilter(field_name="directions__name", lookup_expr='icontains')
    directions = django_filters.ModelMultipleChoiceFilter(queryset=models.Direction.objects.all())
    scanner_comment = django_filters.CharFilter(field_name="scanner_comment", lookup_expr='icontains')
    responsible_id = django_filters.CharFilter(field_name="responsible_id", lookup_expr='exact')
    supervisor_id = django_filters.CharFilter(field_name="supervisor_id", lookup_expr='exact')
    has_supervisor = django_filters.BooleanFilter(method='filter_has_supervisor')
    is_supervisor = django_filters.BooleanFilter(method='filter_is_supervisor')
    infant = TypedChoiceFilter(choices=[('true', 'true'), ('false', 'false')], coerce=strtobool)

    def filter_has_supervisor(self, queryset, name, value):
        if value is None:
            return queryset

        return queryset.filter(supervisor_id__isnull=not value)

    def filter_is_supervisor(self, queryset, name, value):
        if value is None:
            return queryset

        supervisees_qs = models.Volunteer.objects.filter(supervisor_id=OuterRef('pk'))
        queryset = queryset.annotate(is_supervisor=Exists(supervisees_qs))

        return queryset.filter(is_supervisor=value)

    def filter_is_ticket_received(self, queryset, name, value):
        if value:
            return queryset.filter(is_ticket_received=True)
        return queryset.exclude(is_ticket_received=True)

    class Meta:
        model = models.Volunteer
        fields = ['feed_type', 'kitchen', 'group_badge', 'main_role', 'access_role', 'uuid']


class VolunteerCustomFieldValueFilter(django_filters.FilterSet):
    id__in = NumberInFilter(field_name='id', lookup_expr='in')

    class Meta:
        model = models.VolunteerCustomFieldValue
        fields = ['custom_field', 'volunteer']


class VolunteerRoleFilter(django_filters.FilterSet):
    class Meta:
        model = models.VolunteerRole
        fields = ['is_group_badge']


class VolunteerViewSet(VolunteerExtraFilterMixin, SoftDeleteViewSetMixin,
                       MultiSerializerViewSetMixin, SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Volunteer.objects.all()
    serializer_class = serializers.VolunteerSerializer
    serializer_action_classes = {
        'list': serializers.VolunteerListSerializer,
        'retrieve': serializers.RetrieveVolunteerSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr', 'uuid',
                     'person__name', 'person__last_name', 'person__first_name', 'person__nickname', 'person__other_names', 'person__telegram']
    filterset_class = VolunteerFilter

    @action(detail=False, methods=['get'], url_path='export-xlsx')
    def export_xlsx(self, request):
        queryset = (
            self.filter_queryset(self.get_queryset())
            .select_related("main_role", "kitchen", "feed_type", "access_role")
            .prefetch_related(
                "directions",
                "arrivals__status",
                "arrivals__arrival_transport",
                "arrivals__departure_transport",
                "custom_field_values__custom_field",
            )
        )

        custom_fields = list(models.VolunteerCustomField.objects.order_by("id").values("id", "name", "type"))
        today = timezone.localdate()
        active_statuses = {"ARRIVED", "STARTED", "JOINED"}

        rows = []

        for volunteer in queryset.iterator(chunk_size=2000):
            arrivals = sorted(list(volunteer.arrivals.all()), key=lambda arrival: arrival.arrival_date)

            current_arrival = next(
                (
                    arrival
                    for arrival in arrivals
                    if arrival.status_id in active_statuses
                    and arrival.arrival_date < today
                    and arrival.departure_date > (today - timedelta(days=1))
                ),
                None,
            )
            future_arrival = next((arrival for arrival in arrivals if arrival.arrival_date > today), None)

            custom_values_by_field_id = {
                field_value.custom_field_id: field_value.value for field_value in volunteer.custom_field_values.all()
            }

            custom_values = []
            for custom_field in custom_fields:
                value = custom_values_by_field_id.get(custom_field["id"], "")
                if custom_field["type"] == "boolean":
                    custom_values.append(1 if value == "true" else 0)
                else:
                    custom_values.append(value)

            rows.append(
                [
                    volunteer.id,
                    volunteer.name or "",
                    volunteer.first_name or "",
                    volunteer.last_name or "",
                    ", ".join(direction.name for direction in volunteer.directions.all()),
                    volunteer.main_role.name if volunteer.main_role else "",
                    current_arrival.status.name if current_arrival and current_arrival.status else "",
                    current_arrival.arrival_date.strftime("%d.%m.%Y") if current_arrival else "",
                    current_arrival.arrival_transport.name if current_arrival and current_arrival.arrival_transport else "",
                    current_arrival.departure_date.strftime("%d.%m.%Y") if current_arrival else "",
                    current_arrival.departure_transport.name if current_arrival and current_arrival.departure_transport else "",
                    future_arrival.status.name if future_arrival and future_arrival.status else "",
                    future_arrival.arrival_date.strftime("%d.%m.%Y") if future_arrival else "",
                    future_arrival.arrival_transport.name if future_arrival and future_arrival.arrival_transport else "",
                    future_arrival.departure_date.strftime("%d.%m.%Y") if future_arrival else "",
                    future_arrival.departure_transport.name if future_arrival and future_arrival.departure_transport else "",
                    1 if volunteer.is_blocked else 0,
                    volunteer.kitchen.name if volunteer.kitchen else "",
                    volunteer.printing_batch or "",
                    volunteer.feed_type.name if volunteer.feed_type else "",
                    "vegan" if volunteer.is_vegan else "meat",
                    1 if volunteer.is_ticket_received else 0,
                    re.sub(r"<[^>]*>", "", volunteer.comment or ""),
                    volunteer.access_role.name if volunteer.access_role else "",
                    *custom_values,
                ]
            )

        return build_xlsx_response(
            filename="volunteers",
            worksheet_name="Volunteers",
            header=[
                "ID",
                "Call Sign",
                "First Name",
                "Last Name",
                "Directions",
                "Role",
                "Current Arrival Status",
                "Current Arrival Date",
                "Current Arrival Transport",
                "Current Departure Date",
                "Current Departure Transport",
                "Future Arrival Status",
                "Future Arrival Date",
                "Future Arrival Transport",
                "Future Departure Date",
                "Future Departure Transport",
                "Blocked",
                "Kitchen",
                "Badge Batch",
                "Food Type",
                "Vegan/Meat",
                "Ticket Received",
                "Comment",
                "Access Role",
                *[field["name"] for field in custom_fields],
            ],
            rows=rows,
        )



class VolunteerCustomFieldViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomField.objects.all()
    serializer_class = serializers.VolunteerCustomFieldSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]


class VolunteerCustomFieldValueViewSet(SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerCustomFieldValue.objects.all()
    serializer_class = serializers.VolunteerCustomFieldValueSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = VolunteerCustomFieldValueFilter


class VolunteerRoleViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.VolunteerRole.objects.all()
    serializer_class = serializers.VolunteerRoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VolunteerRoleFilter
    search_fields = ['name', ]


class AccessRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.AccessRole.objects.all()
    serializer_class = serializers.AccessRoleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
