import { useState, useRef, useEffect, TouchEvent, MouseEvent } from 'react';
import { Trash2 } from 'lucide-react';
import BlockPreview from './BlockPreview';
import ContextMenu from './ContextMenu';
import { Block } from '@/types/block';

const DELETE_THRESHOLD = 150; // Half of typical note width
const ANIMATION_DURATION = 200; // Duration in ms

interface SwipeableNoteProps {
    block: Block;
    onDelete?: (id: string) => void;
    onClick?: (block: Block) => void;
    showPreview?: boolean;
    showTime?: boolean;
}

interface ContextMenuPosition {
    x: number;
    y: number;
}

export default function SwipeableNote({
    block,
    onDelete,
    onClick,
    showPreview = false,
    showTime = false,
}: SwipeableNoteProps) {
    const [offset, setOffset] = useState(0);
    const [startX, setStartX] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close context menu on any click outside
    useEffect(() => {
        if (!contextMenu) return;

        const handleClickOutside = (event: MouseEvent | Event) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [contextMenu]);

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (showConfirm) return;
        setStartX(e.touches[0].clientX);
        setIsAnimating(false);
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (!startX || showConfirm) return;

        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;

        // Only allow left swipe (negative diff)
        if (diff > 0) {
            setOffset(0);
            return;
        }

        setOffset(diff);
    };

    const handleTouchEnd = () => {
        setStartX(0);

        // If swiped more than threshold, animate to full width then show confirmation
        if (offset < -DELETE_THRESHOLD) {
            setIsAnimating(true);
            setOffset(-window.innerWidth);
            // Wait for animation to complete before showing confirm
            setTimeout(() => {
                setOffset(0);
                setShowConfirm(true);
                setIsAnimating(false);
            }, ANIMATION_DURATION);
        } else {
            // Just animate back to start
            setIsAnimating(true);
            setOffset(0);
            setTimeout(() => {
                setIsAnimating(false);
            }, ANIMATION_DURATION);
        }
    };

    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete(block.id);
        }
        setShowConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate menu position using client coordinates
        const x = e.clientX;
        const y = e.clientY;

        // Ensure menu stays within viewport
        const menuWidth = 128; // Approximate width of context menu
        const menuHeight = 40; // Approximate height of context menu

        const adjustedX = Math.min(x, window.innerWidth - menuWidth);
        const adjustedY = Math.min(y, window.innerHeight - menuHeight);

        setContextMenu({
            x: adjustedX,
            y: adjustedY,
        });
    };

    const handleContextDelete = () => {
        if (onDelete) {
            onDelete(block.id);
        }
        setContextMenu(null);
    };

    // Calculate dynamic border radius based on swipe
    const swipeProgress = Math.min(Math.abs(offset) / DELETE_THRESHOLD, 1);
    const rightBorderRadius = Math.max(0, 8 * (1 - swipeProgress)); // Assuming 8px is the default border radius

    return (
        <div
            ref={containerRef}
            className="relative mb-1 touch-pan-y overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
        >
            {/* Background that appears during swipe */}
            <div className="absolute inset-0 flex items-center justify-end rounded-md bg-red-500 pr-4">
                <Trash2 className="text-white" size={20} />
            </div>

            {/* Main content */}
            <div
                className={`relative rounded-md bg-neutral-100 dark:bg-neutral-600 ${
                    isAnimating ? `transition-transform duration-${ANIMATION_DURATION}` : ''
                }`}
                style={{
                    transform: `translateX(${offset}px)`,
                    borderTopRightRadius: `${rightBorderRadius}px`,
                    borderBottomRightRadius: `${rightBorderRadius}px`,
                }}
            >
                <BlockPreview
                    block={block}
                    onClick={onClick}
                    showPreview={showPreview}
                    showTime={showTime}
                />
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="absolute inset-0 flex items-center justify-end rounded-md bg-neutral-100 dark:bg-neutral-600">
                    <div className="flex items-center space-x-2 p-2">
                        <button
                            onClick={handleCancelDelete}
                            className="rounded-md bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDelete={handleContextDelete}
                />
            )}
        </div>
    );
}
