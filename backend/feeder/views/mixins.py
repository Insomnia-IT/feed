from datetime import datetime

from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from feeder.sync_serializers import get_history_serializer
from history.models import History
from feeder.models import Arrival, VolunteerCustomField, VolunteerCustomFieldValue


User = get_user_model()


class VolunteerExtraFilterMixin(ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()

        arrival_date = self.request.query_params.get('arrival_date')
        departure_date = self.request.query_params.get('departure_date')
        staying_date = self.request.query_params.get('staying_date')
        arrival_status = self.request.query_params.get('arrival_status')
        custom_field_name = self.request.query_params.get('custom_field_name')
        custom_field_id = self.request.query_params.get('custom_field_id')
        custom_field_value = self.request.query_params.get('custom_field_value')
        custom_field_id_empty = self.request.query_params.get('custom_field_id_empty')

        if arrival_date or departure_date or staying_date or arrival_status:
            arrive_qs = Arrival.objects.all()
            if arrival_date:
                arrive_qs = arrive_qs.filter(arrival_date=arrival_date)
            if departure_date:
                arrive_qs = arrive_qs.filter(departure_date=departure_date)
            if staying_date:
                arrive_qs = arrive_qs.filter(arrival_date__lte=staying_date, departure_date__gte=staying_date)
            if arrival_status and arrival_status.isnumeric():
                arrive_qs = arrive_qs.filter(status__id=arrival_status)
            qs = qs.filter(id__in=arrive_qs.values_list('volunteer_id', flat=True))

        if ((custom_field_name or custom_field_id) and custom_field_value) or custom_field_id_empty:
            custom_fields_qs = VolunteerCustomFieldValue.objects.all()
            if custom_field_id_empty:
                custom_fields_qs = custom_fields_qs.filter(custom_field__id=custom_field_id_empty)
                qs = qs.exclude(
                    id__in=custom_fields_qs.values_list('volunteer_id', flat=True)
                )
            else:
                if custom_field_id and custom_field_id.isnumeric():
                    custom_fields_qs = custom_fields_qs.filter(custom_field__id=custom_field_id)
                elif custom_field_name:
                    custom_fields_qs = custom_fields_qs.filter(custom_field__name=custom_field_name)
                if custom_field_value:
                    custom_fields_qs = custom_fields_qs.filter(value=custom_field_value)
                qs = qs.filter(id__in=custom_fields_qs.values_list('volunteer_id', flat=True))

        return qs


class SoftDeleteViewSetMixin(ModelViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.query_params.get("all_qs", None):
            return qs.filter(deleted_at=None)
        return qs

    # @action(methods=["delete"], detail=True, url_path="hard_delete")
    # def hard_delete(self, request, pk=None):
    #     instance = self.get_object()
    #     self.perform_hard_destroy(instance)
    #     return Response(status=status.HTTP_204_NO_CONTENT)
    #
    # def perform_hard_destroy(self, instance: SoftDeleteModelMixin):
    #     instance.hard_delete()


def get_request_user_id(user):
    if hasattr(user, "uuid"):
        return user.uuid
    if isinstance(user, User):
        return user.id

    raise ValidationError({"permission": "You do not have permissions to perform this action"})


class SaveHistoryDataViewSetMixin(ModelViewSet):
    def perform_create(self, serializer):
        user_id = get_request_user_id(self.request.user)

        super().perform_create(serializer)

        instance = serializer.instance
        instance_name = str(instance.__class__.__name__).lower()
        history_serializer = get_history_serializer(instance_name)
        history_data = {
            "status": History.STATUS_CREATE,
            "object_name": instance_name,
            "actor_badge": user_id,
            "action_at": instance.created_at if hasattr(instance, "created_at") else datetime.utcnow(),
            "data": history_serializer(instance).data
        }
        history_data['data'].update('badge', str(instance.volunteer.uuid) if hasattr(instance, "volunteer") else str(instance.uuid))
        History.objects.create(**history_data)

    def perform_update(self, serializer):
        user_id = get_request_user_id(self.request.user)
        old = serializer.instance
        instance_name = str(old.__class__.__name__).lower()
        history_serializer = get_history_serializer(instance_name)
        old_instance_data = history_serializer(old).data

        super().perform_update(serializer)

        instance = serializer.instance
        new_data = history_serializer(instance).data
        changed_data = {}
        old_data = {}
        for key, value in new_data.items():
            old_value = old_instance_data.get(key)
            if value != old_value:
                changed_data.update({key: value})
                old_data.update({key: old_value})
        if changed_data:
            instance_id = new_data.get("id")
            changed_data.update({"id": instance_id})
            changed_data.update({"badge": str(instance.volunteer.uuid) if hasattr(instance, "volunteer") else str(instance.uuid)})
            history_data = {
                "status": History.STATUS_UPDATE,
                "object_name": instance_name,
                "actor_badge": user_id,
                "action_at": instance.updated_at if hasattr(instance, "updated_at") else datetime.utcnow(),
                "data": changed_data,
                "old_data": old_data
            }
            History.objects.create(**history_data)



    def perform_destroy(self, instance):
        user_id = get_request_user_id(self.request.user)

        instance_id = instance.uuid if hasattr(instance, "uuid") else instance.id
        instance_name = str(instance.__class__.__name__).lower()

        super().perform_destroy(instance)

        history_data = {
            "status": History.STATUS_DELETE,
            "object_name": instance_name,
            "actor_badge": user_id,
            "action_at": instance.updated_at if hasattr(instance, "updated_at") else datetime.utcnow(),
            "data": {
                "id": str(instance_id),
                "badge": str(instance.volunteer.uuid) if hasattr(instance, "volunteer") else str(instance.uuid),
                "deleted": True
            }
        }
        History.objects.create(**history_data)

class MultiSerializerViewSetMixin(object):
    def get_serializer_class(self):
        """
        Смотрим на serializer class в self.serializer_action_classes, который представляет из себя
        dict mapping action name (key) в serializer class (value), например::
        class MyViewSet(MultiSerializerViewSetMixin, ViewSet):
            serializer_class = MyDefaultSerializer
            serializer_action_classes = {
               'list': MyListSerializer,
               'my_action': MyActionSerializer,
            }

            @action
            def my_action:
                ...

        Если подходящих вхождений в action нет тогда просто fallback к обычному
        get_serializer_class lookup: self.serializer_class, DefaultSerializer.
        """
        try:
            return self.serializer_action_classes[self.action]
        except (KeyError, AttributeError):
            return super(MultiSerializerViewSetMixin, self).get_serializer_class()

