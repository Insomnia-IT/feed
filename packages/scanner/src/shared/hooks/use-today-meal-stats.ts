import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { GroupBadge, MealPlanCell, Transaction } from 'db';
import { db, getTodayTrans, getVolsOnField } from 'db';
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

export const useTodayMealStats = () => {
    const { lastSyncStart, mealTime, kitchenId } = useApp();

    const volsOnField = useLiveQuery(async () => await getVolsOnField(getToday()), [mealTime, lastSyncStart], []);

    const allGroupBadges = useLiveQuery(
        async () =>
            db.groupBadges
                .toArray()
                .then((value) =>
                    value
                        .filter((b) => !b.is_disabled)
                        .filter(
                            (groupBadge) =>
                                groupBadge.kitchen === kitchenId || (groupBadge.kitchen === null && kitchenId === 1)
                        )
                ),
        [lastSyncStart, kitchenId],
        []
    );

    const groupBadgeById = useMemo(() => {
        return allGroupBadges.reduce(
            (acc, b) => {
                acc[b.id] = b;
                return acc;
            },
            {} as Record<string, GroupBadge>
        );
    }, [allGroupBadges]);

    const hasGroupBadge = useCallback(
        (group_badge?: number | null) => {
            return group_badge && groupBadgeById[group_badge];
        },
        [groupBadgeById]
    );

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime, lastSyncStart], []) as Array<Transaction>;

    const { groupBadgeVolunteersCount } = useMemo(() => {
        const groupCounts = new Map<number, number>();

        volsOnField.forEach((v) => {
            if (v.group_badge !== null && hasGroupBadge(v.group_badge)) {
                groupCounts.set(v.group_badge, (groupCounts.get(v.group_badge) ?? 0) + 1);
            }
        });

        return { groupBadgeVolunteersCount: groupCounts };
    }, [volsOnField, hasGroupBadge]);

    const individualFedCount = useMemo(
        () =>
            todayTxs.reduce((acc, curr) => {
                if (curr.mealTime === mealTime && !hasGroupBadge(curr.group_badge)) {
                    return acc + curr.amount;
                }
                return acc;
            }, 0),
        [mealTime, todayTxs, hasGroupBadge]
    );

    const groupFedCount = useMemo(
        () =>
            todayTxs.reduce((acc, curr) => {
                if (curr.mealTime === mealTime && hasGroupBadge(curr.group_badge)) {
                    return acc + curr.amount;
                }
                return acc;
            }, 0),
        [mealTime, todayTxs, hasGroupBadge]
    );

    const groupPlannedCount = useMemo(() => {
        const today = getToday();

        if (!mealTime) {
            return 0;
        }

        return allGroupBadges.reduce((total, gb) => {
            const planCell = findPlanCell(gb.planning_cells, mealTime, today);

            if (planCell) {
                return total + (planCell.amount_meat ?? 0) + (planCell.amount_vegan ?? 0);
            }

            return total + (groupBadgeVolunteersCount.get(gb.id) ?? 0);
        }, 0);
    }, [allGroupBadges, groupBadgeVolunteersCount, mealTime]);

    return {
        lastSyncStart,

        volsOnFieldCount: volsOnField.length,

        individualFedCount,
        // Из всех кто на поле, вычитаем тех, что планируется поесть по ГБ и тех, кто уже поел индивидуально
        individualLeftCount: Math.max(volsOnField.length - groupPlannedCount - individualFedCount, 0),

        groupFedCount,
        groupLeftCount: Math.max(groupPlannedCount - groupFedCount, 0)
    };
};
