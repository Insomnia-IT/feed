from django.db import models
from rest_framework.exceptions import ValidationError

from config.get_request import current_request


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


class SaveSynchronisationDataMixin:

    def save(self, *args, **kwargs):
        from_sync = kwargs.pop('from_sync', False)
        if from_sync:
            request_user = None
        else:
            user = current_request().user
            if hasattr(user, "uuid"):
                request_user = user.uuid
            else:
                raise ValidationError({"permission": "You do not have permissions to perform this action"})
        updated = True
        if not self.id:
            updated = False
        super(SaveSynchronisationDataMixin, self).save(*args, **kwargs)
        data = {
            "status": "updated" if updated else "inserted",
            "object": self.__class__.__name__,
            "actor_badge": request_user,
            "date": self.updated_at if self.updated_at else self.created_at,
            "data": {
                "id": self.uuid,
                "name": self.name,
                "first_name": self.first_name,
                "last_name": self.last_name,
                "gender": self.gender.name if self.gender else None,
                "phone": self.phone,
                # "infant": true,
                "vegan": self.is_vegan,
                "feed": self.feed_type.name if self.feed_type else None,
                "number": self.badge_number,
                "batch": self.printing_batch,
                "role": self.role,
                "position": self.position,
                "photo": self.photo,
                "person": self.person.id if self.person else None,
                "comment": self.comment,
                "notion_id": self.notion_id,
                "directions": self.directions.all().values_list('id', flat=True),
            }
        }

        pass
