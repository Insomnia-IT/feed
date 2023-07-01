import arrow
import requests
import math

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
            .to('Europe/Moscow')
            .replace(hour=0, minute=0, second=0)
            .to('utc')
            .timestamp()
    )


def sync_to_notion(people):
    # init dict to accumulate statistic
    statistic = {
        'volunteers': {
            'sent': {
                'arrived': {
                    'success': 0,
                    'failed': 0,
                    'total': 0
                }
            }
        }
    }

    try:
        # get people from Notion API if it's None
        if not people:
            people = NotionAPIController.get_people()
            
        # send info about arrived/leaving to Notion
        result = update_arrived(people)

        # keep result in statistic
        statistic['volunteers']['sent']['arrived'].update({
            'success': result['updated']['success'],
            'failed': result['updated']['failed'],
            'total': result['total']
        })
    except PartialArrivedException as e:
        # keep error in statistic
        error = ['arrived', '']
        for failed in e.args[0]:
            error.append(failed.get('uuid'))
            error.append(failed.get('error'))
        statistic['volunteers']['sent'].update({'error': error})

        result = e.args[1]
        # keep result in statistic
        statistic['volunteers']['sent']['arrived'].update({
            'success': result['updated']['success'],
            'failed': result['updated']['failed'],
            'total': result['total']
        })

        # throw custom exception to handle error properly
        raise SendArrivedException(statistic)

    except Exception as e:
        # keep error in statistic
        statistic['volunteers']['sent'].update({'error': ['arrived', str(e)]})

        # throw custom exception to handle error properly
        raise SendArrivedException(statistic)

    print('sync-to stat', statistic)

    return statistic


def update_arrived(people):
    # init dict to accumulate statistic
    statistic = {
        'updated': {
            'success': 0,
            'failed': 0
        },
        'total': 0
    }

    # get volunteers among people as dict of uuid and active(_from/_to) fields
    volunteers = {
        str(uuid): {
            'active_from': active_from,
            'active_to': active_to,
            'is_active': is_active
        } for uuid, active_from, active_to, is_active in models.Volunteer.objects
            .filter(uuid__in=[person.get('uuid') for person in people])
            .exclude(active_from__exact=None, active_to__exact=None)
            .values_list('uuid', 'active_from', 'active_to', 'is_active')
    }

    # filter volonteers according to people and needs of updating
    data = []
    for person in people:
        uuid = person.get('uuid')
        
        if vol := volunteers.get(uuid):
            active_from = vol.get('active_from')
            active_to = vol.get('active_to')
            is_active = vol.get('is_active')

            # skip processing if active fields aren't modified
            if not active_from or not active_to or not is_active:
                continue

            # get start of day by Moscow for fields
            registration_datetime = convert_to_start_of_day_by_moscow(active_from)
            departure_datetime = convert_to_start_of_day_by_moscow(active_to)

            # skip processing if both fields are synchronized with remote ones
            if registration_datetime == person.get('arrived') and departure_datetime == person.get('leaving'):
                continue

            item = {
                'uuid': uuid,
                'registration_datetime': registration_datetime,
                'departure_datetime': departure_datetime
            }
            # add for sending
            data.append(item)
            print('sync_to_notion item', item)

    # set total count of volunteers that can be processed
    statistic['total'] = len(data)

    # call Notion API to update arrived/leaving
    result = NotionAPIController.post_bulk_person_arrived(data)

    # set result statistic
    statistic['updated']['success'] = len(result['success'])

    failedCount = len(result['failed'])
    statistic['updated']['failed'] = failedCount

    # throw exception if post has eneded partially
    if failedCount > 0:
        raise PartialArrivedException(result['failed'], statistic)

    return statistic

