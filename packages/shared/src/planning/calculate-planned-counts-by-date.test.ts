import { describe, expect, it } from 'vitest';

import { calculatePlannedCountsByDate, getPlannedCountsForDate } from './calculate-planned-counts-by-date';
import { FeedTypeCode, type PlanningArrival, type PlanningPaidArrival, type PlanningVolunteer } from './types';

const DATE = {
    D1: '2026-07-01',
    D2: '2026-07-02',
    D3: '2026-07-03',
    D4: '2026-07-04',
    D5: '2026-07-05'
} as const;

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
}): PlanningVolunteer => ({
    is_vegan: params.is_vegan ?? false,
    is_blocked: params.is_blocked ?? false,
    feed_type_code: params.feed_type_code ?? FeedTypeCode.Free,
    arrivals: params.arrivals ?? [],
    paid_arrivals: params.paid_arrivals ?? []
});

describe('getPlannedCountsForDate', () => {
    it('returns 0/0 for missing date', () => {
        expect(getPlannedCountsForDate(new Map(), DATE.D1)).toEqual({ meat: 0, vegan: 0 });
    });

    it('returns stored value when present', () => {
        const map = new Map([[DATE.D1, { meat: 3, vegan: 1 }]]);
        expect(getPlannedCountsForDate(map, DATE.D1)).toEqual({ meat: 3, vegan: 1 });
    });
});

describe('calculatePlannedCountsByDate', () => {
    it('returns empty map when no volunteers', () => {
        const result = calculatePlannedCountsByDate({ volunteers: [] });
        expect(result.size).toBe(0);
    });

    it('counts activated volunteer across arrival interval', () => {
        const vol = createVolunteer({
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D3, status: 'STARTED' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D2)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D3)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D4)).toEqual({ meat: 0, vegan: 0 });
    });

    it('ignores arrivals without activated status', () => {
        const vol = createVolunteer({
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D3, status: 'LEFT' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('treats ARRIVED, STARTED, JOINED as activated statuses', () => {
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'ARRIVED' })]
            }),
            createVolunteer({
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
            }),
            createVolunteer({
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'JOINED' })]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });
        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 3, vegan: 0 });
    });

    it('separates vegan and meat eaters', () => {
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                is_vegan: true,
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
            }),
            createVolunteer({
                is_vegan: false,
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
            }),
            createVolunteer({
                is_vegan: true,
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });
        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 2 });
    });

    it('excludes blocked volunteers', () => {
        const vol = createVolunteer({
            is_blocked: true,
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('excludes NOFEED volunteers', () => {
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.NoFeed,
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(result.size).toBe(0);
    });

    it('counts PAID volunteer only by paid_arrivals', () => {
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.Paid,
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D2, status: 'STARTED' })],
            paid_arrivals: [createPaidArrival({ arrival: DATE.D3, departure: DATE.D4 })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 0, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D2)).toEqual({ meat: 0, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D3)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D4)).toEqual({ meat: 1, vegan: 0 });
    });

    it('counts FREE volunteer by either arrivals or paid_arrivals', () => {
        const vol = createVolunteer({
            feed_type_code: FeedTypeCode.Free,
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D2, status: 'STARTED' })],
            paid_arrivals: [createPaidArrival({ arrival: DATE.D3, departure: DATE.D4 })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D2)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D3)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D4)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D5)).toEqual({ meat: 0, vegan: 0 });
    });

    it('aggregates multiple volunteers across overlapping dates', () => {
        const vols: PlanningVolunteer[] = [
            createVolunteer({
                arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D3, status: 'STARTED' })]
            }),
            createVolunteer({
                is_vegan: true,
                arrivals: [createArrival({ arrival: DATE.D2, departure: DATE.D4, status: 'STARTED' })]
            }),
            createVolunteer({
                arrivals: [createArrival({ arrival: DATE.D3, departure: DATE.D5, status: 'STARTED' })]
            })
        ];
        const result = calculatePlannedCountsByDate({ volunteers: vols });

        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D2)).toEqual({ meat: 1, vegan: 1 });
        expect(getPlannedCountsForDate(result, DATE.D3)).toEqual({ meat: 2, vegan: 1 });
        expect(getPlannedCountsForDate(result, DATE.D4)).toEqual({ meat: 1, vegan: 1 });
        expect(getPlannedCountsForDate(result, DATE.D5)).toEqual({ meat: 1, vegan: 0 });
    });

    it('counts overlapping arrival and paid_arrival of the same volunteer only once per date', () => {
        const vol = createVolunteer({
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D3, status: 'STARTED' })],
            paid_arrivals: [createPaidArrival({ arrival: DATE.D2, departure: DATE.D4 })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });

        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D2)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D3)).toEqual({ meat: 1, vegan: 0 });
        expect(getPlannedCountsForDate(result, DATE.D4)).toEqual({ meat: 1, vegan: 0 });
    });

    it('handles missing feed_type_code as FREE-like', () => {
        const vol = createVolunteer({
            feed_type_code: null,
            arrivals: [createArrival({ arrival: DATE.D1, departure: DATE.D1, status: 'STARTED' })]
        });
        const result = calculatePlannedCountsByDate({ volunteers: [vol] });
        expect(getPlannedCountsForDate(result, DATE.D1)).toEqual({ meat: 1, vegan: 0 });
    });
});
