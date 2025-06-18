/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { Grid } from 'antd';
import { Breakpoint } from 'antd/es/_util/responsiveObserver';

interface ScreenCtx {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    breakpoint: Partial<Record<Breakpoint, boolean>>;
}

const ScreenContext = createContext<ScreenCtx | null>(null);

function calcFlags(breakpoint: Partial<Record<Breakpoint, boolean>>): ScreenCtx {
    const xs = !!breakpoint.xs;
    const sm = !!breakpoint.sm;
    const md = !!breakpoint.md;
    const lg = !!breakpoint.lg;
    const xl = !!breakpoint.xl;
    const xxl = !!breakpoint.xxl;

    const isMobile = xs || sm || !(md || lg || xl || xxl);
    const isTablet = md && !(lg || xl || xxl);
    const isDesktop = lg || xl || xxl;

    return { breakpoint, isMobile, isTablet, isDesktop };
}

export const ScreenProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const breakpoint = Grid.useBreakpoint();
    const value = useMemo(() => calcFlags(breakpoint), [breakpoint]);
    return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>;
};

export const useScreen = () => {
    const ctx = useContext(ScreenContext);
    if (!ctx) throw new Error('useScreen must be used inside <ScreenProvider>');
    return ctx;
};
