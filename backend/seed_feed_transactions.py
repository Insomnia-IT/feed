#!/usr/bin/env python
"""
Скрипт для добавления тестовых записей в Историю питания (FeedTransaction).
Запуск: ./manage.py shell < seed_feed_transactions.py
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from feeder.models import FeedTransaction, Kitchen, Volunteer

def make_ulid():
    import uuid
    return '01' + uuid.uuid4().hex[:24]

kitchens = list(Kitchen.objects.all()[:3])
volunteers = list(Volunteer.objects.all()[:3])
if not kitchens:
    print('Нет кухонь в БД. Сначала загрузите фикстуры (loaddata kitchens).')
    exit(1)
if not volunteers:
    print('Нет волонтёров. Создайте пользователя (create_user.py) или загрузите данные.')
    exit(1)

base_time = datetime.now() - timedelta(days=2)
meal_times = ['breakfast', 'lunch', 'dinner', 'night']
created = 0

for day in range(3):
    for i, vol in enumerate(volunteers):
        for j, meal in enumerate(meal_times):
            dtime = base_time + timedelta(days=day, hours=j*4, minutes=i*5)
            kitchen = kitchens[j % len(kitchens)]
            is_anomaly = (day == 1 and i == 0 and meal == 'lunch') or (day == 2 and i == 1 and meal == 'dinner')
            reason = 'Бейдж не использовался на обед' if (is_anomaly and meal == 'lunch') else None
            if not reason and is_anomaly:
                reason = 'Перекорм службы'
            FeedTransaction.objects.create(
                ulid=make_ulid(),
                volunteer=vol,
                group_badge=None,
                is_vegan=[True, False, None][i % 3],
                is_anomaly=is_anomaly,
                kitchen=kitchen,
                amount=1 + (i + j) % 2,
                reason=reason or '',
                dtime=dtime,
                meal_time=meal,
                comment=''
            )
            created += 1

print(f'Создано записей: {created}')
print('Готово. Обнови страницу История питания и выбери период дат (последние 3 дня), нажми Применить.')
