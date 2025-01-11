import { useContext, useCallback } from 'react';
import { EditModeContext } from '@/context/EditModeContext';

export function useEditMode() {
    const context = useContext(EditModeContext);
    if (!context) {
        throw new Error('useEditMode must be used within an EditModeProvider');
    }

    const { state, dispatch } = context;

    const setEditMode = useCallback(
        (isEditMode: boolean) => {
            dispatch({ type: 'SET_EDIT_MODE', isEditMode });
        },
        [dispatch]
    );

    const toggleEditMode = useCallback(() => {
        dispatch({ type: 'TOGGLE_EDIT_MODE' });
    }, [dispatch]);

    return {
        isEditMode: state.isEditMode,
        setEditMode,
        toggleEditMode,
    };
} 