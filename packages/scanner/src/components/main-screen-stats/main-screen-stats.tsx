import React, { useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';

import { AppContext } from '~/app-context';
import type { Transaction } from '~/db';
import { db, getVolsOnField } from '~/db';
import { getToday } from '~/shared/lib/date';

import style from './main-screen-stats.module.css';

export const MainScreenStats = () => {
    const [volsFedAmount, setVolsFedAmount] = useState(0);
    const { mealTime } = useContext(AppContext);

    const volsOnField = useLiveQuery(async () => (await getVolsOnField(getToday())).length, [mealTime], 0);

    const todayTxs = useLiveQuery(
        async () => {
            const today = getToday();
            return db.transactions
                .where('ts')
                .between(dayjs(today).add(7, 'h').unix(), dayjs(today).add(31, 'h').unix())
                .toArray();
        },
        [mealTime],
        []
    ) as Array<Transaction>;

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
            <span>На поле: {volsOnField}</span>
            <span>Покормлено: {volsFedAmount}</span>
            <span>Осталось: {volsOnField > volsFedAmount ? volsOnField - volsFedAmount : 0}</span>
        </div>
    );
};
