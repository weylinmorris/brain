import { SearchResults } from '@/types/search';

export interface SearchState {
    query: string;
    results: SearchResults | null;
    isLoading: boolean;
    error: string | null;
}

export type SearchAction =
    | { type: 'START_LOADING' }
    | { type: 'FINISH_LOADING' }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'SET_QUERY'; query: string }
    | { type: 'SET_RESULTS'; results: SearchResults }
    | { type: 'CLEAR_RESULTS' }; 