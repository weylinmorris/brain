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
import { useBlock } from "@/hooks/useBlock";
import _ from 'lodash';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import ToolbarPlugin from '@/components/block-editor/plugins/ToolbarPlugin';
import theme from "../../components/block-editor/EditorTheme";
import { EditorConfig, BlockEditorProps, SaveStatus } from '@/types/editor-config';
import { LexicalContent } from '@/types/lexical';

const editorConfig: EditorConfig = {
    namespace: 'BrainEditor',
    theme,
    nodes: [
        HeadingNode,
        QuoteNode,
        ListItemNode,
        ListNode,
        CodeNode,
    ],
    onError: (error: Error) => {
        console.error('Error in LexicalComposer:', error);
    }
};

const EditorContent = ({ handleContentSave }: { handleContentSave: (content: string) => void }) => {
    const [editor] = useLexicalComposerContext();
    
    return (
        <ContentEditable
            className="h-full min-h-full outline-none p-4"
            onBlur={(event) => {
                // Check if the new active element is within the toolbar
                const relatedTarget = event.relatedTarget as HTMLElement;
                const isClickingToolbar = relatedTarget?.closest('.editor-toolbar');
                
                // Only save if we're not clicking the toolbar
                if (!isClickingToolbar) {
                    const editorState = editor.getEditorState();
                    const json = JSON.stringify(editorState);
                    handleContentSave(json);
                }
            }}
        />
    );
};

const BlockEditor: React.FC<BlockEditorProps> = ({ className }) => {
    const [mounted, setMounted] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const { modifyBlock, isLoading, error, blocks, activeBlockId } = useBlock();
    const activeBlock = blocks.find(block => block.id === activeBlockId);
    const initialContentRef = useRef<string | null>(null);
    const [title, setTitle] = useState(activeBlock?.title || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

    // Auto-resize textarea on content change
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [title]);

    // Reset editor when active block id changes
    useEffect(() => {
        setEditorKey(prev => prev + 1);
        initialContentRef.current = activeBlock?.content || null;
        setTitle(activeBlock?.title || '');
    }, [activeBlockId]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const saveBlock = useCallback(async (newTitle: string | null, newContent: string | null) => {
        try {
            if (!activeBlockId || !activeBlock) return;

            // For content, check if it's just an empty paragraph
            if (newContent) {
                const parsedContent = JSON.parse(newContent) as LexicalContent;
                const isEmptyContent =
                    parsedContent.root.children.length === 0 ||
                    (parsedContent.root.children.length === 1 &&
                        parsedContent.root.children[0].children?.length === 0 &&
                        parsedContent.root.children[0].type === 'paragraph');

                if (isEmptyContent) return;
            }

            // Only save if something has changed
            const contentChanged = newContent && newContent !== initialContentRef.current;
            const titleChanged = newTitle !== activeBlock.title;

            if (!contentChanged && !titleChanged) return;

            setSaveStatus('saving');

            await modifyBlock(activeBlockId, {
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
    }, [activeBlockId, activeBlock, title, modifyBlock]);

    // Keep the original debouncedSave as it was
    const debouncedSave = useMemo(
        () => _.debounce(saveBlock, 2000, { leading: false, trailing: true }),
        [saveBlock]
    );

    // Handle title changes
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        debouncedSave(newTitle, null);
    };

    // Handle content changes
    const handleContentSave = async (content: string) => {
        await saveBlock(title, content);
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

    const currentEditorConfig: EditorConfig = {
        ...editorConfig,
        editorState: activeBlock?.content || null,
    };

    return (
        <div className="h-full flex flex-col">
            <textarea
                value={title}
                onChange={handleTitleChange}
                onBlur={() => saveBlock(title, null)}
                className="w-full text-2xl font-bold mb-4 m-4 bg-transparent border-none outline-none resize-none text-neutral-800 dark:text-neutral-50"
                placeholder="Untitled"
                rows={1}
                ref={textareaRef}
            />

            <div className={`flex-1 min-h-0 border border-neutral-300 dark:border-neutral-600 rounded-md overflow-hidden ${className || ''}`}>
                <LexicalComposer key={editorKey} initialConfig={currentEditorConfig}>
                    <div className="h-full flex flex-col">
                        <ToolbarPlugin 
                            handleSave={handleContentSave}
                            saveStatus={saveStatus === 'not-saved' ? 'error' : saveStatus} 
                            block={activeBlock || {
                                id: '',
                                title: '',
                                content: '',
                                type: 'text',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                plainText: '',
                                embeddings: []
                            }} 
                            className="editor-toolbar"
                        />
                        <div className="relative flex-1 min-h-0 overflow-auto max-w-none">
                            <RichTextPlugin
                                contentEditable={
                                    <EditorContent handleContentSave={handleContentSave} />
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