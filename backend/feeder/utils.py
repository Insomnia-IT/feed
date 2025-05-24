import arrow
import requests
import math
import time

from enum import Enum

from django.db import transaction
from django.conf import settings
from django.db.models import Q, Prefetch

from feeder import models
from feeder.models import meal_times

from history.models import History

from rest_framework.exceptions import APIException

from feeder.controllers.notion import NotionAPIController


ZERO_HOUR = 4
DAY_START_HOUR = 7

STAT_DATE_FORMAT = 'YYYY-MM-DD'
TZ = 'Europe/Moscow'

class StatisticType(Enum):
    PREDICT = 'predict'
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
    
def get_stat_key(item):
    return ",".join([item['date'], item['type'], item['meal_time'], str(item['is_vegan']), str(item['kitchen_id'])])

def append_stat(stat: dict, item):
    key = get_stat_key(item)
    stat_item = stat.get(key)
    if stat_item:
        stat_item['amount'] += item['amount']
    else:
        stat[key] = item

def get_stat_amount(stat, item):
    key = get_stat_key(item)
    stat_item = stat.get(key)
    if stat_item:
        return stat_item['amount']
    else:
        return 0
    

def get_kitchen_id_by_history(history_by_volunteer, volunteer_uuid, current_date):
    if volunteer_uuid in history_by_volunteer:
        history_items = history_by_volunteer[volunteer_uuid]
        for item in history_items:
            if current_date < item['action_at']:
                return item['old_data']['kitchen']

