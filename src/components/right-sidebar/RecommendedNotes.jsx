import {useActiveBlock, useBlocks} from "@/context/block/index.js";
import {useEffect} from "react";
import BlockPreview from "@/components/blocks/BlockPreview.jsx";

export default function RecommendedNotes({ setActiveTab }) {
    const { activeBlock, setActiveBlock } = useActiveBlock();
    const { recommendedBlocks, getRecommendedBlocks } = useBlocks();

    useEffect(() => {
        if (!activeBlock) return;
        getRecommendedBlocks(activeBlock.id);
    }, [activeBlock]);

    const handleBlockClick = (block) => {
        setActiveBlock(block.id);
        setActiveTab('editor');
    };

    return (
        <div className="flex-1 overflow-auto p-2 w-full">
            {recommendedBlocks.map(blockBlocks =>
                blockBlocks.map(block => (
                    <div key={block.id} className="w-full">
                        <BlockPreview
                            block={block}
                            onClick={() => handleBlockClick(block)}
                            showPreview={true}
                            showTime={false}
                        />
                    </div>
                ))
            )}
        </div>
    );
}
