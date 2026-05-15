import arrow
import time
from collections import defaultdict
from datetime import timedelta, datetime
from enum import Enum
from django.db.models import Q, Prefetch

from feeder import models
from history.models import History

ZERO_HOUR = 4
DAY_START_HOUR = 7
WARMUP_DAYS = 2
STAT_DATE_FORMAT = 'YYYY-MM-DD'
TZ = 'Europe/Moscow'
PLANNIG_DATE_FROM = arrow.get('2026-01-01', tzinfo=TZ).date()
PLANNIG_DATE_TO = arrow.get('2026-07-31', tzinfo=TZ).date()

ALLOWED_HOSTS = {"grist.insomniafest.ru"}

class StatisticType(str, Enum):
    PREDICT = 'predict'
    PLAN = 'plan'
    FACT = 'fact'

class MealTime(str, Enum):
    BREAKFAST = 'breakfast'
    LUNCH = 'lunch'
    DINNER = 'dinner'
    NIGHT = 'night'

class PredictAlgo(str, Enum):
    TREND_ADJUSTED = '1'   # Корректировка по тренду (по умолчанию)
    FALLBACK_PREV = '2'    # Откат к позавчера при падении
    SIMPLE_RATIO = '3'     # Простое отношение факт/план

ALL_MEAL_TIMES = [MealTime.BREAKFAST, MealTime.LUNCH, MealTime.DINNER, MealTime.NIGHT]
PAID_MEAL_TIMES = [MealTime.BREAKFAST, MealTime.LUNCH, MealTime.DINNER]  # Без ночи

class SendArrivedException(Exception):
    pass

class PartialArrivedException(Exception):
    pass

def get_meal_times(is_paid: bool) -> list[MealTime]:
    """Возвращает список приёмов пищи для типа питания."""
    return PAID_MEAL_TIMES if is_paid else ALL_MEAL_TIMES

class StatStore:
    def __init__(self):
        self._data = {}
    
    def add(self, date, stat_type, meal_time, is_vegan, kitchen_id, amount, **extra):
        key = f"{date},{stat_type},{meal_time},{is_vegan},{kitchen_id}"
        if key in self._data:
            self._data[key]['amount'] += amount
        else:
            self._data[key] = {
                'date': date,
                'type': stat_type,
                'meal_time': meal_time,
                'is_vegan': is_vegan,
                'kitchen_id': kitchen_id,
                'amount': amount,
                **extra
            }
    
    def get_amount(self, date, stat_type, meal_time, is_vegan, kitchen_id):
        key = f"{date},{stat_type},{meal_time},{is_vegan},{kitchen_id}"
        return self._data.get(key, {}).get('amount', 0)
    
    def values(self):
        return self._data.values()
    
    def filter_exclude_dates(self, exclude_dates):
        return [item for item in self._data.values() if item['date'] not in exclude_dates]
    
class VolunteerHistory:
    def __init__(self, history_items):
        self.items = sorted(history_items, key=lambda x: x['action_at'])
    
    def get_kitchen_at(self, check_date):
        for item in self.items:
            if check_date < item['action_at']:
                return item['old_data']['kitchen']
        return None
    
