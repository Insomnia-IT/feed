import { useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

import type { ApiHook } from 'request/lib';
import type { ServerTransaction } from 'db';
import { db } from 'db';
import { useApp } from 'model/app-provider';

export const useGetTrans = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const { kitchenId } = useApp();

    const [data, setData] = useState<ServerTransaction[] | null>(null);
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState(false);

    const inFlightRef = useRef(false);

    const send = useCallback(async () => {
        if (inFlightRef.current) return false;

        inFlightRef.current = true;
        setFetching(true);

        try {
            const yesterday = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').toISOString();

            const { data: resp } = await axios.get(`${baseUrl}/feed-transaction/`, {
                params: { limit: 100000, kitchen: kitchenId, dtime_from: yesterday },
                headers: { Authorization: `K-PIN-CODE ${pin}` }
            });

            const serverTransactions = resp.results as ServerTransaction[];
            setData(serverTransactions);

            await db.transactions.clear();

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

            setError(null);
            setUpdated(Date.now());
            return true;
        } catch (e: any) {
            if (e?.response?.status === 401) {
                setAuth(false);
                return false;
            }
            setError(e);
            throw e;
        } finally {
            inFlightRef.current = false;
            setFetching(false);
        }
    }, [baseUrl, pin, setAuth, kitchenId]);

    return useMemo<ApiHook>(
        () => ({
            data,
            fetching,
            error,
            updated,
            send
        }),
        [data, error, fetching, send, updated]
    );
};
