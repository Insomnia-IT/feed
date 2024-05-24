import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import type { Transaction } from '~/db';
import { getTodayTrans, getVolsOnField } from '~/db';
import { getToday } from '~/shared/lib/date';
import { useApp } from '~/model/app-provider';

import style from './main-screen-stats.module.css';

export const ScanScreenStats = () => {
    const [volsFedAmount, setVolsFedAmount] = useState(0);
    const { mealTime } = useApp();

    const volsOnField = useLiveQuery(async () => (await getVolsOnField(getToday())).length, [mealTime], 0);

    const todayTxs = useLiveQuery(async () => getTodayTrans(), [mealTime], []) as Array<Transaction>;
    useEffect(() => {
        setVolsFedAmount(() => {
            if (todayTxs.length > 0) {
                return todayTxs.reduce((acc, curr) => {
                    if (curr.mealTime === mealTime) {
                        return acc + curr.amount;
                    }
                    return acc;
                }, 0);
            }
            return 0;
        });
    }, [mealTime, todayTxs]);

    return (
        <div className={style.mainScreenStats}>
            <span>Покормлено: {volsFedAmount}</span>
            <span>Осталось: {volsOnField > volsFedAmount ? volsOnField - volsFedAmount : 0}</span>
        </div>
    );
};
