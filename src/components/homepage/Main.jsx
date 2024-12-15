'use client';

import BlockEditor from "@/components/block-editor/BlockEditor";
import Search from "@/components/homepage/Search.jsx";

function Main() {
    return (
        <div className="h-screen w-full bg-neutral-800 flex flex-col overflow-hidden">
            <Search/>
            <div className="flex-1 min-h-0">
                <BlockEditor className="h-full"/>
            </div>
        </div>
    );
}

export default Main;