def calculate_statistics(date_from, date_to, anonymous=None, group_badge=None, 
                       prediction_alg=PredictAlgo.TREND_ADJUSTED.value, apply_history=False):
    start_time = time.time()
    store = StatStore()
    
    stat_date_from = arrow.get(date_from, tzinfo=TZ).shift(days=-WARMUP_DAYS)
    stat_date_to = arrow.get(date_to, tzinfo=TZ)
    date_range = list(arrow.Arrow.range('day', stat_date_from, stat_date_to))
    
    print(f"Date range: {stat_date_from.format(STAT_DATE_FORMAT)} to {stat_date_to.format(STAT_DATE_FORMAT)}")
    
    # === Загружаем planning_cells для групповых бейджей ===
    planning_cells_cache = load_planning_cells_cache(group_badge)
    
    # === Загружаем volunteers ===
    volunteers = load_volunteers(stat_date_from, stat_date_to, anonymous, group_badge)

    # === Загружаем history ===
    history_by_volunteer = {}
    if apply_history:
        history_by_volunteer = load_history(stat_date_from)
    
    # 1. Факт
    calculate_fact(store, stat_date_from, stat_date_to, anonymous, group_badge)
    print(f'Fact calculated: {time.time() - start_time:.2f}s')
    
    # 2. План
    calculate_plan_from_volunteers(store, stat_date_from, stat_date_to, volunteers, history_by_volunteer, apply_history)
    print(f'Plan calculated: {time.time() - start_time:.2f}s')
    
    # 3. Прогноз
    calculate_predict(store, date_range, group_badge, prediction_alg, volunteers, planning_cells_cache)
    print(f'Predict calculated: {time.time() - start_time:.2f}s')
    
    # 4. Фильтрация
    exclude_dates = {
        stat_date_from.shift(days=i).format(STAT_DATE_FORMAT) 
        for i in range(WARMUP_DAYS)
    }
    result = store.filter_exclude_dates(exclude_dates)
    
    print(f'Total time: {time.time() - start_time:.2f}s')
    return result

def calculate_fact(store, date_from, date_to, anonymous, group_badge):
    transactions = models.FeedTransaction.objects.filter(
        dtime__range=(
            date_from.shift(hours=+DAY_START_HOUR).datetime,
            date_to.shift(days=+1, hours=+DAY_START_HOUR, seconds=-1).datetime
        )
    ).values('dtime', 'meal_time', 'kitchen_id', 'amount', 'is_vegan', 
             'volunteer_id', 'group_badge', 'reason')
    
    for txn in transactions:
        if anonymous is True and txn.get('volunteer_id'):
            continue
        if anonymous is False and not txn.get('volunteer_id'):
            continue
        if group_badge is True and not has_group_badge(txn):
            continue
        if group_badge is False and has_group_badge(txn):
            continue
        
        adjusted_date = arrow.get(txn['dtime']).to(TZ).shift(hours=-DAY_START_HOUR)
        
        store.add(
            date=adjusted_date.format(STAT_DATE_FORMAT),
            stat_type=StatisticType.FACT,
            meal_time=txn['meal_time'],
            is_vegan=txn['is_vegan'],
            kitchen_id=txn['kitchen_id'],
            amount=txn['amount']
        )

def calculate_plan_from_volunteers(store, date_from, date_to, volunteers, history_by_volunteer, apply_history):
    """Считает план из уже загруженных волонтёров."""
    for current_day in arrow.Arrow.range('day', date_from, date_to):
        process_plan_day(store, current_day, volunteers, history_by_volunteer, apply_history)
    
    return history_by_volunteer

def process_plan_day(store, current_day, volunteers, history_by_volunteer, apply_history):
    for vol in volunteers:
        if not (vol['active_from'] <= current_day <= vol['active_to']):
            continue
        
        meal_times = get_meal_times_for_day(vol, current_day)
        
        for meal_time in meal_times:
            kitchen_date = current_day.shift(days=-1) if meal_time == MealTime.BREAKFAST.value else current_day
            kitchen_id = vol['kitchen_id']
            
            if apply_history and vol['uuid'] in history_by_volunteer:
                kitchen_id = history_by_volunteer[vol['uuid']].get_kitchen_at(kitchen_date) or kitchen_id
            
            store.add(
                date=current_day.format(STAT_DATE_FORMAT),
                stat_type=StatisticType.PLAN,
                meal_time=meal_time,
                is_vegan=vol['is_vegan'],
                kitchen_id=kitchen_id,
                amount=1
            )

