# Generated by Django 5.1 on 2024-11-17 18:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("feeder", "0046_feedtransaction_created_by_volunteer_is_child_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="volunteer",
            name="is_child",
            field=models.BooleanField(
                blank=True, default=False, null=True, verbose_name="IsChild"
            ),
        ),
    ]
