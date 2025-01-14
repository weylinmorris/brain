'use client';

import React from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useEffect } from 'react';
import BlockPreview from '@/components/blocks/BlockPreview';
import { Block } from '@/types/block';
import { TabType } from '@/app/page';

interface RecommendedNotesProps {
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

function convertSimilarityToPercentage(similarity: number): number {
    return Math.round(similarity * 100);
}

const RecommendedNotes: React.FC<RecommendedNotesProps> = ({ setActiveTab }) => {
    const { activeBlockId, setActiveBlock, recommendedBlocks, getRecommendedBlocks } = useBlock();

    useEffect(() => {
        if (!activeBlockId) return;
        getRecommendedBlocks(activeBlockId);
    }, [activeBlockId, getRecommendedBlocks]);

    const handleBlockClick = (block: Block): void => {
        setActiveBlock(block.id);
        setActiveTab('editor');
    };

    return (
        <div className="w-full flex-1 overflow-auto p-2">
            {recommendedBlocks.length === 0 && (
                <div className="mt-8 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
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
                        similarity={
                            block.similarity
                                ? convertSimilarityToPercentage(block.similarity)
                                : undefined
                        }
                    />
                </div>
            ))}
        </div>
    );
};

export default RecommendedNotes;
