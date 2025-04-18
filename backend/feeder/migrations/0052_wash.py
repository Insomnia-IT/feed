# Generated by Django 5.1.6 on 2025-02-22 14:01

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0051_remove_volunteer_color_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='Wash',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='added_washes', to='feeder.volunteer')),
                ('volunteer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='washes', to='feeder.volunteer')),
            ],
            options={
                'verbose_name': 'Стирка',
                'verbose_name_plural': 'Стирки',
            },
        ),
    ]
