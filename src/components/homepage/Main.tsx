'use client';

import React, { useEffect } from 'react';
import BlockEditor from '@/components/block-editor/BlockEditor';
import Search from './Search';

const Main: React.FC = () => {
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh(); // Set on mount
        window.addEventListener('resize', setVh);
        window.addEventListener('orientationchange', setVh);

        return () => {
            window.removeEventListener('resize', setVh);
            window.removeEventListener('orientationchange', setVh);
        };
    }, []);

    return (
        <div
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
            className="flex w-full flex-col overflow-hidden bg-neutral-50 p-2 pb-24 dark:bg-neutral-800 xl:pb-2"
        >
            <Search />
            <div className="min-h-0 flex-1">
                <BlockEditor className="h-full" />
            </div>
        </div>
    );
};

export default Main;
