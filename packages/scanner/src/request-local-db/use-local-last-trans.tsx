import { useCallback, useState } from 'react';
import type { TransactionJoined } from 'db';
import { db, getLastTrans } from 'db';

import type { LocalLastTransHook } from './lib';

export const useLocalLastTrans = (): LocalLastTransHook => {
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Array<TransactionJoined>>([]);
    const [progress, setProgress] = useState<boolean>(false);

    const update = useCallback(async (limit: number) => {
        setProgress(true);
        try {
            const txs = await getLastTrans(0, limit);
            const filteredTxs = txs.filter((tx) => tx.amount !== 0);
            setTransactions(txs);
            const total = await db.transactions.filter((tx) => tx.amount !== 0).count();
            setProgress(false);
            return { txs: filteredTxs, total };
        } catch (e: unknown) {
            setProgress(false);
            setError(e instanceof Error ? e.message : 'Unknown error');
            console.error(e);
            return { txs: [], total: 0 };
        }
    }, []);
    return { error, progress, transactions, update };
};
