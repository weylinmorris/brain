'use client';

import { useState } from "react";
import RecommendedNotes from "@/components/right-sidebar/RecommendedNotes.jsx";

// Shared container styles
const containerStyles = "h-[calc(var(--vh,1vh)*100)] bg-neutral-100 dark:bg-neutral-600 w-96 flex flex-col flex-shrink-0 text-neutral-900 dark:text-neutral-200";

function Sidebar() {
    const [activeTab, setActiveTab] = useState('recommended');

    return (
        <div className={containerStyles}>
            <RecommendedNotes />
        </div>
    );
}

export default Sidebar;