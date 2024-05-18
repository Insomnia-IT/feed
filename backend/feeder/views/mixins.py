from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

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
        History().entry_creation(status=History.STATUS_CREATE, instance=instance, request_user_uuid=user_id)

    def perform_update(self, serializer):
        user_id = get_request_user_id(self.request.user)

        super().perform_update(serializer)

        instance = serializer.instance
        History().entry_creation(status=History.STATUS_UPDATE, instance=instance, request_user_uuid=user_id)

    def perform_destroy(self, instance):
        user_id = get_request_user_id(self.request.user)

        instance_id = instance.id

        super().perform_destroy(instance)

        History().entry_creation(
            status=History.STATUS_DELETE,
            instance=instance,
            request_user_uuid=user_id,
            instance_id=instance_id
        )

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

