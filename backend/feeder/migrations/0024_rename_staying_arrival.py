# Generated by Django 4.2.1 on 2024-04-07 11:05

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0023_alter_gender_id'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Staying',
            new_name='Arrival',
        ),
    ]