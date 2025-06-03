import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
    const timer = useRef<ReturnType<typeof setTimeout>>();
    return useCallback(
        (...args: Parameters<T>) => {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => cb(...args), delay);
        },
        [cb, delay]
    );
}
