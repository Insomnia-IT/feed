import React, { useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';

import { AppContext } from '~/app-context';
import { db, getVolsOnField } from '~/db';
import { getToday } from '~/lib/date';

import style from './main-screen-stats.module.css';

export const MainScreenStats = () => {
    const { mealTime } = useContext(AppContext);

    const volsOnField = useLiveQuery(async () => (await getVolsOnField(getToday())).length, [mealTime], 0);

    const volsFed = useLiveQuery(
        async () => {
            const today = getToday();
            return db.transactions
                .where('ts')
                .between(dayjs(today).add(7, 'h').unix(), dayjs(today).add(31, 'h').unix())
                .filter((tx) => {
                    return tx.mealTime === mealTime && tx.amount !== 0;
                })
                .count();
        },
        [mealTime],
        0
    );
    return (
        <div className={style.mainScreenStats}>
            <span>На поле: {volsOnField}</span>
            <span>Покормлено: {volsFed}</span>
            <span>Осталось: {volsOnField > volsFed ? volsOnField - volsFed : 0}</span>
        </div>
    );
};
