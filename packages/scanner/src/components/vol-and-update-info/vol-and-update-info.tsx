import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import cn from 'classnames';

import type { Transaction } from '~/db';
import { db, getVolsOnField } from '~/db';
import { getToday } from '~/shared/lib/date';
import { useApp } from '~/model/app-provider';

import css from './vol-and-update-info.module.css';

const formatDate = (value) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' });
};

export const VolAndUpdateInfo = ({ textColor = 'black' }: { textColor?: 'black' | 'white' }) => {
    const [volsFedAmount, setVolsFedAmount] = useState(0);
    const { lastSyncStart, mealTime } = useApp();

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
        <div className={cn(css.postScanStats, { [css[textColor]]: textColor })}>
            <div className={css.stats}>
                <p>На поле: {volsOnField}</p>
                <p>Покормлено: {volsFedAmount}</p>
                <p>Осталось: {volsOnField > volsFedAmount ? volsOnField - volsFedAmount : 0}</p>
            </div>
            <p>Обновилось: {formatDate(lastSyncStart)}</p>
        </div>
    );
};
