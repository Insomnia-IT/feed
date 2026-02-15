/* eslint-disable react-refresh/only-export-components */
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import { Grid } from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';

interface ScreenCtx {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    breakpoint: Partial<Record<Breakpoint, boolean>>;
}

const ScreenContext = createContext<ScreenCtx | null>(null);

function calcFlags(breakpoint: Partial<Record<Breakpoint, boolean>>): ScreenCtx {
    const breakpointOrder: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const current = breakpointOrder.find((bp) => breakpoint[bp]) || 'xs';

    const isMobile = current === 'xs' || current === 'sm';
    const isTablet = current === 'md';
    const isDesktop = current === 'lg' || current === 'xl' || current === 'xxl';

    return { breakpoint, isMobile, isTablet, isDesktop };
}

export const ScreenProvider = ({ children }: PropsWithChildren) => {
    const breakpoint = Grid.useBreakpoint();
    const value = useMemo(() => calcFlags(breakpoint), [breakpoint]);
    return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>;
};

export const useScreen = () => {
    const ctx = useContext(ScreenContext);
    if (!ctx) throw new Error('useScreen must be used inside <ScreenProvider>');
    return ctx;
};
