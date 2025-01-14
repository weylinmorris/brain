'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useProject } from '@/hooks/useProject';
import { useSession } from 'next-auth/react';
import { PenLine, ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateUtils';
import { ContextMenu } from '@/components/global/ContextMenu';
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

const EditorContent = ({ onSubmit, onContentChange, editorRef }: { 
    onSubmit: () => void; 
    onContentChange: (content: string) => void;
    editorRef: React.MutableRefObject<{ clear: () => void } | null>;
}) => {
    const [editor] = useLexicalComposerContext();
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        setIsMac(window.navigator.platform.includes('Mac'));

        // Setup content change listener
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const root = $getRoot();
                const content = JSON.stringify(editorState);
                onContentChange(content);
            });
        });
    }, [editor, onContentChange]);

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
    }, [editor]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <ContentEditable
            className="min-h-[100px] w-full resize-none rounded-lg border-0 bg-transparent text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-neutral-400"
            onKeyDown={handleKeyDown}
        />
    );
};

const NoteComposer = () => {
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
            projectId: activeProject?.id || null,
        };

        await addBlock(newBlock);
        setContent('');
        editorRef.current?.clear();
    };

    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    const charCount = content ? JSON.parse(content).root.children[0]?.children[0]?.text?.length || 0 : 0;
    const isOverLimit = charCount > MAX_CHARS;

    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900"
        >
            <LexicalComposer initialConfig={editorConfig}>
                <div className="relative min-h-[100px] text-sm [&_*]:!text-sm [&_.EditorTheme__paragraph]:!text-sm">
                    <RichTextPlugin
                        contentEditable={<EditorContent onSubmit={handleSubmit} onContentChange={handleContentChange} editorRef={editorRef} />}
                        placeholder={
                            <div className="pointer-events-none absolute left-0 top-0 text-sm text-neutral-500 dark:text-neutral-400">
                                What's on your mind?
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
                        <span className={`text-xs ${isOverLimit ? 'text-amber-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
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

interface NoteCardProps {
    block: {
        id: string;
        updatedAt: Date;
        plainText?: string;
        content: string;
    };
}

const NoteCard = ({ block }: NoteCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const { removeBlock } = useBlock();
    const content = block.plainText || JSON.parse(block.content).root.children[0].children[0].text;
    const shouldTruncate = content.length > MAX_CHARS;

    const handleDelete = async () => {
        await removeBlock(block.id);
    };

    const menuItems = [
        {
            label: 'Delete note',
            icon: <Trash2 size={14} />,
            onClick: handleDelete,
            className:
                'flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700',
        },
    ];

    return (
        <article className="group relative rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900">
            <div className="absolute right-2 top-2">
                <ContextMenu items={menuItems} isOpen={showMenu} onOpenChange={setShowMenu} />
            </div>
            <div className="mb-2 text-xs text-neutral-300 dark:text-neutral-400">
                {/* TODO: Add the block project name once implemented */}
                {null || 'No Project'} &#183; {formatRelativeTime(block.updatedAt)}
            </div>
            <div className="prose prose-neutral dark:prose-invert break-words text-sm font-light text-neutral-700 dark:text-neutral-200">
                {shouldTruncate && !isExpanded ? (
                    <>
                        <div>{content.slice(0, MAX_CHARS)}...</div>
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Show more <ChevronDown size={16} />
                        </button>
                    </>
                ) : (
                    <div>
                        {content}
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                                Show less <ChevronUp size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};

const NoteFeed = () => {
    const { blocks, isLoading, error } = useBlock();
    const [sortedBlocks, setSortedBlocks] = useState<typeof blocks>([]);

    useEffect(() => {
        setSortedBlocks(
            [...blocks].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
        );
    }, [blocks]);

    if (isLoading && !sortedBlocks.length) {
        return <div className="text-center text-neutral-500 text-sm">Loading notes...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 text-sm">Error: {error}</div>;
    }

    if (!sortedBlocks.length) {
        return <div className="text-center text-neutral-500 text-sm">No notes yet. Create your first note above!</div>;
    }

    return (
        <div className="space-y-4">
            {sortedBlocks.map((block) => (
                <NoteCard key={block.id} block={block} />
            ))}
        </div>
    );
};

const Main: React.FC = () => {
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);

        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []);

    return (
        <div
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
            className="flex w-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-800"
        >
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-300 hover:scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700 dark:hover:scrollbar-thumb-neutral-600 md:p-6">
                <div className="mx-auto max-w-2xl">
                    <NoteComposer />
                    <NoteFeed />
                </div>
            </div>
        </div>
    );
};

export default Main;
