'use client';

import { useEffect } from "react";
import BlockEditor from "@/components/block-editor/BlockEditor";
import Search from "@/components/homepage/Search.jsx";

function Main() {
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh(); // Set on mount
        window.addEventListener("resize", setVh);
        window.addEventListener("orientationchange", setVh);

        return () => {
            window.removeEventListener("resize", setVh);
            window.removeEventListener("orientationchange", setVh);
        };
    }, []);

    return (
        <div
            style={{ height: "calc(var(--vh, 1vh) * 100)" }}
            className="w-full p-2 pb-24 md:pb-2 bg-neutral-50 dark:bg-neutral-800 flex flex-col overflow-hidden"
        >
            <Search />
            <div className="flex-1 min-h-0">
                <BlockEditor className="h-full" />
            </div>
        </div>
    );
}

export default Main;
