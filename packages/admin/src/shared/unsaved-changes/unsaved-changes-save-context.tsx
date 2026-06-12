import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

type UnsavedChangesSaveContextValue = {
    registerSaveHandler: (handler: () => void) => () => void;
    getSaveHandler: () => (() => void) | null;
};

const UnsavedChangesSaveContext = createContext<UnsavedChangesSaveContextValue | null>(null);

export const UnsavedChangesSaveProvider = ({ children }: { children: ReactNode }) => {
    const handlerRef = useRef<(() => void) | null>(null);

    const registerSaveHandler = useCallback((handler: () => void) => {
        handlerRef.current = handler;
        return () => {
            if (handlerRef.current === handler) {
                handlerRef.current = null;
            }
        };
    }, []);

    const getSaveHandler = useCallback(() => handlerRef.current, []);

    return (
        <UnsavedChangesSaveContext.Provider value={{ registerSaveHandler, getSaveHandler }}>
            {children}
        </UnsavedChangesSaveContext.Provider>
    );
};

export const useUnsavedChangesSaveContext = () => {
    const context = useContext(UnsavedChangesSaveContext);
    if (!context) {
        throw new Error('useUnsavedChangesSaveContext must be used within UnsavedChangesSaveProvider');
    }
    return context;
};
