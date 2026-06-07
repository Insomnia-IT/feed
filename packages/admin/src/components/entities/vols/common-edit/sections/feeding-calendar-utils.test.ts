import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
    applyFeedingModeToDate,
    buildActiveArrivalDateKeys,
    paintFeedingDate,
    resolvePaintAction,
    isFreeFeedingDuringStayChecked,
    removeArrivalDatesFromFreeFeeding,
    dateSetsToIntervals,
    deriveFeedTypeCode,
    normalizeVolunteerFeedingPayload,
    expandIntervalToDateKeys,
    getDateKeysFromArrivals,
    buildPaidArrivalsForApi,
    getRemovedArrivalDateKeys,
    getStayFreeDateKeys,
    removeDatesFromFeedingCalendar,
    getDefaultSummerMonthIndex,
    intervalsToDateSets,
    mergeArrivalDatesIntoFreeFeeding,
    toggleFeedingDate
} from './feeding-calendar-utils';

describe('feeding-calendar-utils', () => {
    it('expands interval to consecutive date keys', () => {
        expect(expandIntervalToDateKeys({ arrival_date: '2026-06-10', departure_date: '2026-06-12' })).toEqual([
            '2026-06-10',
            '2026-06-11',
            '2026-06-12'
        ]);
    });

    it('merges consecutive dates into one interval per kind', () => {
        const intervals = dateSetsToIntervals({
            freeDates: new Set(['2026-06-01', '2026-06-02', '2026-06-10']),
            paidDates: new Set(['2026-07-01', '2026-07-02'])
        });

        expect(intervals).toEqual([
            {
                arrival_date: '2026-06-01',
                departure_date: '2026-06-02',
                is_free: true,
                id: expect.any(String)
            },
            {
                arrival_date: '2026-06-10',
                departure_date: '2026-06-10',
                is_free: true,
                id: expect.any(String)
            },
            {
                arrival_date: '2026-07-01',
                departure_date: '2026-07-02',
                is_free: false,
                id: expect.any(String)
            }
        ]);
    });

    it('round-trips intervals to date sets', () => {
        const source = [
            {
                id: 'a',
                arrival_date: '2026-08-01',
                departure_date: '2026-08-03',
                is_free: true
            },
            {
                id: 'b',
                arrival_date: '2026-07-15',
                departure_date: '2026-07-16',
                is_free: false
            }
        ];

        const { freeDates, paidDates } = intervalsToDateSets(source);
        const restored = dateSetsToIntervals({ freeDates, paidDates, existingIntervals: source });

        expect(restored).toEqual([source[1], source[0]]);
    });

    it('highlights only active arrival dates', () => {
        const keys = buildActiveArrivalDateKeys([
            { arrival_date: '2026-06-10', departure_date: '2026-06-11', status: 'STARTED' },
            { arrival_date: '2026-07-01', departure_date: '2026-07-02', status: 'SKIPPED' },
            { arrival_date: '2026-08-05', departure_date: '2026-08-05', status: 'ARRIVED' }
        ]);

        expect(keys).toEqual(new Set(['2026-06-10', '2026-06-11', '2026-08-05']));
    });

    it('picks default summer month index for carousel', () => {
        expect(
            getDefaultSummerMonthIndex({
                referenceDate: dayjs('2026-07-15'),
                year: 2026
            })
        ).toBe(1);

        expect(
            getDefaultSummerMonthIndex({
                referenceDate: dayjs('2026-05-01'),
                year: 2026
            })
        ).toBe(0);

        expect(
            getDefaultSummerMonthIndex({
                referenceDate: dayjs('2026-09-01'),
                year: 2026
            })
        ).toBe(2);
    });

    it('collects date keys from arrivals', () => {
        expect(
            getDateKeysFromArrivals([
                { arrival_date: '2026-06-10', departure_date: '2026-06-11' },
                { arrival_date: '2026-07-01', departure_date: '2026-07-01' }
            ])
        ).toEqual(new Set(['2026-06-10', '2026-06-11', '2026-07-01']));
    });

    it('merges arrival dates into free feeding and removes paid overlap', () => {
        const result = mergeArrivalDatesIntoFreeFeeding({
            arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
            freeDates: new Set(['2026-08-01']),
            paidDates: new Set(['2026-06-10'])
        });

        expect(result.freeDates).toEqual(new Set(['2026-08-01', '2026-06-10', '2026-06-11']));
        expect(result.paidDates).toEqual(new Set());
        expect(result.addedCount).toBe(2);
    });

    it('resolves paint action from first cell', () => {
        expect(
            resolvePaintAction({
                dateKey: '2026-06-10',
                mode: 'free',
                freeDates: new Set(['2026-06-10']),
                paidDates: new Set()
            })
        ).toBe('remove');

        expect(
            resolvePaintAction({
                dateKey: '2026-06-10',
                mode: 'paid',
                freeDates: new Set(['2026-06-10']),
                paidDates: new Set()
            })
        ).toBe('apply');
    });

    it('paints and removes dates while dragging', () => {
        const painted = paintFeedingDate({
            dateKey: '2026-06-10',
            mode: 'free',
            action: 'apply',
            freeDates: new Set(),
            paidDates: new Set()
        });
        const erased = paintFeedingDate({
            dateKey: '2026-06-10',
            mode: 'free',
            action: 'remove',
            ...painted
        });
        expect(erased.freeDates).toEqual(new Set());
    });

    it('applies and toggles feeding mode on a date', () => {
        const applied = applyFeedingModeToDate({
            dateKey: '2026-06-10',
            mode: 'free',
            freeDates: new Set(),
            paidDates: new Set(['2026-06-10'])
        });
        expect(applied.freeDates).toEqual(new Set(['2026-06-10']));
        expect(applied.paidDates).toEqual(new Set());

        const toggledOff = toggleFeedingDate({
            dateKey: '2026-06-10',
            mode: 'free',
            ...applied
        });
        expect(toggledOff.freeDates).toEqual(new Set());
    });

    it('derives feed type code from calendar selection', () => {
        expect(
            deriveFeedTypeCode({
                freeDates: new Set(),
                paidDates: new Set(),
                isChild: false
            })
        ).toBe('NO');

        expect(
            deriveFeedTypeCode({
                freeDates: new Set(['2026-06-01']),
                paidDates: new Set(),
                isChild: false
            })
        ).toBe('FREE');

        expect(
            deriveFeedTypeCode({
                freeDates: new Set(),
                paidDates: new Set(['2026-06-01']),
                isChild: false
            })
        ).toBe('PAID');

        expect(
            deriveFeedTypeCode({
                freeDates: new Set(['2026-06-01']),
                paidDates: new Set(['2026-07-01']),
                isChild: false
            })
        ).toBe('PAID');

        expect(
            deriveFeedTypeCode({
                freeDates: new Set(),
                paidDates: new Set(),
                isChild: true
            })
        ).toBe('CHILD');
    });

    it('keeps explicit feed_type when calendar is empty (legacy select behavior)', () => {
        const feedTypes = [
            { id: 1, code: 'FREE' },
            { id: 2, code: 'PAID' },
            { id: 3, code: 'CHILD' },
            { id: 4, code: 'NO' }
        ];

        expect(
            normalizeVolunteerFeedingPayload({
                paidArrivals: [],
                feedTypeId: 1,
                feedTypes
            })
        ).toEqual({ feed_type: 1, paid_arrivals: [] });

        expect(
            normalizeVolunteerFeedingPayload({
                paidArrivals: [],
                feedTypeId: 4,
                feedTypes
            })
        ).toEqual({ feed_type: 4, paid_arrivals: [] });
    });

    it('detects when all arrival days are marked free', () => {
        expect(
            isFreeFeedingDuringStayChecked({
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
                freeDates: new Set(['2026-06-10', '2026-06-11'])
            })
        ).toBe(true);

        expect(
            isFreeFeedingDuringStayChecked({
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
                freeDates: new Set(['2026-06-10'])
            })
        ).toBe(false);
    });

    it('builds paid_arrivals for api with is_free flags and without stay-only days', () => {
        expect(
            buildPaidArrivalsForApi({
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }],
                freeDuringStay: true,
                paidArrivals: [
                    {
                        id: 'stay',
                        arrival_date: '2026-06-10',
                        departure_date: '2026-06-12',
                        is_free: true
                    },
                    {
                        id: 'festival',
                        arrival_date: '2026-06-20',
                        departure_date: '2026-06-21',
                        is_free: true
                    },
                    {
                        id: 'paid',
                        arrival_date: '2026-07-01',
                        departure_date: '2026-07-02',
                        is_free: false
                    }
                ]
            })
        ).toEqual([
            {
                id: 'festival',
                arrival_date: '2026-06-20',
                departure_date: '2026-06-21',
                is_free: true
            },
            {
                id: 'paid',
                arrival_date: '2026-07-01',
                departure_date: '2026-07-02',
                is_free: false
            }
        ]);
    });

    it('normalizes volunteer payload before api submit', () => {
        const feedTypes = [
            { id: 1, code: 'FREE' },
            { id: 2, code: 'PAID' }
        ];

        expect(
            normalizeVolunteerFeedingPayload({
                feedTypes,
                feedTypeId: 2,
                freeDuringStay: false,
                arrivals: [],
                paidArrivals: [
                    {
                        arrival_date: '2026-06-01',
                        departure_date: '2026-06-01',
                        is_free: true
                    },
                    {
                        arrival_date: '2026-07-01',
                        departure_date: '2026-07-01',
                        is_free: false
                    }
                ]
            })
        ).toEqual({
            feed_type: 2,
            paid_arrivals: [
                {
                    id: expect.any(String),
                    arrival_date: '2026-06-01',
                    departure_date: '2026-06-01',
                    is_free: true
                },
                {
                    id: expect.any(String),
                    arrival_date: '2026-07-01',
                    departure_date: '2026-07-01',
                    is_free: false
                }
            ]
        });
    });

    it('detects dates removed with deleted arrival', () => {
        expect(
            getRemovedArrivalDateKeys({
                previousArrivalDateKeys: new Set(['2026-06-04', '2026-06-22', '2026-06-25']),
                currentArrivalDateKeys: new Set(['2026-06-04', '2026-06-19'])
            })
        ).toEqual(new Set(['2026-06-22', '2026-06-25']));
    });

    it('removes deleted arrival dates from feeding calendar', () => {
        expect(
            removeDatesFromFeedingCalendar({
                dateKeys: ['2026-06-22', '2026-06-23'],
                freeDates: new Set(['2026-06-04', '2026-06-22', '2026-06-30']),
                paidDates: new Set(['2026-06-23'])
            })
        ).toEqual({
            freeDates: new Set(['2026-06-04', '2026-06-30']),
            paidDates: new Set()
        });
    });

    it('extracts stay-free dates separately from festival-free dates', () => {
        expect(
            getStayFreeDateKeys({
                freeDuringStay: true,
                arrivalDateKeys: new Set(['2026-06-10', '2026-06-11']),
                freeDates: new Set(['2026-06-10', '2026-06-15'])
            })
        ).toEqual(new Set(['2026-06-10']));

        expect(
            getStayFreeDateKeys({
                freeDuringStay: false,
                arrivalDateKeys: new Set(['2026-06-10']),
                freeDates: new Set(['2026-06-10', '2026-06-15'])
            })
        ).toEqual(new Set());
    });

    it('removes free feeding from arrival days only', () => {
        expect(
            removeArrivalDatesFromFreeFeeding({
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
                freeDates: new Set(['2026-06-10', '2026-06-11', '2026-08-01']),
                paidDates: new Set(['2026-06-12'])
            })
        ).toEqual({
            freeDates: new Set(['2026-08-01']),
            paidDates: new Set(['2026-06-12'])
        });
    });
});
