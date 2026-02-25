import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dayjs from 'dayjs';
import {
    groupByDate,
    forwardFillMeals,
    transformToRenderData,
    fillMissingDates,
    checkDateEditability,
    createDateHelpers,
    type MealPlanRow,
    type MealPlanRowRender,
    type MealTypeKey,
    MESSAGES
} from './useGroupMealPlanData';
import { AppRoles } from 'auth';

const TEST_DATES = {
    EARLY: '2026-02-20',
    MIDDLE: '2026-02-21',
    LATE: '2026-02-22',
    JULY_31: '2026-07-31'
} as const;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

const createMealRow = (params: {
    date: string;
    feedType: MealTypeKey;
    amountMeat: number;
    amountVegan: number;
}): MealPlanRow => ({
    date: params.date,
    feed_type: params.feedType,
    amount_meat: params.amountMeat,
    amount_vegan: params.amountVegan
});

const createRenderRow = (params: {
    date: string;
    breakfast?: { amount_meat: number | null; amount_vegan: number | null };
    lunch?: { amount_meat: number | null; amount_vegan: number | null };
    dinner?: { amount_meat: number | null; amount_vegan: number | null };
    editable?: boolean;
}): MealPlanRowRender => ({
    id: params.date,
    date: dayjs(params.date),
    breakfast: params.breakfast,
    lunch: params.lunch,
    dinner: params.dinner,
    editable: params.editable ?? true
});

const createGroupedData = (data: Record<string, MealPlanRow[]>): Map<string, MealPlanRow[]> => {
    const grouped = new Map<string, MealPlanRow[]>();
    for (const [date, rows] of Object.entries(data)) {
        grouped.set(date, rows);
    }
    return grouped;
};

describe('groupByDate', () => {
    it('should group rows by date', () => {
        const data: MealPlanRow[] = [
            createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 }),
            createMealRow({ date: TEST_DATES.EARLY, feedType: 'lunch', amountMeat: 20, amountVegan: 3 }),
            createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'breakfast', amountMeat: 15, amountVegan: 4 })
        ];

        const result = groupByDate(data);

        expect(result.size).toBe(2);
        expect(result.get(TEST_DATES.EARLY)?.length).toBe(2);
        expect(result.get(TEST_DATES.MIDDLE)?.length).toBe(1);
    });

    it.each([
        { input: [], expected: 0, description: 'empty data' },
        {
            input: [createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 })],
            expected: 1,
            description: 'single row'
        }
    ])('should handle $description', ({ input, expected }) => {
        const result = groupByDate(input);
        expect(result.size).toBe(expected);
    });
});

