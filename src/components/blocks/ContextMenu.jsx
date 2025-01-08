import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, onClose, onDelete }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-neutral-100 dark:bg-neutral-700 rounded-md shadow-lg py-1 min-w-32 z-[9999]"
            style={{ top: `${y}px`, left: `${x}px` }}
        >
            <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-500 dark:text-red-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:outline-none"
            >
                Delete
            </button>
        </div>
    );
};

export default ContextMenu;