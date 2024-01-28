import { useCallback, useContext, useMemo, useState } from 'react';

import { useGetVols } from '~/request/use-get-vols';
import { useSyncTransactions } from '~/request/use-sync-trans';
import { AppContext } from '~/app-context';
import { useGetTrans } from '~/request/use-get-trans';
import { useSendTrans } from '~/request/use-send-trans';
import { db } from '~/db';

import { useGetGroupBadges } from './use-get-group-badges';
import type { ApiHook } from './lib';

export const useSync = (baseUrl: string, pin: string | null, setAuth: (auth: boolean) => void): ApiHook => {
    const { deoptimizedSync } = useContext(AppContext);

    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const { fetching: sendTransFetching, send: sendTransSend } = useSendTrans(baseUrl, pin, setAuth);

    const { fetching: getTransFetching, send: getTransSend } = useGetTrans(baseUrl, pin, setAuth);

    const { fetching: volsFetching, send: volsSend } = useGetVols(baseUrl, pin, setAuth);

    const { fetching: groupBadgesFetching, send: groupBadgesSend } = useGetGroupBadges(baseUrl, pin, setAuth);

    const { fetching: syncTransactionsFetching, send: syncTransactionsSend } = useSyncTransactions(
        baseUrl,
        pin,
        setAuth
    );

    const send = useCallback(
        ({ lastSyncStart }) => {
            if (
                volsFetching ||
                syncTransactionsFetching ||
                groupBadgesFetching ||
                getTransFetching ||
                sendTransFetching
            ) {
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
                    console.time('Время синхронизации');
                    if (deoptimizedSync === '1') {
                        // TODO: Remove after test
                        console.log('%c Старый алгоритм ', 'background: #ffb110;');
                        await sendTransSend();
                        await db.volunteers.clear();
                        await volsSend({ limit: '10000' });
                        await db.groupBadges.clear();
                        await groupBadgesSend();
                        await getTransSend();
                    } else {
                        console.log('%c Новый алгоритм ', 'background: green; color: white;');
                        await volsSend({
                            updated_at__from: new Date(lastSyncStart).toISOString(),
                            is_active: '1',
                            limit: '10000'
                        });
                        await groupBadgesSend({
                            created_at__from: new Date(lastSyncStart).toISOString(),
                            limit: '1000'
                        });
                        await syncTransactionsSend();
                    }
                    console.timeEnd('Время синхронизации');
                    success();
                } catch (e) {
                    error(e);
                }
            });
        },
        [
            volsFetching,
            syncTransactionsFetching,
            groupBadgesFetching,
            getTransFetching,
            sendTransFetching,
            deoptimizedSync,
            sendTransSend,
            volsSend,
            groupBadgesSend,
            getTransSend,
            syncTransactionsSend
        ]
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