describe('forwardFillMeals', () => {
    const firstDate = dayjs(TEST_DATES.EARLY);
    const lastDate = dayjs(TEST_DATES.LATE);

    it('should forward-fill missing meal types within a date', () => {
        const grouped = createGroupedData({
            [TEST_DATES.EARLY]: [
                createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 }),
                createMealRow({ date: TEST_DATES.EARLY, feedType: 'lunch', amountMeat: 20, amountVegan: 3 }),
                createMealRow({ date: TEST_DATES.EARLY, feedType: 'dinner', amountMeat: 30, amountVegan: 4 })
            ],
            [TEST_DATES.MIDDLE]: [
                createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'breakfast', amountMeat: 15, amountVegan: 5 })
            ],
            [TEST_DATES.LATE]: []
        });

        const result = forwardFillMeals({ grouped, firstDate, lastDate });

        expect(result).toHaveLength(3);

        expect(result[0]).toMatchObject({
            breakfast: { amount_meat: 10 },
            lunch: { amount_meat: 20 },
            dinner: { amount_meat: 30 }
        });

        expect(result[1]).toMatchObject({
            breakfast: { amount_meat: 15 },
            lunch: { amount_meat: 20 },
            dinner: { amount_meat: 30 }
        });

        expect(result[2]).toMatchObject({
            breakfast: { amount_meat: 15 },
            lunch: { amount_meat: 20 },
            dinner: { amount_meat: 30 }
        });
    });

    it('should use last known value for each meal type independently', () => {
        const grouped = createGroupedData({
            [TEST_DATES.EARLY]: [
                createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 })
            ],
            [TEST_DATES.MIDDLE]: [
                createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'lunch', amountMeat: 20, amountVegan: 3 })
            ]
        });

        const result = forwardFillMeals({ grouped, firstDate, lastDate: dayjs(TEST_DATES.MIDDLE) });

        expect(result[0]).toMatchObject({
            breakfast: { amount_meat: 10 },
            lunch: undefined
        });

        expect(result[1]).toMatchObject({
            breakfast: { amount_meat: 10 },
            lunch: { amount_meat: 20 }
        });
    });

    it('should preserve existing values when present', () => {
        const grouped = createGroupedData({
            [TEST_DATES.EARLY]: MEAL_TYPES.map((ft, i) =>
                createMealRow({ date: TEST_DATES.EARLY, feedType: ft, amountMeat: (i + 1) * 10, amountVegan: i + 1 })
            )
        });

        const result = forwardFillMeals({ grouped, firstDate, lastDate: firstDate });

        expect(result).toHaveLength(1);
        expect(result[0].breakfast?.amount_meat).toBe(10);
        expect(result[0].lunch?.amount_meat).toBe(20);
        expect(result[0].dinner?.amount_meat).toBe(30);
    });

    describe('null edge cases', () => {
        it('should handle all null values on a date', () => {
            const grouped = createGroupedData({
                [TEST_DATES.EARLY]: [
                    createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 })
                ],
                [TEST_DATES.MIDDLE]: [
                    { date: TEST_DATES.MIDDLE, feed_type: 'breakfast', amount_meat: null, amount_vegan: null }
                ]
            });

            const result = forwardFillMeals({
                grouped,
                firstDate: dayjs(TEST_DATES.EARLY),
                lastDate: dayjs(TEST_DATES.MIDDLE)
            });

            expect(result[0].breakfast?.amount_meat).toBe(10);
            expect(result[1].breakfast?.amount_meat).toBe(10);
        });

        it('should handle first date with null values', () => {
            const grouped = createGroupedData({
                [TEST_DATES.EARLY]: [
                    { date: TEST_DATES.EARLY, feed_type: 'breakfast', amount_meat: null, amount_vegan: null }
                ],
                [TEST_DATES.MIDDLE]: [
                    createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'breakfast', amountMeat: 20, amountVegan: 5 })
                ]
            });

            const result = forwardFillMeals({
                grouped,
                firstDate: dayjs(TEST_DATES.EARLY),
                lastDate: dayjs(TEST_DATES.MIDDLE)
            });

            expect(result[0].breakfast).toBeUndefined();
            expect(result[1].breakfast?.amount_meat).toBe(20);
        });

        it('should propagate null values when no previous value exists', () => {
            const grouped = createGroupedData({
                [TEST_DATES.EARLY]: [
                    { date: TEST_DATES.EARLY, feed_type: 'breakfast', amount_meat: null, amount_vegan: null }
                ]
            });

            const result = forwardFillMeals({
                grouped,
                firstDate: dayjs(TEST_DATES.EARLY),
                lastDate: dayjs(TEST_DATES.EARLY)
            });

            expect(result[0].breakfast).toBeUndefined();
        });
    });
});

