'use client';

import React, { useState } from 'react';
import RecommendedNotes from '../../components/right-sidebar/RecommendedNotes';
import { TabType } from '@/app/page';

// Shared container styles
const containerStyles =
    'h-[calc(var(--vh,1vh)*100)] bg-neutral-50 xl:bg-neutral-100 dark:bg-neutral-800 xl:dark:bg-neutral-600 w-full xl:w-96 flex flex-col flex-shrink-0 text-neutral-900 dark:text-neutral-200';

interface RecommendedProps {
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const Sidebar: React.FC<RecommendedProps> = ({ setActiveTab }) => {
    const [activeTab] = useState('recommended');

    return (
        <div className={containerStyles}>
            <RecommendedNotes setActiveTab={setActiveTab} />
        </div>
    );
};

export default Sidebar;
