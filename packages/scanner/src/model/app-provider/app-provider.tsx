import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { MealTime } from 'db';
import { useSync } from 'request';
import { API_DOMAIN } from 'config';
import { db } from 'db';
import { useGetStat } from 'request/use-get-stat';

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
    predict: { individual: number; group: number } | null;
    isDev: boolean;
    debugMode: string | null;
    deoptimizedSync: string | null;
    syncFetching: boolean;
    syncError: boolean;
    autoSync: boolean;
    toggleAutoSync: () => void;
    doSync: (override?: { full?: boolean; kitchenId?: number }) => Promise<void>;
}
const AppContext = createContext<IAppContext | null>(null);

const isDev = import.meta.env.DEV;

const storedKitchenId = Number(localStorage.getItem('kitchenId'));
const lastSyncStartLS = localStorage.getItem('lastSyncStart');
const debugModeLS = localStorage.getItem('debug');
// TODO: Remove after test
const deoptimizedSyncLS = localStorage.getItem('katya_testiruet');
const autoSyncLS = localStorage.getItem('autoSync');

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [appError, setAppError] = useState<string | null>(null);
    const [mealTime, setMealTime] = useState<MealTime | null>(null);
    const [pin, setPin] = useState<string | null>('');
    const [auth, setAuth] = useState<boolean>(false);
    const [kitchenId, setKitchenId] = useState<number>(storedKitchenId);
    const [lastSyncStart, setLastSyncStart] = useState<number | null>(lastSyncStartLS ? +lastSyncStartLS : null);
    const [volCount, setVolCount] = useState<number>(0);
    const [predict, setPredict] = useState<{ individual: number; group: number } | null>(null);
    const [autoSync, setAutoSync] = useState<boolean>(autoSyncLS ? autoSyncLS === '1' : true);
    const { error: syncError, fetching: syncFetching, send: syncSend } = useSync(API_DOMAIN, pin, setAuth);
    const { send: statSend } = useGetStat(API_DOMAIN, pin, setAuth);

    const currentDate = new Date().toISOString().slice(0, 10);

    const doStat = useCallback(
        async (currentDate: string): Promise<void> => {
            try {
                const stats = await statSend(currentDate);
                const predictStats = stats.filter(
                    (s) =>
                        s.date === currentDate &&
                        s.meal_time === mealTime &&
                        s.kitchen_id === kitchenId &&
                        s.type === 'predict'
                );
                const individual = predictStats.filter((s) => !s.group_badge).reduce((acc, s) => acc + s.amount, 0);
                const group = predictStats.filter((s) => s.group_badge).reduce((acc, s) => acc + s.amount, 0);
                setPredict({
                    individual,
                    group
                });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
            }
        },
        [kitchenId, mealTime, statSend]
    );

    useEffect(() => {
        if (auth && kitchenId && mealTime && currentDate) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            doStat(currentDate);
        }
    }, [auth, kitchenId, mealTime, currentDate, doStat]);

    const toggleAutoSync = useCallback((): void => {
        setAutoSync((prev) => {
            localStorage.setItem('autoSync', !prev ? '1' : '0');
            return !prev;
        });
    }, []);

    const saveLastSyncStart = useCallback((ts: number): void => {
        // eslint-disable-next-line no-console
        console.log('localStorage.setItem', String(ts));

        localStorage.setItem('lastSyncStart', String(ts));
        setLastSyncStart(ts);
    }, []);

    const doSync = useCallback(
        async ({
            full,
            kitchenId: kitchenIdOverride
        }: {
            full?: boolean;
            kitchenId?: number;
        } = {}): Promise<void> => {
            if (navigator.onLine && !syncFetching) {
                // eslint-disable-next-line no-console
                console.log('online, updating...');
                try {
                    const updatedAt = await syncSend({
                        lastSyncStart: full ? null : lastSyncStart,
                        kitchenId: kitchenIdOverride || kitchenId
                    });
                    if (typeof updatedAt === 'number') {
                        saveLastSyncStart(updatedAt);
                        const count = await db.volunteers.count();
                        setVolCount(count);
                    }
                    return;
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.log(e);
                }
            }
        },
        [kitchenId, lastSyncStart, saveLastSyncStart, syncFetching, syncSend]
    );

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
            predict,
            isDev,
            debugMode: debugModeLS,
            deoptimizedSync: deoptimizedSyncLS,
            syncFetching,
            syncError: Boolean(syncError),
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
            doSync,
            syncError,
            predict
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
