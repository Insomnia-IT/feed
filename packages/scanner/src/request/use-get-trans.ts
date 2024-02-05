import { useCallback, useContext, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

import type { ApiHook } from '~/request/lib';
import type { ServerTransaction } from '~/db';
import { db } from '~/db';
import { AppContext } from '~/app-context';

export const useGetTrans = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const { kitchenId } = useContext(AppContext);

    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(() => {
        if (fetching) {
            return Promise.resolve(false);
        }

        setFetching(true);

        return new Promise((res, rej) => {
            const yesterday = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').toISOString();

            axios
                .get(`${baseUrl}/feed-transaction/`, {
                    params: {
                        limit: 100000,
                        kitchen: kitchenId,
                        dtime_from: yesterday
                    },
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                })
                .then(async ({ data: { results } }) => {
                    setFetching(false);

                    try {
                        await db.transactions.clear();
                    } catch (e) {
                        rej(e);
                        return false;
                    }

                    try {
                        const serverTransactions = results as Array<ServerTransaction>;
                        const transactions = serverTransactions.map(
                            ({ amount, dtime, is_vegan, kitchen, meal_time, ulid, volunteer }) => ({
                                vol_id: volunteer,
                                is_vegan,
                                mealTime: meal_time,
                                ulid,
                                amount,
                                ts: Math.floor(new Date(dtime).valueOf() / 1000),
                                is_new: false,
                                kitchen
                            })
                        );

                        await db.transactions.bulkAdd(transactions);
                    } catch (e) {
                        console.error(e);
                        rej(e);
                        return false;
                    }
                    setUpdated(+new Date());
                    res(true);
                    return true;
                })
                .catch((e) => {
                    setFetching(false);
                    if (e?.response?.status === 401) {
                        rej(false);
                        setAuth(false);
                        return false;
                    }
                    setError(e);
                    rej(e);
                    return e;
                });
        });
    }, [baseUrl, error, fetching, pin, setAuth]);

    return <ApiHook>useMemo(
        () => ({
            fetching,
            error,
            updated,
            send
        }),
        [error, fetching, send, updated]
    );
};
