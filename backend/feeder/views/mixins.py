from rest_framework.exceptions import ValidationError
from rest_framework.viewsets import ModelViewSet

from history.models import History


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


class SaveHistoryDataViewSetMixin(ModelViewSet):
    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "uuid"):
            request_user = user.uuid
        else:
            raise ValidationError({"permission": "You do not have permissions to perform this action"})

        super().perform_create(serializer)

        instance = serializer.instance
        History().entry_creation(status=History.STATUS_CREATE, instance=instance, request_user_uuid=request_user)

    def perform_update(self, serializer):
        user = self.request.user
        if hasattr(user, "uuid"):
            request_user = user.uuid
        else:
            raise ValidationError({"permission": "You do not have permissions to perform this action"})

        super().perform_update(serializer)

        instance = serializer.instance
        History().entry_creation(status=History.STATUS_UPDATE, instance=instance, request_user_uuid=request_user)

    def perform_destroy(self, instance):
        user = self.request.user
        if hasattr(user, "uuid"):
            request_user = user.uuid
        else:
            raise ValidationError({"permission": "You do not have permissions to perform this action"})

        instance_id = instance.id

        super().perform_destroy(instance)

        History().entry_creation(
            status=History.STATUS_DELETE,
            instance=instance,
            request_user_uuid=request_user,
            instance_id=instance_id
        )
