import { Block } from './block';
import { BlockSearchResult } from './database';
import type { Dispatch } from 'react';

export interface BlockState {
    blocks: Block[];
    searchResults: SearchResults;
    recommendedBlocks: Block[][];
    activeBlockId: string | null;
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
}

export interface SearchResults {
    type: 'question' | 'search' | null;
    answer: string | null;
    sources: Block[];
    blocks: BlockSearchResult;
}

export type BlockAction =
    | { type: 'SET_BLOCKS'; blocks: Block[] }
    | { type: 'SET_SEARCH_RESULTS'; results: SearchResults }
    | { type: 'SET_RECOMMENDED_BLOCKS'; results: Block[][] }
    | { type: 'CREATE_BLOCK'; block: Block }
    | { type: 'UPDATE_BLOCK'; block: Block }
    | { type: 'DELETE_BLOCK'; id: string }
    | { type: 'SET_ACTIVE_BLOCK'; id: string | null }
    | { type: 'START_LOADING' }
    | { type: 'FINISH_LOADING' }
    | { type: 'START_SAVING' }
    | { type: 'FINISH_SAVING' }
    | { type: 'SET_ERROR'; error: string };

export interface BlockContextType {
    state: BlockState;
    dispatch: Dispatch<BlockAction>;
}
