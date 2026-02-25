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

const MESSAGES = {
    PAST_DATE: 'Нельзя редактировать прошедшие даты',
    AFTER_21: 'После 21:00 следующий день можно редактировать только через бюро',
    DEFAULT: 'Редактирование недоступно'
} as const;

export type MealTypeKey = 'breakfast' | 'lunch' | 'dinner';

interface EditabilityResult {
    editable: boolean;
    message?: string;
}

const checkDateEditability = (date: Dayjs, role?: AppRoles): EditabilityResult => {
    const yesterday = dayjs().subtract(1, 'day');
    const today = dayjs();
    const tomorrow = dayjs().add(1, 'day');
    const currentHour = today.hour();

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
    const startDate = dayjs().subtract(5, 'day');
    const feedTypes = ['breakfast', 'lunch', 'dinner'] as const;
    const rows: MealPlanRow[] = [];

    const skipDates = [3, 7];
    const missingMeals: Record<number, string[]> = {
        2: ['breakfast'],
        5: ['dinner']
    };

    for (let i = 0; i < 11; i++) {
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

const transformToRenderData = (data: MealPlanRow[], role?: AppRoles): MealPlanRowRender[] => {
    const grouped = new Map<string, MealPlanRow[]>();

    for (const row of data) {
        const existing = grouped.get(row.date) || [];
        existing.push(row);
        grouped.set(row.date, existing);
    }

    const dates = Array.from(grouped.keys()).sort();
    if (dates.length === 0) return [];

    const firstDate = dayjs(dates[0]);
    const lastDate = dayjs(dates[dates.length - 1]);

    const lastMealValues: {
        breakfast: { amount_meat: number | null; amount_vegan: number | null } | null;
        lunch: { amount_meat: number | null; amount_vegan: number | null } | null;
        dinner: { amount_meat: number | null; amount_vegan: number | null } | null;
    } = { breakfast: null, lunch: null, dinner: null };

    const result: MealPlanRowRender[] = [];
    let currentDate = firstDate;

    while (!currentDate.isAfter(lastDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const existingRows = grouped.get(dateStr) || [];

        const breakfast = existingRows.find((r) => r.feed_type === 'breakfast');
        const lunch = existingRows.find((r) => r.feed_type === 'lunch');
        const dinner = existingRows.find((r) => r.feed_type === 'dinner');

        const filledBreakfast =
            breakfast && breakfast.amount_meat !== null
                ? { amount_meat: breakfast.amount_meat, amount_vegan: breakfast.amount_vegan }
                : lastMealValues.breakfast;

        const filledLunch =
            lunch && lunch.amount_meat !== null
                ? { amount_meat: lunch.amount_meat, amount_vegan: lunch.amount_vegan }
                : lastMealValues.lunch;

        const filledDinner =
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

const fillMissingDates = (data: MealPlanRowRender[], role?: AppRoles): MealPlanRowRender[] => {
    if (data.length === 0) {
        return data;
    }

    const lastDayOfJuly = dayjs().month(6).date(31);

    let lastRealRow: MealPlanRowRender | undefined;

    for (let i = data.length - 1; i >= 0; i--) {
        const row = data[i];
        if (row.breakfast || row.lunch || row.dinner) {
            lastRealRow = row;
            break;
        }
    }

    const lastDate = data[data.length - 1].date;

    if (lastRealRow && lastDate.isBefore(lastDayOfJuly, 'day')) {
        const result = [...data];
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
    }

    return data;
};

interface UseGroupMealPlanDataReturn {
    data: MealPlanRow[];
    showAll: boolean;
    renderData: MealPlanRowRender[];
    displayData: MealPlanRowRender[];
    setShowAll: (showAll: boolean) => void;
    getCellEditability: (date: Dayjs) => EditabilityResult;
    handleSave: (date: Dayjs, mealTypeKey: MealTypeKey, editMeat: number | null, editaVegan: number | null) => void;
}

export const useGroupMealPlanData = (): UseGroupMealPlanDataReturn => {
    const { data: user } = useGetIdentity<UserData>();
    const role = user?.roles?.[0];

    const [data, setData] = useState<MealPlanRow[]>(generateMockData());
    const [showAll, setShowAll] = useState(false);

    const renderData = useMemo(() => fillMissingDates(transformToRenderData(data), role), [data, role]);

    const displayData = useMemo(() => {
        if (showAll) return renderData;

        const yesterday = dayjs().subtract(1, 'day');
        const endDate = dayjs().add(3, 'day');
        return renderData.filter(
            (row) =>
                (row.date.isSame(yesterday, 'day') || row.date.isAfter(yesterday)) &&
                row.date.isBefore(endDate.add(1, 'day'))
        );
    }, [renderData, showAll]);

    const getCellEditability = useCallback((date: Dayjs) => checkDateEditability(date, role), [role]);

    const handleSave = useCallback(
        (date: Dayjs, mealTypeKey: MealTypeKey, editMeat: number | null, editaVegan: number | null) => {
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
        getCellEditability,
        handleSave
    };
};
