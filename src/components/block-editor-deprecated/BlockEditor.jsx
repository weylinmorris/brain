import BlockTextArea from "@/components/block-editor/BlockTextArea.jsx";
import { useActiveBlock, useBlocks } from "@/context/BlockContext";
import { useEffect, useState } from "react";
import { useAutoResizingTextArea } from "@/hooks/blockEditorUtilHooks.js";

const BlockEditor = () => {
    const { activePage, activeBlockTree, setActiveBlock } = useActiveBlock();
    const { pages, updateBlock, updateBlockImmediately, createBlock, deleteBlock, isLoading } = useBlocks();
    const textareaRef = useAutoResizingTextArea(activePage?.title);

    // Add shared cursor position state
    const [cursorXPosition, setCursorXPosition] = useState(0);

    useEffect(() => {
        const initializePageBlock = async () => {
            if (!activePage) return;
            if (activeBlockTree && activeBlockTree.length > 0) return;

            try {
                await createBlock({
                    content: '',
                    parentId: activePage.id,
                    type: 'text'
                });
                await setActiveBlock(activePage.id);
            } catch (error) {
                console.error('Failed to initialize block:', error);
            }
        };

        initializePageBlock();
    }, [activePage?.id]);

    useEffect(() => {
        if (!activePage) {
            setActiveBlock(pages[0]?.id);
        }
    }, [pages]);

    const handleTitleChange = (e) => {
        updateBlock({
            ...activePage,
            title: e.target.value
        });
    };

    const handleBlocksChange = async (updatedBlocks) => {
        for (const block of updatedBlocks) {
            await updateBlock(block);
        }
        await setActiveBlock(activePage.id);
    };

    const handleBlocksChangeImmediately = async (updatedBlocks) => {
        for (const block of updatedBlocks) {
            await updateBlockImmediately(block);
        }
        await setActiveBlock(activePage.id);
    };

    const handleCreateBlock = async (blockData) => {
        const newBlock = await createBlock(blockData);
        await setActiveBlock(activePage.id);
        return newBlock;
    };

    const handleDeleteBlock = async (id) => {
        await deleteBlock(id);
        await setActiveBlock(activePage.id);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8 text-neutral-400">
                Loading...
            </div>
        );
    }

    if (!activePage) {
        return (
            <div className="flex justify-center items-center p-8 text-neutral-400">
                Select a page to edit
            </div>
        );
    }

    const topLevelBlocks = activeBlockTree.filter(block => block.parentId === activePage.id);

    return (
        <div className="p-4">
            <textarea
                type="text"
                value={activePage.title || ''}
                onChange={handleTitleChange}
                className="w-full text-2xl font-bold mb-4 bg-transparent border-none outline-none resize-none"
                placeholder="Untitled"
                rows={1}
                ref={textareaRef}
            />
            <div>
                {topLevelBlocks.map((block, index) => (
                    <BlockTextArea
                        key={block.id}
                        block={block}
                        blocks={activeBlockTree}
                        setBlocks={handleBlocksChange}
                        setBlocksImmediately={handleBlocksChangeImmediately}
                        deleteBlock={handleDeleteBlock}
                        previousSiblingId={index > 0 ? topLevelBlocks[index - 1].id : null}
                        onCreateBlock={handleCreateBlock}
                        onDeleteBlock={handleDeleteBlock}
                        cursorXPosition={cursorXPosition}
                        onCursorXPositionChange={setCursorXPosition}
                    />
                ))}
            </div>
        </div>
    );
};

export default BlockEditor;