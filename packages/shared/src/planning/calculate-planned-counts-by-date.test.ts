import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';

import {
    calculatePlannedCountsByDate,
    getPlannedCountsForDate,
    type PlannedDayCounts
} from './calculate-planned-counts-by-date';
import { FeedTypeCode, type PlanningArrival, type PlanningPaidArrival, type PlanningVolunteer } from './types';

// Конкретный год здесь не имеет бизнес-смысла: production-код сравнивает только календарные даты
// в интервалах arrival_date/departure_date. В тестах нам нужна стабильная последовательность
// соседних дней, чтобы явно проверять попадание в интервалы: 1-й, 2-й, 3-й и тд
const REFERENCE_DATE = '2024-01-01';
const testDate = (dayOffset: number): string => dayjs(REFERENCE_DATE).add(dayOffset, 'day').format('YYYY-MM-DD');

const TEST_DATE = {
    FIRST_DAY: testDate(0),
    SECOND_DAY: testDate(1),
    THIRD_DAY: testDate(2),
    FOURTH_DAY: testDate(3),
    FIFTH_DAY: testDate(4)
} as const;

// Фабрики ниже создают минимальные структуры, которые нужны общей планировочной логике
// Так тесты не зависят от полных моделей admin/scanner и проверяют только общий контракт shared-пакета
const createArrival = (params: { arrival: string; departure: string; status?: string | null }): PlanningArrival => ({
    arrival_date: params.arrival,
    departure_date: params.departure,
    status: params.status ?? null
});

const createPaidArrival = (params: { arrival: string; departure: string; is_free?: boolean }): PlanningPaidArrival => ({
    arrival_date: params.arrival,
    departure_date: params.departure,
    is_free: params.is_free ?? false
});

const createVolunteer = (params: {
    is_vegan?: boolean;
    is_blocked?: boolean;
    feed_type_code?: string | null;
    arrivals?: PlanningArrival[];
    paid_arrivals?: PlanningPaidArrival[];
    qr?: string;
}): PlanningVolunteer => ({
    is_vegan: params.is_vegan ?? false,
    is_blocked: params.is_blocked ?? false,
    feed_type_code: params.feed_type_code ?? FeedTypeCode.Free,
    arrivals: params.arrivals ?? [],
    paid_arrivals: params.paid_arrivals ?? [],
    qr: params.qr ?? 'test-qr'
});

const expectPlannedCounts = (actual: PlannedDayCounts, expected: { meat: number; vegan: number }) => {
    expect(actual.meat).toHaveLength(expected.meat);
    expect(actual.vegan).toHaveLength(expected.vegan);
};

describe('getPlannedCountsForDate', () => {
    // getPlannedCountsForDate -- маленький helper для безопасного чтения из Map:
    // если на дату ничего не рассчитано, UI должен получить 0/0 вместо undefined
    it('returns 0/0 for missing date', () => {
        expectPlannedCounts(getPlannedCountsForDate(new Map(), TEST_DATE.FIRST_DAY), { meat: 0, vegan: 0 });
    });

    it('returns stored value when present', () => {
        const map = new Map([[TEST_DATE.FIRST_DAY, { meat: ['m1', 'm2', 'm3'], vegan: ['v1'] }]]);
        expectPlannedCounts(getPlannedCountsForDate(map, TEST_DATE.FIRST_DAY), { meat: 3, vegan: 1 });
    });
});