def calculate_predict(store, date_range, group_badge, prediction_alg, volunteers, planning_cells_cache):
    prev_day = None
    prev_prev_day = None
    
    for current_day in date_range:
        if group_badge is not False:
            calculate_group_badge_predict(store, current_day, volunteers, planning_cells_cache)
        
        if group_badge is not True:
            calculate_regular_predict(store, current_day, prev_day, prev_prev_day, prediction_alg)
        
        prev_prev_day = prev_day
        prev_day = current_day

def calculate_group_badge_predict(store, current_day, volunteers, planning_cells_cache):
    """
    Прогноз для групповых бейджей.
    Приоритет: planning_cells > подсчёт волонтёров > 0
    """
    current_date_str = current_day.format(STAT_DATE_FORMAT)
    kitchen_ids = get_kitchen_ids()
    
    # Группируем волонтёров по бейджам
    badge_volunteers = {}
    for vol in volunteers:
        if not vol.get('group_badge_id'):
            continue
        if not (vol['active_from'] <= current_day <= vol['active_to']):
            continue
        
        badge_id = vol['group_badge_id']
        if badge_id not in badge_volunteers:
            badge_volunteers[badge_id] = []
        badge_volunteers[badge_id].append(vol)
    
    # Получаем все бейджи из planning_cells для этой даты
    badges_from_planning = set()
    for (badge_id, meal_time, date_str) in planning_cells_cache.keys():
        if date_str == current_date_str:
            badges_from_planning.add(badge_id)
    
    # Добавляем бейджи из волонтёров (если нет в planning_cells)
    all_badge_ids = badges_from_planning | set(badge_volunteers.keys())
    
    meal_times = [m.value for m in ALL_MEAL_TIMES]
    # Для каждого бейджа и приёма пищи
    for badge_id in all_badge_ids:
        vols = badge_volunteers.get(badge_id, [])  # Может быть пустым
        
        for meal_time in meal_times:
            cache_key = (badge_id, meal_time, current_date_str)
            cell = planning_cells_cache.get(cache_key)
            
            # Приоритет: planning_cells
            if cell:
                predict_meat = cell.get('amount_meat') or 0
                predict_vegan = cell.get('amount_vegan') or 0
                kitchen_id = str(kitchen_ids[0]) if kitchen_ids else '1'
            else:
                predict_meat = sum(1 for v in vols if not v['is_vegan'])
                predict_vegan = sum(1 for v in vols if v['is_vegan'])
                kitchen_id = next((v['kitchen_id'] for v in vols if v.get('kitchen_id') is not None), '1')
            
            # Добавляем meat
            store.add(
                date=current_date_str,
                stat_type=StatisticType.PREDICT,
                meal_time=meal_time,
                is_vegan=False,
                kitchen_id=kitchen_id,
                amount=predict_meat,
                group_badge_id=badge_id
            )
            
            # Добавляем vegan
            store.add(
                date=current_date_str,
                stat_type=StatisticType.PREDICT,
                meal_time=meal_time,
                is_vegan=True,
                kitchen_id=kitchen_id,
                amount=predict_vegan,
                group_badge_id=badge_id
            )

