from django.db import models


class History(models.Model):
    STATUS_CREATE = "inserted"
    STATUS_UPDATE = "updated"
    STATUS_DELETE = "deleted"

    STATUS_CHOICES = (
        (STATUS_CREATE, "inserted"),
        (STATUS_UPDATE, "updated"),
        (STATUS_DELETE, "deleted")
    )

    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    object = models.CharField(max_length=32)
    actor_badge = models.UUIDField()
    date = models.DateTimeField()
    data = models.JSONField()

