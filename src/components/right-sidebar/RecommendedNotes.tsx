'use client';

import { useBlock } from '@/hooks/useBlock';
import { useEditMode } from '@/hooks/useEditMode';
import { useEffect } from 'react';
import BlockPreview from '@/components/blocks/BlockPreview';
import { Block } from '@/types/block';
import { TabType } from '@/app/page';

interface RecommendedNotesProps {
    setActiveTab: (tab: TabType) => void;
}

export default function RecommendedNotes({ setActiveTab }: RecommendedNotesProps) {
    const { activeBlockId, setActiveBlock, recommendedBlocks, getRecommendedBlocks } = useBlock();
    const { setEditMode } = useEditMode();

    useEffect(() => {
        if (!activeBlockId) return;
        getRecommendedBlocks(activeBlockId);
    }, [activeBlockId, getRecommendedBlocks]);

    const handleBlockClick = (block: Block): void => {
        setEditMode(false);
        setActiveBlock(block.id);
        setActiveTab('editor');
    };

    return (
        <div className="w-full flex-1 overflow-auto p-2">
            {recommendedBlocks.length === 0 && (
                <div className="mt-8 text-center text-sm font-semibold text-gray-500">
                    No recommended notes found
                </div>
            )}

            {recommendedBlocks?.map((block: Block) => (
                <div key={block.id} className="w-full">
                    <BlockPreview
                        block={block}
                        onClick={() => handleBlockClick(block)}
                        showPreview={true}
                        showTime={false}
                    />
                </div>
            ))}
        </div>
    );
}
