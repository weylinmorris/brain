export const initialState = {
    blocks: [],
    searchResults: [[], [], []],
    recommendedBlocks: [[], [], []],
    activeBlockId: null,
    isLoading: true,
    error: null,
    isSaving: false,
};

export function blockReducer(state, action) {
    switch (action.type) {
        case 'SET_BLOCKS':
            return {
                ...state,
                blocks: action.blocks,
            }

        case 'SET_SEARCH_RESULTS':
            return {
                ...state,
                searchResults: action.results,
            }

        case 'SET_RECOMMENDED_BLOCKS':
            return {
                ...state,
                recommendedBlocks: action.results,
            }

        case 'CREATE_BLOCK': {
            return {
                ...state,
                blocks: [action.block, ...state.blocks],
            }
        }

        case 'UPDATE_BLOCK': {
            return {
                ...state,
                blocks: state.blocks.map(block => {
                    if (block.id === action.block.id) {
                        return action.block;
                    }
                    return block;
                }),
            }
        }

        case 'DELETE_BLOCK': {
            return {
                ...state,
                blocks: state.blocks.filter(block => block.id !== action.id),
                activeBlockId: state.activeBlockId === action.id ? null : state.activeBlockId,
            }
        }

        case 'SET_ACTIVE_BLOCK':
            return {
                ...state,
                activeBlockId: action.id,
            };

        case 'START_LOADING':
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case 'FINISH_LOADING':
            return {
                ...state,
                isLoading: false,
            };

        case 'START_SAVING':
            return {
                ...state,
                isSaving: true,
                error: null,
            };

        case 'FINISH_SAVING':
            return {
                ...state,
                isSaving: false,
            };

        case 'SET_ERROR':
            return {
                ...state,
                error: action.error,
                isLoading: false,
                isSaving: false,
            };

        default:
            return state;
    }
}