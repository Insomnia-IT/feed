import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { Transaction } from 'db';
import { getTodayTrans, getVolsOnField } from 'db';
import { useApp } from 'model/app-provider';
import { getToday } from 'shared/lib/date';

export const useTodayMealStats = () => {
    const { lastSyncStart, mealTime } = useApp();

    const volsOnField = useLiveQuery(async () => await getVolsOnField(getToday()), [mealTime, lastSyncStart], []);

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime, lastSyncStart], []) as Array<Transaction>;

    const individualOnFieldCount = useMemo(
        () => volsOnField.filter((v) => v.group_badge == null).length,
        [volsOnField]
    );

    const groupVolunteersCount = useMemo(() => volsOnField.filter((v) => v.group_badge != null).length, [volsOnField]);

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

    return {
        lastSyncStart,
        volsOnField,
        individualFedCount,
        individualLeftCount: Math.max(individualOnFieldCount - individualFedCount, 0),
        groupFedCount,
        groupLeftCount: Math.max(groupVolunteersCount - groupFedCount, 0)
    };
};