describe('transformToRenderData', () => {
    it('should transform raw data to render format', () => {
        const data: MealPlanRow[] = MEAL_TYPES.map((ft, i) =>
            createMealRow({ date: TEST_DATES.EARLY, feedType: ft, amountMeat: (i + 1) * 10, amountVegan: i + 1 })
        );

        const result = transformToRenderData(data);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(TEST_DATES.EARLY);
        expect(result[0].breakfast?.amount_meat).toBe(10);
        expect(result[0].lunch?.amount_meat).toBe(20);
        expect(result[0].dinner?.amount_meat).toBe(30);
    });

    it('should fill missing dates in sequence', () => {
        const data: MealPlanRow[] = [
            createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 }),
            createMealRow({ date: TEST_DATES.LATE, feedType: 'breakfast', amountMeat: 15, amountVegan: 3 })
        ];

        const result = transformToRenderData(data);

        expect(result).toHaveLength(3);
        expect(result.map((r) => r.date.format('YYYY-MM-DD'))).toEqual([
            TEST_DATES.EARLY,
            TEST_DATES.MIDDLE,
            TEST_DATES.LATE
        ]);
    });

    it('should forward-fill missing meal types', () => {
        const data: MealPlanRow[] = [
            createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 }),
            { date: TEST_DATES.MIDDLE, feed_type: 'breakfast', amount_meat: null, amount_vegan: null }
        ];

        const result = transformToRenderData(data);

        expect(result[1].breakfast?.amount_meat).toBe(10);
    });

    it('should include editable field based on date', () => {
        const data: MealPlanRow[] = [
            createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 })
        ];

        const result = transformToRenderData(data);

        expect(result[0]).toHaveProperty('editable');
        expect(result[0]).toHaveProperty('readonlyMessage');
    });

    it.each([
        { input: [], expectedLength: 0 },
        {
            input: [createMealRow({ date: TEST_DATES.LATE, feedType: 'breakfast', amountMeat: 15, amountVegan: 3 })],
            expectedLength: 1
        }
    ])('should handle $input.length input rows', ({ input, expectedLength }) => {
        const result = transformToRenderData(input);
        expect(result.length).toBe(expectedLength);
    });

    describe('null edge cases', () => {
        it('should handle data with all null values', () => {
            const data: MealPlanRow[] = [
                { date: TEST_DATES.EARLY, feed_type: 'breakfast', amount_meat: null, amount_vegan: null },
                { date: TEST_DATES.EARLY, feed_type: 'lunch', amount_meat: null, amount_vegan: null },
                { date: TEST_DATES.EARLY, feed_type: 'dinner', amount_meat: null, amount_vegan: null }
            ];

            const result = transformToRenderData(data);

            expect(result).toHaveLength(1);
            expect(result[0].breakfast).toBeUndefined();
            expect(result[0].lunch).toBeUndefined();
            expect(result[0].dinner).toBeUndefined();
        });

        it('should handle mixed null and non-null across dates', () => {
            const data: MealPlanRow[] = [
                createMealRow({ date: TEST_DATES.EARLY, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 }),
                { date: TEST_DATES.EARLY, feed_type: 'lunch', amount_meat: null, amount_vegan: null },
                { date: TEST_DATES.MIDDLE, feed_type: 'breakfast', amount_meat: null, amount_vegan: null },
                createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'lunch', amountMeat: 20, amountVegan: 4 })
            ];

            const result = transformToRenderData(data);

            expect(result[0].breakfast?.amount_meat).toBe(10);
            expect(result[0].lunch).toBeUndefined();

            expect(result[1].breakfast?.amount_meat).toBe(10);
            expect(result[1].lunch?.amount_meat).toBe(20);
        });
    });
});

describe('fillMissingDates', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-25'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should extend data to July 31st when last date is before July', () => {
        const data = [createRenderRow({ date: TEST_DATES.EARLY, breakfast: { amount_meat: 10, amount_vegan: 2 } })];

        const result = fillMissingDates(data);

        const lastDate = result[result.length - 1].date;
        expect(lastDate.format('YYYY-MM-DD')).toBe(TEST_DATES.JULY_31);
    });

    it('should copy last real row values to new dates', () => {
        const data = [
            createRenderRow({
                date: TEST_DATES.EARLY,
                breakfast: { amount_meat: 10, amount_vegan: 2 },
                lunch: { amount_meat: 20, amount_vegan: 3 },
                dinner: { amount_meat: 30, amount_vegan: 4 }
            })
        ];

        const result = fillMissingDates(data);

        expect(result[1].breakfast?.amount_meat).toBe(10);
        expect(result[1].lunch?.amount_meat).toBe(20);
        expect(result[1].dinner?.amount_meat).toBe(30);
    });

    it('should apply editability to new dates', () => {
        const data = [createRenderRow({ date: TEST_DATES.EARLY, editable: true })];

        const result = fillMissingDates(data);

        expect(result[0].editable).toBe(true);
    });

    it.each([
        { lastDate: TEST_DATES.JULY_31, shouldModify: false },
        { lastDate: TEST_DATES.EARLY, shouldModify: true }
    ])(
        'should $shouldModify ? "modify" : "not modify" data when last date is $lastDate',
        ({ lastDate, shouldModify }) => {
            const data = [createRenderRow({ date: lastDate, breakfast: { amount_meat: 10, amount_vegan: 2 } })];
            const originalLength = data.length;

            const result = fillMissingDates(data);

            if (shouldModify) {
                expect(result.length).toBeGreaterThan(originalLength);
            } else {
                expect(result.length).toBe(originalLength);
            }
        }
    );

    it('should return empty array for empty input', () => {
        const result = fillMissingDates([]);
        expect(result).toEqual([]);
    });

    describe('null edge cases', () => {
        it('should handle when last real row has null values', () => {
            const data = [
                createRenderRow({
                    date: TEST_DATES.EARLY,
                    breakfast: { amount_meat: null, amount_vegan: null },
                    lunch: { amount_meat: 20, amount_vegan: 3 },
                    dinner: undefined
                })
            ];

            const result = fillMissingDates(data);

            expect(result[1].breakfast).toEqual({ amount_meat: null, amount_vegan: null });
            expect(result[1].lunch?.amount_meat).toBe(20);
            expect(result[1].dinner).toBeUndefined();
        });

        it('should handle row with all undefined meals', () => {
            const data = [
                createRenderRow({
                    date: TEST_DATES.EARLY,
                    breakfast: undefined,
                    lunch: undefined,
                    dinner: undefined
                })
            ];

            const result = fillMissingDates(data);

            expect(result[0].breakfast).toBeUndefined();
        });
    });
});

