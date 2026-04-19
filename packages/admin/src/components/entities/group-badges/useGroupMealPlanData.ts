import { useCallback, useMemo, useState } from 'react';
import { useGetIdentity, useOne, useUpdate, useCreate } from '@refinedev/core';
import type { BaseKey } from '@refinedev/core';
import dayjs, { type Dayjs } from 'dayjs';
import { AppRoles, type AppRole, type UserData } from 'auth';
import type { GroupBadgeEntity, MealPlanCell } from 'interfaces';

export const MESSAGES = {
    PAST_DATE: 'Нельзя редактировать прошедшие даты',
    AFTER_21: 'После 21:00 следующий день можно редактировать только через бюро'
} as const;

const DISPLAY_END_DAYS_AHEAD = 3;
const JULY_MONTH_INDEX = 6;

export type MealTypeKey = 'breakfast' | 'lunch' | 'dinner';

type MealAmounts = { amount_meat: number | null; amount_vegan: number | null } | null;

interface EditabilityResult {
    editable: boolean;
    message?: string;
}

type SimpleMealPlanCell = Pick<MealPlanCell, 'meal_time' | 'date' | 'amount_meat' | 'amount_vegan'>;

export const createDateHelpers = () => {
    const today = dayjs();
    return {
        yesterday: today.subtract(1, 'day'),
        today,
        tomorrow: today.add(1, 'day'),
        currentHour: today.hour()
    };
};

export const checkDateEditability = (date: Dayjs, role?: AppRole): EditabilityResult => {
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
    breakfast: { amount_meat: number | null; amount_vegan: number | null };
    lunch: { amount_meat: number | null; amount_vegan: number | null };
    dinner: { amount_meat: number | null; amount_vegan: number | null };
    editable: boolean;
    readonlyMessage?: string;
}

const getDefaultMealValue = () => ({ amount_meat: null, amount_vegan: null });

