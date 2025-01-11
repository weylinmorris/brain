'use client';

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
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { useBlock } from '@/hooks/useBlock';
import _ from 'lodash';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import ToolbarPlugin from '@/components/block-editor/plugins/ToolbarPlugin';
import BlockReader from '@/components/block-editor/BlockReader';
import theme from '../../components/block-editor/EditorTheme';
import { EditorConfig, BlockEditorProps, SaveStatus } from '@/types/editor-config';
import { LexicalContent } from '@/types/lexical';

const editorConfig: EditorConfig = {
    namespace: 'BrainEditor',
    theme,
    nodes: [HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode],
    onError: (error: Error) => {
        console.error('Error in LexicalComposer:', error);
    },
};

const EditorContent = ({ handleContentSave }: { handleContentSave: (content: string) => void }) => {
    const [editor] = useLexicalComposerContext();

    // Create a debounced save function
    const debouncedHandleSave = useMemo(
        () =>
            _.debounce(
                (content: string) => {
                    handleContentSave(content);
                },
                3000,
                { leading: false, trailing: true }
            ),
        [handleContentSave]
    );

    // Setup save on update
    useEffect(() => {
        const removeListener = editor.registerUpdateListener(
            ({ editorState, dirtyElements, dirtyLeaves }) => {
                // Only save if there are actual changes
                if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
                    const json = JSON.stringify(editorState);
                    debouncedHandleSave(json);
                }
            }
        );

        // Cleanup
        return () => {
            debouncedHandleSave.cancel();
            removeListener();
        };
    }, [editor, debouncedHandleSave]);

    return (
        <ContentEditable
            className="h-full min-h-full p-4 outline-none"
            onBlur={(event) => {
                // Check if the new active element is within the toolbar
                const relatedTarget = event.relatedTarget as HTMLElement;
                const isClickingToolbar = relatedTarget?.closest('.editor-toolbar');

                // Only save if we're not clicking the toolbar
                if (!isClickingToolbar) {
                    debouncedHandleSave.flush(); // Flush any pending saves
                    const editorState = editor.getEditorState();
                    const json = JSON.stringify(editorState);
                    handleContentSave(json); // Immediate save on blur
                }
            }}
        />
    );
};

const BlockEditor: React.FC<BlockEditorProps> = ({ className }) => {
    const [mounted, setMounted] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const { modifyBlock, isLoading, error, blocks, activeBlockId } = useBlock();
    const activeBlock = blocks.find((block) => block.id === activeBlockId);
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

    // Handle block and content updates
    useEffect(() => {
        console.log('Block or content update - activeBlockId:', activeBlockId);

        if (!activeBlock) return;

        // Reset editor only when switching blocks
        if (activeBlockId !== activeBlock.id) {
            console.log('Switching blocks - resetting editor');
            setEditorKey((prev) => prev + 1);
        }

        // Update content and title
        initialContentRef.current = activeBlock.content || null;
        setTitle(activeBlock.title || '');
    }, [activeBlockId, activeBlock]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const saveBlock = useCallback(
        async (newTitle: string | null, newContent: string | null) => {
            console.log(
                'Save triggered - Title:',
                newTitle?.slice(0, 20),
                'Content length:',
                newContent?.length
            );
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
        },
        [activeBlockId, activeBlock, title, modifyBlock]
    );

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

    if (!mounted)
        return (
            <div className="p-12 text-center font-bold text-neutral-500 dark:text-neutral-400">
                Loading editor...
            </div>
        );
    if (!activeBlockId)
        return (
            <div className="p-12 text-center font-bold text-neutral-500 dark:text-neutral-400">
                No note selected
            </div>
        );
    if (error) return <div className="p-12 text-center font-bold text-red-500">Error: {error}</div>;

    const currentEditorConfig: EditorConfig = {
        ...editorConfig,
        editorState: activeBlock?.content || null,
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between m-4 mb-2">
                <textarea
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={() => saveBlock(title, null)}
                    className="flex-1 resize-none border-none bg-transparent text-2xl font-bold text-neutral-800 outline-none dark:text-neutral-50"
                    placeholder="Untitled"
                    rows={1}
                    ref={textareaRef}
                    readOnly={!isEditMode}
                />
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="ml-2 text-sm rounded-md p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                    {isEditMode ? 'View' : 'Edit'}
                </button>
            </div>

            <div
                className={`min-h-0 flex-1 overflow-hidden rounded-md ${isEditMode ? 'border border-neutral-300 dark:border-neutral-600' : ''} ${className || ''}`}
            >
                {isEditMode ? (
                    <LexicalComposer key={editorKey} initialConfig={currentEditorConfig}>
                        <div className="flex h-full flex-col">
                            <ToolbarPlugin
                                handleSave={handleContentSave}
                                saveStatus={saveStatus === 'not-saved' ? 'error' : saveStatus}
                                block={
                                    activeBlock || {
                                        id: '',
                                        title: '',
                                        content: '',
                                        type: 'text',
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                        plainText: '',
                                        embeddings: [],
                                    }
                                }
                                className="editor-toolbar"
                            />
                            <div className="relative min-h-0 max-w-none flex-1 overflow-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-2">
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
                ) : (
                    <div className="h-full overflow-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-2">
                        <BlockReader content={activeBlock?.content || null} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockEditor;