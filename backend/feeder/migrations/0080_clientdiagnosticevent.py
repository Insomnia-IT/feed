from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("feeder", "0079_add_groupbadge_is_disabled")]
    operations = [
        migrations.CreateModel(
            name="ClientDiagnosticEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_id", models.CharField(max_length=64, unique=True)),
                ("installation_hash", models.CharField(db_index=True, max_length=64)),
                ("kitchen_id", models.IntegerField(null=True)),
                ("event_type", models.CharField(max_length=64)),
                ("occurred_at", models.DateTimeField()),
                ("app_version", models.CharField(max_length=64)),
                ("state", models.CharField(default="ok", max_length=16)),
                ("details", models.JSONField(default=dict)),
                ("received_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
        )
    ]
