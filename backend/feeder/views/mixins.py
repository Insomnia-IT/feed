from datetime import datetime

from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from feeder.sync_serializers import get_history_serializer
from history.models import History

User = get_user_model()


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
        data = history_serializer(instance).data
        if hasattr(instance, "volunteer"):
            data.update({"badge": str(instance.volunteer.uuid)})
        elif str(instance.__class__.__name__).lower() == "volunteer":
            data.update({"badge": str(instance.uuid)})

        history_data = {
            "status": History.STATUS_CREATE,
            "object_name": instance_name,
            "actor_badge": user_id,
            "action_at": instance.created_at if hasattr(instance, "created_at") else datetime.utcnow(),
            "data": data
        }

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
            if hasattr(instance, "volunteer"):
                changed_data.update({"badge": str(instance.volunteer.uuid)})
            elif str(instance.__class__.__name__).lower() == "volunteer":
                changed_data.update({"badge": str(instance.uuid)})
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

        instance_name = str(instance.__class__.__name__).lower()
        data = {
                "id": instance.uuid if hasattr(instance, "uuid") else instance.id,
                "deleted": True
            }

        if hasattr(instance, "volunteer"):
            data.update({"badge": str(instance.volunteer.uuid)})
        elif str(instance.__class__.__name__).lower() == "volunteer":
            data.update({"badge": str(instance.uuid)})

        super().perform_destroy(instance)

        history_data = {
            "status": History.STATUS_DELETE,
            "object_name": instance_name,
            "actor_badge": user_id,
            "action_at": instance.updated_at if hasattr(instance, "updated_at") else datetime.utcnow(),
            "data": data
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

