'use client';

import { RootProvider } from "@/context";
import Main from "../components/homepage/Main";
import Sidebar from "@/components/homepage/Sidebar";
import Recommended from "../components/homepage/RightSidebar";
import { BottomNav } from "../components/navigation/BottomNav";
import { useState } from "react";

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
            <div className="flex items-stretch h-full">
                <div className={`hidden md:block w-full md:w-96 ${activeTab === 'notes' ? '!block' : ''}`}>
                    <Sidebar setActiveTab={setActiveTab}/>
                </div>
                <div className={`w-full ${activeTab === 'editor' ? 'block' : 'hidden md:block'}`}>
                    <Main/>
                </div>
                <div className={`hidden md:block w-full md:w-96 ${activeTab === 'recommended' ? '!block' : ''}`}>
                    <Recommended setActiveTab={setActiveTab}/>
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