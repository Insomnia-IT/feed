import { useCallback, useState } from 'react';

import type { TransactionJoined } from '~/db';
import { getLastTrans } from '~/db';
import type { LocalLastTransHook } from '~/request-local-db/lib';

export const useLocalLastTrans = (): LocalLastTransHook => {
    const [error, setError] = useState<any>(null);
    const [transactions, setTransactions] = useState<Array<TransactionJoined>>([]);
    const [progress, setProgress] = useState<boolean>(false);

    const update = useCallback((limit) => {
        setProgress(true);

        return getLastTrans(0, limit)
            .then((txs) => {
                txs = txs.filter((tx) => tx.amount !== 0);
                setTransactions(txs);
                setProgress(false);
                return txs;
            })
            .catch((e) => {
                setProgress(false);
                setError(e);
                console.error(e);
            });
    }, []);
    return { error, progress, transactions, update };
};
