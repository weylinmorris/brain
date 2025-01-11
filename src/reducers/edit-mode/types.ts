export interface EditModeState {
    isEditMode: boolean;
}

export type EditModeAction = 
    | { type: 'SET_EDIT_MODE'; isEditMode: boolean }
    | { type: 'TOGGLE_EDIT_MODE' }; 