export const groupByDate = (data: SimpleMealPlanCell[]): Map<string, SimpleMealPlanCell[]> => {
    const grouped = new Map<string, SimpleMealPlanCell[]>();

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
    grouped: Map<string, SimpleMealPlanCell[]>;
    firstDate: Dayjs;
    lastDate: Dayjs;
    role?: AppRole;
}): MealPlanRowRender[] => {
    const lastMealValues: Record<MealTypeKey, MealAmounts> = {
        breakfast: getDefaultMealValue(),
        lunch: getDefaultMealValue(),
        dinner: getDefaultMealValue()
    };

    const result: MealPlanRowRender[] = [];
    let currentDate = firstDate;

    while (!currentDate.isAfter(lastDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const existingRows = grouped.get(dateStr) || [];
        const rowsByMealTime: Partial<Record<MealTypeKey, SimpleMealPlanCell>> = {};
        for (const row of existingRows) {
            rowsByMealTime[row.meal_time as MealTypeKey] = row;
        }

        const breakfast = rowsByMealTime.breakfast;
        const lunch = rowsByMealTime.lunch;
        const dinner = rowsByMealTime.dinner;

        const filledBreakfast = breakfast
            ? { amount_meat: breakfast.amount_meat, amount_vegan: breakfast.amount_vegan }
            : lastMealValues.breakfast;

        const filledLunch = lunch
            ? { amount_meat: lunch.amount_meat, amount_vegan: lunch.amount_vegan }
            : lastMealValues.lunch;

        const filledDinner = dinner
            ? { amount_meat: dinner.amount_meat, amount_vegan: dinner.amount_vegan }
            : lastMealValues.dinner;

        const editability = checkDateEditability(currentDate, role);

        result.push({
            id: dateStr,
            date: currentDate,
            breakfast: filledBreakfast ?? getDefaultMealValue(),
            lunch: filledLunch ?? getDefaultMealValue(),
            dinner: filledDinner ?? getDefaultMealValue(),
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

export const transformToRenderData = (data: SimpleMealPlanCell[], role?: AppRole): MealPlanRowRender[] => {
    let tempData = data;

    if (data.length === 0) {
        tempData = getDefaultCells();
    }

    const grouped = groupByDate(tempData);
    const dates = Array.from(grouped.keys()).sort();

    if (dates.length === 0) {
        return [];
    }

    const firstDate = dayjs(dates[0]);
    const lastDate = dayjs(dates[dates.length - 1]);

    return forwardFillMeals({ grouped, firstDate, lastDate, role });
};

export const fillMissingDates = (data: MealPlanRowRender[], role?: AppRole): MealPlanRowRender[] => {
    if (data.length === 0) {
        return data;
    }

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
            breakfast: lastRealRow.breakfast ? { ...lastRealRow.breakfast } : getDefaultMealValue(),
            lunch: lastRealRow.lunch ? { ...lastRealRow.lunch } : getDefaultMealValue(),
            dinner: lastRealRow.dinner ? { ...lastRealRow.dinner } : getDefaultMealValue(),
            editable: editability.editable,
            readonlyMessage: editability.message
        });
        currentDate = currentDate.add(1, 'day');
    }

    return result;
};

interface UseGroupMealPlanDataReturn {
    showAll: boolean;
    renderData: MealPlanRowRender[];
    displayData: MealPlanRowRender[];
    setShowAll: (showAll: boolean) => void;
    handleSave: (params: {
        date: Dayjs;
        mealTypeKey: MealTypeKey;
        editMeat: number | null;
        editaVegan: number | null;
    }) => Promise<void>;
    isLoading?: boolean;
    isSaving?: boolean;
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

const getDefaultCells = (): SimpleMealPlanCell[] => [
    {
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        meal_time: 'breakfast',
        amount_meat: null,
        amount_vegan: null
    },
    {
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        meal_time: 'lunch',
        amount_meat: null,
        amount_vegan: null
    },
    {
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        meal_time: 'dinner',
        amount_meat: null,
        amount_vegan: null
    }
];

export const useGroupMealPlanData = ({ id }: { id?: BaseKey }): UseGroupMealPlanDataReturn => {
    const { result: groupBadge, query } = useOne<GroupBadgeEntity>({ resource: 'group-badges', id });

    const { mutateAsync: updateCell } = useUpdate();
    const { mutateAsync: createCell } = useCreate();

    const { data: user } = useGetIdentity<UserData>();
    const role = user?.roles?.[0];

    const [showAll, setShowAll] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const existingCellByKey = useMemo(
        () =>
            new Map(
                (groupBadge?.planning_cells ?? []).map((cell) => [`${cell.date}:${cell.meal_time}`, cell] as const)
            ),
        [groupBadge?.planning_cells]
    );

    const renderData = useMemo(
        () => fillMissingDates(transformToRenderData(groupBadge?.planning_cells ?? [], role), role),
        [groupBadge, role]
    );

    const displayData = useMemo(() => filterDisplayData(renderData, showAll), [renderData, showAll]);

    const handleSave = useCallback(
        async ({
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
            if (!id) {
                return;
            }

            const dateStr = date.format('YYYY-MM-DD');
            const existingCell = existingCellByKey.get(`${dateStr}:${mealTypeKey}`);

            const payload = {
                group_badge: id as number,
                date: dateStr,
                meal_time: mealTypeKey,
                amount_meat: editMeat,
                amount_vegan: editaVegan
            };

            try {
                setIsSaving(true);

                if (existingCell) {
                    // Update existing cell
                    await updateCell({
                        resource: 'group-badge-planning-cells',
                        id: existingCell.id,
                        values: payload
                    });
                } else {
                    // Create new cell
                    await createCell({
                        resource: 'group-badge-planning-cells',
                        values: payload
                    });
                }
            } catch (error) {
                console.error('Failed to save meal plan cell:', error);
                // Could show error notification here
            } finally {
                await query.refetch();
                setIsSaving(false);
            }
        },
        [id, existingCellByKey, updateCell, createCell, query]
    );

    return {
        showAll,
        renderData,
        displayData,
        setShowAll,
        handleSave,
        isLoading: isSaving,
        isSaving
    };
};
