'use client';

import {useEffect} from "react";
import {useActiveBlock, useBlocks} from "@/context/block/index.js";
import BlockPreview from "@/components/blocks/BlockPreview.jsx";

function Recommended() {
    const {activeBlock, setActiveBlock} = useActiveBlock();
    const {recommendedBlocks, getRecommendedBlocks} = useBlocks();

    useEffect(() => {
        if (!activeBlock) return;

        getRecommendedBlocks(activeBlock.id);
    }, [activeBlock]);

    return (
        <div style={{height: "calc(var(--vh, 1vh) * 100)"}}
             className="p-2 bg-neutral-100 dark:bg-neutral-600 w-96 flex flex-col flex-shrink-0 text-neutral-900 dark:text-neutral-200 overflow-auto">
            <h4 className="m-4">Recommended Notes</h4>

            {
                recommendedBlocks.map(blockBlocks => {
                    return blockBlocks.map(block => (
                        <div key={block.id}>
                            <BlockPreview
                                block={block}
                                onClick={() => setActiveBlock(block.id)}
                                showPreview={true}
                                showTime={false}
                            />
                        </div>
                    ))
                })
            }
        </div>
    );
}

export default Recommended;