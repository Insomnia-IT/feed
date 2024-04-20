import React, { useCallback, useContext, useEffect } from 'react';
import cn from 'classnames';

import { API_DOMAIN } from '~/config';
import { AppContext } from '~/app-context';
import { db } from '~/db';
import { nop } from '~/shared/lib/utils';
import { ReactComponent as Refresh } from '~/shared/icons/refresh.svg';
import { useSync } from '~/request';

import css from './btn-sync.module.css';

const SYNC_INTERVAL = 2 * 60 * 1000;

export const BtnSync: React.FC = () => {
    const { deoptimizedSync, lastSyncStart, pin, setAuth, setLastSyncStart, setVolCount } = useContext(AppContext);
    const { error, fetching, send, updated } = useSync(API_DOMAIN, pin, setAuth);

    const success = !error && updated;

    const doSync = async () => {
        try {
            await send({ lastSyncStart });
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (updated && !fetching) {
            setLastSyncStart(updated);
            void db.volunteers.count().then((c) => {
                setVolCount(c);
            });
        }
    }, [fetching, setLastSyncStart, setVolCount, updated]);

    useEffect(() => {
        // TODO detect hanged requests
        const sync = (): void => {
            // clearTimeout(timer);
            if (navigator.onLine) {
                console.log('online, updating...');
                void doSync();
            }
        };

        const timer = setInterval(sync, SYNC_INTERVAL);

        return () => clearInterval(timer);
    }, [send, lastSyncStart, doSync]);

    const handleClick = useCallback(() => {
        void doSync();
    }, [doSync]);

    return (
        <button
            className={cn(css.btnSync, error && css.error, success && css.success)}
            onClick={fetching ? nop : handleClick}
            disabled={fetching}
        >
            {deoptimizedSync === '1' && <div className={css.deoptimizedIcon}></div>}
            <Refresh />
        </button>
    );
};
