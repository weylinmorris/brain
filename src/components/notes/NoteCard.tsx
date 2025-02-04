'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, FolderInput } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateUtils';
import { ContextMenu } from '@/components/global/ContextMenu';
import { useBlock } from '@/hooks/useBlock';
import { useProject } from '@/hooks/useProject';
import { NoteEditor } from '@/components/block-editor/NoteEditor';

const COLLAPSED_HEIGHT = 160; // in pixels

interface NoteCardProps {
    block: {
        id: string;
        updatedAt: Date;
        plainText?: string;
        content: string;
        projectId?: string;
    };
    isActive?: boolean;
}

export const NoteCard = ({ block, isActive }: NoteCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [contentHeight, setContentHeight] = useState<number>(COLLAPSED_HEIGHT);
    const contentRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLElement>(null);
    const { removeBlock, modifyBlock } = useBlock();
    const { projects } = useProject();

    // Scroll into view and expand when active
    useEffect(() => {
        if (isActive && cardRef.current) {
            setIsExpanded(true);
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isActive]);

    useEffect(() => {
        if (contentRef.current) {
            const height = contentRef.current.scrollHeight;
            setContentHeight(height);
            setShouldShowExpand(height > COLLAPSED_HEIGHT);
        }
    }, [block.content]);

    const handleDelete = async () => {
        await removeBlock(block.id);
    };

    const handleMoveToProject = async (projectId: string | undefined) => {
        await modifyBlock(block.id, { projectId });
        setShowProjectModal(false);
    };

    const menuItems = [
        {
            label: 'Move to project',
            icon: <FolderInput size={14} />,
            onClick: () => setShowProjectModal(true),
            className:
                'flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700',
        },
        {
            label: 'Delete note',
            icon: <Trash2 size={14} />,
            onClick: handleDelete,
            className:
                'flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700',
        },
    ];

    const project = projects.find((project) => project.id === block.projectId);
    const [shouldShowExpand, setShouldShowExpand] = useState(false);

    return (
        <>
            <article
                ref={cardRef}
                data-block-id={block.id}
                className={`group relative scroll-mt-4 rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-neutral-900 ${
                    isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
            >
                <div className="absolute right-2 top-2">
                    <ContextMenu items={menuItems} isOpen={showMenu} onOpenChange={setShowMenu} />
                </div>
                <div className="mb-2 text-xs text-neutral-300 dark:text-neutral-400">
                    {project?.name ?? 'No Project'} &#183; {formatRelativeTime(block.updatedAt)}
                </div>
                <div className="prose prose-neutral dark:prose-invert relative">
                    <div
                        style={{
                            height: shouldShowExpand
                                ? isExpanded
                                    ? `${contentHeight + 40}px`
                                    : `${COLLAPSED_HEIGHT}px`
                                : 'auto',
                            paddingBottom: isExpanded ? '40px' : '0',
                        }}
                        className="relative overflow-hidden transition-[height] duration-200 ease-in-out"
                    >
                        <div ref={contentRef}>
                            <NoteEditor
                                content={block.content}
                                isReadOnly
                                className="outline-none"
                            />
                        </div>
                        {shouldShowExpand && !isExpanded && (
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
                        )}
                    </div>
                    {shouldShowExpand && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="absolute bottom-0 left-1/2 flex h-10 w-full -translate-x-1/2 items-center justify-center rounded-lg p-1 opacity-0 transition-all duration-200 hover:opacity-100"
                        >
                            {isExpanded ? (
                                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                    Collapse
                                </p>
                            ) : (
                                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                                    Expand
                                </p>
                            )}
                        </button>
                    )}
                </div>
            </article>

            {showProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
                        <button
                            onClick={() => setShowProjectModal(false)}
                            className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            ×
                        </button>
                        <h3 className="mb-4 text-lg font-medium">Move to Project</h3>
                        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-4">
                            <button
                                className="flex w-full items-center rounded-md px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                onClick={() => handleMoveToProject(undefined)}
                            >
                                No Project
                            </button>
                            {projects.map((project) => (
                                <button
                                    key={project.id}
                                    className="flex w-full items-center rounded-md px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    onClick={() => handleMoveToProject(project.id)}
                                >
                                    {project.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
