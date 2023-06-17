import arrow
import requests

from enum import Enum

from django.conf import settings
from django.db import transaction
from django.db.models import Q

from feeder import models
from feeder.models import meal_times 

from rest_framework.exceptions import APIException


ZERO_HOUR = 4
DAY_START_HOUR = 7

STAT_DATE_FORMAT = 'YYYY-MM-DD'

class StatisticType(Enum):
    PLAN = 'plan'
    FACT = 'fact'


def get_meal_times(is_paid) -> list:
    # skip 'night' (last value) if is_paid is True
    return meal_times[:-1] if is_paid else meal_times

@transaction.atomic
def sync_with_notion() -> dict:
    headers = {"Authorization": settings.NOTION_AUTH_HEADER}

    peoples_url = 'https://srv.rumyantsev.com/api/v1/agreemod/people'
    default_badge = models.Color.objects.filter(name='green').first()
    food_type_free = models.FeedType.objects.filter(code='FT1').first()
    food_type_paid = models.FeedType.objects.filter(code='FT2').first()
    food_type_child = models.FeedType.objects.filter(code='FT3').first()
    food_type_no = models.FeedType.objects.filter(code='FT4').first()
    statistic = {
        'volunteers': {'created': 0, 'total': 0},
        'departments': {'created': 0, 'total': 0},
    }

    # with open("data/notion_locations.json", "w") as f:
    #     f.write(r.text)

    # Volunteers
    r = requests.get(peoples_url, headers=headers)
    if not r.ok:
        raise APIException("GET agreemod/people failed")
    
    items = r.json()
    #
    # with open("data/notion_volunteers.json", "w") as f:
    #     f.write(r.text)

    departments = set()
    # Prepare departments
    for item in items:
        if names := item.get('service_or_location'):
            departments |= set([capitalize(name) for name in names])

    statistic['departments']['total'] = len(departments)
    # Update departments
    for department_name in departments:
        department, created = models.Department.objects.get_or_create(
            name=department_name,
        )
        if created:
            statistic['departments']['created'] += 1

    statistic['volunteers']['total'] = len(items)
    for item in items:
        volunteer, created = models.Volunteer.objects.get_or_create(
            uuid=item.get('uuid')
        )
        if created:
            statistic['volunteers']['created'] += 1

        if not created and (volunteer.is_active or volunteer.is_blocked):
            print('skip, already activated {}'.format(volunteer.uuid))
            continue
        
        volunteer.name = item.get('name')
        volunteer.lastname = item.get('lastname')
        volunteer.nickname = item.get('nickname')
        volunteer.email = item.get('email')
        volunteer.qr = item.get('qr')
        volunteer.is_vegan = item.get('is_vegan')
        volunteer.position = item.get('position')
        volunteer.badge_number = item.get('badge_number')
        volunteer.feed_type = food_type_paid if item.get('food_type') == 'Платно' else food_type_child if item.get('food_type') == 'Ребенок' else food_type_no if item.get('food_type') == 'Без питания' else food_type_free
        volunteer.balance = volunteer.feed_type.daily_amount
        volunteer.kitchen = models.Kitchen.objects.get(pk=1)

        if arrival_dt := item.get('arrival_date'):
            volunteer.arrival_date = arrow.get(arrival_dt).replace(hour=ZERO_HOUR).datetime
            volunteer.active_from = volunteer.arrival_date
        if depart_dt := item.get('departure_date'):
            volunteer.departure_date = arrow.get(depart_dt).replace(hour=ZERO_HOUR).datetime
            volunteer.active_to = volunteer.departure_date

        if color := item.get('color'):
            if badge_color := models.Color.objects.filter(name=color).first():
                volunteer.color_type = badge_color
        if not volunteer.color_type:
            volunteer.color_type = default_badge

        if (department_names := item.get('service_or_location')) and len(department_names) > 0:
            volunteer.departments.set(
                models.Department.objects.filter(name__in=[capitalize(name) for name in department_names]).all()
            )

        volunteer.save()

    return statistic


def capitalize(s: str) -> str:
    if s:
        return s[0].title()+s[1:]


