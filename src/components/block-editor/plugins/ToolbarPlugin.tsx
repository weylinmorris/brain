import React, { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
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
import SavePlugin from './SavePlugin';
import { Block } from '../../../types/block';

type TextFormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
type ElementFormatType = 'left' | 'center' | 'right';

const Piclrow = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-pilcrow"
        >
            <path d="M13 4v16" />
            <path d="M17 4v16" />
            <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
        </svg>
    );
};

const ToolbarPlugin = ({
    handleSave,
    saveStatus,
    block,
    className,
}: {
    handleSave: (json: string) => void;
    saveStatus: string;
    block: Block;
    className?: string;
}) => {
    const [editor] = useLexicalComposerContext();
    const [activeStyles, setActiveStyles] = useState(new Set());
    const [, setIsCodeBlock] = useState(false);

    // Format tracking
    editor.registerUpdateListener(({ editorState }) => {
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
    const formatText = (format: TextFormatType) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    // Alignment commands
    const formatAlignment = (alignment: string) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment as ElementFormatType);
    };

    // Heading commands
    const formatHeading = (headingType: string) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (headingType === 'p') {
                    $setBlocksType(selection, () => $createParagraphNode());
                } else {
                    $setBlocksType(selection, () =>
                        $createHeadingNode(headingType as HeadingTagType)
                    );
                }
            }
        });
    };

    // List commands
    const toggleList = (listType: string) => {
        if (listType === 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else if (listType === 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
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
    const undo = () => editor.dispatchCommand(UNDO_COMMAND, undefined);
    const redo = () => editor.dispatchCommand(REDO_COMMAND, undefined);

    // Button component for consistent styling
    const ToolbarButton = ({
        onClick,
        icon: Icon,
        isActive,
        tooltip,
    }: {
        onClick: () => void;
        icon: React.ElementType;
        isActive: boolean;
        tooltip: string;
    }) => (
        <button
            onClick={onClick}
            className={`rounded p-2 text-neutral-800 hover:bg-neutral-200 dark:text-neutral-50 dark:hover:bg-neutral-500 ${isActive ? 'bg-neutral-200 dark:bg-neutral-500' : ''}`}
            title={tooltip}
        >
            <Icon size={18} />
        </button>
    );

    // Divider component
    const Divider = () => <div className="mx-2 h-6 w-px bg-neutral-300 dark:bg-neutral-600" />;

    return (
        <div
            className={`flex flex-wrap items-center gap-1 border-b border-neutral-300 bg-neutral-50 p-2 dark:border-neutral-600 dark:bg-neutral-600 ${className || ''}`}
        >
            {/* History Controls */}
            <div className="flex items-center">
                <ToolbarButton onClick={undo} icon={Undo} tooltip="Undo" isActive={false} />
                <ToolbarButton onClick={redo} icon={Redo} tooltip="Redo" isActive={false} />
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
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => formatAlignment('center')}
                    icon={AlignCenter}
                    tooltip="Align Center"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => formatAlignment('right')}
                    icon={AlignRight}
                    tooltip="Align Right"
                    isActive={false}
                />
            </div>

            <Divider />

            {/* Headings */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => formatHeading('h1')}
                    icon={Heading1}
                    tooltip="Heading 1"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => formatHeading('h2')}
                    icon={Heading2}
                    tooltip="Heading 2"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => formatHeading('h3')}
                    icon={Heading3}
                    tooltip="Heading 3"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => formatHeading('p')}
                    icon={Piclrow}
                    tooltip="Paragraph"
                    isActive={false}
                />
            </div>

            <Divider />

            {/* Lists, Quote, and Code Block */}
            <div className="flex items-center">
                <ToolbarButton
                    onClick={() => toggleList('bullet')}
                    icon={List}
                    tooltip="Bullet List"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={() => toggleList('number')}
                    icon={ListOrdered}
                    tooltip="Numbered List"
                    isActive={false}
                />
                <ToolbarButton
                    onClick={toggleQuote}
                    icon={Quote}
                    tooltip="Quote"
                    isActive={false}
                />
            </div>

            <div className="flex flex-1 justify-end">
                <SavePlugin onSave={handleSave} saveStatus={saveStatus} block={block} />
            </div>
        </div>
    );
};

export default ToolbarPlugin;