def calculate_statistics(date_from, date_to, anonymous=None, group_badge=None, prediction_alg='1', apply_history=False):
    start_time = time.time()
    # convert from str to a datetime type (Arrow)
    stat_date_from = arrow.get(date_from, tzinfo=TZ).shift(days=-2)
    stat_date_to = arrow.get(date_to, tzinfo=TZ)

    fact_query = models.FeedTransaction.objects.filter(
        dtime__range=(
            stat_date_from.shift(hours=+DAY_START_HOUR).datetime,
            stat_date_to.shift(days=+1, hours=+DAY_START_HOUR).datetime
        )
    )
    
    # get transactions by criteria of fact statistic
    transactions = fact_query.values(
        'dtime', 'meal_time', 'kitchen_id', 'amount', 'is_vegan', 'volunteer_id', 'group_badge', 'reason'
    )
    print(f'transactions loaded: {time.time() - start_time}')

    # set FACT statistics
    stat = dict()

    for txn in transactions:
        if anonymous is True and txn.get('volunteer_id') is not None:
            continue
        if anonymous is False and txn.get('volunteer_id') is None:
            continue
        if group_badge is True and (txn.get('group_badge') is None and not (txn.get('reason') and 'Групповое питание' in txn.get('reason'))):
            continue
        if group_badge is False and (txn.get('group_badge') is not None or (txn.get('reason') and 'Групповое питание' in txn.get('reason'))):
            continue

        state_date = arrow.get(txn['dtime'])
        adjusted_date = (
            state_date.shift(days=-1) 
            if state_date.hour < DAY_START_HOUR and txn['meal_time'] == meal_times[3] # = "night"
            else state_date
        )
        append_stat(stat, {
            'date': adjusted_date.format(STAT_DATE_FORMAT),
            'type': StatisticType.FACT.value,
            'meal_time': txn['meal_time'],
            'is_vegan': txn['is_vegan'],
            'amount': txn['amount'],
            'kitchen_id': txn['kitchen_id']
        })
    
    print(f'fact calculated: {time.time() - start_time}')

    # plan statistic
    # Сохраняем подходящие arrivals для каждого волонтера

    volunteers = (
        models.Volunteer.objects
        .exclude(Q(is_blocked=True) | Q(feed_type__code='FT4'))
        .prefetch_related(
            Prefetch(
                'arrivals',
                queryset=models.Arrival.objects.filter(
                    status__in=['ARRIVED', 'STARTED', 'JOINED'],
                    arrival_date__lt=stat_date_to.shift(days=1).datetime,
                    departure_date__gt=stat_date_from.datetime
                ),
                to_attr='relevant_arrivals'
            )
        )
        .select_related('kitchen', 'feed_type')
    )
    if apply_history:
        history = (
            History.objects
            .filter(status='updated', object_name='volunteer', data__has_key='kitchen', action_at__gt=stat_date_from.datetime)
            .values()
        )
        history_by_volunteer = dict()
        print('history', len(history))
        for item in history:
            volunteer_uuid = item.get('volunteer_uuid')
            if volunteer_uuid in history_by_volunteer:
                history_by_volunteer[volunteer_uuid].append(item)
            else:
                history_by_volunteer[volunteer_uuid] = [item]
    # Предварительная обработка данных волонтеров
    processed_volunteers = []
    for vol in volunteers:
        if group_badge is True and vol.group_badge is None:
            continue
        if group_badge is False and vol.group_badge is not None:
            continue

        for arrival in vol.relevant_arrivals or []:
            active_from = arrow.get(arrival.arrival_date).to(TZ).floor('day')
            active_to = arrow.get(arrival.departure_date).to(TZ).floor('day')

            # Проверка пересечения с общим диапазоном
            if active_to < stat_date_from or active_from > stat_date_to:
                continue
            
            processed_volunteers.append({
                'uuid': str(vol.uuid),
                'active_from': active_from,
                'active_to': active_to,
                'is_paid': vol.feed_type.paid if vol.feed_type else False,
                'is_vegan': vol.is_vegan,
                'kitchen_id': vol.kitchen.id if vol.kitchen else None,
            })
    
    print(f'volunteers loaded: {time.time() - start_time}')

    # iterate over date range (day by day) between from and to
    date_range = list(arrow.Arrow.range('day', stat_date_from, stat_date_to))
    prev_day = None
    prev_prev_day = None
    for current_stat_date in date_range:
        # Get volunteers by criterias of plan statistic.
        #
        # The criterias:
        #     Тех, у кого нет проставленных полей active_from и active_to мы игнорим.
        #     Также мы игнорим тех, у кого active_from меньше начала текущего дня статистики и у которых не проставлен флаг is_active.
        #     Также игнорим волонтеров, у которых стоит флаг paid и нет флага is_active.
        #     Также игнорим волонтеров, у которых стоит флаг is_blocked.
        #     Также игнорим волонтеров, у которых стоит тип питания "без питания" (FT4).
        #     Ну и остальных проверяем по тому, что текущий день входит в интервал от active_from до active_to.

        current_day = current_stat_date.floor('day')

        # set PLAN statistics for current date
        for vol_data in processed_volunteers:
            active_from = vol_data['active_from']
            active_to = vol_data['active_to']

            if not (active_from <= current_day <= active_to):
                continue

            is_paid = vol_data['is_paid']

            # skip breakfast
            if active_from == current_day and active_to != current_day:
                meal_times_set = get_meal_times(is_paid)[1:]  # in [ "lunch", "dinner" (, is_paid ? "night") ]
            # skip dinner and night
            elif active_from != current_day and active_to == current_day:
                meal_times_set = get_meal_times(is_paid)[:2]  # in [ "breakfast", "lunch" ]
            # handle each value of meal_times
            else:
                meal_times_set = get_meal_times(is_paid) # in [ "breakfast", "lunch", "dinner" (, is_paid ? "night") ]

            for meal_time in meal_times_set:
                kitchen_id = apply_history and get_kitchen_id_by_history(history_by_volunteer, vol_data['uuid'], current_day.shift(days=-1) if meal_time == 'breakfast' else current_day) or vol_data['kitchen_id']
                append_stat(stat, {
                    'date': current_day.format(STAT_DATE_FORMAT),
                    'type': StatisticType.PLAN.value,
                    'meal_time': meal_time,
                    'is_vegan': vol_data['is_vegan'],
                    'amount': 1,
                    'kitchen_id': kitchen_id
                })

        # set PREDICT statistics for current date
        for meal_time in get_meal_times(True):
            for is_vegan in [False, True]:
                for kitchen_id in [1, 2]:
                    predict_amount = 0 
                    if prev_day:
                        prev_plan = get_stat_amount(stat, {
                            'date': prev_day.format(STAT_DATE_FORMAT),
                            'type': StatisticType.PLAN.value,
                            'meal_time': meal_time,
                            'is_vegan': is_vegan,
                            'kitchen_id': kitchen_id
                        })
                        prev_fact = get_stat_amount(stat, {
                            'date': prev_day.format(STAT_DATE_FORMAT),
                            'type': StatisticType.FACT.value,
                            'meal_time': meal_time,
                            'is_vegan': is_vegan,
                            'kitchen_id': kitchen_id
                        })
                        current_plan = get_stat_amount(stat, {
                            'date': current_day.format(STAT_DATE_FORMAT),
                            'type': StatisticType.PLAN.value,
                            'meal_time': meal_time,
                            'is_vegan': is_vegan,
                            'kitchen_id': kitchen_id
                        })
                        if prediction_alg == '3':
                            predict_amount = 0 if prev_plan == 0 else current_plan * prev_fact / prev_plan
                        else:
                            prev_prev_fact = get_stat_amount(stat, {
                                'date': (prev_prev_day or prev_day).format(STAT_DATE_FORMAT),
                                'type': StatisticType.FACT.value,
                                'meal_time': meal_time,
                                'is_vegan': is_vegan,
                                'kitchen_id': kitchen_id
                            })
                            prev_prev_plan = get_stat_amount(stat, {
                                    'date': (prev_prev_day or prev_day).format(STAT_DATE_FORMAT),
                                    'type': StatisticType.PLAN.value,
                                    'meal_time': meal_time,
                                    'is_vegan': is_vegan,
                                    'kitchen_id': kitchen_id
                                })
                            if prediction_alg == '2':
                                if 2 * prev_fact < prev_prev_fact and prev_prev_day:
                                    prev_fact = prev_prev_fact
                                    prev_plan = prev_prev_plan
                            else:
                                if current_plan > prev_plan and prev_plan > prev_prev_plan and prev_fact < prev_prev_fact:
                                    prev_fact = prev_prev_fact
                                    prev_plan = prev_prev_plan

                            predict_amount = 0 if prev_plan == 0 else math.sqrt(current_plan) * prev_fact / math.sqrt(prev_plan)
                    append_stat(stat, {
                        'date': current_day.format(STAT_DATE_FORMAT),
                        'type': StatisticType.PREDICT.value,
                        'meal_time': meal_time,
                        'is_vegan': is_vegan,
                        'amount': predict_amount,
                        'kitchen_id': kitchen_id
                    })
        prev_prev_day = prev_day
        prev_day = current_day
    print(f'Total time: {time.time() - start_time}')


    first_date_str = stat_date_from.floor('day').format(STAT_DATE_FORMAT)
    second_date_str = stat_date_from.shift(days=+1).floor('day').format(STAT_DATE_FORMAT)
    # filter two first days
    return filter(lambda item: item['date'] != first_date_str and item['date'] != second_date_str, stat.values()) 
