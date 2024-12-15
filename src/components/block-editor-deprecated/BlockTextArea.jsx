import { useAutoResizingTextArea, useMaintainFocus } from "@/hooks/blockEditorUtilHooks.js";
import {
    findChildBlocks,
    createKeyHandlers
} from "@/utils/blockEditorUtils.js";

const BlockBullet = () => (
    <div className="w-2 h-2 mt-1.5 bg-neutral-500 rounded-full mr-2"/>
);

const BlockTextArea = ({
                           block,
                           blocks,
                           setBlocks,
                           setBlocksImmediately,
                           deleteBlock,
                           previousSiblingId,
                           onCreateBlock,
                           onDeleteBlock,
                       }) => {
    const textareaRef = useAutoResizingTextArea(block.content);
    const { cursorPositionRef, maintainFocus } = useMaintainFocus();

    const updateBlock = async (updates) => {
        const updatedBlock = { ...block, ...updates };
        await setBlocks([updatedBlock]);
    };

    const updateBlockImmediately = async (updates) => {
        const updatedBlock = { ...block, ...updates };
        await setBlocksImmediately([updatedBlock]);
    };

    const handleChange = (e) => {
        updateBlock({ content: e.target.value });
    };

    const handleBlur = (e) => {
        updateBlockImmediately({ content: e.target.value });
    };

    const {
        handleEnterKey,
        handleTabKey,
        handleBackspaceKey,
        handleArrowKeys
    } = createKeyHandlers({
        block,
        blocks,
        updateBlock,
        updateBlockImmediately,
        onCreateBlock,
        onDeleteBlock,
        maintainFocus,
        cursorPositionRef,
        previousSiblingId
    });

    const handleKeyDown = (e) => {
        const textarea = e.target;
        const cursorPosition = textarea.selectionStart;

        switch (e.key) {
            case 'Enter':
                handleEnterKey(e, cursorPosition);
                break;
            case 'Tab':
                handleTabKey(e, cursorPosition);
                break;
            case 'Backspace':
                handleBackspaceKey(e, cursorPosition);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                handleArrowKeys(e);
                break;
        }
    };

    // Get child blocks
    const childBlocks = findChildBlocks(blocks, block.id);

    return (
        <div className="pl-4 flex w-full">
            <BlockBullet/>
            <div className="flex-1 p-0 m-0">
                <textarea
                    data-block-id={block.id}
                    className="bg-neutral-800 resize-none w-full m-0 focus:outline-none"
                    wrap="hard"
                    value={block.content}
                    ref={textareaRef}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    rows={1}
                />

                {childBlocks.map((childBlock, index) => (
                    <BlockTextArea
                        key={childBlock.id}
                        block={childBlock}
                        blocks={blocks}
                        setBlocks={setBlocks}
                        setBlocksImmediately={setBlocksImmediately}
                        deleteBlock={deleteBlock}
                        onCreateBlock={onCreateBlock}
                        onDeleteBlock={onDeleteBlock}
                        previousSiblingId={index > 0 ? childBlocks[index - 1].id : null}
                    />
                ))}
            </div>
        </div>
    );
};

export default BlockTextArea;