'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useProject } from '@/hooks/useProject';
import { useSession } from 'next-auth/react';
import { PenLine } from 'lucide-react';
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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { COMMAND_PRIORITY_NORMAL, KEY_ENTER_COMMAND } from 'lexical';
import baseTheme from '@/components/block-editor/EditorTheme';

const MAX_CHARS = 400;

// Create a custom theme that extends the base theme but with smaller text
const theme = {
    ...baseTheme,
    root: 'text-sm',
    paragraph: baseTheme.paragraph + ' !text-sm',
    text: {
        ...baseTheme.text,
        base: baseTheme.text?.base + ' !text-sm',
    },
    ltr: baseTheme.ltr + ' !text-sm',
    rtl: baseTheme.rtl + ' !text-sm',
};

const editorConfig = {
    namespace: 'NoteComposer',
    theme,
    nodes: [HeadingNode, QuoteNode, ListItemNode, ListNode, CodeNode],
    onError: (error: Error) => {
        console.error('Error in NoteComposer:', error);
    },
};

const EditorContent = ({
    onSubmit,
    onContentChange,
    editorRef,
}: {
    onSubmit: () => void;
    onContentChange: (content: string) => void;
    editorRef: React.MutableRefObject<{ clear: () => void } | null>;
}) => {
    const [editor] = useLexicalComposerContext();
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(window.navigator.platform.includes('Mac'));

        // Register command for cmd+enter
        const removeKeyDownListener = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                if (event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    onSubmit();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_NORMAL
        );

        // Setup content change listener
        const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const root = $getRoot();
                const content = JSON.stringify(editorState);
                onContentChange(content);
            });
        });

        return () => {
            removeKeyDownListener();
            removeUpdateListener();
        };
    }, [editor, onContentChange, onSubmit]);

    // Expose clear method through ref
    useEffect(() => {
        editorRef.current = {
            clear: () => {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                });
            },
        };
    }, [editor, editorRef]);

    return (
        <ContentEditable className="min-h-[100px] w-full resize-none rounded-lg border-0 bg-transparent text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-neutral-400" />
    );
};

export const NoteComposer = () => {
    const [content, setContent] = useState('');
    const { addBlock } = useBlock();
    const { activeProject } = useProject();
    const { data: session } = useSession();
    const [isMac, setIsMac] = useState(false);
    const editorRef = useRef<{ clear: () => void } | null>(null);

    useEffect(() => {
        setIsMac(window.navigator.platform.includes('Mac'));
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || !session?.user?.id) return;

        const newBlock = {
            title: 'Untitled',
            content: content,
            type: 'text' as const,
            userId: session.user.id,
            projectId: activeProject?.id || undefined,
        };

        await addBlock(newBlock);
        setContent('');
        editorRef.current?.clear();
    };

    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    const charCount = content
        ? JSON.parse(content).root.children[0]?.children[0]?.text?.length || 0
        : 0;
    const isOverLimit = charCount > MAX_CHARS;

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900"
        >
            <LexicalComposer initialConfig={editorConfig}>
                <div className="relative min-h-[100px] text-sm [&_*]:!text-sm [&_.EditorTheme__paragraph]:!text-sm">
                    <RichTextPlugin
                        contentEditable={
                            <EditorContent
                                onSubmit={handleSubmit}
                                onContentChange={handleContentChange}
                                editorRef={editorRef}
                            />
                        }
                        placeholder={
                            <div className="pointer-events-none absolute left-0 top-0 text-sm text-neutral-500 dark:text-neutral-400">
                                What&apos;s on your mind?
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <CheckListPlugin />
                    <AutoFocusPlugin />
                    <TabIndentationPlugin />
                </div>
            </LexicalComposer>
            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        Press {isMac ? '⌘' : 'Ctrl'} + Enter to save
                    </span>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xs ${isOverLimit ? 'text-amber-500' : 'text-neutral-500 dark:text-neutral-400'}`}
                        >
                            {charCount}/{MAX_CHARS}
                        </span>
                        {isOverLimit && (
                            <span className="text-xs text-amber-500">
                                Shorter notes work better with AI features and app layout
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
                >
                    <PenLine size={14} />
                    <span>Save</span>
                </button>
            </div>
        </form>
    );
};
