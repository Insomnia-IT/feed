# Generated by Django 4.2.1 on 2024-03-19 21:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0017_direction_directiontype_gender_participationrole_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='volunteer',
            name='directions',
            field=models.ManyToManyField(blank=True, to='feeder.direction'),
        ),
    ]
