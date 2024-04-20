import React, { useContext, useState } from 'react';

import { createMockData } from '~/shared/lib/mock';
import { db } from '~/db';
import { AppContext } from '~/app-context';

import style from './mock-trans.module.css';

export const MockTrans: React.FC = () => {
    const [count, setCount] = useState<number>(1);
    const { mealTime } = useContext(AppContext);
    const addTestTrans = (count: number, type: 'now' | 'rnd') => {
        if (mealTime) {
            const trans = createMockData(count, type, mealTime);
            trans.forEach((tx) => {
                void db.transactions.add(tx);
            });
        }
    };
    return (
        <div className={style.mockBlock}>
            <input type={'number'} placeholder={'count'} value={count} onChange={(e) => setCount(+e.target.value)} />
            <button onClick={() => addTestTrans(count, 'now')}>Tx now</button>
            <button onClick={() => addTestTrans(count, 'rnd')}>Tx rnd</button>
        </div>
    );
};
