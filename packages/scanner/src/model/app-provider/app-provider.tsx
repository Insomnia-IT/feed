import React, { useContext, useEffect, useMemo, useState } from 'react';

import type { MealTime } from '~/db';
import type { ApiHook } from '~/request';
import { useSync } from '~/request';
import { API_DOMAIN } from '~/config';
import { db } from '~/db';

const SYNC_INTERVAL = 2 * 60 * 1000;

interface IAppContext {
    appError: string | null;
    setError: (err: string | null) => void;
    setLastSyncStart: (ts: number) => void;
    setVolCount: (ts: number) => void;
    pin: string | null;
    setPin: (pin: string) => void;
    auth: boolean;
    setAuth: (auth: boolean) => void;
    lastSyncStart: number | null;
    volCount: number;
    mealTime: MealTime | null;
    setMealTime: (mealTime: MealTime) => void;
    kitchenId: number;
    setKitchenId: (kitchenId: number) => void;
    isDev: boolean;
    debugMode: string | null;
    deoptimizedSync: string | null;
    sync: ApiHook;
}
const AppContext = React.createContext<IAppContext | null>(null);

const isDev = process.env.NODE_ENV !== 'production';

const storedPin = localStorage.getItem('pin');
const storedKitchenId = Number(localStorage.getItem('kitchenId'));
const lastSyncStartLS = localStorage.getItem('lastSyncStart');
const debugModeLS = localStorage.getItem('debug');
// TODO: Remove after test
const deoptimizedSyncLS = localStorage.getItem('katya_testiruet');

export const AppProvider = (props) => {
    const { children } = props;

    const [appError, setAppError] = useState<string | null>(null);
    const [mealTime, setMealTime] = useState<MealTime | null>(null);
    const [pin, setPin] = useState<string | null>('');
    const [auth, setAuth] = useState<boolean>(false);
    const [kitchenId, setKitchenId] = useState<number>(storedKitchenId);
    const [lastSyncStart, setLastSyncStart] = useState<number | null>(lastSyncStartLS ? +lastSyncStartLS : null);
    const [volCount, setVolCount] = useState<number>(0);

    const sync = useSync(API_DOMAIN, pin, setAuth, kitchenId);
    const { fetching, send, updated } = sync;

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

    const contextValue: IAppContext = useMemo(
        () => ({
            pin,
            setPin,
            auth,
            setAuth,
            appError,
            lastSyncStart,
            volCount,
            setError: setAppError,
            setLastSyncStart: (ts) => {
                localStorage.setItem('lastSyncStart', String(ts));
                setLastSyncStart(ts);
            },
            setVolCount,
            mealTime,
            setMealTime,
            kitchenId,
            setKitchenId,
            isDev,
            debugMode: debugModeLS,
            deoptimizedSync: deoptimizedSyncLS,
            sync
        }),
        [pin, auth, appError, lastSyncStart, volCount, mealTime, kitchenId, sync]
    );

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
export function useApp(): IAppContext {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
