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
    # object_id = models.UUIDField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    object_name = models.CharField(max_length=32)
    actor_badge = models.CharField(max_length=128, blank=True, null=True)
    action_at = models.DateTimeField()
    data = models.JSONField(blank=True, null=True)
    old_data = models.JSONField(blank=True, null=True)
    volunteer_uuid = models.CharField(max_length=128, blank=True, null=True)

    class Meta:
        verbose_name = "История"
        verbose_name_plural = "История"

    def __str__(self):
        return f"{self.object_name} - {self.status}"
