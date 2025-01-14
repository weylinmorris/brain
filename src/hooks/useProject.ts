import { useContext } from 'react';
import { ProjectContext } from '@/context/ProjectContext';
import { Project, ProjectInput, ProjectUpdate } from '@/types/database';
import { createProject, updateProject, deleteProject, addBlockToProject, removeBlockFromProject } from '@/lib/api';

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }

    const { state, dispatch } = context;

    async function create(input: ProjectInput): Promise<Project> {
        try {
            const project = await createProject(input);
            dispatch({ type: 'ADD_PROJECT', project });
            return project;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to create project',
            });
            throw error;
        }
    }

    async function update(id: string, updates: ProjectUpdate): Promise<Project> {
        try {
            const project = await updateProject(id, updates);
            dispatch({ type: 'UPDATE_PROJECT', project });
            return project;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to update project',
            });
            throw error;
        }
    }

    async function remove(id: string): Promise<void> {
        try {
            await deleteProject(id);
            dispatch({ type: 'REMOVE_PROJECT', id });
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to delete project',
            });
            throw error;
        }
    }

    async function addBlock(projectId: string, blockId: string, relationship: 'OWNS' | 'RELATED'): Promise<void> {
        try {
            await addBlockToProject(projectId, blockId, relationship);
            // Note: We might want to refresh the project or update its state here
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to add block to project',
            });
            throw error;
        }
    }

    async function removeBlock(projectId: string, blockId: string): Promise<void> {
        try {
            await removeBlockFromProject(projectId, blockId);
            // Note: We might want to refresh the project or update its state here
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                error: error instanceof Error ? error.message : 'Failed to remove block from project',
            });
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
        activeProject: state.projects.find(p => p.id === state.activeProjectId) || null,
        isLoading: state.isLoading,
        error: state.error,
        create,
        update,
        remove,
        addBlock,
        removeBlock,
        setActiveProject,
    };
} 