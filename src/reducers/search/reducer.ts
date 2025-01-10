import { SearchState, SearchAction } from './types';

export const initialSearchState: SearchState = {
    query: '',
    results: null,
    isLoading: false,
    error: null,
};

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
    switch (action.type) {
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

        case 'SET_ERROR':
            return {
                ...state,
                error: action.error,
                isLoading: false,
            };

        case 'SET_QUERY':
            return {
                ...state,
                query: action.query,
                error: null,
            };

        case 'SET_RESULTS':
            return {
                ...state,
                results: action.results,
                error: null,
            };

        case 'CLEAR_RESULTS':
            return {
                ...state,
                results: null,
                error: null,
            };

        default:
            return state;
    }
}
