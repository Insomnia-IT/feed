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
