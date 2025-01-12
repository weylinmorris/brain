'use client';

import { RootProvider } from '@/context';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <RootProvider>{children}</RootProvider>
        </SessionProvider>
    );
}
