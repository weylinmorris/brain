'use client';

import React, { useEffect } from 'react';
import { NoteComposer } from '@/components/notes/NoteComposer';
import { NoteFeed } from '@/components/notes/NoteFeed';

const Main: React.FC = () => {
    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
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
            className="flex w-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-800"
        >
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-300 hover:scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700 dark:hover:scrollbar-thumb-neutral-600 md:p-6">
                <div className="mx-auto max-w-2xl">
                    <NoteComposer />
                    <NoteFeed />
                </div>
            </div>
        </div>
    );
};

export default Main;