def calculate_regular_predict(store, current_day, prev_day, prev_prev_day, algo):
    if not prev_day:
        return
    
    kitchen_ids = get_kitchen_ids()
    meal_times = [m.value for m in ALL_MEAL_TIMES]
    for meal_time in meal_times:
        for is_vegan in [False, True]:
            for kitchen_id in kitchen_ids:
                current_plan = store.get_amount(
                    current_day.format(STAT_DATE_FORMAT), StatisticType.PLAN, 
                    meal_time, is_vegan, kitchen_id
                )
                prev_fact = store.get_amount(
                    prev_day.format(STAT_DATE_FORMAT), StatisticType.FACT,
                    meal_time, is_vegan, kitchen_id
                )
                
                if algo == PredictAlgo.SIMPLE_RATIO:
                    predict_amount = predict_simple_ratio(
                        store, current_plan, prev_fact, prev_day,
                        meal_time, is_vegan, kitchen_id
                    )
                elif algo == PredictAlgo.FALLBACK_PREV:
                    predict_amount = predict_fallback_prev(
                        store, current_plan, prev_fact, prev_day, prev_prev_day,
                        meal_time, is_vegan, kitchen_id
                    )
                else:
                    predict_amount = predict_trend_adjusted(
                        store, current_plan, prev_fact, prev_day, prev_prev_day,
                        meal_time, is_vegan, kitchen_id
                    )
                
                store.add(
                    date=current_day.format(STAT_DATE_FORMAT),
                    stat_type=StatisticType.PREDICT,
                    meal_time=meal_time,
                    is_vegan=is_vegan,
                    kitchen_id=kitchen_id,
                    amount=round(predict_amount)
                )

def predict_simple_ratio(store, current_plan, prev_fact, prev_day, meal_time, is_vegan, kitchen_id):
    prev_plan = store.get_amount(
        prev_day.format(STAT_DATE_FORMAT), StatisticType.PLAN, meal_time, is_vegan, kitchen_id
    )
    return 0 if prev_plan == 0 else current_plan * prev_fact / prev_plan

def predict_fallback_prev(store, current_plan, prev_fact, prev_day, prev_prev_day, 
                           meal_time, is_vegan, kitchen_id):
    if not prev_prev_day:
        return predict_simple_ratio(store, current_plan, prev_fact, prev_day, 
                                     meal_time, is_vegan, kitchen_id)
    
    prev_prev_fact = store.get_amount(
        prev_prev_day.format(STAT_DATE_FORMAT), StatisticType.FACT, meal_time, is_vegan, kitchen_id
    )
    
    if 2 * prev_fact < prev_prev_fact:
        prev_plan = store.get_amount(
            prev_prev_day.format(STAT_DATE_FORMAT), StatisticType.PLAN, meal_time, is_vegan, kitchen_id
        )
        return 0 if prev_plan == 0 else current_plan * prev_prev_fact / prev_plan
    
    return predict_simple_ratio(store, current_plan, prev_fact, prev_day, 
                                 meal_time, is_vegan, kitchen_id)

def predict_trend_adjusted(store, current_plan, prev_fact, prev_day, prev_prev_day,
                          meal_time, is_vegan, kitchen_id):
    if not prev_prev_day:
        return predict_simple_ratio(store, current_plan, prev_fact, prev_day,
                                     meal_time, is_vegan, kitchen_id)
    
    prev_prev_fact = store.get_amount(
        prev_prev_day.format(STAT_DATE_FORMAT), StatisticType.FACT, meal_time, is_vegan, kitchen_id
    )
    prev_prev_plan = store.get_amount(
        prev_prev_day.format(STAT_DATE_FORMAT), StatisticType.PLAN, meal_time, is_vegan, kitchen_id
    )
    prev_plan = store.get_amount(
        prev_day.format(STAT_DATE_FORMAT), StatisticType.PLAN, meal_time, is_vegan, kitchen_id
    )
    
    if current_plan > prev_plan > prev_prev_plan and prev_fact < prev_prev_fact:
        prev_fact = prev_prev_fact
        prev_plan = prev_prev_plan
    
    return 0 if prev_plan == 0 else (current_plan ** 0.5) * prev_fact / (prev_plan ** 0.5)

def load_history(date_from):
    history = History.objects.filter(
        status='updated',
        object_name='volunteer',
        data__has_key='kitchen',
        action_at__gt=date_from.datetime
    ).values()
    return build_history_by_volunteer(history)

def build_history_by_volunteer(history_queryset):
    raw_history = {}
    for item in history_queryset:
        vol_id = item.get('volunteer_uuid')
        if vol_id:
            if vol_id in raw_history:
                raw_history[vol_id].append(item)
            else:
                raw_history[vol_id] = [item]
    
    return {
        vol_id: VolunteerHistory(items)
        for vol_id, items in raw_history.items()
    }

