from django.db import models
from rest_framework.exceptions import ValidationError

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


class SaveHistoryDataViewSetMixin:
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

        super().perform_destroy(instance)

        History().entry_creation(status=History.STATUS_DELETE, instance=instance, request_user_uuid=request_user)

