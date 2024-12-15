import {useEffect, useRef} from "react";

const useAutoResizingTextArea = (content) => {
    const ref = useRef(null);

    useEffect(() => {
        const textarea = ref.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [content]);

    return ref;
};

const useMaintainFocus = () => {
    const cursorPositionRef = useRef(null);

    const maintainFocusAndCursor = (blockId) => {
        const savedCursorPosition = cursorPositionRef.current;
        setTimeout(() => {
            const textarea = document.querySelector(
                `[data-block-id="${blockId}"]`
            );

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

export {useAutoResizingTextArea, useMaintainFocus};
