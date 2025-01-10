'use client';

import React, { createContext, useReducer } from 'react';
import { SearchState, SearchAction } from '@/reducers/search/types';
import { initialSearchState, searchReducer } from '@/reducers/search/reducer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SearchContextType {
    state: SearchState;
    dispatch: React.Dispatch<SearchAction>;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
    children: React.ReactNode;
}

function SearchProviderContent({ children }: SearchProviderProps) {
    const [state, dispatch] = useReducer(searchReducer, initialSearchState);

    return <SearchContext.Provider value={{ state, dispatch }}>{children}</SearchContext.Provider>;
}

export function SearchProvider({ children }: SearchProviderProps) {
    return (
        <ErrorBoundary fallback={<div>Something went wrong with the search system.</div>}>
            <SearchProviderContent>{children}</SearchProviderContent>
        </ErrorBoundary>
    );
}
