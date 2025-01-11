'use client';

import React, { createContext, useReducer } from 'react';
import { EditModeState, EditModeAction } from '@/reducers/edit-mode/types';
import { initialEditModeState, editModeReducer } from '@/reducers/edit-mode/reducer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface EditModeContextType {
    state: EditModeState;
    dispatch: React.Dispatch<EditModeAction>;
}

export const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

interface EditModeProviderProps {
    children: React.ReactNode;
}

function EditModeProviderContent({ children }: EditModeProviderProps) {
    const [state, dispatch] = useReducer(editModeReducer, initialEditModeState);

    return (
        <EditModeContext.Provider value={{ state, dispatch }}>
            {children}
        </EditModeContext.Provider>
    );
}

export function EditModeProvider({ children }: EditModeProviderProps) {
    return (
        <ErrorBoundary fallback={<div>Something went wrong with the edit mode system.</div>}>
            <EditModeProviderContent>{children}</EditModeProviderContent>
        </ErrorBoundary>
    );
} 