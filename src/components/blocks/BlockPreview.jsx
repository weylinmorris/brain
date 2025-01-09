import React from 'react';
import {Clock} from 'lucide-react';
import {getTimeAgo} from '@/utils/timeUtils.js';
import {getPreviewFromBlock, getPreviewFromBlockContent} from '@/utils/blockUtils.js';

function BlockPreview({block, onClick, showPreview = true, showTime = true}) {
    return (
        <div
            className="px-4 py-2 bg-neutral-50 md:bg-neutral-100 dark:bg-neutral-800 md:dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500 text-neutral-500 hover:text-neutral-600 dark:text-neutral-300 dark:hover:text-neutral-50 rounded-md cursor-pointer space-y-2"
            onClick={() => onClick?.(block)}
        >
            <p className="text-sm font-bold">{getPreviewFromBlock(block)}</p>

            {
                showPreview && (
                    <span className="flex items-center text-xs">
                        {getPreviewFromBlockContent(block)}
                    </span>
                )
            }

            {
                showTime && (
                    <span className="flex items-center text-xs">
                        <Clock className="w-4 h-4 mr-1"/>
                        {getTimeAgo(block.updatedAt)}
                    </span>
                )
            }
        </div>
    );
}

export default BlockPreview;
