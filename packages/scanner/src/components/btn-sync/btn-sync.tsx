import React, { useCallback } from 'react';
import cn from 'classnames';

import { nop } from '~/shared/lib/utils';
import { ReactComponent as Refresh } from '~/shared/icons/refresh.svg';
import { useApp } from '~/model/app-provider';

import css from './btn-sync.module.css';

export const BtnSync: React.FC = () => {
    const { deoptimizedSync, lastSyncStart, sync } = useApp();
    const { error, fetching, send, updated } = sync;

    const success = !error && updated;

    const doSync = async () => {
        try {
            await send({ lastSyncStart });
        } catch (e) {
            console.error(e);
        }
    };

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
