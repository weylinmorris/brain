'use client'

import { createContext, useReducer, useEffect } from 'react';
import { initialState, blockReducer } from './reducer';
import { fetchBlocks } from './api';

export const BlockContext = createContext(undefined);

export function BlockProvider({ children }) {
    const [state, dispatch] = useReducer(blockReducer, initialState);

    useEffect(() => {
        async function loadInitialBlocks() {
            try {
                dispatch({ type: 'START_LOADING' });
                const blocks = await fetchBlocks();
                dispatch({ type: 'SET_BLOCKS', blocks });

                if (!state.activeBlockId && blocks.length > 0) {
                    const sortedBlocks = blocks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    dispatch({ type: 'SET_ACTIVE_BLOCK', id: sortedBlocks[0].id });
                }
            } catch (error) {
                dispatch({ type: 'SET_ERROR', error: error.message });
            } finally {
                dispatch({ type: 'FINISH_LOADING' });
            }
        }

        loadInitialBlocks();
    }, []);

    return (
        <BlockContext.Provider value={{ state, dispatch }}>
            {children}
        </BlockContext.Provider>
    );
}