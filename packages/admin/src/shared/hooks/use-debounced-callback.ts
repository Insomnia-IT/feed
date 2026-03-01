import { useCallback, useRef } from 'react';

export function useDebouncedCallback<Args extends unknown[]>(cb: (...args: Args) => void, delay = 300) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        (...args: Args) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => cb(...args), delay);
        },
        [cb, delay]
    );
}
