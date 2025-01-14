import { useContext } from 'react';
import { ProjectContext } from '@/context/ProjectContext';
import { Project, ProjectInput, ProjectUpdate } from '@/types/database';
import { createProject, updateProject, deleteProject } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export function useProject() {
    const { addToast } = useToast();

    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }

    const { state, dispatch } = context;

    async function create(input: ProjectInput): Promise<Project> {
        try {
            const project = await createProject(input);
            dispatch({ type: 'ADD_PROJECT', project });

            addToast('Project created successfully', 'success');
            return project;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to create project',
            });
            addToast('Failed to create project', 'error');
            throw error;
        }
    }

    async function update(id: string, updates: ProjectUpdate): Promise<Project> {
        try {
            const project = await updateProject(id, updates);
            dispatch({ type: 'UPDATE_PROJECT', project });

            addToast('Project updated successfully', 'success');
            return project;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to update project',
            });
            addToast('Failed to update project', 'error');
            throw error;
        }
    }

    async function remove(id: string): Promise<void> {
        try {
            await deleteProject(id);
            dispatch({ type: 'REMOVE_PROJECT', id });

            addToast('Project deleted successfully', 'success');
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to delete project',
            });
            addToast('Failed to delete project', 'error');
            throw error;
        }
    }

    function setActiveProject(id: string | null) {
        if (id === null) {
            dispatch({ type: 'CLEAR_ACTIVE_PROJECT' });
        } else {
            dispatch({ type: 'SET_ACTIVE_PROJECT', id });
        }
    }

    return {
        projects: state.projects,
        activeProject: state.projects.find((p) => p.id === state.activeProjectId) || null,
        isLoading: state.isLoading,
        error: state.error,
        create,
        update,
        remove,
        setActiveProject,
    };
}
