import dayjs from 'dayjs';
import { ulid } from 'ulid';

import type { MealTime, Transaction } from '~/db';

import { rndInt } from './utils';

const createTestTrans = (type: 'now' | 'rnd', mealTime: MealTime): Transaction => {
    let ts: any;
    if (type === 'now') {
        ts = dayjs();
    }
    if (type === 'rnd') {
        ts = dayjs().startOf('day').add(rndInt(7, 31), 'h');
    }
    ts = ts.unix();
    const vol_id = rndInt(0, 600);

    return {
        vol_id: vol_id,
        amount: 1,
        ts,
        ulid: ulid(ts),
        mealTime: mealTime,
        is_new: true,
        is_vegan: rndInt(0, 1) ? true : false,
        qr_code: vol_id.toString()
    };
};

export const createMockData = (cnt: number, type: 'now' | 'rnd', mealTime: MealTime): Array<Transaction> =>
    Array(cnt)
        .fill(0)
        .map(() => createTestTrans(type, mealTime));
