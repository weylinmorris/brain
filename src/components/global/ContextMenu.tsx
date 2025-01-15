import React, { useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface ContextMenuItem {
    label: string;
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function ContextMenu({ items, isOpen, onOpenChange }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                onOpenChange(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onOpenChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onOpenChange(false);
            buttonRef.current?.focus();
        }
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenChange(!isOpen);
                }}
                className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
                <MoreVertical size={16} className="text-neutral-500 dark:text-neutral-400" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => onOpenChange(false)} />
                    <div
                        ref={menuRef}
                        onKeyDown={handleKeyDown}
                        role="menu"
                        className="absolute right-0 z-20 min-w-[160px] rounded-lg bg-white py-1 shadow-lg dark:bg-neutral-800"
                    >
                        {items.map((item, index) => (
                            <button
                                key={index}
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChange(false);
                                    item.onClick(e);
                                }}
                                className={
                                    item.className ||
                                    'flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
                                }
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
