from django.db import models


class SynchronizationActions(models.Model):
    SYSTEM_NOTION = "notion"
    SYSTEM_CHOICES = (
        (SYSTEM_NOTION, "notion"),
    )
    system = models.CharField(max_length=32, choices=SYSTEM_CHOICES)
