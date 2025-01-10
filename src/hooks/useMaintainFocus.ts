import { useRef } from 'react';

const useMaintainFocus = () => {
    const cursorPositionRef = useRef<number | null>(null);

    const maintainFocusAndCursor = (blockId: string): void => {
        const savedCursorPosition = cursorPositionRef.current;
        setTimeout(() => {
            const textarea = document.querySelector(
                `[data-block-id="${blockId}"]`
            ) as HTMLTextAreaElement | null;

            if (textarea) {
                textarea.focus();
                if (savedCursorPosition !== null) {
                    textarea.selectionStart = savedCursorPosition;
                    textarea.selectionEnd = savedCursorPosition;
                }
            }
        }, 0);
    };

    return { cursorPositionRef, maintainFocusAndCursor };
};

export { useMaintainFocus };