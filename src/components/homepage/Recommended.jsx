'use client';

import {useEffect, useState} from "react";
import {useActiveBlock, useBlocks} from "@/context/block/index.js";
import {ChevronUpIcon} from "lucide-react";
import BlockPreview from "@/components/blocks/BlockPreview.jsx";

function Recommended() {
    const { activeBlock, setActiveBlock } = useActiveBlock();
    const { recommendedBlocks, getRecommendedBlocks } = useBlocks();
    const [linkedIsExpanded, setLinkedIsExpanded] = useState(false);
    const [similarIsExpanded, setSimilarIsExpanded] = useState(false);
    const [maybeSimilarIsExpanded, setMaybeSimilarIsExpanded] = useState(false);

    useEffect(() => {
        if (!activeBlock) return;

        getRecommendedBlocks(activeBlock.id);
    }, [activeBlock]);

    useEffect(() => {
        if (recommendedBlocks[0].length > 0) setLinkedIsExpanded(true);

        if (recommendedBlocks[1].length === 0) setSimilarIsExpanded(false);
        if (recommendedBlocks[2].length === 0) setMaybeSimilarIsExpanded(false);
    }, [recommendedBlocks]);

    return (
        <div className="px-2 py-4 bg-neutral-600 w-[40rem] flex flex-col h-screen text-neutral-200">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col max-h-full overflow-y-auto">
                    {/* Linked Notes Section */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => setLinkedIsExpanded(!linkedIsExpanded)}
                            className="flex justify-between items-center hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>Linked ({recommendedBlocks[0].length})</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-200 ${
                                    linkedIsExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 ml-4 overflow-y-auto ${
                            linkedIsExpanded ? 'opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        } transition-all duration-200`}>
                            {recommendedBlocks[0].length > 0 ? (
                                recommendedBlocks[0].map(block => (
                                    <div key={block.id}>
                                        <BlockPreview
                                            block={block}
                                            onClick={() => setActiveBlock(block.id)}
                                            showPreview={true}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-400 italic px-4 py-2">No directly linked notes found</p>
                            )}
                        </div>
                    </div>

                    {/* Similar Notes Section */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => setSimilarIsExpanded(!similarIsExpanded)}
                            className="flex justify-between items-center hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>Similar ({recommendedBlocks[1].length})</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-200 ${
                                    similarIsExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 ml-4 overflow-y-auto ${
                            similarIsExpanded ? 'opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        } transition-all duration-200`}>
                            {recommendedBlocks[1].length > 0 ? (
                                recommendedBlocks[1].map(block => (
                                    <div key={block.id}>
                                        <BlockPreview
                                            block={block}
                                            onClick={() => setActiveBlock(block.id)}
                                            showPreview={true}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-400 italic px-4 py-2">No similar notes found</p>
                            )}
                        </div>
                    </div>

                    {/* Potentially Similar Notes Section */}
                    <div className="flex flex-col">
                        <div
                            onClick={() => setMaybeSimilarIsExpanded(!maybeSimilarIsExpanded)}
                            className="flex justify-between items-center hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>Recommended ({recommendedBlocks[2].length})</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-200 ${
                                    maybeSimilarIsExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 ml-4 overflow-y-auto ${
                            maybeSimilarIsExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        } transition-all duration-200`}>
                            {recommendedBlocks[2].length > 0 ? (
                                recommendedBlocks[2].map(block => (
                                    <div key={block.id}>
                                        <BlockPreview
                                            block={block}
                                            onClick={() => setActiveBlock(block.id)}
                                            showPreview={true}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-400 italic px-4 py-2">No potentially similar notes found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Recommended;