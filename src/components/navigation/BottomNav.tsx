import React from 'react';
import { Book, Edit, Lightbulb } from 'lucide-react';

type TabType = 'notes' | 'editor' | 'recommended';

interface BottomNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-neutral-100 pb-7 dark:border-neutral-500 dark:bg-neutral-600 md:hidden">
            <div className="flex h-14 items-center justify-around">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex h-full w-full flex-col items-center justify-center ${
                        activeTab === 'notes'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                >
                    <Book size={20} />
                    <span className="mt-0.5 text-[10px]">Notes</span>
                </button>
                <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex h-full w-full flex-col items-center justify-center ${
                        activeTab === 'editor'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                >
                    <Edit size={20} />
                    <span className="mt-0.5 text-[10px]">Editor</span>
                </button>
                <button
                    onClick={() => setActiveTab('recommended')}
                    className={`flex h-full w-full flex-col items-center justify-center ${
                        activeTab === 'recommended'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                >
                    <Lightbulb size={20} />
                    <span className="mt-0.5 text-[10px]">Related</span>
                </button>
            </div>
        </div>
    );
}

export type { TabType };
