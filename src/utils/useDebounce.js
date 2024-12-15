import { useEffect, useCallback, useRef } from 'react';

const useDebounce = (
    callback,
    delay
) => {
    // Initialize with undefined and properly type the timeout
    const timeoutRef = useRef(undefined);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
};

export default useDebounce;