import { useContext, useCallback } from 'react';
import { SearchContext } from '@/context/SearchContext';
import { searchBlocks } from '@/lib/api';
import { useProject } from '@/hooks/useProject';

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }

    const { state, dispatch } = context;
    const { activeProject } = useProject();

    const performSearch = useCallback(
        async (query: string) => {
            try {
                dispatch({ type: 'START_LOADING' });
                const results = await searchBlocks(query, activeProject?.id);
                dispatch({ type: 'SET_RESULTS', results });
                return results;
            } catch (error) {
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to perform search',
                });
                throw error;
            } finally {
                dispatch({ type: 'FINISH_LOADING' });
            }
        },
        [dispatch, activeProject]
    );

    const clearSearch = useCallback(() => {
        dispatch({ type: 'CLEAR_RESULTS' });
    }, [dispatch]);

    const setSearchQuery = useCallback(
        (query: string) => {
            dispatch({ type: 'SET_QUERY', query });
        },
        [dispatch]
    );

    return {
        query: state.query,
        results: state.results,
        isLoading: state.isLoading,
        error: state.error,
        performSearch,
        clearSearch,
        setSearchQuery,
    };
}
