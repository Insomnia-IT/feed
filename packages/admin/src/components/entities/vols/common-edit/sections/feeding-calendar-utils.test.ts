import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
    applyFeedingModeToDate,
    buildActiveArrivalDateKeys,
    buildPlannedArrivalDateKeys,
    buildPaintableArrivalDateKeys,
    canApplyFeedingPaintToDate,
    canInteractWithFeedingCalendarDate,
    paintFeedingDate,
    resolvePaintAction,
    isFreeFeedingDuringStayChecked,
    removeArrivalDatesFromFreeFeeding,
    dateSetsToIntervals,
    deriveFeedTypeCode,
    deriveFreeDuringStayFromVolunteer,
    normalizeVolunteerFeedingPayload,
    resolveVolunteerFeedingPayload,
    expandIntervalToDateKeys,
    getDateKeysFromArrivals,
    buildPaidArrivalsForApi,
    coerceFeedTypeId,
    FEED_TYPE_IDS,
    getRemovedArrivalDateKeys,
    getStayFreeDateKeys,
    removeDatesFromFeedingCalendar,
    getDefaultSummerMonthIndex,
    intervalsToDateSets,
    mergeArrivalDatesIntoFreeFeeding,
    resolveFeedTypeId,
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

    it('outlines only planned arrival dates', () => {
        const keys = buildPlannedArrivalDateKeys([
            { arrival_date: '2026-07-08', departure_date: '2026-07-13', status: 'PLANNED' },
            { arrival_date: '2026-06-10', departure_date: '2026-06-11', status: 'STARTED' },
            { arrival_date: '2026-08-01', departure_date: '2026-08-02', status: 'SKIPPED' }
        ]);

        expect(keys).toEqual(
            new Set(['2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13'])
        );
    });

    it('allows painting on active and planned arrival dates', () => {
        const keys = buildPaintableArrivalDateKeys([
            { arrival_date: '2026-07-08', departure_date: '2026-07-10', status: 'PLANNED' },
            { arrival_date: '2026-06-10', departure_date: '2026-06-11', status: 'STARTED' },
            { arrival_date: '2026-08-01', departure_date: '2026-08-02', status: 'SKIPPED' }
        ]);

        expect(keys).toEqual(new Set(['2026-06-10', '2026-06-11', '2026-07-08', '2026-07-09', '2026-07-10']));
        expect(
            canApplyFeedingPaintToDate({
                dateKey: '2026-07-09',
                paintableArrivalDates: keys
            })
        ).toBe(true);
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

    it('passes through feed_type from form like child and paid calendar', () => {
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
                feedTypes,
                arrivals: []
            })
        ).toEqual({ feed_type: 1, paid_arrivals: [] });

        expect(
            normalizeVolunteerFeedingPayload({
                paidArrivals: [],
                feedTypeId: 4,
                feedTypes,
                arrivals: []
            })
        ).toEqual({ feed_type: 4, paid_arrivals: [] });

        expect(
            normalizeVolunteerFeedingPayload({
                paidArrivals: [],
                feedTypeId: 3,
                feedTypes,
                isChild: true,
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
            })
        ).toEqual({ feed_type: 3, paid_arrivals: [] });
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

    it('returns all arrival dates as stay-free when freeDuringStay=true, regardless of freeDates', () => {
        // Все дни заездов — зелёные, даже если их нет в paid_arrivals (freeDates пуст)
        expect(
            getStayFreeDateKeys({
                freeDuringStay: true,
                arrivalDateKeys: new Set(['2026-06-10', '2026-06-11']),
                freeDates: new Set()
            })
        ).toEqual(new Set(['2026-06-10', '2026-06-11']));

        // freeDates содержит день не из заездов — он НЕ попадает в stayFreeDates
        expect(
            getStayFreeDateKeys({
                freeDuringStay: true,
                arrivalDateKeys: new Set(['2026-06-10', '2026-06-11']),
                freeDates: new Set(['2026-06-10', '2026-06-15'])
            })
        ).toEqual(new Set(['2026-06-10', '2026-06-11']));

        // freeDuringStay=false → всегда пустое множество
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

    it('coerces legacy feed_type aliases to numeric ids', () => {
        expect(coerceFeedTypeId(2)).toBe(2);
        expect(coerceFeedTypeId('3')).toBe(3);
        expect(coerceFeedTypeId('free')).toBe(FEED_TYPE_IDS.FREE);
        expect(coerceFeedTypeId('paid')).toBe(FEED_TYPE_IDS.PAID);
        expect(coerceFeedTypeId('child')).toBe(FEED_TYPE_IDS.CHILD);
        expect(coerceFeedTypeId('nofeed')).toBe(FEED_TYPE_IDS.NO);
        expect(coerceFeedTypeId('PAID')).toBe(FEED_TYPE_IDS.PAID);
    });

    it('resolves feed_type ids without feed-types lookup', () => {
        expect(resolveFeedTypeId({ feedTypes: [], code: 'PAID' })).toBe(2);
        expect(
            normalizeVolunteerFeedingPayload({
                feedTypes: [],
                feedTypeId: 'paid' as unknown as number,
                arrivals: [],
                paidArrivals: [
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
                    arrival_date: '2026-07-01',
                    departure_date: '2026-07-01',
                    is_free: false
                }
            ]
        });
    });

    it('resolves feed_type by priority: child, free in form, paid calendar, none', () => {
        const feedTypes = [
            { id: 1, code: 'FREE' },
            { id: 2, code: 'PAID' },
            { id: 3, code: 'CHILD' },
            { id: 4, code: 'NO' }
        ];

        expect(
            resolveVolunteerFeedingPayload({
                feedTypes,
                isChild: true,
                feedTypeId: 3,
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }],
                paidArrivals: [
                    {
                        arrival_date: '2026-07-01',
                        departure_date: '2026-07-01',
                        is_free: false
                    }
                ]
            })
        ).toEqual({ feed_type: 3, paid_arrivals: [] });

        expect(
            resolveVolunteerFeedingPayload({
                feedTypes,
                isChild: false,
                feedTypeId: 1,
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }],
                paidArrivals: []
            })
        ).toEqual({ feed_type: 1, paid_arrivals: [] });

        expect(
            resolveVolunteerFeedingPayload({
                feedTypes,
                isChild: false,
                feedTypeId: 2,
                arrivals: [],
                paidArrivals: [
                    {
                        arrival_date: '2026-07-01',
                        departure_date: '2026-07-01',
                        is_free: true
                    }
                ]
            })
        ).toEqual({
            feed_type: 2,
            paid_arrivals: [
                {
                    id: expect.any(String),
                    arrival_date: '2026-07-01',
                    departure_date: '2026-07-01',
                    is_free: true
                }
            ]
        });

        expect(
            resolveVolunteerFeedingPayload({
                feedTypes,
                isChild: false,
                feedTypeId: 4,
                arrivals: [],
                paidArrivals: []
            })
        ).toEqual({ feed_type: 4, paid_arrivals: [] });
    });

    it('restores free-during-stay checkbox from volunteer api data', () => {
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 1,
                paidArrivals: [],
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
            })
        ).toBe(true);

        // feed_type=FREE но нет заездов → false
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 1,
                paidArrivals: [],
                arrivals: []
            })
        ).toBe(false);

        // feed_type=PAID с оранжевыми на дате заезда → false (не «бесплатно на заезд»!)
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 2,
                paidArrivals: [
                    {
                        arrival_date: '2026-06-10',
                        departure_date: '2026-06-10',
                        is_free: true
                    }
                ],
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
            })
        ).toBe(false);

        // feed_type=PAID с оранжевыми вне заездов → false
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 2,
                paidArrivals: [
                    {
                        arrival_date: '2026-07-01',
                        departure_date: '2026-07-01',
                        is_free: true
                    }
                ],
                arrivals: []
            })
        ).toBe(false);

        // Ребёнок всегда true
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 3,
                paidArrivals: [],
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
            })
        ).toBe(true);

        // feed_type=FREE НО paid_arrivals не пустой → false
        expect(
            deriveFreeDuringStayFromVolunteer({
                feedTypeId: 1,
                paidArrivals: [{ arrival_date: '2026-07-01', departure_date: '2026-07-01', is_free: true }],
                arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
            })
        ).toBe(false);
    });

    it('allows painting only inside arrival outline dates', () => {
        const paintableArrivalDates = new Set(['2026-06-10', '2026-06-11']);

        expect(
            canApplyFeedingPaintToDate({
                dateKey: '2026-06-10',
                paintableArrivalDates
            })
        ).toBe(true);
        expect(
            canApplyFeedingPaintToDate({
                dateKey: '2026-06-20',
                paintableArrivalDates
            })
        ).toBe(false);
    });

    it('allows interaction outside arrival only to remove existing marks', () => {
        const paintableArrivalDates = new Set(['2026-06-10']);
        const freeDates = new Set(['2026-06-20']);
        const paidDates = new Set<string>();

        expect(
            canInteractWithFeedingCalendarDate({
                dateKey: '2026-06-10',
                mode: 'free',
                paintableArrivalDates,
                freeDates,
                paidDates
            })
        ).toBe(true);
        expect(
            canInteractWithFeedingCalendarDate({
                dateKey: '2026-06-20',
                mode: 'free',
                paintableArrivalDates,
                freeDates,
                paidDates
            })
        ).toBe(true);
        expect(
            canInteractWithFeedingCalendarDate({
                dateKey: '2026-06-21',
                mode: 'free',
                paintableArrivalDates,
                freeDates,
                paidDates
            })
        ).toBe(false);
    });
});
