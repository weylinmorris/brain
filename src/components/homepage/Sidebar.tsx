'use client';

import { ChevronUpIcon, Upload } from 'lucide-react';
import { useBlock } from '@/hooks/useBlock';
import { useMemo, useState, ChangeEvent } from 'react';
import SwipeableNote from '@/components/blocks/SwipeableNote';
import ThemeToggle from '../../components/theme/ThemeToggle';
import { Block } from '@/types/block';
import { TabType } from '@/app/page';

interface SidebarProps {
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

async function handleLogseqUpload(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/blocks/import', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

function Sidebar({ setActiveTab }: SidebarProps) {
    const { blocks, addBlock, removeBlock, setActiveBlock } = useBlock();
    const [isRecentExpanded, setIsRecentExpanded] = useState<boolean>(true);
    const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);

    const recentBlocks = useMemo(() => {
        return [...blocks]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 10);
    }, [blocks]);

    const allBlocks = useMemo(() => {
        return [...blocks].sort((a, b) => a.title.localeCompare(b.title));
    }, [blocks]);

    const handleNewBlockClick = async (): Promise<void> => {
        const now = new Date();
        const newBlock = await addBlock({
            title: '',
            content: '',
            type: 'text',
            createdAt: now,
            updatedAt: now,
        });

        setActiveBlock(newBlock.id);
        setActiveTab('editor');
    };

    const handleBlockClick = (block: Block): void => {
        setActiveBlock(block.id);
        setActiveTab('editor');
    };

    const handleDeleteBlock = async (blockId: string): Promise<void> => {
        await removeBlock(blockId);
    };

    const toggleRecentExpanded = (): void => {
        setIsAllExpanded(isRecentExpanded ? isAllExpanded : false);
        setIsRecentExpanded(!isRecentExpanded);
    };

    const toggleAllExpanded = (): void => {
        setIsRecentExpanded(isAllExpanded ? isRecentExpanded : false);
        setIsAllExpanded(!isAllExpanded);
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await handleLogseqUpload(file);
                event.target.value = '';
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };

    return (
        <div
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
            className="bg:neutral-50 flex w-full flex-shrink-0 flex-col p-2 pb-24 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50 md:w-96 md:bg-neutral-100 md:pb-2 md:dark:bg-neutral-600"
        >
            <div className="flex h-full flex-col">
                {/* Top section with New Note button */}
                <div className="flex-shrink-0">
                    <button
                        className="group relative mb-2 w-full rounded-md bg-primary-600 px-4 py-2 font-bold text-neutral-100 hover:bg-primary-700 dark:bg-primary-800 dark:hover:bg-primary-700"
                        onClick={handleNewBlockClick}
                        title="Create a new page"
                    >
                        <span>New Note</span>
                    </button>
                </div>

                {/* Main content area */}
                <div className="flex min-h-0 flex-1 flex-col">
                    {/* Recent Notes Section */}
                    <div className="flex-shrink-0">
                        <div
                            onClick={toggleRecentExpanded}
                            className="flex items-center justify-between rounded-md px-4 py-2 hover:cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-500"
                        >
                            <h4>Recent Notes</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-300 ${
                                    isRecentExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div
                            className={`mt-2 ${
                                isRecentExpanded
                                    ? 'mb-4 opacity-100'
                                    : 'max-h-0 overflow-hidden opacity-0'
                            } duration-300`}
                        >
                            {recentBlocks.map((block) => (
                                <SwipeableNote
                                    key={block.id}
                                    block={block}
                                    onClick={() => handleBlockClick(block)}
                                    onDelete={handleDeleteBlock}
                                    showPreview={false}
                                    showTime={false}
                                />
                            ))}
                        </div>
                    </div>

                    {/* All Notes Section */}
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div
                            onClick={toggleAllExpanded}
                            className="flex items-center justify-between rounded-md px-4 py-2 hover:cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-500"
                        >
                            <h4>All Notes ({allBlocks.length})</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-300 ${
                                    isAllExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div
                            className={`ml-4 mt-2 flex-1 overflow-y-auto ${
                                isAllExpanded ? 'opacity-100' : 'max-h-0 overflow-hidden opacity-0'
                            } duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:bg-transparent`}
                        >
                            {allBlocks.map((block) => (
                                <SwipeableNote
                                    key={block.id}
                                    block={block}
                                    onClick={() => handleBlockClick(block)}
                                    onDelete={handleDeleteBlock}
                                    showPreview={true}
                                    showTime={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-4 flex-shrink-0">
                    <div className="flex items-center justify-end space-x-2">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
