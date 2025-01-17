'use client';

import { RootProvider } from '@/context';
import Main from '../components/homepage/Main';
import Sidebar from '@/components/homepage/Sidebar';
import Recommended from '../components/homepage/RightSidebar';
import { BottomNav } from '../components/navigation/BottomNav';
import { useState } from 'react';

export type TabType = 'editor' | 'notes' | 'recommended';

interface TabProps {
    activeTab: TabType;
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

export type { TabProps };

function HomeContent() {
    const [activeTab, setActiveTab] = useState<TabType>('editor');

    return (
        <>
            <div className="flex h-full items-stretch">
                <div
                    className={`hidden w-full xl:block xl:w-80 ${activeTab === 'notes' ? '!block' : ''}`}
                >
                    <Sidebar />
                </div>
                <div className={`w-full ${activeTab === 'editor' ? 'block' : 'hidden xl:block'}`}>
                    <Main />
                </div>
                <div
                    className={`hidden w-full xl:block xl:w-[32rem] ${activeTab === 'recommended' ? '!block' : ''}`}
                >
                    <Recommended />
                </div>
            </div>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
    );
}

export default function Home() {
    return (
        <RootProvider>
            <HomeContent />
        </RootProvider>
    );
}
