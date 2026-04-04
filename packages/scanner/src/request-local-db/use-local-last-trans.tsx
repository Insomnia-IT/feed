import { useCallback, useState } from 'react';
import type { TransactionJoined } from 'db';
import { getLastTrans } from 'db';

import type { LocalLastTransHook } from './lib';

const PAGE_SIZE = 20;

export const useLocalLastTrans = (): LocalLastTransHook => {
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Array<TransactionJoined>>([]);
    const [progress, setProgress] = useState<boolean>(false);

    const update = useCallback(async (offset: number) => {
        setProgress(true);
        try {
            const txs = await getLastTrans(offset, PAGE_SIZE);
            setTransactions((prev) => (offset === 0 ? txs : [...prev, ...txs]));
            setProgress(false);
            return { txs, total: 0 };
        } catch (e: unknown) {
            setProgress(false);
            setError(e instanceof Error ? e.message : 'Unknown error');
            console.error(e);
            return { txs: [], total: 0 };
        }
    }, []);
    return { error, progress, transactions, update };
};
