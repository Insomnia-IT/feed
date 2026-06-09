import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

import { isVolunteerActivatedStatusValue } from 'shared/helpers/volunteer-status';

/** Июнь, июль, август (0-based month index в dayjs). */
export const FEEDING_SUMMER_MONTHS = [5, 6, 7] as const;

export type FeedingDateKind = 'free' | 'paid';

export type FeedingDateSets = {
    freeDates: Set<string>;
    paidDates: Set<string>;
};

export function cloneFeedingDateSets(sets: FeedingDateSets): FeedingDateSets {
    return {
        freeDates: new Set(sets.freeDates),
        paidDates: new Set(sets.paidDates)
    };
}

/** Включает день в активный режим (зелёный или синий), снимает противоположный. */
export function applyFeedingModeToDate(params: {
    dateKey: string;
    mode: FeedingDateKind;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): FeedingDateSets {
    const freeDates = new Set(params.freeDates);
    const paidDates = new Set(params.paidDates);

    if (params.mode === 'free') {
        paidDates.delete(params.dateKey);
        freeDates.add(params.dateKey);
    } else {
        freeDates.delete(params.dateKey);
        paidDates.add(params.dateKey);
    }

    return { freeDates, paidDates };
}

export function isDateInFeedingMode(params: {
    dateKey: string;
    mode: FeedingDateKind;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): boolean {
    return params.mode === 'free' ? params.freeDates.has(params.dateKey) : params.paidDates.has(params.dateKey);
}

/** Можно закрасить день в активном режиме (только даты заезда с обводкой на календаре). */
export function canApplyFeedingPaintToDate(params: { dateKey: string; paintableArrivalDates: Set<string> }): boolean {
    return params.paintableArrivalDates.has(params.dateKey);
}

/** Можно взаимодействовать с днём: закрасить в диапазоне заезда или снять уже выставленную отметку. */
export function canInteractWithFeedingCalendarDate(params: {
    dateKey: string;
    mode: FeedingDateKind;
    paintableArrivalDates: Set<string>;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): boolean {
    return (
        canApplyFeedingPaintToDate({ dateKey: params.dateKey, paintableArrivalDates: params.paintableArrivalDates }) ||
        isDateInFeedingMode(params)
    );
}

/** Действие протягивания: снять отметку, если начали с уже выделенного дня. */
export function resolvePaintAction(params: {
    dateKey: string;
    mode: FeedingDateKind;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): 'apply' | 'remove' {
    return isDateInFeedingMode(params) ? 'remove' : 'apply';
}

/** Включает или снимает день в активном режиме (протягивание). */
export function paintFeedingDate(params: {
    dateKey: string;
    mode: FeedingDateKind;
    action: 'apply' | 'remove';
    freeDates: Set<string>;
    paidDates: Set<string>;
}): FeedingDateSets {
    if (params.action === 'apply') {
        return applyFeedingModeToDate(params);
    }

    const freeDates = new Set(params.freeDates);
    const paidDates = new Set(params.paidDates);

    if (params.mode === 'free') {
        freeDates.delete(params.dateKey);
    } else {
        paidDates.delete(params.dateKey);
    }

    return { freeDates, paidDates };
}

/** Переключает день в активном режиме (клик без протягивания). */
export function toggleFeedingDate(params: {
    dateKey: string;
    mode: FeedingDateKind;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): FeedingDateSets {
    const freeDates = new Set(params.freeDates);
    const paidDates = new Set(params.paidDates);

    if (params.mode === 'free') {
        if (freeDates.has(params.dateKey)) {
            freeDates.delete(params.dateKey);
        } else {
            paidDates.delete(params.dateKey);
            freeDates.add(params.dateKey);
        }
    } else if (paidDates.has(params.dateKey)) {
        paidDates.delete(params.dateKey);
    } else {
        freeDates.delete(params.dateKey);
        paidDates.add(params.dateKey);
    }

    return { freeDates, paidDates };
}

export type PaidArrivalFormInterval = {
    id?: string;
    arrival_date: string;
    departure_date: string;
    is_free: boolean;
};

export function getFeedingCalendarYear(referenceDate = dayjs()): number {
    return referenceDate.year();
}

/** Индекс (0–2) летнего месяца для карусели: текущий месяц или ближайший июнь/август. */
export function getDefaultSummerMonthIndex(params?: { referenceDate?: dayjs.Dayjs; year?: number }): number {
    const referenceDate = params?.referenceDate ?? dayjs();
    const calendarYear = params?.year ?? getFeedingCalendarYear(referenceDate);

    if (referenceDate.year() !== calendarYear) {
        return 0;
    }

    const month = referenceDate.month();
    const summerMonths = FEEDING_SUMMER_MONTHS as readonly number[];
    const exactIndex = summerMonths.indexOf(month);
    if (exactIndex >= 0) {
        return exactIndex;
    }

    if (month < summerMonths[0]) {
        return 0;
    }

    return summerMonths.length - 1;
}

export function formatFeedingDateKey(date: dayjs.Dayjs): string {
    return date.format('YYYY-MM-DD');
}

export function isFeedingSummerDate(dateKey: string, year: number): boolean {
    const date = dayjs(dateKey);
    return date.year() === year && (FEEDING_SUMMER_MONTHS as readonly number[]).includes(date.month());
}

export function expandIntervalToDateKeys(interval: { arrival_date: string; departure_date: string }): string[] {
    const start = dayjs(interval.arrival_date).startOf('day');
    const end = dayjs(interval.departure_date).startOf('day');
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        return [];
    }

    const keys: string[] = [];
    let cursor = start;
    while (!cursor.isAfter(end)) {
        keys.push(formatFeedingDateKey(cursor));
        cursor = cursor.add(1, 'day');
    }
    return keys;
}

export function intervalsToDateSets(intervals: PaidArrivalFormInterval[]): {
    freeDates: Set<string>;
    paidDates: Set<string>;
} {
    const freeDates = new Set<string>();
    const paidDates = new Set<string>();

    for (const interval of intervals) {
        const target = interval.is_free ? freeDates : paidDates;
        for (const key of expandIntervalToDateKeys(interval)) {
            target.add(key);
        }
    }

    return { freeDates, paidDates };
}

function sortDateKeys(keys: Iterable<string>): string[] {
    return [...keys].sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
}

function mergeSortedDateKeysToIntervals(params: {
    sortedKeys: string[];
    isFree: boolean;
    existingIntervals: PaidArrivalFormInterval[];
}): PaidArrivalFormInterval[] {
    const { sortedKeys, isFree, existingIntervals } = params;
    if (sortedKeys.length === 0) {
        return [];
    }

    const existingIdByRange = new Map<string, string | undefined>(
        existingIntervals
            .filter((item) => item.is_free === isFree && item.arrival_date && item.departure_date)
            .map((item) => [`${item.arrival_date}:${item.departure_date}`, item.id])
    );

    const intervals: PaidArrivalFormInterval[] = [];
    let rangeStart = sortedKeys[0];
    let rangeEnd = sortedKeys[0];

    const pushRange = () => {
        const rangeKey = `${rangeStart}:${rangeEnd}`;
        intervals.push({
            id: existingIdByRange.get(rangeKey) ?? uuidv4(),
            arrival_date: rangeStart,
            departure_date: rangeEnd,
            is_free: isFree
        });
    };

    for (let index = 1; index < sortedKeys.length; index += 1) {
        const current = sortedKeys[index];
        const previous = sortedKeys[index - 1];
        if (dayjs(current).diff(dayjs(previous), 'day') === 1) {
            rangeEnd = current;
            continue;
        }
        pushRange();
        rangeStart = current;
        rangeEnd = current;
    }
    pushRange();

    return intervals;
}

export function dateSetsToIntervals(params: {
    freeDates: Set<string>;
    paidDates: Set<string>;
    existingIntervals?: PaidArrivalFormInterval[];
}): PaidArrivalFormInterval[] {
    const { freeDates, paidDates, existingIntervals = [] } = params;

    const freeIntervals = mergeSortedDateKeysToIntervals({
        sortedKeys: sortDateKeys(freeDates),
        isFree: true,
        existingIntervals
    });
    const paidIntervals = mergeSortedDateKeysToIntervals({
        sortedKeys: sortDateKeys(paidDates),
        isFree: false,
        existingIntervals
    });

    return [...freeIntervals, ...paidIntervals].sort(
        (a, b) => dayjs(a.arrival_date).unix() - dayjs(b.arrival_date).unix()
    );
}

export type FeedTypeCode = 'FREE' | 'PAID' | 'CHILD' | 'NO';

/** Канонические ID типов питания в БД (совпадают с `packages/scanner/src/db.ts`). */
export const FEED_TYPE_IDS: Record<FeedTypeCode, number> = {
    FREE: 1,
    PAID: 2,
    CHILD: 3,
    NO: 4
};

const CANONICAL_FEED_TYPE_ID_SET = new Set<number>(Object.values(FEED_TYPE_IDS));

const LEGACY_FEED_TYPE_ALIASES: Record<string, FeedTypeCode> = {
    free: 'FREE',
    paid: 'PAID',
    child: 'CHILD',
    no: 'NO',
    nofeed: 'NO',
    no_feed: 'NO'
};

/** Приводит значение формы/API к числовому `feed_type` (1–4). */
export function coerceFeedTypeId(value: unknown): number | undefined {
    if (typeof value === 'number' && CANONICAL_FEED_TYPE_ID_SET.has(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return undefined;
        }

        const numeric = Number(trimmed);
        if (Number.isInteger(numeric) && CANONICAL_FEED_TYPE_ID_SET.has(numeric)) {
            return numeric;
        }

        const upper = trimmed.toUpperCase() as FeedTypeCode;
        if (upper in FEED_TYPE_IDS) {
            return FEED_TYPE_IDS[upper];
        }

        const alias = LEGACY_FEED_TYPE_ALIASES[trimmed.toLowerCase()];
        if (alias) {
            return FEED_TYPE_IDS[alias];
        }
    }

    return undefined;
}

/**
 * Единая логика PATCH: в запросе всегда **один** `feed_type` (1–4), не все четыре.
 *
 * Приоритет (как в PATCH — по полям формы, как у «Ребёнок» / календаря):
 * 1. Ребёнок (`feed_type: 3`) → `3`, `paid_arrivals: []`
 * 2. Бесплатно на заезд (`feed_type: 1`, `paid_arrivals` пустой) → `1`, `paid_arrivals: []`
 * 3. Календарь: синий/оранжевый день → `2` + `paid_arrivals`
 * 4. Ничего → `4`, `paid_arrivals: []`
 */
export function resolveVolunteerFeedingPayload(params: {
    paidArrivals: PaidArrivalFormInterval[];
    isChild: boolean;
    feedTypeId?: number | null;
    arrivals: ArrivalDateInterval[];
    feedTypes: Array<{ id: number; code: string }>;
}): { feed_type: number; paid_arrivals: PaidArrivalFormInterval[] } {
    const feedTypeId = coerceFeedTypeId(params.feedTypeId);
    const childFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'CHILD' });
    const freeFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'FREE' });

    if (params.isChild || feedTypeId === childFeedTypeId) {
        return {
            feed_type: childFeedTypeId,
            paid_arrivals: []
        };
    }

    if (feedTypeId === freeFeedTypeId && params.paidArrivals.length === 0) {
        return {
            feed_type: freeFeedTypeId,
            paid_arrivals: []
        };
    }

    const paid_arrivals = buildPaidArrivalsForApi({
        paidArrivals: params.paidArrivals,
        arrivals: params.arrivals,
        freeDuringStay: false
    });

    if (paid_arrivals.length > 0) {
        return {
            feed_type: resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'PAID' }),
            paid_arrivals
        };
    }

    return {
        feed_type: resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'NO' }),
        paid_arrivals: []
    };
}

