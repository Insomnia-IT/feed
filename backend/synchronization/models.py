from django.db import models


class SynchronizationSystemActions(models.Model):
    SYSTEM_NOTION = "notion"
    SYSTEM_CHOICES = (
        (SYSTEM_NOTION, "notion"),
    )
    DIRECTION_TO_SYSTEM = "to_system"
    DIRECTION_FROM_SYSTEM = "from_system"

    DIRECTION_CHOICES = (
        (DIRECTION_TO_SYSTEM, "to_system"),
        (DIRECTION_FROM_SYSTEM, "from_system"),
    )

    system = models.CharField(max_length=32, choices=SYSTEM_CHOICES)
    direction = models.CharField(max_length=32, choices=DIRECTION_CHOICES)
    date = models.DateTimeField()
    latest = models.BooleanField(default=False)
    success = models.BooleanField(default=True)
    error = models.CharField(max_length=512, null=True, blank=True)

    class Meta:
        verbose_name = "Синхронизация В"
        verbose_name_plural = "Синхронизация В"

    def __str__(self):
        return self.system
