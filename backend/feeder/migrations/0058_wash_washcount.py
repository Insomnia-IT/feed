# Generated by Django 5.1.6 on 2025-05-28 19:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0057_remove_direction_notion_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='wash',
            name='washCount',
            field=models.PositiveIntegerField(default=0, verbose_name='Количество'),
        ),
    ]