def load_planning_cells_cache(group_badge):
    planning_cells_cache = {}
    if group_badge is not False:
        cells = models.GroupBadgePlanningCells.objects.filter(
            date__range=(PLANNIG_DATE_FROM, PLANNIG_DATE_TO)
        ).values('group_badge_id', 'meal_time', 'date', 'amount_meat', 'amount_vegan')

        grouped_cells = defaultdict(list)
        for cell in cells:
            group_key = (cell['group_badge_id'], cell['meal_time'])
            
            grouped_cells[group_key].append({
                'date': cell['date'],
                'amount_meat': cell['amount_meat'],
                'amount_vegan': cell['amount_vegan']
            })
        
        for (badge_id, meal_time), cells in grouped_cells.items():
            cells.sort(key=lambda x: x['date'])
            date_to_cell = {c['date']: c for c in cells}
            last_valid = None
            current_date = PLANNIG_DATE_FROM
            while current_date <= PLANNIG_DATE_TO:
                if current_date in date_to_cell:
                    cell = date_to_cell[current_date]
                    if cell['amount_meat'] is None and cell['amount_vegan'] is None:
                        last_valid = None
                    else:
                        last_valid = cell

                if last_valid:
                    key = (badge_id, meal_time, current_date.strftime('%Y-%m-%d'))
                    planning_cells_cache[key] = {
                        'amount_meat': last_valid['amount_meat'],
                        'amount_vegan': last_valid['amount_vegan']
                    }
                current_date += timedelta(days=1)
            
    return planning_cells_cache

def load_volunteers(date_from, date_to, anonymous, group_badge):
    queryset = models.Volunteer.objects.exclude(
        Q(is_blocked=True) | Q(feed_type__code='FT4')
    ).prefetch_related(
        Prefetch(
            'arrivals',
            queryset=models.Arrival.objects.filter(
                arrival_date__lt=date_to.shift(days=2).datetime,
                departure_date__gt=date_from.datetime
            ),
            to_attr='relevant_arrivals'
        )
    ).select_related('kitchen', 'feed_type')
    
    result = []
    for vol in queryset:
        if group_badge is True and not vol.group_badge:
            continue
        if group_badge is False and vol.group_badge:
            continue
        
        for arrival in vol.relevant_arrivals or []:
            active_from = arrow.get(arrival.arrival_date).to(TZ).floor('day')
            active_to = arrow.get(arrival.departure_date).to(TZ).floor('day')
            
            if active_to < date_from or active_from > date_to:
                continue
            
            result.append({
                'uuid': str(vol.uuid),
                'active_from': active_from,
                'active_to': active_to,
                'is_paid': vol.feed_type.paid if vol.feed_type else False,
                'is_vegan': vol.is_vegan,
                'kitchen_id': vol.kitchen.id if vol.kitchen else None,
                'group_badge_id': vol.group_badge_id if vol.group_badge else None,
            })
    
    return result

def has_group_badge(txn):
    return bool(
        txn.get('group_badge') or 
        (txn.get('reason') and 'Групповое питание' in txn.get('reason', ''))
    )

def get_meal_times_for_day(vol, current_day):
    is_paid = vol['is_paid']
    all_meals = get_meal_times(is_paid)
    
    if vol['active_from'] == current_day and vol['active_to'] != current_day:
        return [m.value for m in all_meals if m != MealTime.BREAKFAST]
    
    if vol['active_from'] != current_day and vol['active_to'] == current_day:
        return [m.value for m in all_meals if m in (MealTime.BREAKFAST, MealTime.LUNCH)]
    
    return [m.value for m in all_meals]

def get_kitchen_ids():
    """Возвращает список ID всех кухонь."""
    return list(models.Kitchen.objects.values_list('id', flat=True))