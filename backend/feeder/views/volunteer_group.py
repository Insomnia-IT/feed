import json

from django.core.serializers import serialize
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.utils import timezone


from feeder import serializers
from feeder.models import Volunteer,VolunteerGroupOperation
from feeder.serializers import VolunteerSerializer, RetrieveVolunteerSerializer, VolunteerListSerializer, VolunteerGroupSerializer
from feeder.views.mixins import get_request_user_id

from history.models import History

from uuid import uuid4, UUID


class VolunteerGroupViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated, ]

    @extend_schema(
        request=serializers.VolunteerGroupSerializer(),
    )
    def post(self, request, *args, **kwargs):
        volunteers_ids = request.data.get('volunteers_ids', [])
        new_data_list = request.data.get('field_list', {})

        if not isinstance(volunteers_ids, list) or len(volunteers_ids) == 0:
            return Response({"error": "volunteer_ids should be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)
        
        new_data = {}
        for entity in new_data_list:
            new_data[entity['field']] = entity['data']
        
        if not isinstance(new_data, dict) or len(new_data) == 0:
            return Response({"error": "fields should be a non-empty dictionary"}, status=status.HTTP_400_BAD_REQUEST)

        updated_volunteers = []
        errors = []

        volunteers_before_update = Volunteer.objects.filter(id__in=volunteers_ids).values('id', *new_data.keys())
        original_data = {volunteer['id']: {field: volunteer[field] for field in new_data.keys()} for volunteer in volunteers_before_update}
        group_operation_uuid = uuid4()

        with transaction.atomic():
            for volunteer_id in volunteers_ids:
                try:
                    vol = Volunteer.objects.get(id=volunteer_id)
                    serializer = VolunteerSerializer(vol, data=new_data, partial=True, context={'request': request})
                    serializer.is_valid(raise_exception=True)

                    vol = serializer.save()
                    updated_volunteers.append(vol)

                    History.objects.create(
                        status=History.STATUS_UPDATE,
                        object_name='volunteer',
                        actor_badge=get_request_user_id(request.user),
                        action_at=timezone.now(),
                        data=new_data,
                        old_data=original_data[volunteer_id],
                        volunteer_uuid=str(vol.uuid),
                        group_operation_uuid=str(group_operation_uuid),
                    )
                except ValidationError as ve:
                    errors.append({"id": volunteer_id, "errors": ve.detail})
                except Volunteer.DoesNotExist:
                    errors.append({"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_id": volunteer_id})
                except Exception as e:
                    errors.append({"error": "Failed to renew volunteer data", "errors": f"{type(e)} {str(e)}"})
        if errors:
            return Response(
                {"updated": updated_volunteers,
                "errors": errors},
                status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"id": str(group_operation_uuid)},
            status=status.HTTP_200_OK)

class VolunteerGroupDeleteViewSet(APIView):  # viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated,]

    @extend_schema(responses={200: serializers.SimpleResponse},)
    def delete(self, request, pk):
        operation_id = pk
        if not operation_id:
            return Response({"error": "operation_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        print(operation_id)
        
        histories = History.objects.filter(
            group_operation_uuid=operation_id
        )

        if not histories.exists():
            return Response({"error": f"Operation with id {operation_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)

        group_operation_uuid = uuid4()
        updated_volunteers = []
        errors = []

        with transaction.atomic():
            for hist in histories:
                volunteer_id = hist.volunteer_uuid
                old_data = hist.old_data or {}
                new_data = hist.data or {}

                try:
                    vol = Volunteer.objects.get(uuid=UUID(volunteer_id))
                    serializer = VolunteerSerializer(vol, data=old_data, partial=True, context={'request': request})
                    serializer.is_valid(raise_exception=True)

                    vol = serializer.save()
                    updated_volunteers.append(vol)

                    History.objects.create(
                        status=History.STATUS_UPDATE,
                        object_name='volunteer',
                        actor_badge=1,
                        action_at=timezone.now(),
                        data=old_data,
                        old_data=new_data,
                        volunteer_uuid=str(vol.uuid),
                        group_operation_uuid=str(group_operation_uuid),
                    )
                except ValidationError as ve:
                    errors.append({"id": volunteer_id, "errors": ve.detail})
                except Volunteer.DoesNotExist:
                    errors.append({"error": f"Volunteer with id {volunteer_id} does not exist", "volunteer_id": volunteer_id})
                except Exception as e:
                    errors.append({"error": "Failed to renew volunteer data", "errors": f"{type(e)} {str(e)}"})

        if errors:
            return Response(
                {"updated": updated_volunteers,
                "errors": errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"id": str(group_operation_uuid),
            "updated": serialize("json", updated_volunteers)},
            status=status.HTTP_200_OK
        )
