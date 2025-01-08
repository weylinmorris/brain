'use client';

import {BlockProvider} from "@/context/block";
import Main from "@/components/homepage/Main.jsx";
import Sidebar from "@/components/homepage/Sidebar.jsx";
import Recommended from "@/components/homepage/RightSidebar.jsx";
import {ToastProvider} from "@/context/toast/ToastContext.js";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useState } from "react";

export default function Home() {
    const [activeTab, setActiveTab] = useState('editor');

    return (
        <BlockProvider>
            <ToastProvider>
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
            </ToastProvider>
        </BlockProvider>
    );
}