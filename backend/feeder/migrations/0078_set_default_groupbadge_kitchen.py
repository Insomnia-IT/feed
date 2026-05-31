from django.db import migrations


def set_default_kitchen(apps, schema_editor):
    GroupBadge = apps.get_model('feeder', 'GroupBadge')
    GroupBadge.objects.filter(kitchen__isnull=True).update(kitchen_id=1)


class Migration(migrations.Migration):
    dependencies = [
        ('feeder', '0077_merge_20260511_1208'),
    ]

    operations = [
        migrations.RunPython(set_default_kitchen, reverse_code=migrations.RunPython.noop),
    ]
