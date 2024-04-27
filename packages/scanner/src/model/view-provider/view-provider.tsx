import React, { useContext, useMemo, useState } from 'react';

export interface IViewContext {
    currentView: number;
    setCurrentView: (any) => void;
}

// @ts-ignore
const ViewContext = React.createContext<IViewContext | null>(null);

export const ViewProvider = (props) => {
    const { children } = props;

    const [currentView, setCurrentView] = useState<number>(0);

    const viewContextValue: IViewContext = useMemo(
        () => ({
            currentView: currentView,
            setCurrentView: setCurrentView
        }),
        [currentView]
    );
    return (
        <div>
            <ViewContext.Provider value={viewContextValue}>{children}</ViewContext.Provider>
        </div>
    );
};

export function useView(): IViewContext {
    const context = useContext(ViewContext);
    if (context === null) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}
