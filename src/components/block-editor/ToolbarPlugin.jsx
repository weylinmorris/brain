import React, { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND,
} from 'lexical';
import {
    $createHeadingNode,
    $createQuoteNode,
} from '@lexical/rich-text';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
} from 'lexical';
import {
    $setBlocksType
} from '@lexical/selection';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
    Code,
} from 'lucide-react';
import SavePlugin from "@/components/block-editor/SavePlugin.jsx";

const Piclrow = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="lucide lucide-pilcrow">
            <path d="M13 4v16"/>
            <path d="M17 4v16"/>
            <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>
        </svg>
    )
}

const ToolbarPlugin = ({handleSave, saveStatus, block}) => {
    const [editor] = useLexicalComposerContext();
    const [activeStyles, setActiveStyles] = useState(new Set());
    const [, setIsCodeBlock] = useState(false);

    // Format tracking
    editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const styles = new Set();
                if (selection.hasFormat('bold')) styles.add('bold');
                if (selection.hasFormat('italic')) styles.add('italic');
                if (selection.hasFormat('underline')) styles.add('underline');
                if (selection.hasFormat('strikethrough')) styles.add('strikethrough');
                if (selection.hasFormat('code')) styles.add('code');
                setActiveStyles(styles);

                // Check if current selection is in a code block
                const node = selection.anchor.getNode();
                const parentNode = node.getParent();
                setIsCodeBlock(parentNode?.getType?.() === 'code');
            }
        });
    });

    // Basic formatting commands
    const formatText = (format) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    // Alignment commands
    const formatAlignment = (alignment) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    };

    // Heading commands
    const formatHeading = (headingType) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () =>
                    headingType === 'p'
                        ? $createParagraphNode()
                        : $createHeadingNode(headingType)
                );
            }
        });
    };

    // List commands
    const toggleList = (listType) => {
        if (listType === 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
        } else if (listType === 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND);
        }
    };

    // Quote command
    const toggleQuote = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
    };

    // History commands
    const undo = () => editor.dispatchCommand(UNDO_COMMAND);
    const redo = () => editor.dispatchCommand(REDO_COMMAND);

    // Button component for consistent styling
    const ToolbarButton = ({ onClick, icon: Icon, isActive, tooltip }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-50 
                ${isActive ? 'bg-neutral-600' : ''}`}
            title={tooltip}
        >
            <Icon size={18} />
        </button>
    );

    // Divider component
    const Divider = () => (
        <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600 mx-2" />
    );

    return (
        <div className="flex items-center p-2 bg-neutral-50 dark:bg-neutral-600 gap-1 flex-wrap border-b border-neutral-300 dark:border-neutral-600">
            {/* History Controls */}
            <div className="flex items-center">
                <ToolbarButton onClick={undo} icon={Undo} tooltip="Undo" />
                <ToolbarButton onClick={redo} icon={Redo} tooltip="Redo" />
            </div>

            <Divider />

            {/* Text Formatting */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => formatText('bold')}
                    icon={Bold}
                    isActive={activeStyles.has('bold')}
                    tooltip="Bold"
                />
                <ToolbarButton
                    onClick={() => formatText('italic')}
                    icon={Italic}
                    isActive={activeStyles.has('italic')}
                    tooltip="Italic"
                />
                <ToolbarButton
                    onClick={() => formatText('underline')}
                    icon={Underline}
                    isActive={activeStyles.has('underline')}
                    tooltip="Underline"
                />
                <ToolbarButton
                    onClick={() => formatText('strikethrough')}
                    icon={Strikethrough}
                    isActive={activeStyles.has('strikethrough')}
                    tooltip="Strikethrough"
                />
                <ToolbarButton
                    onClick={() => formatText('code')}
                    icon={Code}
                    isActive={activeStyles.has('code')}
                    tooltip="Inline Code"
                />
            </div>

            <Divider />

            {/* Alignment */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => formatAlignment('left')}
                    icon={AlignLeft}
                    tooltip="Align Left"
                />
                <ToolbarButton
                    onClick={() => formatAlignment('center')}
                    icon={AlignCenter}
                    tooltip="Align Center"
                />
                <ToolbarButton
                    onClick={() => formatAlignment('right')}
                    icon={AlignRight}
                    tooltip="Align Right"
                />
            </div>

            <Divider />

            {/* Headings */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => formatHeading('h1')}
                    icon={Heading1}
                    tooltip="Heading 1"
                />
                <ToolbarButton
                    onClick={() => formatHeading('h2')}
                    icon={Heading2}
                    tooltip="Heading 2"
                />
                <ToolbarButton
                    onClick={() => formatHeading('h3')}
                    icon={Heading3}
                    tooltip="Heading 3"
                />
                <ToolbarButton
                    onClick={() => formatHeading('p')}
                    icon={Piclrow}
                    tooltip="Paragraph"
                />
            </div>

            <Divider/>

            {/* Lists, Quote, and Code Block */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => toggleList('bullet')}
                    icon={List}
                    tooltip="Bullet List"
                />
                <ToolbarButton
                    onClick={() => toggleList('number')}
                    icon={ListOrdered}
                    tooltip="Numbered List"
                />
                <ToolbarButton
                    onClick={toggleQuote}
                    icon={Quote}
                    tooltip="Quote"
                />
            </div>

            <div className="flex-1 flex justify-end">
                <SavePlugin onSave={handleSave} saveStatus={saveStatus} block={block} />
            </div>
        </div>
    );
};

export default ToolbarPlugin;