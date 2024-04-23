from django.db import models


class SynchronizationToSystemActions(models.Model):
    SYSTEM_NOTION = "notion"
    SYSTEM_CHOICES = (
        (SYSTEM_NOTION, "notion"),
    )

    system = models.CharField(max_length=32, choices=SYSTEM_CHOICES)
    date = models.DateTimeField()
    latest = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Синхронизация В"
        verbose_name_plural = "Синхронизация В"

    def __str__(self):
        return self.system
