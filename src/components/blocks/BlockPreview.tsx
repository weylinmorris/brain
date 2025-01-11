import React from 'react';
import { Clock } from 'lucide-react';
import { getTimeAgo } from '@/utils/timeUtils';
import { Block } from '@/types/block';

interface BlockPreviewProps {
    block: Block;
    onClick?: (block: Block) => void;
    showPreview?: boolean;
    showTime?: boolean;
}

function BlockPreview({ block, onClick, showPreview = true, showTime = true }: BlockPreviewProps) {
    return (
        <div
            className="cursor-pointer space-y-2 rounded-md bg-neutral-50 px-4 py-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-500 dark:hover:text-neutral-50 xl:bg-neutral-100 xl:dark:bg-neutral-600"
            onClick={() => onClick?.(block)}
        >
            <p className="line-clamp-1 text-sm font-bold text-neutral-800 dark:text-neutral-50">
                {block.title || 'Untitled'}
            </p>

            {showPreview && (
                <span className="flex items-center text-xs">
                    <span className="line-clamp-3">{block.plainText}</span>
                </span>
            )}

            {showTime && (
                <span className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock className="mr-1 h-2.5 w-2.5" />
                    {getTimeAgo(block.updatedAt)}
                </span>
            )}
        </div>
    );
}

export default BlockPreview;
