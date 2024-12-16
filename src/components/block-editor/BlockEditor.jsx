'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { useBlocks, useActiveBlock } from "@/context/block";
import _ from 'lodash';

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
            code: 'bg-neutral-200 dark:bg-neutral-700 rounded px-1.5 py-0.5 font-mono text-sm',
        },
        list: {
            ul: 'mb-2',
            ol: 'list-decimal ml-4 mb-2',
            listitem: 'mb-1',
            nested: {
                listitem: 'ml-4'
            },
            checklist: 'flex gap-2 items-start',
        },
        quote: 'border-l-4 border-neutral-500 pl-4 italic text-neutral-300',
    },
    nodes: [
        HeadingNode,
        QuoteNode,
        ListItemNode,
        ListNode,
        CodeNode,
        CodeHighlightNode,
    ],
};

const BlockEditor = ({ className }) => {
    const [mounted, setMounted] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const { updateBlock, isLoading, error } = useBlocks();
    const { activeBlock, activeBlockId } = useActiveBlock();
    const initialContentRef = useRef(null);
    const [title, setTitle] = useState(activeBlock?.title || '');
    const textareaRef = useAutoResizingTextArea(title);
    const [saveStatus, setSaveStatus] = useState('saved');

    // Reset editor when active block changes
    useEffect(() => {
        setEditorKey(prev => prev + 1);
        initialContentRef.current = activeBlock?.content || null;
        setTitle(activeBlock?.title || '');
    }, [activeBlockId, activeBlock]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const saveBlock = useCallback(async (newTitle, newContent) => {
        try {
            if (!activeBlockId) return;

            // For content, check if it's just an empty paragraph
            if (newContent) {
                const parsedContent = JSON.parse(newContent);
                const isEmptyContent =
                    parsedContent.root.children.length === 0 ||
                    (parsedContent.root.children.length === 1 &&
                        parsedContent.root.children[0].children.length === 0 &&
                        parsedContent.root.children[0].type === 'paragraph');

                if (isEmptyContent) return;
            }

            // Only save if something has changed
            const contentChanged = newContent && newContent !== initialContentRef.current;
            const titleChanged = newTitle !== activeBlock.title;

            if (!contentChanged && !titleChanged) return;

            setSaveStatus('saving');

            await updateBlock({
                id: activeBlockId,
                title: newTitle || title,
                content: newContent || activeBlock.content,
            });

            if (newContent) {
                initialContentRef.current = newContent;
            }

            setSaveStatus('saved');
        } catch (error) {
            console.error('Failed to save block:', error);
            setSaveStatus('not-saved');
        }
    }, [activeBlockId, activeBlock, title, updateBlock]);

    // Keep the original debouncedSave as it was
    const debouncedSave = useMemo(
        () => _.debounce(saveBlock, 2000, { leading: false, trailing: true }),
        [saveBlock]
    );

    // Handle title changes
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        debouncedSave(newTitle, null);
    };

    // Handle content changes
    const handleContentSave = async (content) => {
        debouncedSave(title, content);
    };

    // Clean up debounced save on unmount or block change
    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    if (!mounted) return <div className="p-12 font-bold text-center text-neutral-500 dark:text-neutral-400">Loading editor...</div>;
    if (!activeBlockId) return <div className="p-12 font-bold text-center text-neutral-500 dark:text-neutral-400">No note selected</div>;
    if (isLoading) return <div className="p-12 font-bold text-center text-neutral-500 dark:text-neutral-400">Loading note...</div>;
    if (error) return <div className="p-12 font-bold text-center text-red-500">Error: {error}</div>;

    const currentEditorConfig = {
        ...editorConfig,
        editorState: activeBlock.content || null,
    };

    return (
        <div className="px-4 h-full flex flex-col">
            <textarea
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="w-full text-2xl font-bold mb-4 m-4 bg-transparent border-none outline-none resize-none text-neutral-800 dark:text-neutral-50"
                placeholder="Untitled"
                rows={1}
                ref={textareaRef}
            />

            <div className={`flex-1 min-h-0 mb-4 border border-neutral-300 dark:border-neutral-600 rounded-md overflow-hidden ${className || ''}`}>
                <LexicalComposer initialConfig={currentEditorConfig}>
                    <div className="h-full flex flex-col">
                        <ToolbarPlugin handleSave={handleContentSave} saveStatus={saveStatus} block={activeBlock} />
                        <div className="relative flex-1 min-h-0 overflow-auto bg-neutral-50 dark:bg-neutral-700 max-w-none prose dark:prose-invert">
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable
                                        className="h-full min-h-full outline-none p-4 text-neutral-950 dark:text-neutral-100 [&_li:has(>ul)]:!list-none [&_ul]:list-disc [&_ul_ul]:list-circle [&_ul_ul_ul]:list-square"
                                    />
                                }
                                placeholder={
                                    <div className="absolute top-4 left-4 text-neutral-600 dark:text-neutral-500 pointer-events-none">
                                        {"What's on your mind?"}
                                    </div>
                                }
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <HistoryPlugin />
                            <AutoFocusPlugin />
                            <ListPlugin />
                            <CheckListPlugin />
                            <TabIndentationPlugin />
                        </div>
                    </div>
                </LexicalComposer>
            </div>
        </div>
    );
};

export default BlockEditor;