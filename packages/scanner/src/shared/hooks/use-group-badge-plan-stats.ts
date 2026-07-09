import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { GroupBadge, MealPlanCell, Transaction } from 'db';
import { db, getVolsOnField, getTodayTrans } from 'db';
import { useApp } from 'model/app-provider';
import { getToday } from 'shared/lib/date';

const findPlanCell = (cells: MealPlanCell[], mealTime: string, today: string): MealPlanCell | undefined => {
    const exactMatch = cells.find((c) => c.meal_time === mealTime && c.date === today);
    if (exactMatch) return exactMatch;

    const pastCells = cells
        .filter((c) => c.meal_time === mealTime && c.date < today)
        .sort((a, b) => b.date.localeCompare(a.date));

    return pastCells[0];
};

export interface GroupBadgePlanStats {
    id: number;
    name: string;
    direction: string | null;
    planMeat: number;
    planVegan: number;
    factMeat: number;
    factVegan: number;
}

export const useGroupBadgePlanStats = () => {
    const { lastSyncStart, mealTime, kitchenId } = useApp();
    const today = getToday();

    const volsOnField = useLiveQuery(async () => await getVolsOnField(today), [mealTime, lastSyncStart], []);

    const allGroupBadges = useLiveQuery(
        async () =>
            db.groupBadges
                .toArray()
                .then((value) =>
                    value
                        .filter((b) => !b.is_disabled && !b.deleted_at)
                        .filter(
                            (groupBadge) =>
                                groupBadge.kitchen === kitchenId || (groupBadge.kitchen === null && kitchenId === 1)
                        )
                ),
        [lastSyncStart, kitchenId],
        []
    );

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime, lastSyncStart], []) as Array<Transaction>;

    const {
        groupBadgeVolunteersMeatCount,
        groupBadgeVolunteersVeganCount,
        groupBadgeFactMeatCount,
        groupBadgeFactVeganCount
    } = useMemo(() => {
        const groupMeatCounts = new Map<number, number>();
        const groupVeganCounts = new Map<number, number>();
        const factMeatCounts = new Map<number, number>();
        const factVeganCounts = new Map<number, number>();
        const groupBadgeById: Record<string, GroupBadge> = {};

        allGroupBadges.forEach((b) => {
            groupBadgeById[b.id] = b;
        });

        volsOnField.forEach((v) => {
            if (v.group_badge !== null && groupBadgeById[v.group_badge]) {
                if (v.is_vegan) {
                    groupVeganCounts.set(v.group_badge, (groupVeganCounts.get(v.group_badge) ?? 0) + 1);
                } else {
                    groupMeatCounts.set(v.group_badge, (groupMeatCounts.get(v.group_badge) ?? 0) + 1);
                }
            }
        });

        todayTxs.forEach((tx) => {
            if (tx.mealTime === mealTime && tx.group_badge != null && tx.amount > 0) {
                if (tx.is_vegan) {
                    factVeganCounts.set(tx.group_badge, (factVeganCounts.get(tx.group_badge) ?? 0) + tx.amount);
                } else {
                    factMeatCounts.set(tx.group_badge, (factMeatCounts.get(tx.group_badge) ?? 0) + tx.amount);
                }
            }
        });

        return {
            groupBadgeVolunteersMeatCount: groupMeatCounts,
            groupBadgeVolunteersVeganCount: groupVeganCounts,
            groupBadgeFactMeatCount: factMeatCounts,
            groupBadgeFactVeganCount: factVeganCounts
        };
    }, [volsOnField, allGroupBadges, todayTxs, mealTime]);

    const stats = useMemo(() => {
        if (!mealTime) {
            return [];
        }

        const result: GroupBadgePlanStats[] = [];

        allGroupBadges.forEach((gb) => {
            const planCell = findPlanCell(gb.planning_cells, mealTime, today);

            let planMeat: number;
            let planVegan: number;
            if (planCell && planCell.amount_meat !== null) {
                planMeat = planCell.amount_meat;
            } else {
                planMeat = groupBadgeVolunteersMeatCount.get(gb.id) ?? 0;
            }

            if (planCell && planCell.amount_vegan !== null) {
                planVegan = planCell.amount_vegan;
            } else {
                planVegan = groupBadgeVolunteersVeganCount.get(gb.id) ?? 0;
            }

            const factMeat = groupBadgeFactMeatCount.get(gb.id) ?? 0;
            const factVegan = groupBadgeFactVeganCount.get(gb.id) ?? 0;

            const totalPlan = planMeat + planVegan;
            const totalFact = factMeat + factVegan;

            if (totalPlan > 0 || totalFact > 0) {
                result.push({
                    id: gb.id,
                    name: gb.name,
                    direction: gb.direction?.name ?? null,
                    planMeat,
                    planVegan,
                    factMeat,
                    factVegan
                });
            }
        });

        result.sort((a, b) => a.name.localeCompare(b.name));

        return result;
    }, [
        allGroupBadges,
        groupBadgeVolunteersMeatCount,
        groupBadgeVolunteersVeganCount,
        groupBadgeFactMeatCount,
        groupBadgeFactVeganCount,
        mealTime,
        today
    ]);

    return { stats };
};
