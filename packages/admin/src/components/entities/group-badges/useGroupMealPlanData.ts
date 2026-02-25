import { useState, useMemo, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

export interface MealPlanRow {
    date: string;
    feed_type: string;
    amount_meat: number | null;
    amount_vegan: number | null;
}

// TODO:
//  3. Для роли руководитель локации можно редактировать следующий день только до 21:00 текущего. Если кликнут позже 21, то появляется модальное окно с сообщеним
//      "После 21:00 следующий день можно редактировать только через бюро". Послезавтра и далее можно редактировать свободно. Остальные роли могут редактировать сегодняшние значение и позже.
//  4. При нажатии на "Показать все даты" отображаем даты, начиная со вчерашнего дня или самой ранней даты в ячейках (смотря что раньше). Даты показываем до конца июля текущего года. + бесконечная прокрутка

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

const transformToRenderData = (data: MealPlanRow[]): MealPlanRowRender[] => {
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

        result.push({
            id: dateStr,
            date: currentDate,
            breakfast: filledBreakfast || undefined,
            lunch: filledLunch || undefined,
            dinner: filledDinner || undefined
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

const fillMissingDates = (data: MealPlanRowRender[]): MealPlanRowRender[] => {
    if (data.length === 0) return data;

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
            result.push({
                id: currentDate.format('YYYY-MM-DD'),
                date: currentDate,
                breakfast: lastRealRow.breakfast ? { ...lastRealRow.breakfast } : undefined,
                lunch: lastRealRow.lunch ? { ...lastRealRow.lunch } : undefined,
                dinner: lastRealRow.dinner ? { ...lastRealRow.dinner } : undefined
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

    const renderData = useMemo(() => fillMissingDates(transformToRenderData(data)), [data]);

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
