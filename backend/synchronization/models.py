from django.db import models
import uuid


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
    partial_offset = models.IntegerField(null=True, blank=True)
    success = models.BooleanField(default=True)
    error = models.CharField(max_length=512, null=True, blank=True)
    sync_run_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    trigger = models.CharField(max_length=32, default="manual")
    started_at = models.DateTimeField(null=True)
    finished_at = models.DateTimeField(null=True)
    duration_ms = models.PositiveIntegerField(default=0)
    cursor_before = models.DateTimeField(null=True)
    cursor_after = models.DateTimeField(null=True)
    received_count = models.PositiveIntegerField(default=0)
    processed_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    retry_count = models.PositiveIntegerField(default=0)
    error_category = models.CharField(max_length=64, null=True)
    consecutive_failure_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Синхронизация"
        verbose_name_plural = "Синхронизация"
        indexes = [
            models.Index(
                fields=["system", "direction", "-date", "-id"],
                name="sync_sys_dir_date_idx",
            ),
            models.Index(
                fields=["system", "direction", "-date", "-id"],
                name="sync_sys_dir_ok_date_idx",
                condition=models.Q(success=True),
            ),
        ]

    def __str__(self):
        return self.system
