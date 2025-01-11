import { EditModeState, EditModeAction } from './types';

export const initialEditModeState: EditModeState = {
    isEditMode: false,
};

export function editModeReducer(state: EditModeState, action: EditModeAction): EditModeState {
    switch (action.type) {
        case 'SET_EDIT_MODE':
            return {
                ...state,
                isEditMode: action.isEditMode,
            };
        case 'TOGGLE_EDIT_MODE':
            return {
                ...state,
                isEditMode: !state.isEditMode,
            };
        default:
            return state;
    }
} 