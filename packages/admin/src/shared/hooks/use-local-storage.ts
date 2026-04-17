import { useCallback } from 'react';

const isBrowser = () => typeof window !== 'undefined';

export const useLocalStorage = () => {
    const getItem = useCallback((key: string): string | null => {
        if (!isBrowser()) return null;

        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    }, []);

    const setItem = useCallback((key: string, value: string): void => {
        if (!isBrowser()) return;

        try {
            window.localStorage.setItem(key, value);
        } catch {
            /* empty */
        }
    }, []);

    const removeItem = useCallback((key: string): void => {
        if (!isBrowser()) return;

        try {
            window.localStorage.removeItem(key);
        } catch {
            /* empty */
        }
    }, []);

    return {
        getItem,
        setItem,
        removeItem
    };
};
