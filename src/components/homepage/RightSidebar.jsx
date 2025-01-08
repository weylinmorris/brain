'use client';

import { useState } from "react";
import RecommendedNotes from "@/components/right-sidebar/RecommendedNotes.jsx";
import AskAI from "@/components/right-sidebar/AskAi.jsx";

// Shared container styles
const containerStyles = "h-[calc(var(--vh,1vh)*100)] bg-neutral-100 dark:bg-neutral-600 w-96 flex flex-col flex-shrink-0 text-neutral-900 dark:text-neutral-200";

function Sidebar() {
    const [activeTab, setActiveTab] = useState('recommended');

    return (
        <div className={containerStyles}>
            <div className="flex border-b border-neutral-200 dark:border-neutral-500">
                <button
                    onClick={() => setActiveTab('recommended')}
                    className={`flex-1 p-4 text-sm font-medium ${
                        activeTab === 'recommended'
                            ? 'border-b-2 border-primary-700'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                >
                    Recommended
                </button>
                <button
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 p-4 text-sm font-medium ${
                        activeTab === 'ask'
                            ? 'border-b-2 border-primary-700'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                >
                    Ask AI
                </button>
            </div>

            {activeTab === 'recommended' && <RecommendedNotes />}
            {activeTab === 'ask' && <AskAI />}
        </div>
    );
}

export default Sidebar;