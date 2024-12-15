'use client';

import {ChevronUpIcon, Upload} from "lucide-react";
import {useBlocks, useActiveBlock} from "@/context/block";
import {useMemo, useState} from "react";
import BlockPreview from '@/components/blocks/BlockPreview';
import ContextMenu from '@/components/blocks/ContextMenu';

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

function Sidebar() {
    const {blocks, createBlock, deleteBlock} = useBlocks();
    const {setActiveBlock} = useActiveBlock();
    const [isRecentExpanded, setIsRecentExpanded] = useState(true);
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);

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

        // Set as active page - the BlockEditor will automatically create the first block
        setActiveBlock(newBlock.id);
    }

    const handleBlockClick = (page) => {
        setActiveBlock(page.id);
    };

    const handleContextMenu = (e, page) => {
        e.preventDefault();
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            blockId: page.id
        });
    };

    const handleDeleteBlock = async () => {
        if (contextMenu) {
            await deleteBlock(contextMenu.blockId);
            setContextMenu(null);
        }
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
        <div className="px-2 py-4 bg-neutral-600 w-[40rem] flex flex-col h-screen text-neutral-50">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div>
                    <button
                        className="w-full mb-2 font-bold bg-primary-800 text-neutral-100 rounded-md px-4 py-2 hover:bg-primary-700 transition-colors duration-200 relative group"
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
                            className="flex justify-between items-center hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>Recent Notes</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-200 ${
                                    isRecentExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 overflow-y-auto ${
                            isRecentExpanded ? 'opacity-100 mb-4' : 'max-h-0 opacity-0 overflow-hidden'
                        } transition-all duration-200`}>
                            {recentBlocks.map(block => (
                                <div
                                    key={block.id}
                                    onContextMenu={(e) => handleContextMenu(e, block)}
                                >
                                    <BlockPreview
                                        block={block}
                                        onClick={handleBlockClick}
                                        showPreview={false}
                                        showTime={false}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All Notes Section */}
                    <div className="flex flex-col">
                        <div
                            onClick={toggleAllExpanded}
                            className="flex justify-between items-center hover:bg-neutral-500 rounded-md px-4 py-2 hover:cursor-pointer">
                            <h4>All Notes</h4>
                            <ChevronUpIcon
                                className={`h-5 w-5 transform transition-transform duration-200 ${
                                    isAllExpanded ? '' : 'rotate-180'
                                }`}
                            />
                        </div>
                        <div className={`mt-2 ml-4 overflow-y-auto ${
                            isAllExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        } transition-all duration-200`}>
                            {allBlocks.map(block => (
                                <div
                                    key={block.id}
                                    onContextMenu={(e) => handleContextMenu(e, block)}
                                >
                                    <BlockPreview
                                        block={block}
                                        onClick={handleBlockClick}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            onDelete={handleDeleteBlock}
                        />
                    )}
                </div>
            </div>

            <div className="flex-0">
                <label className="relative cursor-pointer">
                    <input
                        type="file"
                        className="hidden"
                        accept=".json,.edn"
                        onChange={handleFileChange}
                    />
                    <div
                        className="p-4 font-bold bg-neutral-700  hover:bg-neutral-500 transition-colors duration-200 rounded-md flex items-center justify-center">
                        <Upload size={16}/>
                        <p className="ml-6 text-sm">Import from Logseq</p>
                    </div>
                </label>
            </div>
        </div>
    );
}

export default Sidebar;