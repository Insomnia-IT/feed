import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { Transaction } from 'db';
import { getTodayTrans, getVolsOnField } from 'db';
import { useApp } from 'model/app-provider';
import { getToday } from 'shared/lib/date';

export const useTodayMealStats = () => {
    const { lastSyncStart, mealTime } = useApp();

    const volsOnField = useLiveQuery(
        async () => (await getVolsOnField(getToday())).length,
        [mealTime, lastSyncStart],
        0
    );

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime, lastSyncStart], []) as Array<Transaction>;

    const volsFedAmount = useMemo(
        () =>
            todayTxs.reduce((acc, curr) => {
                if (curr.mealTime === mealTime) {
                    return acc + curr.amount;
                }

                return acc;
            }, 0),
        [mealTime, todayTxs]
    );

    return {
        lastSyncStart,
        volsOnField,
        volsFedAmount,
        volsLeftAmount: Math.max(volsOnField - volsFedAmount, 0)
    };
};
