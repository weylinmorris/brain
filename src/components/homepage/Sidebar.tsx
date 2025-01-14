'use client';

import React, { useState } from 'react';
import { LogOut, Plus, FolderOpen, Folder, Search, Edit2, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { formatRelativeTime } from '@/utils/dateUtils';
import { useToast } from '@/context/ToastContext';
import { TabType } from '@/app/page';

interface SidebarProps {
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

function Sidebar({ setActiveTab }: SidebarProps) {
    const { data: session } = useSession();
    const { projects, activeProject, isLoading, error, create, update, remove, setActiveProject } = useProject();
    const { addToast } = useToast();
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim() && session?.user?.id) {
            try {
                await create({
                    name: newProjectName,
                    userId: session.user.id
                });
                setNewProjectName('');
                setIsCreatingProject(false);
                addToast('Project created successfully', 'success');
            } catch (error) {
                console.error('Failed to create project:', error);
                addToast('Failed to create project', 'error');
            }
        }
    };

    const handleUpdateProject = async (id: string, newName: string) => {
        try {
            await update(id, { name: newName });
            setEditingProject(null);
            addToast('Project updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update project:', error);
            addToast('Failed to update project', 'error');
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            await remove(id);
            setShowDeleteConfirm(null);
            addToast('Project deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete project:', error);
            addToast('Failed to delete project', 'error');
        }
    };

    const handleSignOut = () => signOut({ redirect: true, callbackUrl: '/auth/signin' });

    const ProjectActions = ({ project }: { project: { id: string; name: string } }) => (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project.id);
                    }}
                    className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-600"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(project.id);
                    }}
                    className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-600"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    if (isLoading) {
        return <div className="flex h-screen w-96 items-center justify-center bg-neutral-50 dark:bg-neutral-800">Loading...</div>;
    }

    if (error) {
        return (
            <div className="flex h-screen w-96 flex-col items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-800">
                <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
                <p className="text-center text-sm text-neutral-900 dark:text-white">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-96 flex-col bg-neutral-50 dark:bg-neutral-800">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Projects</h1>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={handleSignOut}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        aria-label="Sign out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Search and New Project */}
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                    />
                </div>
                {!isCreatingProject ? (
                    <button 
                        onClick={() => setIsCreatingProject(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
                    >
                        <Plus size={18} />
                        <span>New Project</span>
                    </button>
                ) : (
                    <form onSubmit={handleCreateProject} className="space-y-2">
                        <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name"
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 rounded-lg bg-primary-600 px-3 py-1 text-sm font-medium text-white hover:bg-primary-700"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreatingProject(false);
                                    setNewProjectName('');
                                }}
                                className="flex-1 rounded-lg bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* View All Projects Button */}
            <button 
                onClick={() => setActiveProject(null)}
                className="flex items-center justify-between border-b border-neutral-200 p-4 text-neutral-900 hover:bg-neutral-200 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
            >
                <span className="font-medium">All Projects</span>
                <ChevronRight size={18} />
            </button>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                    {filteredProjects.map(project => (
                        <div key={project.id}>
                            {showDeleteConfirm === project.id ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/50">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <p className="text-sm">Delete "{project.name}"?</p>
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            className="rounded bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveProject(project.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setActiveProject(project.id);
                                        }
                                    }}
                                    className={`group relative flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
                                        activeProject?.id === project.id ? 'bg-neutral-200 dark:bg-neutral-700' : ''
                                    } cursor-pointer`}
                                >
                                    {activeProject?.id === project.id ? (
                                        <FolderOpen size={18} className="text-primary-600 dark:text-primary-400" />
                                    ) : (
                                        <Folder size={18} className="text-neutral-500 dark:text-neutral-400" />
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        {editingProject === project.id ? (
                                            <input
                                                type="text"
                                                defaultValue={project.name}
                                                autoFocus
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleUpdateProject(project.id, e.target.value)}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateProject(project.id, e.currentTarget.value);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingProject(null);
                                                    }
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                                            />
                                        ) : (
                                            <>
                                                <div className="truncate font-medium text-neutral-900 dark:text-white">
                                                    {project.name}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {formatRelativeTime(project.updatedAt)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!editingProject && <ProjectActions project={project} />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
