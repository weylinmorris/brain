'use client';

import React, { useEffect, useState } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { NoteCard } from './NoteCard';

export const NoteFeed = () => {
    const { blocks, isLoading, error, activeBlockId } = useBlock();
    const [sortedBlocks, setSortedBlocks] = useState<typeof blocks>([]);

    useEffect(() => {
        setSortedBlocks(
            [...blocks].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
        );
    }, [blocks]);

    if (isLoading && !sortedBlocks.length) {
        return <div className="text-center text-sm text-neutral-500">Loading notes...</div>;
    }

    if (error) {
        return <div className="text-center text-sm text-red-500">Error: {error}</div>;
    }

    if (!sortedBlocks.length) {
        return (
            <div className="text-center text-sm text-neutral-500">
                No notes yet. Create your first note above!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedBlocks.map((block) => (
                <NoteCard key={block.id} block={block} isActive={block.id === activeBlockId} />
            ))}
        </div>
    );
};
