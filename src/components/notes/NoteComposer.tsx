'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useProject } from '@/hooks/useProject';
import { useSession } from 'next-auth/react';
import { PenLine, Loader2 } from 'lucide-react';
import { NoteEditor } from '@/components/block-editor/NoteEditor';
import { LexicalEditor, $getRoot } from 'lexical';

const MAX_CHARS = 400;

export const NoteComposer = () => {
    const [content, setContent] = useState('');
    const [editor, setEditor] = useState<LexicalEditor | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addBlock } = useBlock();
    const { activeProject } = useProject();
    const { data: session } = useSession();
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(window.navigator.platform.includes('Mac'));
    }, []);

    const clearEditor = useCallback(() => {
        if (editor) {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
            });
        }
    }, [editor]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || !session?.user?.id || isSaving) return;

        try {
            setIsSaving(true);
            const newBlock = {
                title: 'Untitled',
                content: content,
                type: 'text' as const,
                userId: session.user.id,
                projectId: activeProject?.id || undefined,
            };

            await addBlock(newBlock);
            clearEditor();
            setContent('');
        } finally {
            setIsSaving(false);
        }
    };

    const charCount = content
        ? JSON.parse(content).root.children[0]?.children[0]?.text?.length || 0
        : 0;
    const isOverLimit = charCount > MAX_CHARS;

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900"
        >
            <NoteEditor
                content={content}
                onChange={setContent}
                onSubmit={handleSubmit}
                autoFocus
                onEditorReady={setEditor}
                placeholder={
                    <div className="pointer-events-none absolute left-0 top-0 text-sm text-neutral-500 dark:text-neutral-400">
                        What&apos;s on your mind?
                    </div>
                }
                className="min-h-[100px] w-full resize-none rounded-lg border-0 bg-transparent text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-neutral-400"
            />
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
                    disabled={!content.trim() || isSaving}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-700 dark:hover:bg-primary-600"
                >
                    {isSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <PenLine size={14} />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
            </div>
        </form>
    );
};
