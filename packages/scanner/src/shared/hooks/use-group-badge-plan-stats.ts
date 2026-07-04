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
    plan: number;
    fact: number;
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

    const { groupBadgeVolunteersCount, groupBadgeFactCount } = useMemo(() => {
        const groupCounts = new Map<number, number>();
        const factCounts = new Map<number, number>();
        const groupBadgeById: Record<string, GroupBadge> = {};

        allGroupBadges.forEach((b) => {
            groupBadgeById[b.id] = b;
        });

        volsOnField.forEach((v) => {
            if (v.group_badge !== null && groupBadgeById[v.group_badge]) {
                groupCounts.set(v.group_badge, (groupCounts.get(v.group_badge) ?? 0) + 1);
            }
        });

        todayTxs.forEach((tx) => {
            if (tx.mealTime === mealTime && tx.group_badge != null && tx.amount > 0) {
                factCounts.set(tx.group_badge, (factCounts.get(tx.group_badge) ?? 0) + tx.amount);
            }
        });

        return { groupBadgeVolunteersCount: groupCounts, groupBadgeFactCount: factCounts };
    }, [volsOnField, allGroupBadges, todayTxs, mealTime]);

    const stats = useMemo(() => {
        if (!mealTime) {
            return [];
        }

        const result: GroupBadgePlanStats[] = [];

        allGroupBadges.forEach((gb) => {
            const planCell = findPlanCell(gb.planning_cells, mealTime, today);

            let plan: number;
            if (planCell) {
                plan = (planCell.amount_meat ?? 0) + (planCell.amount_vegan ?? 0);
            } else {
                plan = groupBadgeVolunteersCount.get(gb.id) ?? 0;
            }

            const fact = groupBadgeFactCount.get(gb.id) ?? 0;

            if (plan > 0 || fact > 0) {
                result.push({
                    id: gb.id,
                    name: gb.name,
                    direction: gb.direction?.name ?? null,
                    plan,
                    fact
                });
            }
        });

        result.sort((a, b) => a.name.localeCompare(b.name));

        return result;
    }, [allGroupBadges, groupBadgeVolunteersCount, groupBadgeFactCount, mealTime, today]);

    return { stats };
};
