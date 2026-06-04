import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

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
    return 'FREE';
}

export function resolveFeedTypeId(params: {
    feedTypes: Array<{ id: number; code: string }>;
    code: FeedTypeCode;
}): number | undefined {
    return params.feedTypes.find(({ code: feedCode }) => feedCode === params.code)?.id;
}

export type ArrivalDateInterval = {
    arrival_date?: string | null;
    departure_date?: string | null;
};

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
