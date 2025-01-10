import React, { useEffect, useRef, MouseEvent } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onDelete }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | Event) => {
            if (
                menuRef.current &&
                event.target instanceof Node &&
                !menuRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] min-w-32 rounded-md bg-neutral-100 py-1 shadow-lg dark:bg-neutral-700"
            style={{ top: `${y}px`, left: `${x}px` }}
        >
            <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-200 focus:outline-none dark:text-red-400 dark:hover:bg-neutral-600"
            >
                Delete
            </button>
        </div>
    );
};

export default ContextMenu;
