# Generated by Django 4.2.1 on 2024-06-13 07:48

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0038_merge_20240612_1539'),
    ]

    operations = [
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'CITY_SERVICE\' WHERE type_id = \'CITY\''
        ),
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'FIELD_SERVICE\' WHERE type_id = \'SERVICE\''
        ),
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'UNIVERSAL_SERVICE\' WHERE type_id = \'UNIVERSAL\''
        ),
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'FEDERAL_LOCATION\' WHERE type_id = \'LOCATION\''
        ),
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'GRANT_LOCATION\' WHERE type_id = \'GRANT\''
        ),
        migrations.RunSQL(
            sql='update feeder_direction set type_id = \'COMMERCIAL_LOCATION\' WHERE type_id = \'COMMERCE\''
        ),
        migrations.RunSQL(
            sql='delete from feeder_directiontype where id in (\'CITY\', \'SERVICE\', \'UNIVERSAL\', \'LOCATION\', \'GRANT\', \'COMMERCE\')'
        )
    ]