/**
 * Восстанавливает чекбокс «Бесплатно на время заезда» из ответа API при открытии карточки.
 *
 * Правило: чекбокс включён только в каноническом состоянии FREE:
 * - feed_type = 1 (FREE)  И  paid_arrivals полностью пустой  И  есть хотя бы один заезд.
 *
 * Если paid_arrivals содержит интервалы (даже с is_free: true), это «за счёт фестиваля» —
 * чекбокс должен быть выключен, иначе синк затрёт оранжевые дни на датах заезда.
 */
export function deriveFreeDuringStayFromVolunteer(params: {
    feedTypeId: number | null | undefined;
    paidArrivals: PaidArrivalFormInterval[];
    arrivals: ArrivalDateInterval[];
}): boolean {
    const feedTypeId = coerceFeedTypeId(params.feedTypeId);

    if (feedTypeId === FEED_TYPE_IDS.CHILD) {
        return true;
    }

    return (
        feedTypeId === FEED_TYPE_IDS.FREE &&
        params.paidArrivals.length === 0 &&
        getDateKeysFromArrivals(params.arrivals).size > 0
    );
}

export function deriveFeedTypeCode(params: {
    freeDates: Set<string>;
    paidDates: Set<string>;
    isChild: boolean;
}): FeedTypeCode {
    const { freeDates, paidDates, isChild } = params;
    if (isChild) {
        return 'CHILD';
    }
    if (paidDates.size > 0) {
        return 'PAID';
    }
    if (freeDates.size > 0) {
        return 'FREE';
    }
    return 'NO';
}

