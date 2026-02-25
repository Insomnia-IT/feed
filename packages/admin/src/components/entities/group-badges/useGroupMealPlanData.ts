import { useState, useMemo, useCallback } from 'react';
import { useGetIdentity } from '@refinedev/core';
import dayjs, { type Dayjs } from 'dayjs';
import { AppRoles, type UserData } from 'auth';

export interface MealPlanRow {
    date: string;
    feed_type: string;
    amount_meat: number | null;
    amount_vegan: number | null;
}

export const MESSAGES = {
    PAST_DATE: 'Нельзя редактировать прошедшие даты',
    AFTER_21: 'После 21:00 следующий день можно редактировать только через бюро',
    DEFAULT: 'Редактирование недоступно'
} as const;

const MOCK_DATA_DAYS_BACK = 5;
const MOCK_DATA_DAYS_COUNT = 11;
const DISPLAY_END_DAYS_AHEAD = 3;
const JULY_MONTH_INDEX = 6;

export type MealTypeKey = 'breakfast' | 'lunch' | 'dinner';

export type MealAmounts = { amount_meat: number | null; amount_vegan: number | null } | null;

export interface EditabilityResult {
    editable: boolean;
    message?: string;
}

export const createDateHelpers = () => {
    const today = dayjs();
    return {
        yesterday: today.subtract(1, 'day'),
        today,
        tomorrow: today.add(1, 'day'),
        currentHour: today.hour()
    };
};

export const checkDateEditability = (date: Dayjs, role?: AppRoles): EditabilityResult => {
    const { yesterday, today, tomorrow, currentHour } = createDateHelpers();

    if (date.isSame(yesterday, 'day') || date.isBefore(yesterday, 'day')) {
        return { editable: false, message: MESSAGES.PAST_DATE };
    }

    if (role === AppRoles.DIRECTION_HEAD) {
        if (date.isSame(today, 'day')) {
            return { editable: true };
        }
        if (date.isSame(tomorrow, 'day') && currentHour >= 21) {
            return { editable: false, message: MESSAGES.AFTER_21 };
        }
    }

    return { editable: true };
};

export interface MealPlanRowRender {
    id: string;
    date: Dayjs;
    breakfast?: { amount_meat: number | null; amount_vegan: number | null };
    lunch?: { amount_meat: number | null; amount_vegan: number | null };
    dinner?: { amount_meat: number | null; amount_vegan: number | null };
    editable: boolean;
    readonlyMessage?: string;
}

const generateMockData = (): MealPlanRow[] => {
    const startDate = dayjs().subtract(MOCK_DATA_DAYS_BACK, 'day');
    const feedTypes = ['breakfast', 'lunch', 'dinner'] as const;
    const rows: MealPlanRow[] = [];

    const skipDates = [3, 7];
    const missingMeals: Record<number, string[]> = {
        2: ['breakfast'],
        5: ['dinner']
    };

    for (let i = 0; i < MOCK_DATA_DAYS_COUNT; i++) {
        if (skipDates.includes(i)) continue;

        const date = startDate.add(i, 'day').format('YYYY-MM-DD');
        const missingForDay = missingMeals[i] || [];

        for (const feedType of feedTypes) {
            if (missingForDay.includes(feedType)) {
                rows.push({
                    date,
                    feed_type: feedType,
                    amount_meat: null,
                    amount_vegan: null
                });
            } else {
                rows.push({
                    date,
                    feed_type: feedType,
                    amount_meat: Math.floor(Math.random() * 50) + 10,
                    amount_vegan: Math.floor(Math.random() * 10) + 2
                });
            }
        }
    }
    return rows;
};

export const groupByDate = (data: MealPlanRow[]): Map<string, MealPlanRow[]> => {
    const grouped = new Map<string, MealPlanRow[]>();

    for (const row of data) {
        const existing = grouped.get(row.date) || [];
        existing.push(row);
        grouped.set(row.date, existing);
    }

    return grouped;
};

