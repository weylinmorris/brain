'use client';

import React, { createContext, useReducer, useEffect } from 'react';
import { ProjectState, ProjectAction } from '@/reducers/projects/types';
import { initialProjectState, projectReducer } from '@/reducers/projects/reducer';
import { fetchProjects } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ProjectContextType {
    state: ProjectState;
    dispatch: React.Dispatch<ProjectAction>;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
    children: React.ReactNode;
}

function ProjectProviderContent({ children }: ProjectProviderProps) {
    const [state, dispatch] = useReducer(projectReducer, initialProjectState);

    useEffect(() => {
        let mounted = true;

        async function loadInitialProjects() {
            try {
                dispatch({ type: 'START_LOADING' });
                const projects = await fetchProjects();

                if (!mounted) return;

                dispatch({ type: 'SET_PROJECTS', projects });

                if (!state.activeProjectId && projects.length > 0) {
                    const sortedProjects = [...projects].sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    );
                    dispatch({ type: 'SET_ACTIVE_PROJECT', id: sortedProjects[0].id });
                }
            } catch (error) {
                if (!mounted) return;
                dispatch({
                    type: 'SET_ERROR',
                    error: error instanceof Error ? error.message : 'Failed to load projects',
                });
            } finally {
                if (mounted) {
                    dispatch({ type: 'FINISH_LOADING' });
                }
            }
        }

        loadInitialProjects();

        return () => {
            mounted = false;
        };
    }, []);

    return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
    return (
        <ErrorBoundary fallback={<div>Something went wrong with the project system.</div>}>
            <ProjectProviderContent>{children}</ProjectProviderContent>
        </ErrorBoundary>
    );
} 