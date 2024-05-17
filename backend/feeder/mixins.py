from django.contrib.auth import get_user_model
from django.db import models
from rest_framework.exceptions import ValidationError
from datetime import datetime

from config.get_request import current_request
from history.models import History


class TitleMixin(models.Model):
    title = models.CharField(verbose_name='Название', max_length=255)

    def __str__(self):
        return self.title

    class Meta:
        abstract = True


class NameMixin(models.Model):
    name = models.CharField(verbose_name='Название', max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        abstract = True


class NameIndexedMixin(models.Model):
    name = models.CharField(verbose_name='Название', max_length=255, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        abstract = True


class TimeMixin(models.Model):
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)

    class Meta:
        abstract = True


class CommentMixin(models.Model):
    comment = models.TextField(null=True, blank=True, verbose_name="Комментарий")

    class Meta:
        abstract = True


User = get_user_model()


def get_request_user_id(user):
    if hasattr(user, "uuid"):
        return user.uuid
    if isinstance(user, User):
        return user.id

    raise ValidationError({"permission": "You do not have permissions to perform this action"})


class SaveHistoryDataModelMixin(models.Model):

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from feeder.sync_serializers import get_history_serializer
        # todo что с user при получении данных от синхронизатора
        user_id = get_request_user_id(current_request().user)
        status = History.STATUS_UPDATE
        instance_name = str(self.__class__.__name__).lower()
        serializer = get_history_serializer(instance_name)
        action_at = datetime.utcnow()
        old_data = {}
        if hasattr(self, 'deleted_at') and self.deleted_at:
            status = History.STATUS_DELETE
            action_at = self.deleted_at
        if not self.pk:
            status = History.STATUS_CREATE
        else:
            cls = self.__class__
            old = cls._default_manager.get(pk=self.pk)
            old_data = serializer(old).data

        super().save(*args, **kwargs)

        changed_data = serializer(self).data
        for key, value in old_data.items():
            if changed_data.get(key) == value:
                changed_data.pop(key)

        if status == History.STATUS_CREATE and hasattr(self, "created_at"):
            action_at = self.created_at
        if status == History.STATUS_UPDATE and hasattr(self, "updated_at"):
            action_at = self.updated_at

        if changed_data:
            changed_data.update({"id": old_data.get("id")})
            history_data = {
                "status": status,
                "object_name": instance_name,
                "actor_badge": user_id,
                "action_at": action_at,
                "data": changed_data
            }
            History.objects.create(**history_data)

    def delete(self, *args, **kwargs):
        # todo что с user при получении данных от синхронизатора
        user_id = get_request_user_id(current_request().user)
        instance_name = str(self.__class__.__name__).lower()
        instance_id = self.uuid if hasattr(self, "uuid") else self.id

        super().delete(*args, **kwargs)

        history_data = {
            "status": History.STATUS_DELETE,
            "object_name": instance_name,
            "actor_badge": user_id,
            "action_at": datetime.utcnow(),
            "data": {
                "id": str(instance_id),
                "deleted": True
            }
        }
        History.objects.create(**history_data)
