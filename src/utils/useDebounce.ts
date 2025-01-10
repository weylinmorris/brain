import { useEffect, useCallback, useRef } from 'react';

type AnyFunction = (...args: any[]) => any;

function useDebounce<T extends AnyFunction>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    // Initialize with undefined and properly type the timeout
    const timeoutRef = useRef<number>();

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
}

export default useDebounce; 