export const forwardFillMeals = ({
    grouped,
    firstDate,
    lastDate,
    role
}: {
    grouped: Map<string, MealPlanRow[]>;
    firstDate: Dayjs;
    lastDate: Dayjs;
    role?: AppRoles;
}): MealPlanRowRender[] => {
    const lastMealValues: Record<MealTypeKey, MealAmounts> = {
        breakfast: null,
        lunch: null,
        dinner: null
    };

    const result: MealPlanRowRender[] = [];
    let currentDate = firstDate;

    while (!currentDate.isAfter(lastDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const existingRows = grouped.get(dateStr) || [];

        const breakfast = existingRows.find((row) => row.feed_type === 'breakfast');
        const lunch = existingRows.find((row) => row.feed_type === 'lunch');
        const dinner = existingRows.find((row) => row.feed_type === 'dinner');

        const filledBreakfast: MealAmounts =
            breakfast && breakfast.amount_meat !== null
                ? { amount_meat: breakfast.amount_meat, amount_vegan: breakfast.amount_vegan }
                : lastMealValues.breakfast;

        const filledLunch: MealAmounts =
            lunch && lunch.amount_meat !== null
                ? { amount_meat: lunch.amount_meat, amount_vegan: lunch.amount_vegan }
                : lastMealValues.lunch;

        const filledDinner: MealAmounts =
            dinner && dinner.amount_meat !== null
                ? { amount_meat: dinner.amount_meat, amount_vegan: dinner.amount_vegan }
                : lastMealValues.dinner;

        const editability = checkDateEditability(currentDate, role);

        result.push({
            id: dateStr,
            date: currentDate,
            breakfast: filledBreakfast || undefined,
            lunch: filledLunch || undefined,
            dinner: filledDinner || undefined,
            editable: editability.editable,
            readonlyMessage: editability.message
        });

        if (filledBreakfast) {
            lastMealValues.breakfast = filledBreakfast;
        }
        if (filledLunch) {
            lastMealValues.lunch = filledLunch;
        }
        if (filledDinner) {
            lastMealValues.dinner = filledDinner;
        }

        currentDate = currentDate.add(1, 'day');
    }

    return result;
};

export const transformToRenderData = (data: MealPlanRow[], role?: AppRoles): MealPlanRowRender[] => {
    const grouped = groupByDate(data);
    const dates = Array.from(grouped.keys()).sort();

    if (dates.length === 0) {
        return [];
    }

    const firstDate = dayjs(dates[0]);
    const lastDate = dayjs(dates[dates.length - 1]);

    return forwardFillMeals({ grouped, firstDate, lastDate, role });
};

export const fillMissingDates = (data: MealPlanRowRender[], role?: AppRoles): MealPlanRowRender[] => {
    if (data.length === 0) return data;

    const lastDayOfJuly = dayjs().month(JULY_MONTH_INDEX).date(31);

    let lastRealRow: MealPlanRowRender | undefined;
    for (let i = data.length - 1; i >= 0; i--) {
        const row = data[i];
        if (row.breakfast || row.lunch || row.dinner) {
            lastRealRow = row;
            break;
        }
    }

    const lastDate = data[data.length - 1].date;

    if (!lastRealRow || !lastDate.isBefore(lastDayOfJuly, 'day')) {
        return data;
    }

    const result: MealPlanRowRender[] = [...data];
    let currentDate = lastDate.add(1, 'day');

    while (!currentDate.isAfter(lastDayOfJuly, 'day')) {
        const editability = checkDateEditability(currentDate, role);
        result.push({
            id: currentDate.format('YYYY-MM-DD'),
            date: currentDate,
            breakfast: lastRealRow.breakfast ? { ...lastRealRow.breakfast } : undefined,
            lunch: lastRealRow.lunch ? { ...lastRealRow.lunch } : undefined,
            dinner: lastRealRow.dinner ? { ...lastRealRow.dinner } : undefined,
            editable: editability.editable,
            readonlyMessage: editability.message
        });
        currentDate = currentDate.add(1, 'day');
    }

    return result;
};

interface UseGroupMealPlanDataReturn {
    data: MealPlanRow[];
    showAll: boolean;
    renderData: MealPlanRowRender[];
    displayData: MealPlanRowRender[];
    setShowAll: (showAll: boolean) => void;
    handleSave: (params: {
        date: Dayjs;
        mealTypeKey: MealTypeKey;
        editMeat: number | null;
        editaVegan: number | null;
    }) => void;
}

const filterDisplayData = (data: MealPlanRowRender[], showAll: boolean): MealPlanRowRender[] => {
    if (showAll) return data;

    const yesterday = dayjs().subtract(1, 'day');
    const endDate = dayjs().add(DISPLAY_END_DAYS_AHEAD, 'day');

    return data.filter(
        (row) =>
            (row.date.isSame(yesterday, 'day') || row.date.isAfter(yesterday)) &&
            row.date.isBefore(endDate.add(1, 'day'))
    );
};

export const useGroupMealPlanData = (): UseGroupMealPlanDataReturn => {
    const { data: user } = useGetIdentity<UserData>();
    const role = user?.roles?.[0];

    const [data, setData] = useState<MealPlanRow[]>(generateMockData());
    const [showAll, setShowAll] = useState(false);

    const renderData = useMemo(() => fillMissingDates(transformToRenderData(data), role), [data, role]);

    const displayData = useMemo(() => filterDisplayData(renderData, showAll), [renderData, showAll]);

    const handleSave = useCallback(
        ({
            date,
            mealTypeKey,
            editMeat,
            editaVegan
        }: {
            date: Dayjs;
            mealTypeKey: MealTypeKey;
            editMeat: number | null;
            editaVegan: number | null;
        }) => {
            const dateStr = date.format('YYYY-MM-DD');

            setData((prev) =>
                prev.map((row) => {
                    if (row.date === dateStr && row.feed_type === mealTypeKey) {
                        return {
                            ...row,
                            amount_meat: editMeat,
                            amount_vegan: editaVegan
                        };
                    }
                    return row;
                })
            );
        },
        []
    );

    return {
        data,
        showAll,
        renderData,
        displayData,
        setShowAll,
        handleSave
    };
};
