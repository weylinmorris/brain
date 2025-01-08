import {useActiveBlock, useBlocks} from "@/context/block/index.js";
import {useEffect} from "react";
import BlockPreview from "@/components/blocks/BlockPreview.jsx";

export default function RecommendedNotes() {
    const { activeBlock, setActiveBlock } = useActiveBlock();
    const { recommendedBlocks, getRecommendedBlocks } = useBlocks();

    useEffect(() => {
        if (!activeBlock) return;
        getRecommendedBlocks(activeBlock.id);
    }, [activeBlock]);

    return (
        <div className="flex-1 overflow-auto p-2">
            {recommendedBlocks.map(blockBlocks =>
                blockBlocks.map(block => (
                    <div key={block.id}>
                        <BlockPreview
                            block={block}
                            onClick={() => setActiveBlock(block.id)}
                            showPreview={true}
                            showTime={false}
                        />
                    </div>
                ))
            )}
        </div>
    );
}