@transaction.atomic
def sync_from_notion(people):
    # get people from Notion API if it's Empty
    if not people:
        people = NotionAPIController.get_people()

    # init dict to accumulate statistic
    statistic = {
        'volunteers': {
            'created': 0, 
            'total': 0
        },
        'departments': {
            'created': 0, 
            'total': 0
        }
    }


    # DEPARTMENTS

    # prepare department names
    department_names = set()
    for person in people:
        if service_or_location_names := person.get('service_or_location'):
            department_names |= set([capitalize(name) for name in service_or_location_names])

    # set total count of departments
    statistic['departments']['total'] = len(department_names)

    # if department with the name doesn't exist, then create and include it into stat
    for department_name in department_names:
        _ , created = models.Department.objects.get_or_create(name=department_name)
        if created:
            statistic['departments']['created'] += 1

    
    # VOLUNTEERS (vols)
    
    # set feed types
    feed_types = {
        FeedType(feed_type.code) : feed_type
        for feed_type
        in models.FeedType.objects.filter(
            code__in=[type.value for type in FeedType]
        ).all()
    }

    # set default kitchen
    default_kitchen = models.Kitchen.objects.get(pk=1)

    # set default color
    default_color_type = models.Color.objects.filter(name='green').first()

    # set total count of vols
    statistic['volunteers']['total'] = len(people)

    notion_uuids = {}

    # handle each person to update vols
    for person in people:
        uuid = person.get('uuid')

        # get or create vol
        volunteer, created = models.Volunteer.objects.get_or_create(uuid=uuid)

        # include vol into stat if one has been created
        if created:
            statistic['volunteers']['created'] += 1

        notion_uuids[volunteer.uuid] = True

        if not created and volunteer.is_active:
            print('skip, already activated {}'.format(volunteer.uuid))
            continue

        # otherwise set/update vol fields
        volunteer.name = person.get('name')
        volunteer.lastname = person.get('lastname')
        volunteer.nickname = person.get('nickname')
        volunteer.email = person.get('email')
        volunteer.qr = person.get('qr')
        volunteer.is_vegan = person.get('is_vegan')
        volunteer.position = person.get('position')
        volunteer.badge_number = person.get('badge_number')
        volunteer.comment =  person.get('comment')

        volunteer.feed_type = (
            feed_types[FeedType.PAID] if person.get('food_type') == 'Платно' 
            else feed_types[FeedType.CHILD] if person.get('food_type') == 'Ребенок' 
            else feed_types[FeedType.NO] if person.get('food_type') == 'Без питания' 
            else feed_types[FeedType.FREE]
        )

        volunteer.balance = volunteer.feed_type.daily_amount
        volunteer.kitchen = default_kitchen

        if arrival_dt := person.get('arrival_date'):
            volunteer.arrival_date = arrow.get(arrival_dt).datetime
            volunteer.active_from = volunteer.arrival_date

        if depart_dt := person.get('departure_date'):
            volunteer.departure_date = arrow.get(depart_dt).datetime
            volunteer.active_to = volunteer.departure_date

        if color := person.get('color'):
            volunteer.color_type = (
                color_type 
                if (color_type := models.Color.objects.filter(name=color).first()) 
                else default_color_type
            )

        if (service_or_location_names := person.get('service_or_location')) and len(service_or_location_names) > 0:
            volunteer.departments.set(
                models.Department.objects.filter(name__in=[capitalize(name) for name in service_or_location_names]).all()
            )
        
        volunteer.save()

    volunteers = models.Volunteer.objects.all()

    for volunteer in volunteers:
        if not volunteer.uuid in notion_uuids and not volunteer.is_active and not volunteer.is_blocked:
            print('blocked, skipped in notion: {}'.format(volunteer.uuid))
            volunteer.is_blocked = True
            volunteer.comment = 'отсутствует в ноушен'
            volunteer.save()


    print('sync-from stat:', statistic)

    return statistic


def sync_with_notion():
    # get people from notion API
    people = NotionAPIController.get_people()

    # update local db based on data from Notion
    statistic = sync_from_notion(people)
    
    if settings.IS_SYNC_TO_NOTION_ON == str(True):
        # back sync must not affect on sync in general
        # therefore just log error if back sync has failed
        try:
            # add result to statistic
            statistic['volunteers'].update(
                # update Notion based on data from local db
                sync_to_notion(people)['volunteers']
            )
        except SendArrivedException as e:
            print('Error whilst processing back sync (arrived):', e)

            # add error to statistic
            statistic['volunteers'].update(e.args[0]['volunteers'])
        except Exception as e:
            print('Error whilst processing back sync:', e)

            # add error to statistic
            statistic['volunteers'].update({'sent': {'error': ['', str(e)]}})


    print('sync stat', statistic)
    
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
        #     Также игнорим волонтеров, у которых стоит флаг is_blocked.
        #     Ну и остальных проверяем по тому, что текущий день входит в интервал от active_from до active_to.
        volunteers = (
            models.Volunteer.objects
                .exclude(
                    (Q(active_from__exact=None) | Q(active_to__exact=None) | Q(is_blocked=True)) 
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
