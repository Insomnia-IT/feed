import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { MealPlanCell, Transaction } from 'db';
import { db, getTodayTrans, getVolsOnField } from 'db';
import { useApp } from 'model/app-provider';
import { getToday } from 'shared/lib/date';

const findPlanCell = (cells: MealPlanCell[], mealTime: string, today: string): MealPlanCell | undefined => {
    const exactMatch = cells.find((c) => c.meal_time === mealTime && c.date === today);
    if (exactMatch) {
        return exactMatch;
    }

    const pastCells = cells
        .filter((c) => c.meal_time === mealTime && c.date < today)
        .sort((a, b) => b.date.localeCompare(a.date));

    return pastCells[0];
};

export const useTodayMealStats = () => {
    const { lastSyncStart, mealTime } = useApp();

    const volsOnField = useLiveQuery(async () => await getVolsOnField(getToday()), [mealTime, lastSyncStart], []);

    const groupBadgeIds = useMemo(
        () => [...new Set(volsOnField.filter((v) => v.group_badge != null).map((v) => v.group_badge!))],
        [volsOnField]
    );

    const groupBadges = useLiveQuery(
        async () => {
            if (groupBadgeIds.length === 0) return [];
            return db.groupBadges.where('id').anyOf(groupBadgeIds).toArray();
        },
        [groupBadgeIds, lastSyncStart],
        []
    );

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime, lastSyncStart], []) as Array<Transaction>;

    const individualOnFieldCount = useMemo(
        () => volsOnField.filter((v) => v.group_badge == null).length,
        [volsOnField]
    );

    const individualFedCount = useMemo(
        () =>
            todayTxs.reduce((acc, curr) => {
                if (curr.mealTime === mealTime && curr.group_badge == null) {
                    return acc + curr.amount;
                }
                return acc;
            }, 0),
        [mealTime, todayTxs]
    );

    const groupFedCount = useMemo(
        () =>
            todayTxs.reduce((acc, curr) => {
                if (curr.mealTime === mealTime && curr.group_badge != null) {
                    return acc + curr.amount;
                }
                return acc;
            }, 0),
        [mealTime, todayTxs]
    );

    const groupPlannedCount = useMemo(() => {
        const today = getToday();

        if (!mealTime) {
            return 0;
        }

        return groupBadges.reduce((total, gb) => {
            const planCell = findPlanCell(gb.planning_cells, mealTime, today);

            if (planCell) {
                return total + (planCell.amount_meat ?? 0) + (planCell.amount_vegan ?? 0);
            }

            return total + volsOnField.filter((v) => v.group_badge === gb.id).length;
        }, 0);
    }, [groupBadges, volsOnField, mealTime]);

    return {
        lastSyncStart,
        volsOnFieldCount: volsOnField.length,

        individualFedCount,
        individualLeftCount: Math.max(individualOnFieldCount - individualFedCount, 0),

        groupFedCount,
        groupLeftCount: Math.max(groupPlannedCount - groupFedCount, 0)
    };
};
