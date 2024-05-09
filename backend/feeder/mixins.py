from django.contrib.auth import get_user_model
from django.db import models
from rest_framework.exceptions import ValidationError

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
        # todo что с user при получении данных от синхронизатора
        user_id = get_request_user_id(current_request().user)
        status = History.STATUS_UPDATE
        if not self.id:
            status = History.STATUS_CREATE
        if hasattr(self, 'deleted_at') and self.deleted_at is not None:
            status = History.STATUS_DELETE

        super().save(*args, **kwargs)

        History().entry_creation(status=status, instance=self, request_user_uuid=user_id)

    def delete(self, *args, **kwargs):
        # todo что с user при получении данных от синхронизатора
        user_id = get_request_user_id(current_request().user)
        status = History.STATUS_DELETE
        instance_id = self.id

        super().delete(*args, **kwargs)

        History().entry_creation(status=status, instance=self, request_user_uuid=user_id, instance_id=instance_id)







