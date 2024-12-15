export const findBlockById = (blocks, id) =>
    blocks.find(b => b.id === id);

export const findChildBlocks = (blocks, parentId) =>
    blocks.filter(b => b.parentId === parentId);

export const getSiblingBlocks = (blocks, parentId) =>
    blocks.filter(b => b.parentId === parentId);

const getDocumentOrderBlocks = (blocks) => {
    const result = [];
    const topLevelBlocks = blocks.filter(b =>
        !b.parentId || !blocks.some(potential => potential.id === b.parentId)
    );

    const traverseBlocks = (block) => {
        result.push(block);
        const children = blocks
            .filter(b => b.parentId === block.id)
            .sort((a, b) => {
                if (a.order?.low !== b.order?.low) {
                    return (a.order?.low || 0) - (b.order?.low || 0);
                }
                return 0;
            });

        children.forEach(child => traverseBlocks(child));
    };

    topLevelBlocks
        .sort((a, b) => {
            if (a.order?.low !== b.order?.low) {
                return (a.order?.low || 0) - (b.order?.low || 0);
            }
            return 0;
        })
        .forEach(block => traverseBlocks(block));

    return result;
};

export const findAdjacentBlock = (blocks, currentId, direction) => {
    const orderedBlocks = getDocumentOrderBlocks(blocks);
    const currentIndex = orderedBlocks.findIndex(b => b.id === currentId);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < orderedBlocks.length) {
        return orderedBlocks[nextIndex];
    }

    return null;
};

export const createKeyHandlers = ({
                                      block,
                                      blocks,
                                      updateBlock,
                                      updateBlockImmediately,
                                      onCreateBlock,
                                      onDeleteBlock,
                                      maintainFocus,
                                      cursorPositionRef,
                                      previousSiblingId
                                  }) => {
    const handleEnterKey = async (e, cursorPosition) => {
        if (e.shiftKey) {
            const newContent = block.content.slice(0, cursorPosition) + '\n' + block.content.slice(cursorPosition);
            await updateBlock({ content: newContent });

            setTimeout(() => {
                const textarea = document.querySelector(`[data-block-id="${block.id}"]`);
                if (textarea) {
                    textarea.selectionStart = cursorPosition + 1;
                    textarea.selectionEnd = cursorPosition + 1;
                }
            }, 0);
        } else {
            e.preventDefault();
            const contentBeforeCursor = block.content.slice(0, cursorPosition);
            const contentAfterCursor = block.content.slice(cursorPosition);

            await updateBlockImmediately({ content: contentBeforeCursor });

            const newBlock = await onCreateBlock({
                content: contentAfterCursor,
                parentId: block.parentId,
                type: 'text'
            });

            setTimeout(() => {
                const newTextarea = document.querySelector(
                    `[data-block-id="${newBlock.id}"]`
                );
                if (newTextarea) {
                    newTextarea.focus();
                    newTextarea.selectionStart = 0;
                    newTextarea.selectionEnd = 0;
                }
            }, 0);
        }
    };

    const handleTabKey = async (e, cursorPosition) => {
        e.preventDefault();
        cursorPositionRef.current = cursorPosition;

        if (e.shiftKey) {
            const parentBlock = findBlockById(blocks, block.parentId);
            if (parentBlock) {
                const updatedBlock = { ...block, parentId: parentBlock.parentId };
                await updateBlockImmediately(updatedBlock);
                maintainFocus(block.id);
            }
        } else {
            if (previousSiblingId) {
                const updatedBlock = { ...block, parentId: previousSiblingId };
                await updateBlockImmediately(updatedBlock);
                maintainFocus(block.id);
            }
        }
    };

    const handleBackspaceKey = async (e, cursorPosition) => {
        if (block.content.length > 0) {
            return;
        }

        const siblingBlocks = getSiblingBlocks(blocks, block.parentId);
        const isFirstBlock = siblingBlocks[0]?.id === block.id;
        if (isFirstBlock && block.parentId === null) {
            return;
        }

        const hasChildren = findChildBlocks(blocks, block.id).length > 0;
        if (hasChildren) {
            return;
        }

        e.preventDefault();
        await onDeleteBlock(block.id);

        const siblings = getSiblingBlocks(blocks, block.parentId);
        const currentIndex = siblings.findIndex(b => b.id === block.id);
        const previousBlock = currentIndex > 0 ? siblings[currentIndex - 1] : findBlockById(blocks, block.parentId);

        if (previousBlock) {
            setTimeout(() => {
                const prevTextarea = document.querySelector(`[data-block-id="${previousBlock.id}"]`);
                if (prevTextarea) {
                    prevTextarea.focus();
                    const length = prevTextarea.value.length;
                    prevTextarea.selectionStart = length;
                    prevTextarea.selectionEnd = length;
                }
            }, 0);
        }
    };

    const handleArrowKeys = (e) => {
        switch (e.key) {
            case 'ArrowUp': {
                const prevBlock = findAdjacentBlock(blocks, block.id, -1);
                if (prevBlock) {
                    e.preventDefault();
                    const prevTextarea = document.querySelector(`[data-block-id="${prevBlock.id}"]`);
                    if (prevTextarea) {
                        prevTextarea.focus();
                        const length = prevTextarea.value.length;
                        prevTextarea.setSelectionRange(length, length);
                    }
                }
                break;
            }

            case 'ArrowDown': {
                const nextBlock = findAdjacentBlock(blocks, block.id, 1);
                if (nextBlock) {
                    e.preventDefault();
                    const nextTextarea = document.querySelector(`[data-block-id="${nextBlock.id}"]`);
                    if (nextTextarea) {
                        nextTextarea.focus();
                        nextTextarea.setSelectionRange(0, 0);
                    }
                }
                break;
            }
        }
    };

    return {
        handleEnterKey,
        handleTabKey,
        handleBackspaceKey,
        handleArrowKeys
    };
};