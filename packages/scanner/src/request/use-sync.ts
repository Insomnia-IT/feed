import { useCallback, useMemo, useState } from 'react';

import { useGetVols } from '~/request/use-get-vols';
import { useSendTrans } from '~/request/use-send-trans';
import { useGetTrans } from '~/request/use-get-trans';
import { useSyncTransactions } from '~/request/use-sync-trans';

import { useGetGroupBadges } from './use-get-group-badges';
import type { ApiHook } from './lib';

export const useSync = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const {
        // error: volsError,
        fetching: volsFetching,
        send: volsSend
        // updated: volsUpdated
    } = useGetVols(baseUrl, pin, setAuth);

    const {
        // error: volsError,
        fetching: groupBadgesFetching,
        send: groupBadgesSend
        // updated: volsUpdated
    } = useGetGroupBadges(baseUrl, pin, setAuth);

    const {
        // error: volsError,
        fetching: syncTransactionsFetching,
        send: syncTransactionsSend
        // updated: volsUpdated
    } = useSyncTransactions(baseUrl, pin, setAuth);

    const send = useCallback(
        ({ lastUpdate }) => {
            if (volsFetching || syncTransactionsFetching) {
                return;
            }

            const updateTimeStart = +new Date();

            setFetching(true);

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            return new Promise(async (res, rej) => {
                const success = (): void => {
                    setFetching(false);
                    setError(null);
                    setUpdated(updateTimeStart);
                    res(true);
                };

                const error = (err): void => {
                    setError(err);
                    setFetching(false);
                    rej(err);
                };

                try {
                    await volsSend({ updated_at__from: new Date(lastUpdate).toISOString(), limit: '10000' });
                    await syncTransactionsSend();
                    await groupBadgesSend();
                    success();
                } catch (e) {
                    error(e);
                }
            });
        },
        [volsFetching, syncTransactionsFetching, volsSend, syncTransactionsSend, groupBadgesSend]
    );

    return <ApiHook>useMemo(
        () => ({
            fetching,
            updated,
            error,
            send
        }),
        [error, fetching, send, updated]
    );
};
