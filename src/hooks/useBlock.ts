import { useContext, useCallback } from 'react';
import { BlockContext } from '@/context/BlockContext';
import { Block } from '@/types/block';
import { fetchRecommendedBlocks, createBlock, updateBlock, deleteBlock } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { BlockInput } from '@/types/database';

export function useBlock() {
    const { addToast } = useToast();
    const context = useContext(BlockContext);
    if (!context) {
        throw new Error('useBlock must be used within a BlockProvider');
    }

    const { state, dispatch } = context;

    const addBlock = useCallback(
        async (block: BlockInput) => {
            try {
                dispatch({ type: 'START_LOADING' });
                const newBlock = await createBlock(block);
                dispatch({ type: 'ADD_BLOCK', block: newBlock });
                return newBlock;
            } catch (error) {
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to create block',
                });
                throw error;
            } finally {
                dispatch({ type: 'FINISH_LOADING' });
            }
        },
        [dispatch]
    );

    const modifyBlock = useCallback(
        async (id: string, updates: Partial<Block>) => {
            try {
                const updatedBlock = await updateBlock(id, updates);
                dispatch({ type: 'UPDATE_BLOCK', block: updatedBlock });
                return updatedBlock;
            } catch (error) {
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to update block',
                });
                throw error;
            }
        },
        [dispatch]
    );

    const removeBlock = useCallback(
        async (id: string) => {
            try {
                dispatch({ type: 'START_LOADING' });
                await deleteBlock(id);
                dispatch({ type: 'REMOVE_BLOCK', id });
                addToast('Note deleted successfully', 'success');
            } catch (error) {
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to delete block',
                });
                throw error;
            } finally {
                dispatch({ type: 'FINISH_LOADING' });
            }
        },
        [dispatch, addToast]
    );

    const getRecommendedBlocks = useCallback(
        async (blockId: string | null) => {
            if (!blockId) return;

            try {
                dispatch({ type: 'START_LOADING' });
                const recommendedBlocks = await fetchRecommendedBlocks(blockId);
                dispatch({ type: 'SET_RECOMMENDED_BLOCKS', blocks: recommendedBlocks });
            } catch (error) {
                dispatch({
                    type: 'SET_ERROR',
                    error:
                        error instanceof Error ? error.message : 'Failed to get recommended blocks',
                });
            } finally {
                dispatch({ type: 'FINISH_LOADING' });
            }
        },
        [dispatch]
    );

    const setActiveBlock = useCallback(
        (id: string | null) => {
            dispatch({ type: 'SET_ACTIVE_BLOCK', id });
        },
        [dispatch]
    );

    return {
        blocks: state.blocks,
        recommendedBlocks: state.recommendedBlocks,
        activeBlockId: state.activeBlockId,
        isLoading: state.isLoading,
        error: state.error,
        addBlock,
        modifyBlock,
        removeBlock,
        setActiveBlock,
        getRecommendedBlocks,
    };
}
