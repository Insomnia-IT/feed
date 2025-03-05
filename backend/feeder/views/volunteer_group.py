import uuid
from django.core.serializers import serialize
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from feeder.models import Volunteer


class Volunteer_Group_ViewSet(VolunteerExtraFilterMixin, SoftDeleteViewSetMixin,
                       MultiSerializerViewSetMixin, SaveHistoryDataViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Volunteer.objects.all()
    serializer_class = serializers.VolunteerSerializer
    serializer_action_classes = {
        'list': serializers.VolunteerListSerializer,
        'retrieve': serializers.RetrieveVolunteerSerializer
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'name', 'phone', 'email', 'qr', 'uuid']
    filterset_class = VolunteerFilter


@action(detail=False, methods=['patch'])
def bulk_update(self, request, *args, **kwargs):
    volunteer_ids = request.data.get('volunteer_ids', [])
    fields_to_update = request.data.get('fields', {})

    if not isinstance(volunteer_ids, list) or len(volunteer_ids) == 0:
        return Response({"error": "volunteer_ids should be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(fields_to_update, dict) or len(fields_to_update) == 0:
        return Response({"error": "fields should be a non-empty dictionary"}, status=status.HTTP_400_BAD_REQUEST)

    updated_volunteers = []
    errors = []

    # Сохраняем предыдущие значения полей
    volunteers_before_update = Volunteer.objects.filter(id__in=volunteer_ids).values()
    fields_before_update = {volunteer['id']: volunteer for volunteer in volunteers_before_update}

    for volunteer_id in volunteer_ids:
        try:
            volunteer_instance = Volunteer.objects.get(id=volunteer_id)
            serializer = self.get_serializer(volunteer_instance, data=fields_to_update, partial=True)
            if serializer.is_valid():
                serializer.save()
                updated_volunteers.append(serializer.data)
            else:
                errors.append({"id": volunteer_id, "errors": serializer.errors})
        except Volunteer.DoesNotExist:
            errors.append({"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_id": volunteer_id})

    if errors:
        return Response({"updated": updated_volunteers, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

    # Сохраняем новое состояние полей
    volunteers_after_update = Volunteer.objects.filter(id__in=volunteer_ids).values()
    fields_after_update = {volunteer['id']: volunteer for volunteer in volunteers_after_update}

    # Создаем лог операции
    log_data = {
        "volunteer_ids": volunteer_ids,
        "fields_before_update": fields_before_update,
        "fields_after_update": fields_after_update
    }
    log_serializer = VolunteerUpdateLogSerializer(data=log_data)
    if log_serializer.is_valid():
        log_serializer.save()
    else:
        return Response({"error": "Failed to log the operation", "errors": log_serializer.errors},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(updated_volunteers, status=status.HTTP_200_OK)


@action(detail=False, methods=['post'])
def rollback(self, request, *args, **kwargs):
    operation_id = request.data.get('operation_id')

    if not operation_id:
        return Response({"error": "operation_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        log_entry = VolunteerUpdateLog.objects.get(operation_id=operation_id)
    except VolunteerUpdateLog.DoesNotExist:
        return Response({"error": f"Operation with id {operation_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)

    fields_before_update = log_entry.fields_before_update

    updated_volunteers = []
    errors = []

    for volunteer_data in fields_before_update.values():
        volunteer_id = volunteer_data['id']
        try:
            volunteer_instance = Volunteer.objects.get(id=volunteer_id)
            serializer = self.get_serializer(volunteer_instance, data=volunteer_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                updated_volunteers.append(serializer.data)
            else:
                errors.append({"id": volunteer_id, "errors": serializer.errors})
        except Volunteer.DoesNotExist:
            errors.append(
                {"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_data": volunteer_data})

    if errors:
        return Response({"updated": updated_volunteers, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response(updated_volunteers, status=status.HTTP_200_OK)
