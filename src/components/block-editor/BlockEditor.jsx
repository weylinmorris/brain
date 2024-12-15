'use client'

import React, { useEffect, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { useBlocks, useActiveBlock } from "@/context/block";

import ToolbarPlugin from './ToolbarPlugin';
import {useAutoResizingTextArea} from "@/hooks/blockEditorUtilHooks.js";

const editorConfig = {
    namespace: 'BrainEditor',
    theme: {
        paragraph: 'mb-2',
        heading: {
            h1: 'text-3xl font-bold mb-4',
            h2: 'text-2xl font-bold mb-3',
            h3: 'text-xl font-bold mb-2',
        },
        text: {
            bold: 'font-bold',
            italic: 'italic',
            underline: 'underline',
            strikethrough: 'line-through',
        },
        list: {
            ul: 'mb-2',  // Remove ml-4 since it's handled in globals.css
            ol: 'list-decimal ml-4 mb-2',
            listitem: 'mb-1',
            nested: {
                listitem: 'ml-4'
            },
            checklist: 'flex gap-2 items-start',
        },
        quote: 'border-l-4 border-neutral-500 pl-4 italic text-neutral-300',
    },
    onError: (error) => console.error(error),
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode],
};

const BlockEditor = ({ className }) => {
    const [mounted, setMounted] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const { updateBlock, createBlock, isLoading, isSaving, error } = useBlocks();
    const { activeBlock, activeBlockId } = useActiveBlock();
    const initialContentRef = useRef(null);
    const [title, setTitle] = useState(activeBlock?.title || '');
    const textareaRef = useAutoResizingTextArea(title);

    // Reset editor when active block changes
    useEffect(() => {
        setEditorKey(prev => prev + 1);
        // Store the initial content of the new active block
        initialContentRef.current = activeBlock?.content || null;
        setTitle(activeBlock?.title || '');
    }, [activeBlockId, activeBlock]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSave = async (content) => {
        try {
            // Parse the content to check if it's just an empty paragraph
            const parsedContent = JSON.parse(content);
            const isEmptyContent =
                parsedContent.root.children.length === 0 ||
                (parsedContent.root.children.length === 1 &&
                    parsedContent.root.children[0].children.length === 0 &&
                    parsedContent.root.children[0].type === 'paragraph');

            if (isEmptyContent) {
                return;
            }

            // Check if content has actually changed from the initial state
            if (content === initialContentRef.current && title === activeBlock.title) {
                return;
            }

            if (activeBlockId) {
                // Update existing block only if we have an active block
                await updateBlock({
                    id: activeBlockId,
                    title,
                    content,
                });
                initialContentRef.current = content;
            }
        } catch (error) {
            console.error('Failed to save block:', error);
        }
    };

    if (!mounted) {
        return <div className="p-4 text-neutral-400">Loading editor...</div>;
    }

    if (!activeBlockId) {
        return <div className="p-4 text-neutral-400">No block selected</div>;
    }

    if (isLoading) {
        return <div className="p-4 text-neutral-400">Loading block data...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    // Create editor config with initial state if available
    const currentEditorConfig = {
        ...editorConfig,
        editorState: activeBlock.content || null,
    };

    return (
        <div className="px-4 h-full flex flex-col">
            <textarea
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold mb-4 m-4 bg-transparent border-none outline-none resize-none text-neutral-50"
                placeholder="Untitled"
                rows={1}
                ref={textareaRef}
            />

            <div className={`flex-1 min-h-0 mb-4 border border-neutral-600 rounded-md overflow-hidden ${className || ''}`}>
                <LexicalComposer key={editorKey} initialConfig={currentEditorConfig}>
                    <div className="h-full flex flex-col">
                        <ToolbarPlugin handleSave={handleSave}/>
                        <div className="relative flex-1 min-h-0 overflow-auto bg-neutral-700 prose prose-invert prose-neutral max-w-none">
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable
                                        className="h-full min-h-full outline-none p-4 text-neutral-200 [&_li:has(>ul)]:!list-none [&_ul]:list-disc [&_ul_ul]:list-circle [&_ul_ul_ul]:list-square"
                                    />
                                }
                                placeholder={
                                    <div className="absolute top-4 left-4 text-neutral-500 pointer-events-none">
                                        {"What's on your mind?"}
                                    </div>
                                }
                                onInput={(e) => console.log('Editor HTML:', e.target.innerHTML)}
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <HistoryPlugin/>
                            <AutoFocusPlugin/>
                            <ListPlugin/>
                            <CheckListPlugin/>
                            <TabIndentationPlugin/>
                            {isSaving && (
                                <div className="absolute bottom-2 right-2 text-sm text-neutral-400">
                                    Saving...
                                </div>
                            )}
                        </div>
                    </div>
                </LexicalComposer>
            </div>
        </div>
    );
};

export default BlockEditor;