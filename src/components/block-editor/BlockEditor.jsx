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
import { CodeNode } from '@lexical/code';
import { useBlocks, useActiveBlock } from "@/context/block";
import _ from 'lodash';

import ToolbarPlugin from '@/components/block-editor/plugins/ToolbarPlugin';
import {useAutoResizingTextArea} from "@/hooks/blockEditorUtilHooks.js";
import theme from "@/components/block-editor/EditorTheme.js";

const editorConfig = {
    namespace: 'BrainEditor',
    theme,
    nodes: [
        HeadingNode,
        QuoteNode,
        ListItemNode,
        ListNode,
        CodeNode,
    ],
    onError: (error) => {
        console.error('Error in LexicalComposer:', error);
    }
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

    // Reset editor when active block id changes
    useEffect(() => {
        setEditorKey(prev => prev + 1);
        initialContentRef.current = activeBlock?.content || null;
        setTitle(activeBlock?.title || '');
    }, [activeBlockId]);

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
        <div className="h-full flex flex-col">
            <textarea
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="w-full text-2xl font-bold mb-4 m-4 bg-transparent border-none outline-none resize-none text-neutral-800 dark:text-neutral-50"
                placeholder="Untitled"
                rows={1}
                ref={textareaRef}
            />

            <div className={`flex-1 min-h-0 border border-neutral-300 dark:border-neutral-600 rounded-md overflow-hidden ${className || ''}`}>
                <LexicalComposer key={editorKey} initialConfig={currentEditorConfig}>
                    <div className="h-full flex flex-col">
                        <ToolbarPlugin handleSave={handleContentSave} saveStatus={saveStatus} block={activeBlock} />
                        <div className="relative flex-1 min-h-0 overflow-auto max-w-none">
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable
                                        className="h-full min-h-full outline-none p-4"
                                    />
                                }
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <AutoFocusPlugin />
                            <CheckListPlugin />
                            <HistoryPlugin />
                            <ListPlugin />
                            <TabIndentationPlugin />
                        </div>
                    </div>
                </LexicalComposer>
            </div>
        </div>
    );
};

export default BlockEditor;