import json
import logging

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView


from feeder import serializers
from feeder.models import Volunteer,VolunteerGroupOperation
from feeder.serializers import VolunteerSerializer, RetrieveVolunteerSerializer, VolunteerListSerializer, VolunteerGroupSerializer


class VolunteerGroupViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.VolunteerGroupSerializer(),
    )
    def post(self, request, *args, **kwargs):
        volunteers_ids = request.data.get('volunteers_ids', [])
        new_data = {}
        new_data_list = request.data.get('field_list', {})
        for entity in new_data_list:
            new_data[entity['field']] = entity['data']
        if not isinstance(volunteers_ids, list) or len(volunteers_ids) == 0:
            return Response({"error": "volunteer_ids should be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(new_data, dict) or len(new_data) == 0:
            return Response({"error": "fields should be a non-empty dictionary"}, status=status.HTTP_400_BAD_REQUEST)

        updated_volunteers = []
        errors = []

        # Сохраняем предыдущие значения полей
        volunteers_before_update = Volunteer.objects.filter(id__in=volunteers_ids).values()
        original_data = {volunteer['id']: volunteer for volunteer in volunteers_before_update}
        print("New data: ", new_data)
        for volunteer_id in volunteers_ids:
            try:
                volunteer_instance = Volunteer.objects.get(id=volunteer_id)
                serializer = VolunteerSerializer(volunteer_instance, data=new_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_volunteers.append(serializer)
                else:
                    errors.append({"id": volunteer_id, "errors": serializer.errors})
            except Volunteer.DoesNotExist:
                errors.append({"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_id": volunteer_id})
            except Exception as e:
                errors.append({"error": "Failed to renew volunteer data", "errors": e})
        if errors:
            return Response({"updated": updated_volunteers, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Сохраняем новое состояние полей
        try:
            volunteers_after_update = Volunteer.objects.filter(id__in=volunteers_ids).values()
            new_data = {volunteer['id']: volunteer for volunteer in volunteers_after_update}
            # Создаем лог
            volunteer_log_instance = VolunteerGroupOperation.objects.create(
                volunteers_ids=volunteers_ids,
                original_data=json.dumps(original_data, default=str),
                new_data=json.dumps(new_data, default=str)
            )
            volunteer_log_instance.save()
        except Exception as e:
            return Response({"error": "Failed to log the operation", "errors": e},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"id": volunteer_log_instance.group_operation_id}, status=status.HTTP_200_OK)

class VolunteerGroupDeleteViewSet(APIView):  # viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated,]
    @extend_schema(responses={200: serializers.SimpleResponse},)
    def delete(self, request, pk):
        operation_id = pk
        if not operation_id:
            return Response({"error": "operation_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            log_entry = VolunteerGroupOperation.objects.get(group_operation_id=operation_id)
        except VolunteerGroupOperation.DoesNotExist:
            return Response({"error": f"Operation with id {operation_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)

        original_data = log_entry.original_data

        updated_volunteers = []
        errors = []

        for volunteer_data in json.loads(original_data).values():
            print(volunteer_data)
            volunteer_id = volunteer_data['id']
            try:
                volunteer_instance = Volunteer.objects.get(id=volunteer_id)
                serializer = VolunteerSerializer(volunteer_instance, data=volunteer_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_volunteers.append(serializer.data)
                    volunteer_instance.save()
                else:
                    errors.append({"id": volunteer_id, "errors": serializer.errors})
            except Volunteer.DoesNotExist:
                errors.append(
                    {"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_data": volunteer_data})

        if errors:
            return Response({"updated": updated_volunteers, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response(updated_volunteers, status=status.HTTP_200_OK)