describe('checkDateEditability', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { daysOffset: -1, description: 'yesterday' },
        { daysOffset: -5, description: 'past dates' }
    ])('should return not editable for $description', ({ daysOffset }) => {
        const date = dayjs().add(daysOffset, 'day');
        const result = checkDateEditability(date);

        expect(result.editable).toBe(false);
        expect(result.message).toBe(MESSAGES.PAST_DATE);
    });

    it.each([
        { role: undefined, description: 'no role' },
        { role: AppRoles.ADMIN, description: 'ADMIN role' },
        { role: AppRoles.SENIOR, description: 'SENIOR role' },
        { role: AppRoles.CAT, description: 'CAT role' }
    ])('should return editable for today with $description', ({ role }) => {
        const today = dayjs();
        const result = checkDateEditability(today, role);

        expect(result.editable).toBe(true);
    });

    it('should return editable for day after tomorrow+', () => {
        const dayAfterTomorrow = dayjs().add(2, 'day');
        const result = checkDateEditability(dayAfterTomorrow);

        expect(result.editable).toBe(true);
    });

    describe('DIRECTION_HEAD role', () => {
        it('should return editable for tomorrow before 21:00', () => {
            vi.setSystemTime(new Date('2026-02-25T12:00:00'));
            const tomorrow = dayjs().add(1, 'day');

            const result = checkDateEditability(tomorrow, AppRoles.DIRECTION_HEAD);

            expect(result.editable).toBe(true);
        });

        it('should return not editable for tomorrow after 21:00', () => {
            vi.setSystemTime(new Date('2026-02-25T22:00:00'));
            const tomorrow = dayjs().add(1, 'day');

            const result = checkDateEditability(tomorrow, AppRoles.DIRECTION_HEAD);

            expect(result.editable).toBe(false);
            expect(result.message).toBe(MESSAGES.AFTER_21);
        });
    });
});

describe('createDateHelpers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-25T15:30:00'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return correct date values', () => {
        const helpers = createDateHelpers();

        expect(helpers.today.format('YYYY-MM-DD')).toBe('2026-02-25');
        expect(helpers.yesterday.format('YYYY-MM-DD')).toBe('2026-02-24');
        expect(helpers.tomorrow.format('YYYY-MM-DD')).toBe('2026-02-26');
        expect(helpers.currentHour).toBe(15);
    });
});

describe('NaN handling', () => {
    it('should handle NaN values in forwardFillMeals', () => {
        const grouped = createGroupedData({
            [TEST_DATES.EARLY]: [
                { date: TEST_DATES.EARLY, feed_type: 'breakfast', amount_meat: NaN, amount_vegan: NaN }
            ],
            [TEST_DATES.MIDDLE]: [
                createMealRow({ date: TEST_DATES.MIDDLE, feedType: 'breakfast', amountMeat: 10, amountVegan: 2 })
            ]
        });

        const result = forwardFillMeals({
            grouped,
            firstDate: dayjs(TEST_DATES.EARLY),
            lastDate: dayjs(TEST_DATES.MIDDLE)
        });

        expect(Number.isNaN(result[0].breakfast?.amount_meat)).toBe(true);
    });

    it('should handle NaN values in transformToRenderData', () => {
        const data: MealPlanRow[] = [
            { date: TEST_DATES.EARLY, feed_type: 'breakfast', amount_meat: NaN, amount_vegan: NaN }
        ];

        const result = transformToRenderData(data);

        expect(Number.isNaN(result[0].breakfast?.amount_meat)).toBe(true);
    });
});
