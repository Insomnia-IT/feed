import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
    applyFeedingModeToDate,
    buildActiveArrivalDateKeys,
    paintFeedingDate,
    resolvePaintAction,
    computeGristReadonlyFreeDates,
    dateSetsToIntervals,
    deriveFeedTypeCode,
    expandIntervalToDateKeys,
    getDateKeysFromArrivals,
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

    it('marks free arrival days readonly for grist FREE volunteers', () => {
        expect(
            computeGristReadonlyFreeDates({
                feedTypeCode: 'FREE',
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
                freeDates: new Set(['2026-06-10', '2026-08-01'])
            })
        ).toEqual(new Set(['2026-06-10']));

        expect(
            computeGristReadonlyFreeDates({
                feedTypeCode: 'PAID',
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-11' }],
                freeDates: new Set(['2026-06-10'])
            })
        ).toEqual(new Set());
    });
});
