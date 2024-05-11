import React, { useContext, useMemo, useState } from 'react';

import type { MealTime } from '~/db';

export enum AppColor {
    RED,
    GREEN,
    YELLOW,
    BLUE
}

export const Colors = {
    [AppColor.RED]: '#FF5555',
    [AppColor.GREEN]: '#BBFFBB',
    [AppColor.YELLOW]: '#FFFF88',
    [AppColor.BLUE]: '#AAFFFF'
};

interface IAppContext {
    setColor: (c: AppColor | null) => void;
    resetColor: () => void;
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

    const [appColor, setAppColor] = useState<AppColor | null>(null);
    const [appError, setAppError] = useState<string | null>(null);
    const [mealTime, setMealTime] = useState<MealTime | null>(null);
    const [pin, setPin] = useState<string | null>('');
    const [auth, setAuth] = useState<boolean>(false);
    const [kitchenId, setKitchenId] = useState<number>(storedKitchenId);
    const [lastSyncStart, setLastSyncStart] = useState<number | null>(lastSyncStartLS ? +lastSyncStartLS : null);
    const [volCount, setVolCount] = useState<number>(0);

    const contextValue: IAppContext = useMemo(
        () => ({
            pin,
            setPin,
            auth,
            setAuth,
            appError,
            setColor: setAppColor,
            lastSyncStart,
            volCount,
            resetColor: () => setAppColor(null),
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
            deoptimizedSync: deoptimizedSyncLS
        }),
        [auth, pin, appError, lastSyncStart, volCount, mealTime, kitchenId]
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
