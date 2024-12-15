import {useContext} from "react";
import {BlockContext} from './BlockContext';
import {searchBlocks, createBlock, updateBlock, deleteBlock, fetchRecommendedBlocks} from './api';
import {useToast} from "@/context/toast/ToastContext.js";

export function useBlockState() {
    const context = useContext(BlockContext);
    if (context === undefined) {
        throw new Error('useBlockState must be used within a BlockProvider');
    }
    return context;
}

export function useActiveBlock() {
    const {state, dispatch} = useBlockState();

    const activeBlock = state.blocks?.find(block => block.id === state.activeBlockId);

    const setActiveBlock = async (id) => {
        dispatch({type: 'SET_ACTIVE_BLOCK', id});
    };

    return {
        activeBlock,
        activeBlockId: state.activeBlockId,
        setActiveBlock,
    };
}

export function useBlocks() {
    const {state, dispatch} = useBlockState();
    const { addToast } = useToast();

    const search = async (query) => {
        try {
            const results = await searchBlocks(query);
            dispatch({type: 'SET_SEARCH_RESULTS', results});
        } catch (error) {
            dispatch({type: 'SET_ERROR', error: error.message});
        }
    }

    const getRecommendedBlocks = async (blockId) => {
        try {
            const results = await fetchRecommendedBlocks(blockId);
            dispatch({type: 'SET_RECOMMENDED_BLOCKS', results});
        } catch (error) {
            dispatch({type: 'SET_ERROR', error: error.message});
        }
    }

    const createNewBlock = async (initialData = {}) => {
        try {
            dispatch({type: 'START_SAVING'});
            const newBlock = await createBlock(initialData);
            dispatch({type: 'CREATE_BLOCK', block: newBlock});
            dispatch({type: 'FINISH_SAVING'});

            addToast('Block created', 'success');

            return newBlock;
        } catch (error) {
            dispatch({type: 'SET_ERROR', error: error.message});
            addToast('Failed to create block', 'error');
            throw error;
        }
    };

    const updateExistingBlock = async (block) => {
        try {
            const newBlock = await updateBlock(block);
            dispatch({type: 'UPDATE_BLOCK', block: newBlock});

            addToast('Block updated', 'success');
        } catch (error) {
            console.error('Failed to sync block with server:', error);
            dispatch({type: 'SET_ERROR', error: error.message});
            addToast('Failed to update block', 'error');
        }
    };

    const removeBlock = async (id) => {
        try {
            dispatch({type: 'START_SAVING'});

            await deleteBlock(id);

            dispatch({type: 'DELETE_BLOCK', id});
            dispatch({type: 'FINISH_SAVING'});

            addToast('Block deleted', 'success');
        } catch (error) {
            dispatch({type: 'SET_ERROR', error: error.message});
            addToast('Failed to delete block', 'error');
            throw error;
        }
    };

    return {
        blocks: state.blocks,
        searchResults: state.searchResults,
        recommendedBlocks: state.recommendedBlocks,
        search,
        getRecommendedBlocks,
        createBlock: createNewBlock,
        updateBlock: updateExistingBlock,
        deleteBlock: removeBlock,
        isLoading: state.isLoading,
        isSaving: state.isSaving,
        error: state.error,
    };
}