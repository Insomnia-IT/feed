from datetime import datetime

from django.db import models


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super(SoftDeleteQuerySet, self).update(deleted_at=datetime.utcnow())

    def restore(self):
        return super(SoftDeleteQuerySet, self).update(deleted_at=None)

    def hard_delete(self):
        return super(SoftDeleteQuerySet, self).delete()

    def alive(self):
        return self.filter(deleted_at=None)

    def deleted(self):
        return self.exclude(deleted_at=None)


class SoftDeleteManager(models.Manager):
    def __init__(self, *args, **kwargs):
        super(SoftDeleteManager, self).__init__(*args, **kwargs)

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model)

    def hard_delete(self):
        return self.get_queryset().hard_delete()

    def all(self):
        return super(SoftDeleteManager, self).all()


class SoftDeleteModelMixin(models.Model):
    deleted_at = models.DateTimeField(editable=False, null=True, default=None)

    class Meta:
        abstract = True

    @property
    def is_deleted(self):
        return bool(self.deleted_at)

    def delete(self, *args, **kwargs):
        self.qr = None
        self.deleted_at = datetime.utcnow()
        self.save(**kwargs)

    def undelete(self, *args, **kwargs):
        if self.deleted_at:
            self.deleted_at = None
            self.save(**kwargs)

    def hard_delete(self):
        super(SoftDeleteModelMixin, self).delete()