/** Все дни заездов отмечены бесплатным питанием на календаре. */
export function isFreeFeedingDuringStayChecked(params: {
    arrivals: ArrivalDateInterval[];
    freeDates: Set<string>;
}): boolean {
    const arrivalDateKeys = getDateKeysFromArrivals(params.arrivals);
    if (arrivalDateKeys.size === 0) {
        return false;
    }

    for (const dateKey of arrivalDateKeys) {
        if (!params.freeDates.has(dateKey)) {
            return false;
        }
    }

    return true;
}

export function applyFeedTypeFromCalendar(params: {
    freeDates: Set<string>;
    paidDates: Set<string>;
    isChild: boolean;
    arrivals: ArrivalDateInterval[];
    feedTypes: Array<{ id: number; code: string }>;
}): number {
    const paidArrivals = dateSetsToIntervals({
        freeDates: params.freeDates,
        paidDates: params.paidDates
    });

    return resolveVolunteerFeedingPayload({
        paidArrivals,
        isChild: params.isChild,
        arrivals: params.arrivals,
        feedTypes: params.feedTypes
    }).feed_type;
}

/**
 * Формирует `paid_arrivals` для API:
 * - `is_free: false` — платное питание (режим «Платно»);
 * - `is_free: true` — за счёт фестиваля (режим «За счёт фестиваля»).
 * Дни «бесплатно на время заезда» в `paid_arrivals` не попадают — только влияют на `feed_type`.
 */
