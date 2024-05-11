import React, { useContext, useMemo, useState } from 'react';

interface IViewContext {
    currentView: AppViews;
    setCurrentView: (any) => void;
}

const ViewContext = React.createContext<IViewContext | null>(null);

export enum AppViews {
    MAIN = 'main',
    HISTORY = 'history',
    STATS = 'stats'
}

export const ViewProvider = (props) => {
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
