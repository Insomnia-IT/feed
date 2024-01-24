import { useCallback, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { IndexableType } from 'dexie';

import type { ApiHook } from '~/request/lib';
import { db } from '~/db';
import type { ServerTransaction, Transaction } from '~/db';

export const useSyncTransactions = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(async () => {
        if (fetching) {
            return Promise.resolve(false);
        }

        let lastTransactionsSync = localStorage.getItem('lastTransactionsSync');

        if (!lastTransactionsSync) {
            lastTransactionsSync = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').toISOString();
        }

        setFetching(true);

        try {
            const transactions = await getNewClientTransactions();

            const response = await axios.post<{ last_updated: string; transactions: Array<ServerTransaction> }>(
                `${baseUrl}/feed-transaction/sync`,
                {
                    last_updated: lastTransactionsSync,
                    transactions: transactions
                },
                {
                    headers: {
                        Authorization: `K-PIN-CODE ${pin}`
                    }
                }
            );

            await updateArrayTransactions(transactions, { is_new: false });
            await putNewServerTransactions(response.data.transactions);
            await deleteOutdatedTransactions();

            localStorage.setItem('lastTransactionsSync', response.data.last_updated);

            setUpdated(+new Date());
            return;
        } catch (e) {
            if (e instanceof AxiosError && e?.response?.status === 401) {
                setAuth(false);
                return false;
            }

            setError(e);
            return e;
        } finally {
            setFetching(false);
        }
    }, [baseUrl, fetching, pin, setAuth]);

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

const getNewClientTransactions = async () => {
    const trans = await db.transactions.toArray();

    const kitchen = Number(localStorage.getItem('kitchenId'));
    return (trans || [])
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
};

const updateArrayTransactions = async (transactions, changes): Promise<void> => {
    for (const transaction of transactions) {
        await db.transactions.update(transaction.ulid, changes);
    }
};

const putNewServerTransactions = async (data): Promise<IndexableType> => {
    const serverTransactions = data as Array<ServerTransaction>;
    const transactions = serverTransactions.map(({ amount, dtime, is_vegan, meal_time, ulid, volunteer }) => ({
        vol_id: volunteer,
        is_vegan,
        mealTime: meal_time,
        ulid,
        amount,
        ts: Math.floor(new Date(dtime).valueOf() / 1000),
        is_new: false
    }));

    return db.transactions.bulkPut(transactions);
};

const deleteOutdatedTransactions = async (): Promise<Array<Transaction>> => {
    const yesterdayTS = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').unix();
    return db.transactions.where('ts').below(yesterdayTS).toArray();
};
