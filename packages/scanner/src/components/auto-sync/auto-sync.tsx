import { useEffect, useRef, useState } from 'react';

import { useApp } from 'model/app-provider';
import { Text } from 'shared/ui/typography';
import { useTimer } from 'shared/hooks/useTimer';

import css from './auto-sync.module.css';

const SYNC_INTERVAL = 2 * 60 * 1000;
const INITIAL_SYNC_TIME = Date.now() + SYNC_INTERVAL;

export const AutoSync = () => {
    const { doSync, syncError, syncFetching } = useApp();

    const [nextSyncTime, setNextSyncTime] = useState<number>(INITIAL_SYNC_TIME);

    const isSyncFetchingRef = useRef(syncFetching);
    const syncSendRef = useRef(doSync);

    useEffect(() => {
        isSyncFetchingRef.current = syncFetching;
        syncSendRef.current = doSync;
    });

    useEffect(() => {
        const sync = (): void => {
            setNextSyncTime(Date.now() + SYNC_INTERVAL);

            const isSyncFetching = isSyncFetchingRef.current;
            const syncSend = syncSendRef.current;

            if (navigator.onLine && !isSyncFetching) {
                console.log('online, updating...');
                void syncSend();
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