export function buildPaidArrivalsForApi(params: {
    paidArrivals: PaidArrivalFormInterval[];
    arrivals: ArrivalDateInterval[];
    freeDuringStay: boolean;
}): PaidArrivalFormInterval[] {
    const { freeDates, paidDates } = intervalsToDateSets(params.paidArrivals);
    const stayFreeDates = getStayFreeDateKeys({
        freeDates,
        arrivalDateKeys: getDateKeysFromArrivals(params.arrivals),
        freeDuringStay: params.freeDuringStay
    });

    const festivalFreeDates = new Set<string>();
    for (const dateKey of freeDates) {
        if (!stayFreeDates.has(dateKey)) {
            festivalFreeDates.add(dateKey);
        }
    }

    return dateSetsToIntervals({
        freeDates: festivalFreeDates,
        paidDates,
        existingIntervals: params.paidArrivals
    });
}

/** Приводит поля формы к телу PATCH волонтёра. */
export function normalizeVolunteerFeedingPayload(params: {
    paidArrivals: PaidArrivalFormInterval[];
    feedTypeId: number | null | undefined;
    feedTypes: Array<{ id: number; code: string }>;
    isChild?: boolean;
    arrivals?: ArrivalDateInterval[];
}): { feed_type: number; paid_arrivals: PaidArrivalFormInterval[] } {
    const feedTypeId = coerceFeedTypeId(params.feedTypeId);
    const childFeedTypeId = resolveFeedTypeId({ feedTypes: params.feedTypes, code: 'CHILD' });
    const isChild = params.isChild ?? (feedTypeId === childFeedTypeId || feedTypeId === FEED_TYPE_IDS.CHILD);

    return resolveVolunteerFeedingPayload({
        paidArrivals: params.paidArrivals,
        isChild,
        feedTypeId: params.feedTypeId,
        arrivals: params.arrivals ?? [],
        feedTypes: params.feedTypes
    });
}

export function resolveFeedTypeId(params: {
    feedTypes: Array<{ id: number; code: string }>;
    code: FeedTypeCode;
}): number {
    return params.feedTypes.find(({ code: feedCode }) => feedCode === params.code)?.id ?? FEED_TYPE_IDS[params.code];
}

export type ArrivalDateInterval = {
    arrival_date?: string | null;
    departure_date?: string | null;
    status?: string | null;
};

