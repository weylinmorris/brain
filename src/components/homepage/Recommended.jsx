'use client';

import {useEffect, useState} from "react";
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
             className="px-2 py-4 bg-neutral-600 w-[40rem] flex flex-col text-neutral-200">
            <h4 className="mx-4 my-2">Recommended Notes</h4>

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