describe('calculatePlannedCountsByDate', () => {
    // Основная функция строит Map<дата, { meat, vegan }> по списку волонтёров
    // Дальше каждый кейс фиксирует отдельное бизнес-правило отбора волонтёров в план питания
    it('returns empty map when no volunteers', () => {
        const result = calculatePlannedCountsByDate({ volunteers: [] });
        expect(result.size).toBe(0);
    });

    it('counts activated volunteer across arrival interval', () => {
        // Активный arrival-интервал включителен: волонтёр считается на первый, второй и третий день,
        // но уже не считается на следующий день после departure_date
        const vol = createVolunteer({
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.THIRD_DAY, status: 'STARTED' })
            ]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.SECOND_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.THIRD_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FOURTH_DAY), { meat: 0, vegan: 0 });
    });

    it('ignores arrivals without activated status', () => {
        const vol = createVolunteer({
            arrivals: [createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.THIRD_DAY, status: 'LEFT' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('treats ARRIVED, STARTED, JOINED as activated statuses', () => {
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'ARRIVED' })
                ]
            }),
            createVolunteer({
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
                ]
            }),
            createVolunteer({
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'JOINED' })
                ]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 3, vegan: 0 });
    });

    it('separates vegan and meat eaters', () => {
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                is_vegan: true,
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
                ]
            }),
            createVolunteer({
                is_vegan: false,
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
                ]
            }),
            createVolunteer({
                is_vegan: true,
                arrivals: [
                    createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
                ]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 2 });
    });

    it('excludes blocked volunteers', () => {
        const vol = createVolunteer({
            is_blocked: true,
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
            ]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('excludes NOFEED volunteers', () => {
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.NoFeed,
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
            ]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('counts PAID volunteer only by paid_arrivals', () => {
        // Для платного питания обычные arrivals не дают права на питание:
        // учитывается только paid_arrivals
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.Paid,
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.SECOND_DAY, status: 'STARTED' })
            ],
            paid_arrivals: [createPaidArrival({ arrival: TEST_DATE.THIRD_DAY, departure: TEST_DATE.FOURTH_DAY })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 0, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.SECOND_DAY), { meat: 0, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.THIRD_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FOURTH_DAY), { meat: 1, vegan: 0 });
    });

    it('counts FREE volunteer by either arrivals or paid_arrivals', () => {
        // Для бесплатного питания достаточно либо активного arrival, либо paid_arrival
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.Free,
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.SECOND_DAY, status: 'STARTED' })
            ],
            paid_arrivals: [createPaidArrival({ arrival: TEST_DATE.THIRD_DAY, departure: TEST_DATE.FOURTH_DAY })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.SECOND_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.THIRD_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FOURTH_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIFTH_DAY), { meat: 0, vegan: 0 });
    });

    it('aggregates multiple volunteers across overlapping dates', () => {
        // Этот кейс проверяет агрегацию по нескольким волонтёрам:
        // интервалы пересекаются, поэтому на разные даты должны получаться разные суммы
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                arrivals: [
                    createArrival({
                        arrival: TEST_DATE.FIRST_DAY,
                        departure: TEST_DATE.THIRD_DAY,
                        status: 'STARTED'
                    })
                ]
            }),
            createVolunteer({
                is_vegan: true,
                arrivals: [
                    createArrival({
                        arrival: TEST_DATE.SECOND_DAY,
                        departure: TEST_DATE.FOURTH_DAY,
                        status: 'STARTED'
                    })
                ]
            }),
            createVolunteer({
                arrivals: [
                    createArrival({
                        arrival: TEST_DATE.THIRD_DAY,
                        departure: TEST_DATE.FIFTH_DAY,
                        status: 'STARTED'
                    })
                ]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });

        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.SECOND_DAY), { meat: 1, vegan: 1 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.THIRD_DAY), { meat: 2, vegan: 1 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FOURTH_DAY), { meat: 1, vegan: 1 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIFTH_DAY), { meat: 1, vegan: 0 });
    });

    it('counts overlapping arrival and paid_arrival of the same volunteer only once per date', () => {
        // Один и тот же волонтёр может иметь и arrival, и paid_arrival на одну дату
        // В плане он всё равно должен считаться один раз, а не удваиваться
        const vol = createVolunteer({
            arrivals: [
                createArrival({
                    arrival: TEST_DATE.FIRST_DAY,
                    departure: TEST_DATE.THIRD_DAY,
                    status: 'STARTED'
                })
            ],
            paid_arrivals: [createPaidArrival({ arrival: TEST_DATE.SECOND_DAY, departure: TEST_DATE.FOURTH_DAY })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.SECOND_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.THIRD_DAY), { meat: 1, vegan: 0 });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FOURTH_DAY), { meat: 1, vegan: 0 });
    });

    it('handles missing feed_type_code as FREE-like', () => {
        const vol = createVolunteer({
            feed_type_code: null,
            arrivals: [
                createArrival({ arrival: TEST_DATE.FIRST_DAY, departure: TEST_DATE.FIRST_DAY, status: 'STARTED' })
            ]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expectPlannedCounts(getPlannedCountsForDate(result, TEST_DATE.FIRST_DAY), { meat: 1, vegan: 0 });
    });
});
