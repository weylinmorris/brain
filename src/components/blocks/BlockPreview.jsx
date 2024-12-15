import React from 'react';
import {Clock, Hash} from 'lucide-react';
import {getTimeAgo} from '@/utils/timeUtils.js';
import {getPreviewFromBlock, getPreviewFromBlockContent} from '@/utils/blockUtils.js';

function BlockPreview({block, onClick, showPreview = true, showTime = true}) {
    return (
        <div
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 text-neutral-300 hover:text-neutral-50 rounded-md transition-colors cursor-pointer space-y-2"
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
};

export default BlockPreview;
