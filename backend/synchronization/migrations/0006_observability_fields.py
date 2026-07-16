import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("synchronization", "0005_synchronizationsystemactions_sync_sys_dir_date_idx_and_more")]
    operations = [
        migrations.AddField(model_name="synchronizationsystemactions", name="sync_run_id", field=models.UUIDField(db_index=True, default=uuid.uuid4)),
        migrations.AddField(model_name="synchronizationsystemactions", name="trigger", field=models.CharField(default="manual", max_length=32)),
        migrations.AddField(model_name="synchronizationsystemactions", name="started_at", field=models.DateTimeField(null=True)),
        migrations.AddField(model_name="synchronizationsystemactions", name="finished_at", field=models.DateTimeField(null=True)),
        migrations.AddField(model_name="synchronizationsystemactions", name="duration_ms", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="cursor_before", field=models.DateTimeField(null=True)),
        migrations.AddField(model_name="synchronizationsystemactions", name="cursor_after", field=models.DateTimeField(null=True)),
        migrations.AddField(model_name="synchronizationsystemactions", name="received_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="processed_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="skipped_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="error_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="retry_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="synchronizationsystemactions", name="error_category", field=models.CharField(max_length=64, null=True)),
        migrations.AddField(model_name="synchronizationsystemactions", name="consecutive_failure_count", field=models.PositiveIntegerField(default=0)),
    ]
