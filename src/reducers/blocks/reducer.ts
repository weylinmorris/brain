import { BlockState, BlockAction } from './types';

export const initialBlockState: BlockState = {
    blocks: [],
    recommendedBlocks: [],
    activeBlockId: null,
    isLoading: false,
    error: null
};

export function blockReducer(state: BlockState, action: BlockAction): BlockState {
    switch (action.type) {
        case 'START_LOADING':
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case 'FINISH_LOADING':
            return {
                ...state,
                isLoading: false
            };

        case 'SET_ERROR':
            return {
                ...state,
                error: action.error,
                isLoading: false
            };

        case 'SET_BLOCKS':
            return {
                ...state,
                blocks: action.blocks,
                error: null
            };

        case 'ADD_BLOCK':
            return {
                ...state,
                blocks: [...state.blocks, action.block],
                error: null
            };

        case 'UPDATE_BLOCK':
            return {
                ...state,
                blocks: state.blocks.map(block => 
                    block.id === action.block.id ? action.block : block
                ),
                error: null
            };

        case 'REMOVE_BLOCK':
            return {
                ...state,
                blocks: state.blocks.filter(block => block.id !== action.id),
                activeBlockId: state.activeBlockId === action.id ? null : state.activeBlockId,
                error: null
            };

        case 'SET_RECOMMENDED_BLOCKS':
            return {
                ...state,
                recommendedBlocks: Array.from(
                    new Map(action.blocks.map(block => [block.id, block])).values()
                ),
                error: null
            };

        case 'SET_ACTIVE_BLOCK':
            return {
                ...state,
                activeBlockId: action.id,
                error: null
            };

        case 'CLEAR_ACTIVE_BLOCK':
            return {
                ...state,
                activeBlockId: null,
                error: null
            };

        default:
            return state;
    }
} 