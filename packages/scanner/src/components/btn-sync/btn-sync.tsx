import React, { useCallback, useContext, useEffect } from 'react';
import cn from 'classnames';

import { API_DOMAIN } from '~/config';
import { AppContext } from '~/app-context';
import { db } from '~/db';
import { nop } from '~/lib/utils';
import { ReactComponent as Refresh } from '~/icons/refresh.svg';
import { useSync } from '~/request';

import css from './btn-sync.module.css';

const SYNC_INTERVAL = 2 * 60 * 1000;

export const BtnSync: React.FC = () => {
    const { lastUpdate, pin, setAuth, setLastUpdated, setVolCount } = useContext(AppContext);
    const { error, fetching, send, updated } = useSync(API_DOMAIN, pin, setAuth);

    const click = useCallback(() => {
        void send({ lastUpdate });
    }, [send, lastUpdate]);

    useEffect(() => {
        if (updated && !fetching) {
            setLastUpdated(updated);
            void db.volunteers.count().then((c) => {
                setVolCount(c);
            });
        }
    }, [fetching, setLastUpdated, setVolCount, updated]);

    useEffect(() => {
        // TODO detect hanged requests
        const sync = (): void => {
            // clearTimeout(timer);
            if (navigator.onLine) {
                console.log('online, updating...');
                void send();
            }
        };

        const timer = setInterval(sync, SYNC_INTERVAL);

        return () => clearInterval(timer);
    }, [send]);

    const success = !error && updated;

    return (
        <button
            className={cn(css.btnSync, error && css.error, success && css.success)}
            onClick={fetching ? nop : click}
            disabled={fetching}
        >
            <Refresh />
        </button>
    );
};
