import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { MealTime } from '~/db';
import { useSync } from '~/request';
import { API_DOMAIN } from '~/config';
import { db } from '~/db';

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
    setMealTime: (mealTime: MealTime | null) => void;
    kitchenId: number;
    setKitchenId: (kitchenId: number) => void;
    isDev: boolean;
    debugMode: string | null;
    deoptimizedSync: string | null;
    syncFetching: boolean;
    syncError: boolean;
    autoSync: boolean;
    toggleAutoSync: () => void;
    syncSend: ({ lastSyncStart }: { lastSyncStart: number | null }) => Promise<void>;
    doSync: () => void;
}
const AppContext = React.createContext<IAppContext | null>(null);

const isDev = process.env.NODE_ENV !== 'production';

const storedPin = localStorage.getItem('pin');
const storedKitchenId = Number(localStorage.getItem('kitchenId'));
const lastSyncStartLS = localStorage.getItem('lastSyncStart');
const debugModeLS = localStorage.getItem('debug');
// TODO: Remove after test
const deoptimizedSyncLS = localStorage.getItem('katya_testiruet');
const autoSyncLS = localStorage.getItem('autoSync');

export const AppProvider = (props) => {
    const { children } = props;

    const [appError, setAppError] = useState<string | null>(null);
    const [mealTime, setMealTime] = useState<MealTime | null>(null);
    const [pin, setPin] = useState<string | null>('');
    const [auth, setAuth] = useState<boolean>(false);
    const [kitchenId, setKitchenId] = useState<number>(storedKitchenId);
    const [lastSyncStart, setLastSyncStart] = useState<number | null>(lastSyncStartLS ? +lastSyncStartLS : null);
    const [volCount, setVolCount] = useState<number>(0);
    const [autoSync, setAutoSync] = useState<boolean>(autoSyncLS ? autoSyncLS === '1' : true);
    const {
        error: syncError,
        fetching: syncFetching,
        send: syncSend,
        updated
    } = useSync(API_DOMAIN, pin, setAuth, kitchenId);
    const toggleAutoSync = useCallback(() => {
        setAutoSync((prev) => {
            localStorage.setItem('autoSync', !prev ? '1' : '0');
            return !prev;
        });
    }, []);

    const saveLastSyncStart = useCallback((ts) => {
        localStorage.setItem('lastSyncStart', String(ts));
        setLastSyncStart(ts);
    }, []);

    const doSync = useCallback(() => {
        if (navigator.onLine && !syncFetching) {
            console.log('online, updating...');
            try {
                void syncSend({ lastSyncStart });
            } catch (e) {
                console.log(e);
            }
        }
    }, [lastSyncStart, syncFetching, syncSend]);

    useEffect(() => {
        if (updated && !syncFetching) {
            saveLastSyncStart(updated);
            void db.volunteers.count().then((c) => {
                setVolCount(c);
            });
        }
    }, [syncFetching, saveLastSyncStart, setLastSyncStart, setVolCount, updated]);

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
            setLastSyncStart: saveLastSyncStart,
            autoSync,
            toggleAutoSync,
            setVolCount,
            mealTime,
            setMealTime,
            kitchenId,
            setKitchenId,
            isDev,
            debugMode: debugModeLS,
            deoptimizedSync: deoptimizedSyncLS,
            syncFetching,
            syncError,
            syncSend,
            doSync
        }),
        [
            pin,
            auth,
            appError,
            lastSyncStart,
            volCount,
            autoSync,
            mealTime,
            kitchenId,
            syncFetching,
            syncSend,
            doSync,
            syncError
        ]
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
