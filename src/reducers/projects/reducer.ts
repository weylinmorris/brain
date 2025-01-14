import { ProjectState, ProjectAction } from './types';
import { Project } from '@/types/database';

export const initialProjectState: ProjectState = {
    projects: [],
    activeProjectId: null,
    isLoading: false,
    error: null,
};

function sortProjects(projects: Project[]): Project[] {
    return [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
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

        case 'SET_PROJECTS':
            return {
                ...state,
                projects: sortProjects(action.projects),
                error: null,
            };

        case 'ADD_PROJECT':
            return {
                ...state,
                projects: sortProjects([...state.projects, action.project]),
                activeProjectId: action.project.id,
                error: null,
            };

        case 'UPDATE_PROJECT':
            return {
                ...state,
                projects: sortProjects(
                    state.projects.map((project) =>
                        project.id === action.project.id ? action.project : project
                    )
                ),
                error: null,
            };

        case 'REMOVE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter((project) => project.id !== action.id),
                activeProjectId:
                    state.activeProjectId === action.id ? null : state.activeProjectId,
                error: null,
            };

        case 'SET_ACTIVE_PROJECT':
            return {
                ...state,
                activeProjectId: action.id,
                error: null,
            };

        case 'CLEAR_ACTIVE_PROJECT':
            return {
                ...state,
                activeProjectId: null,
                error: null,
            };

        default:
            return state;
    }
} 