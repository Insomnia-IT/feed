import { useState, useMemo, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

export interface MealPlanRow {
    date: string;
    feed_type: string;
    amount_meat: number | null;
    amount_vegan: number | null;
}

export interface MealPlanRowRender {
    id: string;
    date: Dayjs;
    breakfast?: { amount_meat: number | null; amount_vegan: number | null };
    lunch?: { amount_meat: number | null; amount_vegan: number | null };
    dinner?: { amount_meat: number | null; amount_vegan: number | null };
}

const generateMockData = (): MealPlanRow[] => {
    const startDate = dayjs().subtract(5, 'day');
    const feedTypes = ['breakfast', 'lunch', 'dinner'] as const;
    const rows: MealPlanRow[] = [];

    for (let i = 0; i < 11; i++) {
        const date = startDate.add(i, 'day').format('YYYY-MM-DD');
        for (const feedType of feedTypes) {
            rows.push({
                date,
                feed_type: feedType,
                amount_meat: Math.floor(Math.random() * 50) + 10,
                amount_vegan: Math.floor(Math.random() * 10) + 2
            });
        }
    }
    return rows;
};

const transformToRenderData = (data: MealPlanRow[]): MealPlanRowRender[] => {
    const grouped = new Map<string, MealPlanRow[]>();

    for (const row of data) {
        const existing = grouped.get(row.date) || [];
        existing.push(row);
        grouped.set(row.date, existing);
    }

    return Array.from(grouped.entries()).map(([dateStr, rows]) => {
        const breakfast = rows.find((r) => r.feed_type === 'breakfast');
        const lunch = rows.find((r) => r.feed_type === 'lunch');
        const dinner = rows.find((r) => r.feed_type === 'dinner');

        return {
            id: dateStr,
            date: dayjs(dateStr),
            breakfast: breakfast
                ? { amount_meat: breakfast.amount_meat, amount_vegan: breakfast.amount_vegan }
                : undefined,
            lunch: lunch ? { amount_meat: lunch.amount_meat, amount_vegan: lunch.amount_vegan } : undefined,
            dinner: dinner ? { amount_meat: dinner.amount_meat, amount_vegan: dinner.amount_vegan } : undefined
        };
    });
};

interface UseGroupMealPlanDataReturn {
    data: MealPlanRow[];
    showAll: boolean;
    renderData: MealPlanRowRender[];
    displayData: MealPlanRowRender[];
    setShowAll: (showAll: boolean) => void;
    handleSave: (
        date: Dayjs,
        mealTypeKey: 'breakfast' | 'lunch' | 'dinner',
        editMeat: number | null,
        editaVegan: number | null
    ) => void;
}

export const useGroupMealPlanData = (): UseGroupMealPlanDataReturn => {
    const [data, setData] = useState<MealPlanRow[]>(generateMockData());
    const [showAll, setShowAll] = useState(false);

    const renderData = useMemo(() => transformToRenderData(data), [data]);

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

    const handleSave = useCallback(
        (
            date: Dayjs,
            mealTypeKey: 'breakfast' | 'lunch' | 'dinner',
            editMeat: number | null,
            editaVegan: number | null
        ) => {
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