def calculate_statistics(data):
    # convert from str to a datetime type (Arrow)
    stat_date_from = arrow.get(data.get('date_from'))
    stat_date_to = arrow.get(data.get('date_to'))

    # get transactions by criteria of fact statistic
    transactions = (
        models.FeedTransaction.objects
            # shift date_to to include end of period
            .filter(dtime__range=(stat_date_from.shift(hours=+DAY_START_HOUR).datetime, stat_date_to.shift(days=+1, hours=+DAY_START_HOUR).datetime))
            .values_list('dtime', 'meal_time', 'kitchen', 'amount', 'is_vegan')
    )

    # set FACT statistics
    fact_stat = []
    for dtime, meal_time, kitchen_id, amount, is_vegan in transactions:
        state_date = arrow.get(dtime)
        fact_stat.append({
            # day starts from 7AM
            'date': (
                (
                    state_date.shift(days=-1) 
                    if state_date.hour < DAY_START_HOUR and meal_time == meal_times[3] # = "night"
                    else state_date
                ).format(STAT_DATE_FORMAT)
            ),
            'type': StatisticType.FACT.value,
            'meal_time': meal_time,
            'is_vegan': is_vegan,
            'amount': amount,
            'kitchen_id': kitchen_id
        })
        
    
    # plan statistic
    plan_stat = []

    # iterate over date range (day by day) between from and to
    for current_stat_date in arrow.Arrow.range('day', stat_date_from, stat_date_to):
        # Get volunteers by criterias of plan statistic.
        # 
        # The criterias:
        #     Тех, у кого нет проставленных полей active_from и active_to мы игнорим.
        #     Также мы игнорим тех, у кого active_from меньше начала текущего дня статистики и у которых не проставлен флаг is_active.
        #     Также игнорим волонтеров, у которых стоит флаг paid и нет флага is_active.
        #     Ну и остальных проверяем по тому, что текущий день входит в интервал от active_from до active_to.
        volunteers = (
            models.Volunteer.objects
                .exclude(
                    (Q(active_from__exact=None) | Q(active_to__exact=None)) 
                    | (
                        Q(is_active=False) 
                        & (
                            Q(active_from__lt=current_stat_date.datetime) | (~Q(feed_type__exact=None) & Q(feed_type__paid=True))
                        )
                    )
                )
                .filter(
                    active_from__lt=current_stat_date.shift(days=+1).datetime, 
                    active_to__gte=current_stat_date.datetime
                )
                .values_list('active_from', 'active_to', 'kitchen__id', 'is_vegan', 'feed_type__paid')
        )

        # set PLAN statistics for current date
        for active_from, active_to, kitchen_id, is_vegan, is_paid in volunteers:
            # convert dates to Arrow and floor them to 'day'
            active_from_as_arrow = arrow.get(active_from).floor('day')
            active_to_as_arrow = arrow.get(active_to).floor('day')

            # skip breakfast
            if active_from_as_arrow == current_stat_date and active_to_as_arrow != current_stat_date:
                for meal_time in get_meal_times(is_paid)[1:]:
                    plan_stat.append({
                        'date': current_stat_date.format(STAT_DATE_FORMAT),
                        'type': StatisticType.PLAN.value,
                        'meal_time': meal_time, # in [ "lunch", "dinner" (, is_paid ? "night") ]
                        'is_vegan': is_vegan,
                        'amount': 1,
                        'kitchen_id': kitchen_id
                    })
            # skip dinner and night
            elif active_from_as_arrow != current_stat_date and active_to_as_arrow == current_stat_date:
                for meal_time in get_meal_times(is_paid)[:2]:
                    plan_stat.append({
                        'date': current_stat_date.format(STAT_DATE_FORMAT),
                        'type': StatisticType.PLAN.value,
                        'meal_time': meal_time, # in [ "breakfast", "lunch" ]
                        'is_vegan': is_vegan,
                        'amount': 1,
                        'kitchen_id': kitchen_id
                    })
            # handle each value of meal_times
            else:
                for meal_time in get_meal_times(is_paid):
                    plan_stat.append({
                        'date': current_stat_date.format(STAT_DATE_FORMAT),
                        'type': StatisticType.PLAN.value,
                        'meal_time': meal_time, # in [ "breakfast", "lunch", "dinner" (, is_paid ? "night") ]
                        'is_vegan': is_vegan,
                        'amount': 1,
                        'kitchen_id': kitchen_id
                    })

    # combine fact and plan stats into result
    return fact_stat + plan_stat
