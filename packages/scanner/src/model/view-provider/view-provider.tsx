import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

interface IViewContext {
    currentView: AppViews;
    setCurrentView: (any: any) => void;
}

const ViewContext = createContext<IViewContext | null>(null);

export const AppViews = {
    MAIN: 'main',
    HISTORY: 'history',
    STATS: 'stats',
    SETTINGS: 'settings'
} as const;

export type AppViews = (typeof AppViews)[keyof typeof AppViews];

export const ViewProvider = (props: { children: ReactNode }) => {
    const { children } = props;

    const [currentView, setCurrentView] = useState<AppViews>(AppViews.MAIN);

    const viewContextValue: IViewContext = useMemo(
        () => ({
            currentView: currentView,
            setCurrentView: setCurrentView
        }),
        [currentView]
    );
    return <ViewContext.Provider value={viewContextValue}>{children}</ViewContext.Provider>;
};

export function useView(): IViewContext {
    const context = useContext(ViewContext);
    if (context === null) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}
