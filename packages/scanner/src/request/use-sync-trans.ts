import { useCallback, useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { IndexableType } from 'dexie';

import type { ApiHook } from 'request/lib';
import { db } from 'db';
import type { ServerTransaction, Transaction } from 'db';

export const useSyncTransactions = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const send = useCallback(
        async ({ kitchenId }: { kitchenId: number }) => {
            if (fetching) {
                return Promise.resolve(false);
            }

            let lastUpdatedServerTrans = localStorage.getItem('lastUpdatedServerTrans'); // Время записи последней известной Кормителю транзакции в бд Джанго

            if (!lastUpdatedServerTrans) {
                lastUpdatedServerTrans = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').toISOString();
            }

            setFetching(true);

            try {
                const newClientTxs = await getNewClientTransactions();
                const formattedNewClientTxs = formatClientTransactionsToServer(newClientTxs);

                const response = await axios.post<{ last_updated: string; transactions: Array<ServerTransaction> }>(
                    `${baseUrl}/feed-transaction/sync`,
                    {
                        last_updated: lastUpdatedServerTrans,
                        transactions: formattedNewClientTxs,
                        kitchen_id: kitchenId
                    },
                    {
                        headers: {
                            Authorization: `K-PIN-CODE ${pin}`
                        }
                    }
                );

                await markTransactionsAsUpdated(newClientTxs);
                await putNewServerTransactions(response.data.transactions);
                await deleteOutdatedTransactions();

                if (response.data.last_updated) {
                    localStorage.setItem('lastUpdatedServerTrans', response.data.last_updated);
                }

                setUpdated(+new Date());
                return;
            } catch (e) {
                if (e instanceof AxiosError && e?.response?.status === 401) {
                    setAuth(false);
                    return false;
                }

                setError(e);
                console.error(e);
                return Promise.reject(e);
            } finally {
                setFetching(false);
            }
        },
        [baseUrl, error, fetching, pin, setAuth]
    );

    return useMemo(
        () => ({
            fetching,
            error,
            updated,
            send
        }),
        [error, fetching, send, updated]
    ) as ApiHook;
};

const getNewClientTransactions = async (): Promise<Array<Transaction>> => {
    const trans = await db.transactions.toArray();

    return (trans || []).filter(({ is_new }) => is_new);
};

const formatClientTransactionsToServer = (trans: Array<Transaction>) => {
    return trans.map(({ amount, group_badge, is_vegan, kitchen, mealTime, reason, ts, ulid, vol_id }) => ({
        volunteer: vol_id,
        is_vegan,
        amount,
        dtime: typeof ts === 'number' ? new Date(ts * 1000).toISOString() : ts,
        ulid,
        meal_time: mealTime,
        kitchen,
        reason,
        group_badge
    }));
};

const markTransactionsAsUpdated = async (trans: any): Promise<IndexableType> => {
    return db.transactions.bulkPut(
        trans.map((transaction: any) => ({
            ...transaction,
            is_new: false
        }))
    );
};

const putNewServerTransactions = async (data: any): Promise<IndexableType> => {
    const serverTransactions = data as Array<ServerTransaction>;
    const transactions = serverTransactions.map(
        ({ amount, dtime, group_badge, is_vegan, kitchen, meal_time, ulid, volunteer }) => ({
            vol_id: volunteer,
            is_vegan,
            mealTime: meal_time,
            ulid,
            amount,
            ts: Math.floor(new Date(dtime).valueOf() / 1000),
            is_new: false,
            kitchen,
            group_badge
        })
    );

    return db.transactions.bulkPut(transactions);
};

const deleteOutdatedTransactions = async (): Promise<number> => {
    const yesterdayTS = dayjs().startOf('day').subtract(1, 'day').add(7, 'hours').unix();
    return db.transactions.where('ts').below(yesterdayTS).delete();
};
