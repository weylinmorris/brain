'use client';

import React, { createContext, useReducer, useEffect } from 'react';
import { BlockState, BlockAction } from '@/reducers/blocks/types';
import { initialBlockState, blockReducer } from '@/reducers/blocks/reducer';
import { fetchBlocks } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useProject } from '@/hooks/useProject';

interface BlockContextType {
    state: BlockState;
    dispatch: React.Dispatch<BlockAction>;
}

export const BlockContext = createContext<BlockContextType | undefined>(undefined);

interface BlockProviderProps {
    children: React.ReactNode;
}

function BlockProviderContent({ children }: BlockProviderProps) {
    const { activeProject } = useProject();
    const [state, dispatch] = useReducer(blockReducer, initialBlockState);

    useEffect(() => {
        let mounted = true;

        async function loadInitialBlocks() {
            try {
                dispatch({ type: 'START_LOADING' });
                const blocks = await fetchBlocks(activeProject?.id);

                if (!mounted) return;

                dispatch({ type: 'SET_BLOCKS', blocks });
            } catch (error) {
                if (!mounted) return;
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to load blocks',
                });
            } finally {
                if (mounted) {
                    dispatch({ type: 'FINISH_LOADING' });
                }
            }
        }

        loadInitialBlocks();

        return () => {
            mounted = false;
        };
    }, [activeProject?.id]);

    return <BlockContext.Provider value={{ state, dispatch }}>{children}</BlockContext.Provider>;
}

export function BlockProvider({ children }: BlockProviderProps) {
    return (
        <ErrorBoundary fallback={<div>Something went wrong with the block system.</div>}>
            <BlockProviderContent>{children}</BlockProviderContent>
        </ErrorBoundary>
    );
}
