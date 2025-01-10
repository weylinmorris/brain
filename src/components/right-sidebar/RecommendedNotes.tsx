'use client';

import { useBlock } from "@/hooks/useBlock";
import { useEffect } from "react";
import BlockPreview from "@/components/blocks/BlockPreview";
import { Block } from "@/types/block";
import { TabType } from "@/app/page";

interface RecommendedNotesProps {
    setActiveTab: (tab: TabType) => void;
}

export default function RecommendedNotes({ setActiveTab }: RecommendedNotesProps) {
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
        <div className="flex-1 overflow-auto p-2 w-full">
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