import React from 'react';
import { Clock, Link } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Block } from '@/types/block';

interface BlockPreviewProps {
    block: Block;
    onClick?: (block: Block) => void;
    showPreview?: boolean;
    showTime?: boolean;
    similarity?: number;
}

function BlockPreview({
    block,
    onClick,
    showPreview = true,
    showTime = true,
    similarity,
}: BlockPreviewProps) {
    return (
        <div
            className="cursor-pointer space-y-2 rounded-md bg-neutral-50 px-4 py-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-500 dark:hover:text-neutral-50 xl:bg-neutral-100 xl:dark:bg-neutral-600"
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
                    {formatRelativeTime(block.updatedAt)}
                </span>
            )}

            {similarity && (
                <span className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                    <Link className="mr-1 h-2.5 w-2.5" />
                    {similarity}% similarity
                </span>
            )}
        </div>
    );
}

export default BlockPreview;
