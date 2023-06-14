import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { useLiveQuery } from 'dexie-react-hooks';

import type { ApiHook } from '~/request/lib';
import { db } from '~/db';

export const useSendTrans = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const trans = useLiveQuery(async () => await db.transactions.toArray());
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    console.log({ trans });

    const send = useCallback(() => {
        if (trans?.length === 0) {
            return Promise.resolve(true);
        }

        if (fetching) {
            return Promise.resolve(false);
        }

        const kitchen = Number(localStorage.getItem('kitchenId'));
        const data = (trans || [])
            .filter(({ is_new }) => is_new)
            .map(({ amount, is_vegan, mealTime, reason, ts, ulid, vol_id }) => ({
                volunteer: vol_id,
                is_vegan,
                amount,
                dtime: typeof ts === 'number' ? new Date(ts * 1000).toISOString() : ts,
                ulid,
                meal_time: mealTime,
                kitchen,
                reason
            }));

        setFetching(true);

        return new Promise((res, rej) => {
            axios
                .post(`${baseUrl}/feed-transaction/bulk`, data, {
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                })
                .then(async (resp) => {
                    try {
                        await db.transactions.clear();
                    } catch (e) {
                        rej(e);
                        return;
                    }
                    setFetching(false);
                    setUpdated(+new Date());
                    res(resp);
                })
                .catch((e) => {
                    setFetching(false);
                    if (e?.response?.status === 401) {
                        rej(false);
                        setAuth(false);
                        return;
                    }
                    setError(error);
                    rej(error);
                });
        });
    }, [baseUrl, error, fetching, pin, setAuth, trans]);

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
