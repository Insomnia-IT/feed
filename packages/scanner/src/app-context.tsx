import React from 'react';

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

export interface IAppContext {
    setColor: (c: AppColor | null) => void;
    resetColor: () => void;
    appError: string | null;
    setError: (err: string | null) => void;
    setLastUpdated: (ts: number) => void;
    setVolCount: (ts: number) => void;
    pin: string | null;
    setPin: (pin: string) => void;
    setAuth: (auth: boolean) => void;
    lastUpdate: number | null;
    volCount: number;
    mealTime: MealTime | null;
    setMealTime: (mealTime: MealTime) => void;
    kitchenId: string | null;
    isDev: boolean;
}

// @ts-ignore
const AppContext = React.createContext<IAppContext>(null);

export { AppContext };