/** Дни активных заездов: приступил, прибился или заехал на поле (`ARRIVED` / `STARTED` / `JOINED`). */
export function buildActiveArrivalDateKeys(arrivals: ArrivalDateInterval[]): Set<string> {
    const keys = new Set<string>();

    for (const arrival of arrivals) {
        if (!isVolunteerActivatedStatusValue(arrival.status)) {
            continue;
        }

        for (const key of expandIntervalToDateKeys({
            arrival_date: arrival.arrival_date ?? '',
            departure_date: arrival.departure_date ?? ''
        })) {
            keys.add(key);
        }
    }

    return keys;
}

/**
 * Бесплатные дни заезда (чекбокс «Бесплатно на время заезда») — отдельно от «за счёт фестиваля».
 *
 * Возвращает ВСЕ дни заездов когда freeDuringStay=true, независимо от того,
 * что хранится в freeDates. Это позволяет не хранить зелёные дни в paid_arrivals формы,
 * избегая feedback-loop с deriveFreeDuringStayFromVolunteer.
 */
export function getStayFreeDateKeys(params: {
    freeDates: Set<string>;
    arrivalDateKeys: Set<string>;
    freeDuringStay: boolean;
}): Set<string> {
    if (!params.freeDuringStay) {
        return new Set();
    }

    return new Set(params.arrivalDateKeys);
}

/** Все дни заездов (включительно) в виде ключей YYYY-MM-DD. */
export function getDateKeysFromArrivals(arrivals: ArrivalDateInterval[]): Set<string> {
    const keys = new Set<string>();

    for (const arrival of arrivals) {
        if (!arrival.arrival_date || !arrival.departure_date) {
            continue;
        }

        for (const key of expandIntervalToDateKeys({
            arrival_date: arrival.arrival_date,
            departure_date: arrival.departure_date
        })) {
            keys.add(key);
        }
    }

    return keys;
}

/** Дни, которые были в предыдущих заездах, но исчезли после изменения списка заездов. */
export function getRemovedArrivalDateKeys(params: {
    previousArrivalDateKeys: Set<string>;
    currentArrivalDateKeys: Set<string>;
}): Set<string> {
    const removedDateKeys = new Set<string>();

    for (const dateKey of params.previousArrivalDateKeys) {
        if (!params.currentArrivalDateKeys.has(dateKey)) {
            removedDateKeys.add(dateKey);
        }
    }

    return removedDateKeys;
}

/** Удаляет указанные даты из календаря питания (и бесплатные, и платные). */
export function removeDatesFromFeedingCalendar(params: {
    dateKeys: Iterable<string>;
    freeDates: Set<string>;
    paidDates: Set<string>;
}): { freeDates: Set<string>; paidDates: Set<string> } {
    const freeDates = new Set(params.freeDates);
    const paidDates = new Set(params.paidDates);

    for (const dateKey of params.dateKeys) {
        freeDates.delete(dateKey);
        paidDates.delete(dateKey);
    }

    return { freeDates, paidDates };
}

/** Снимает бесплатное питание с дней заездов; платные дни не меняет. */
export function removeArrivalDatesFromFreeFeeding(params: {
    arrivals: ArrivalDateInterval[];
    freeDates: Set<string>;
    paidDates: Set<string>;
}): { freeDates: Set<string>; paidDates: Set<string> } {
    const arrivalDateKeys = getDateKeysFromArrivals(params.arrivals);
    const freeDates = new Set(params.freeDates);

    for (const dateKey of arrivalDateKeys) {
        freeDates.delete(dateKey);
    }

    return { freeDates, paidDates: new Set(params.paidDates) };
}

/** Добавляет дни заездов в бесплатное питание; снимает их с платных дней. */
export function mergeArrivalDatesIntoFreeFeeding(params: {
    arrivals: ArrivalDateInterval[];
    freeDates: Set<string>;
    paidDates: Set<string>;
}): { freeDates: Set<string>; paidDates: Set<string>; addedCount: number } {
    const arrivalDateKeys = getDateKeysFromArrivals(params.arrivals);
    const freeDates = new Set(params.freeDates);
    const paidDates = new Set(params.paidDates);
    let addedCount = 0;

    for (const dateKey of arrivalDateKeys) {
        if (!freeDates.has(dateKey)) {
            addedCount += 1;
        }
        freeDates.add(dateKey);
        paidDates.delete(dateKey);
    }

    return { freeDates, paidDates, addedCount };
}
