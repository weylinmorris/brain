import { Project } from '@/types/database';

export interface ProjectState {
    projects: Project[];
    activeProjectId: string | null;
    isLoading: boolean;
    error: string | null;
}

export type ProjectAction =
    | { type: 'START_LOADING' }
    | { type: 'FINISH_LOADING' }
    | { type: 'SET_ERROR'; error: string }
    | { type: 'SET_PROJECTS'; projects: Project[] }
    | { type: 'ADD_PROJECT'; project: Project }
    | { type: 'UPDATE_PROJECT'; project: Project }
    | { type: 'REMOVE_PROJECT'; id: string }
    | { type: 'SET_ACTIVE_PROJECT'; id: string }
    | { type: 'CLEAR_ACTIVE_PROJECT' }; 