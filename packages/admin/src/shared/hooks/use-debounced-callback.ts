import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<Args extends unknown[]>(cb: (...args: Args) => void, delay = 300) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(cb);

    useEffect(() => {
        callbackRef.current = cb;
    }, [cb]);

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        },
        []
    );

    return useCallback(
        (...args: Args) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => callbackRef.current(...args), delay);
        },
        [delay]
    );
}
