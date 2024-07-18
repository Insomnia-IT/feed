import { useEffect, useRef, useState } from 'react';

import { useApp } from '~/model/app-provider';
import { Text } from '~/shared/ui/typography';
import { useTimer } from '~/shared/hooks/useTimer';

import css from './auto-sync.module.css';

const SYNC_INTERVAL = 2 * 60 * 1000;

export const AutoSync = () => {
    const { lastSyncStart, syncError, syncFetching, syncSend } = useApp();

    const [nextSyncTime, setNextSyncTime] = useState<number>(Date.now() + SYNC_INTERVAL);

    const isSyncFetchingRef = useRef(syncFetching);
    const lastSyncStartRef = useRef(lastSyncStart);
    const syncSendRef = useRef(syncSend);

    useEffect(() => {
        isSyncFetchingRef.current = syncFetching;
        lastSyncStartRef.current = lastSyncStart;
        syncSendRef.current = syncSend;
    });

    useEffect(() => {
        const sync = async (): Promise<void> => {
            setNextSyncTime(Date.now() + SYNC_INTERVAL);

            const isSyncFetching = isSyncFetchingRef.current;
            const lastSyncStart = lastSyncStartRef.current;
            const syncSend = syncSendRef.current;

            if (navigator.onLine && !isSyncFetching) {
                console.log('online, updating...');
                try {
                    await syncSend({ lastSyncStart });
                } catch (e) {
                    console.log(e);
                }
            }
        };

        const timer = setInterval(() => {
            void sync();
        }, SYNC_INTERVAL);

        return () => clearInterval(timer);
    }, []);

    const { minutes, seconds } = useTimer(nextSyncTime);

    return (
        <Text className={css.timer} style={{ color: syncError ? 'red' : undefined }}>
            {syncError ? 'Ошибка синхронизации ' : ''}
            {minutes}:{seconds}
        </Text>
    );
};
