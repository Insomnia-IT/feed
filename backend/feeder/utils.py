import arrow
import requests
import math
import time

from enum import Enum

from django.db import transaction
from django.conf import settings
from django.db.models import Q

from feeder import models
from feeder.models import meal_times

from rest_framework.exceptions import APIException

from feeder.controllers.notion import NotionAPIController


ZERO_HOUR = 4
DAY_START_HOUR = 7

STAT_DATE_FORMAT = 'YYYY-MM-DD'
TZ = 'Europe/Moscow'

class StatisticType(Enum):
    PLAN = 'plan'
    FACT = 'fact'

class FeedType(Enum):
    FREE = 'FT1'
    PAID = 'FT2'
    CHILD = 'FT3'
    NO = 'FT4'

class SendArrivedException(Exception):
    pass

class PartialArrivedException(Exception):
    pass


def get_meal_times(is_paid) -> list:
    # skip 'night' (last value) if is_paid is True
    return meal_times[:-1] if is_paid else meal_times


def convert_to_start_of_day_by_moscow(timestamp: int) -> int:
    return math.floor(
        arrow.get(timestamp)
            .to(TZ)
            .replace(hour=0, minute=0, second=0)
            .to('utc')
            .timestamp()
    )

def capitalize(s: str) -> str:
    if s:
        return s[0].title()+s[1:]

def append_stat(stat: dict, item):
    key = ",".join([item['date'], item['type'], item['meal_time'], str(item['is_vegan']), str(item['kitchen_id'])])
    stat_item = stat.get(key)
    if stat_item:
        stat_item['amount'] += item['amount']
    else:
        stat[key] = item

def calculate_statistics(date_from, date_to):
    start_time = time.time()
    # convert from str to a datetime type (Arrow)
    stat_date_from = arrow.get(date_from, tzinfo=TZ)
    stat_date_to = arrow.get(date_to, tzinfo=TZ)

    # get transactions by criteria of fact statistic
    transactions = (
        models.FeedTransaction.objects
            # shift date_to to include end of period
            .filter(dtime__range=(stat_date_from.shift(hours=+DAY_START_HOUR).datetime, stat_date_to.shift(days=+1, hours=+DAY_START_HOUR).datetime))
            .values_list('dtime', 'meal_time', 'kitchen', 'amount', 'is_vegan')
    )

    print(f'transactions loaded: {time.time() - start_time}')

    # set FACT statistics
    stat = dict()

    for dtime, meal_time, kitchen_id, amount, is_vegan in transactions:
        state_date = arrow.get(dtime)
        append_stat(stat, {
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

    print(f'fact calculated: {time.time() - start_time}')

    # plan statistic

    all_arrivals = list(models.Arrival.objects.all())

    print(f'arrivals loaded: {time.time() - start_time}')

    # iterate over date range (day by day) between from and to
    for current_stat_date in arrow.Arrow.range('day', stat_date_from, stat_date_to):
        # Get volunteers by criterias of plan statistic.
        #
        # The criterias:
        #     Тех, у кого нет проставленных полей active_from и active_to мы игнорим.
        #     Также мы игнорим тех, у кого active_from меньше начала текущего дня статистики и у которых не проставлен флаг is_active.
        #     Также игнорим волонтеров, у которых стоит флаг paid и нет флага is_active.
        #     Также игнорим волонтеров, у которых стоит флаг is_blocked.
        #     Также игнорим волонтеров, у которых стоит тип питания "без питания" (FT4).
        #     Ну и остальных проверяем по тому, что текущий день входит в интервал от active_from до active_to.

        volunteers = (
            models.Volunteer.objects
                .exclude(
                    (Q(is_blocked=True) | Q(feed_type__code='FT4'))
                    | (
                        ~Q(arrivals__status='ARRIVED') & ~Q(arrivals__status='STARTED') & ~Q(arrivals__status='JOINED')
                        & (
                            Q(arrivals__arrival_date__lt=current_stat_date.datetime) | (~Q(feed_type__exact=None) & Q(feed_type__paid=True))
                        )
                    )
                )
                .values_list('kitchen__id', 'is_vegan', 'feed_type__paid', 'id')
        )

        print(f'volunteers loaded: {time.time() - start_time}')

        arrivals_by_volunter = dict()

        for arrival in all_arrivals:
            status = arrival.status and arrival.status.id
            if status == 'ARRIVED' or status == 'STARTED' or status == 'JOINED':
                current_arrivals = arrivals_by_volunter.get(arrival.volunteer.id, [])
                current_arrivals.append(arrival)
                arrivals_by_volunter[arrival.volunteer.id] = current_arrivals

        # set PLAN statistics for current date
        for kitchen_id, is_vegan, is_paid, id in volunteers:
            active_arrivals = arrivals_by_volunter.get(id, [])
            if len(active_arrivals) == 0:
                continue

            # print('active_arrivals', len(active_arrivals))

            active_arrival = active_arrivals[-1]

            # convert dates to Arrow and floor them to 'day'
            active_from_as_arrow = arrow.get(active_arrival.arrival_date).to(TZ).floor('day')
            active_to_as_arrow = arrow.get(active_arrival.departure_date).to(TZ).floor('day')

            if active_from_as_arrow > current_stat_date or active_to_as_arrow < current_stat_date:
                continue

            # skip breakfast
            if active_from_as_arrow == current_stat_date and active_to_as_arrow != current_stat_date:
                for meal_time in get_meal_times(is_paid)[1:]:
                    append_stat(stat, {
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
                    append_stat(stat, {
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
                    append_stat(stat, {
                        'date': current_stat_date.format(STAT_DATE_FORMAT),
                        'type': StatisticType.PLAN.value,
                        'meal_time': meal_time, # in [ "breakfast", "lunch", "dinner" (, is_paid ? "night") ]
                        'is_vegan': is_vegan,
                        'amount': 1,
                        'kitchen_id': kitchen_id
                    })
        print(f'date plan: {time.time() - start_time}')
        

    print(f'end: {time.time() - start_time}')

    # combine fact and plan stats into result
    return stat.values()
