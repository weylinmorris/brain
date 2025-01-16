import { Block } from '@/types/block';

export interface BlockState {
    blocks: Block[];
    recommendedBlocks: Block[];
    activeBlockId: string | null;
    isLoading: boolean;
    error: string | null;
}

export type BlockAction =
    | { type: 'START_LOADING' }
    | { type: 'FINISH_LOADING' }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'SET_BLOCKS'; blocks: Block[] }
    | { type: 'ADD_BLOCK'; block: Block }
    | { type: 'SET_RECOMMENDED_BLOCKS'; blocks: Block[] }
    | { type: 'UPDATE_BLOCK'; block: Block }
    | { type: 'REMOVE_BLOCK'; id: string }
    | { type: 'SET_ACTIVE_BLOCK'; id: string | null }
    | { type: 'CLEAR_ACTIVE_BLOCK' };
