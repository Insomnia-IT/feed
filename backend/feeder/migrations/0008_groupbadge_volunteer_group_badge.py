# Generated by Django 4.2.1 on 2023-06-05 09:00

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("feeder", "0007_volunteer_badge_number"),
    ]

    operations = [
        migrations.CreateModel(
            name="GroupBadge",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255, verbose_name="Название")),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Дата создания"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Дата обновления"),
                ),
                (
                    "comment",
                    models.TextField(blank=True, null=True, verbose_name="Комментарий"),
                ),
                ("qr", models.TextField(unique=True, verbose_name="QR-код")),
            ],
            options={
                "verbose_name": "Групповой бейдж",
                "verbose_name_plural": "Групповые бейджи",
            },
        ),
        migrations.AddField(
            model_name="volunteer",
            name="group_badge",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="feeder.groupbadge",
                verbose_name="Групповой бейдж",
            ),
        ),
    ]
