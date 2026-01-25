from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.utils import timezone


from feeder import serializers
from feeder.models import Volunteer, VolunteerGroupOperation, VolunteerCustomFieldValue, Arrival, VolunteerCustomField
from feeder.serializers import VolunteerSerializer, RetrieveVolunteerSerializer, VolunteerListSerializer, VolunteerGroupSerializer, ArrivalSerializer
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
        new_data_list = request.data.get('field_list', [])
        new_data_arrival_list = request.data.get('arrival_field_list', [])
        new_data_custom_list = request.data.get('custom_field_list', [])

        # Проверки правильности структуры запроса
        if not new_data_list and not new_data_custom_list and not new_data_arrival_list:
            return Response({"error": "fields, arrivals or custom fields should be set"}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(volunteers_ids, list) or len(volunteers_ids) == 0:
            return Response({"error": "volunteer_ids should be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        vol_allowed = set(VolunteerSerializer().fields.keys())

        arr_allowed = set(ArrivalSerializer().fields.keys())

        new_data = {}
        new_data_arrival = {}
        invalid_vol = []
        invalid_arr = []

        for entity in new_data_list:
            new_data[entity['field']] = entity['data']
            if entity['field'] not in vol_allowed:
                invalid_vol.append(entity['field'])

        for entity in new_data_arrival_list:
            new_data_arrival[entity['field']] = entity['data']
            if entity['field'] not in arr_allowed:
                invalid_arr.append(entity['field'])
            if entity and not isinstance(entity, dict):
                return Response({"error": "fields should be a non-empty dictionary"},
                                status=status.HTTP_400_BAD_REQUEST)
        custom_fields_data = {}
        for entity in new_data_custom_list:
            if entity and not isinstance(entity, dict):
                return Response({"error": "custom fields should be a non-empty dictionary"},
                                status=status.HTTP_400_BAD_REQUEST)
            custom_fields_data[entity['field']] = entity['data']

        # Получаем существующие значения для обновления
        existing_custom_values = VolunteerCustomFieldValue.objects.filter(
            volunteer_id__in=volunteers_ids,
            custom_field_id__in=custom_fields_data.keys()
            )

        # Создаем словарь для быстрого доступа
        value_map = {
            (v.volunteer_id, v.custom_field.id): v for v in existing_custom_values
        }
        value_map_old = {
            (v.volunteer_id, v.custom_field.id): str(v.value) for v in existing_custom_values
        }

        if invalid_vol or invalid_arr:
            return Response({
                "error": "Found invalid fields",
                "invalid_volunteer_fields": invalid_vol,
                "invalid_arrival_fields": invalid_arr
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_volunteers = []
        errors = []
        missing_arrs = []

        volunteers_before_update = Volunteer.objects.filter(id__in=volunteers_ids).values('id', *new_data.keys())
        original_data = {volunteer['id']: {field: volunteer[field] for field in new_data.keys()} for volunteer in volunteers_before_update}
        
        group_operation_uuid = uuid4()

        with transaction.atomic():
            last_custom_field_value = VolunteerCustomFieldValue.objects.order_by("-id").first()
            change_id = last_custom_field_value.id + 1 if last_custom_field_value else 1
            for volunteer_id in volunteers_ids:
                to_update = []
                to_create = []

                try:
                    vol = Volunteer.objects.get(id=volunteer_id)

                    arrivals = Arrival.objects.filter(volunteer=vol)

                    all_arrivals = []
                    today = timezone.localdate()
                    target = None
                    if new_data_arrival:
                        target = (
                            arrivals
                            .filter(departure_date__gte=today)
                            .order_by('arrival_date')
                            .first()
                        )
                        if not target:
                            missing_arrs.append(volunteer_id)
                    
                    for arr in arrivals:
                        entry = {"id": arr.id}
                        if target and arr.id == target.id:
                            entry.update(new_data_arrival)
                        all_arrivals.append(entry)
                    
                    payload = new_data.copy()
                    if new_data_arrival and target:
                        payload['arrivals'] = all_arrivals

                    context = {'request': request, 'group_op': group_operation_uuid}

                    if target:
                        context['arr_id'] = target.id
                    if payload:
                        serializer = VolunteerSerializer(vol, data=payload, partial=True, context=context)
                        serializer.is_valid(raise_exception=True)

                        vol = serializer.save()
                        updated_volunteers.append(vol.id)

                        if len(new_data.keys()) > 0:
                            history_data = new_data.copy()
                            history_data['id'] = str(vol.uuid)

                            History.objects.create(
                                status=History.STATUS_UPDATE,
                                object_name='volunteer',
                                actor_badge=get_request_user_id(request.user),
                                action_at=timezone.now(),
                                data=history_data,
                                old_data=original_data[volunteer_id],
                                volunteer_uuid=str(vol.uuid),
                                group_operation_uuid=str(group_operation_uuid),
                            )

                    for field_name, value in custom_fields_data.items():
                        key = (volunteer_id, int(field_name))
                        value = str(value) if value is not None else ""
                        if key in value_map.keys():
                            # Обновляем существующее значение
                            db_value = value_map[key]
                            db_value.value = value
                            to_update.append(db_value)
                        else:
                            # Добавляем новые поля
                            to_create.append(
                                VolunteerCustomFieldValue(
                                    id = change_id,
                                    volunteer_id = volunteer_id,
                                    value = value,
                                    custom_field_id=field_name
                                ))
                            change_id+=1
                    if to_update:
                        VolunteerCustomFieldValue.objects.bulk_update(
                            to_update, ['value']
                        )

                        for custom_field in custom_fields_data.keys():
                            History.objects.create(
                                status=History.STATUS_UPDATE,
                                object_name='volunteercustomfieldvalue',
                                actor_badge=get_request_user_id(request.user),
                                action_at=timezone.now(),
                                data={"value": custom_fields_data[custom_field], "custom_field": custom_field, "id": value_map[(volunteer_id, int(custom_field))].id},
                                old_data={"value": value_map_old[(volunteer_id, int(custom_field))]},
                                volunteer_uuid=str(vol.uuid),
                                group_operation_uuid=str(group_operation_uuid),
                            )
                    if to_create:
                        VolunteerCustomFieldValue.objects.bulk_create(
                            to_create,
                        )
                        for custom_field in custom_fields_data.keys():
                            History.objects.create(
                                status=History.STATUS_CREATE,
                                object_name='volunteercustomfieldvalue',
                                actor_badge=get_request_user_id(request.user),
                                action_at=timezone.now(),
                                data={"value": custom_fields_data[custom_field], "custom_field": custom_field, "id": change_id},
                                old_data=None,
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
                {"errors": errors},
                status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"id": str(group_operation_uuid),
             "missing_arrivals": missing_arrs},
            status=status.HTTP_200_OK)

class VolunteerGroupDeleteViewSet(APIView):  # viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated,]

    @extend_schema(responses={200: serializers.SimpleResponse},)
    def delete(self, request, pk):
        operation_id = pk
        if not operation_id:
            return Response({"error": "operation_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        histories = History.objects.filter(
            group_operation_uuid=operation_id
        )

        if not histories.exists():
            return Response({"error": f"Operation with id {operation_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)

        group_operation_uuid = uuid4()
        updated_volunteers = []
        errors = []

        try:
            with transaction.atomic():

                for hist in histories.filter(object_name='volunteer'):
                    volunteer_id = hist.volunteer_uuid
                    old_data = hist.old_data or {}
                    new_data = hist.data or {}

                    vol = Volunteer.objects.get(uuid=UUID(volunteer_id))
                    serializer = VolunteerSerializer(vol, data=old_data, partial=True, context={'request': request})
                    serializer.is_valid(raise_exception=True)

                    vol = serializer.save()
                    updated_volunteers.append(vol.id)

                    History.objects.create(
                        status=History.STATUS_UPDATE,
                        object_name='volunteer',
                        actor_badge=get_request_user_id(request.user),
                        action_at=timezone.now(),
                        data=old_data,
                        old_data=new_data,
                        volunteer_uuid=str(vol.uuid),
                        group_operation_uuid=str(group_operation_uuid),
                    )
                
                for hist in histories.filter(object_name='arrival'):
                    volunteer_id = hist.volunteer_uuid
                    old_data = hist.old_data or {}
                    new_data = hist.data or {}

                    vol = Volunteer.objects.get(uuid=UUID(volunteer_id))
                    arrivals = Arrival.objects.filter(volunteer=vol)

                    arr_id = old_data.get('id')
                    target = arrivals.get(id=arr_id)

                    if not target:
                        continue

                    all_arrivals = []
                    for arr in arrivals:
                        entry = {"id": arr.id}
                        if target and arr.id == target.id:
                            entry.update(old_data)
                        all_arrivals.append(entry)
                    
                    payload = {}
                    payload['arrivals'] = all_arrivals

                    context = {'request': request, 'group_op': group_operation_uuid, 'arr_id': target.id}

                    serializer = VolunteerSerializer(vol, data=payload, partial=True, context=context)
                    serializer.is_valid(raise_exception=True)

                    vol = serializer.save()
                    updated_volunteers.append(vol.id)
                for hist in histories.filter(object_name='volunteercustomfieldvalue'):
                    volunteer_id = Volunteer.objects.get(uuid=hist.volunteer_uuid).id
                    data = hist.data
                    old_data = hist.old_data
                    custom_field = data["custom_field"]
                    custom_field_value = VolunteerCustomFieldValue.objects.get(
                            volunteer_id=volunteer_id,
                            custom_field_id=custom_field,
                        )
                    if str(custom_field_value) == hist.data["value"]:
                        if old_data:
                            VolunteerCustomFieldValue.objects.filter(
                                volunteer_id=volunteer_id,
                                custom_field_id=custom_field,
                            ).update(value = old_data["value"])
                            History.objects.create(
                                status=History.STATUS_UPDATE,
                                object_name='volunteercustomfieldvalue',
                                actor_badge=get_request_user_id(request.user),
                                action_at=timezone.now(),
                                data={"value": old_data["value"], "custom_field": custom_field,
                                    "id": data["id"]},
                                old_data={"value": hist.data["value"]},
                                volunteer_uuid=hist.volunteer_uuid,
                                group_operation_uuid=str(group_operation_uuid),
                            )
                        elif old_data is None:
                            VolunteerCustomFieldValue.objects.filter(
                                volunteer_id=volunteer_id,
                                custom_field_id=custom_field,
                            ).delete()
                            History.objects.create(
                                status=History.STATUS_UPDATE,
                                object_name='volunteercustomfieldvalue',
                                actor_badge=get_request_user_id(request.user),
                                action_at=timezone.now(),
                                data={"value": None, "custom_field": custom_field,
                                      "id": data["id"]},
                                old_data={"value": hist.data["value"]},
                                volunteer_uuid=hist.volunteer_uuid,
                                group_operation_uuid=str(group_operation_uuid),
                            )
                    else:
                        errors.append({"id": volunteer_id, "errors": "volunteer data was already changed after group operation"})
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
            "updated":  updated_volunteers},
            status=status.HTTP_200_OK
        )
