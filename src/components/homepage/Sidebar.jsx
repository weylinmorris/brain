'use client';

import {ChevronUpIcon, Upload} from "lucide-react";
import {useBlocks, useActiveBlock} from "@/context/block";
import {useMemo, useState} from "react";
import SwipeableNote from '@/components/blocks/SwipeableNote';
import ThemeToggle from "@/components/theme/ThemeToggle.jsx";

async function handleLogseqUpload(file) {
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

function Sidebar({ setActiveTab }) {
    const {blocks, createBlock, deleteBlock} = useBlocks();
    const {setActiveBlock} = useActiveBlock();
    const [isRecentExpanded, setIsRecentExpanded] = useState(true);
    const [isAllExpanded, setIsAllExpanded] = useState(false);

    const recentBlocks = useMemo(() => {
        return [...blocks]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10);
    }, [blocks]);

    const allBlocks = useMemo(() => {
        return [...blocks]
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [blocks]);

    const handleNewBlockClick = async () => {
        const newBlock = await createBlock({
            title: '',
            content: '',
            type: 'text'
        });

        // Set as active page and switch to editor tab
        setActiveBlock(newBlock.id);
        setActiveTab('editor');
    }

    const handleBlockClick = (page) => {
        setActiveBlock(page.id);
        setActiveTab('editor');
    };

    const handleContextMenu = (e, page) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            blockId: page.id
        });
    };

    const handleDeleteBlock = async (blockId) => {
        await deleteBlock(blockId);
    };

    const toggleRecentExpanded = () => {
        setIsAllExpanded(isRecentExpanded ? isAllExpanded : false);
        setIsRecentExpanded(!isRecentExpanded);
    };

    const toggleAllExpanded = () => {
        setIsRecentExpanded(isAllExpanded ? isRecentExpanded : false);
        setIsAllExpanded(!isAllExpanded);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await handleLogseqUpload(file);
                // Reset the input so the same file can be uploaded again if needed
                event.target.value = '';
            } catch (error) {
                // We'll add toast handling here later
                console.error('Upload failed:', error);
            }
        }
    };

    return (
        <div style={{height: "calc(var(--vh, 1vh) * 100)"}}
             className="p-2 pb-24 md:pb-2 bg:neutral-50 md:bg-neutral-100 dark:bg-neutral-800 md:dark:bg-neutral-600 w-full md:w-96 flex flex-col flex-shrink-0 text-neutral-900 dark:text-neutral-50">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div>
                    <button
                        className="w-full mb-2 font-bold bg-primary-600 dark:bg-primary-800 text-neutral-100 rounded-md px-4 py-2 hover:bg-primary-700 dark:hover:bg-primary-700 relative group"
                        onClick={handleNewBlockClick}
                        title="Create a new page"
                    >
                        <span>New Note</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col max-h-full overflow-y-auto">
                    {/* Recent Notes Section */}
                    <div className="flex flex-col">
                        <div
                            onClick={toggleRecentExpanded}
                            className="flex justify-between items-center hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>Recent Notes</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-300 ${
                                    isRecentExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 overflow-y-auto ${
                            isRecentExpanded ? 'opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        } duration-300`}>
                            {recentBlocks.map(block => (
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
                    <div className="flex flex-col">
                        <div
                            onClick={toggleAllExpanded}
                            className="flex justify-between items-center hover:bg-neutral-200 dark:hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>All Notes</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-300 ${
                                    isAllExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 ml-4 overflow-y-auto ${
                            isAllExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        } duration-300`}>
                            {allBlocks.map(block => (
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
            </div>

            <div className="flex-0 flex items-center justify-end space-x-2">
                <ThemeToggle />

                {/* <label className="relative cursor-pointer flex-1">
                    <input
                        type="file"
                        className="hidden"
                        accept=".json,.edn"
                        onChange={handleFileChange}
                    />
                    <div
                        className="p-4 font-bold bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300  dark:hover:bg-neutral-500 rounded-md flex items-center justify-center">
                        <Upload size={16}/>
                        <p className="ml-6 text-xs">Import from Logseq</p>
                    </div>
                </label> */}
            </div>
        </div>
    );
}

export default Sidebar;