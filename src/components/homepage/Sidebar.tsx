'use client';

import React, { useState } from 'react';
import { LogOut, Plus, FolderOpen, Folder, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { ContextMenu } from '@/components/global/ContextMenu';

function Sidebar() {
    const { data: session } = useSession();
    const { projects, activeProject, isLoading, error, create, update, remove, setActiveProject } =
        useProject();
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim() && session?.user?.id) {
            try {
                await create({
                    name: newProjectName,
                    userId: session.user.id,
                });
                setNewProjectName('');
                setIsCreatingProject(false);
            } catch (error) {
                console.error('Failed to create project:', error);
            }
        }
    };

    const handleUpdateProject = async (id: string, newName: string) => {
        try {
            await update(id, { name: newName });
            setEditingProject(null);
        } catch (error) {
            console.error('Failed to update project:', error);
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            await remove(id);
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const handleSignOut = () => signOut({ redirect: true, callbackUrl: '/auth/signin' });

    const ProjectActions = ({ project }: { project: { id: string; name: string } }) => {
        const isOpen = openMenuId === project.id;

        const menuItems = [
            {
                label: 'Rename',
                icon: <Edit2 size={14} />,
                onClick: () => setEditingProject(project.id),
            },
            {
                label: 'Delete',
                icon: <Trash2 size={14} />,
                onClick: () => handleDeleteProject(project.id),
                className:
                    'flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700',
            },
        ];

        return (
            <ContextMenu
                items={menuItems}
                isOpen={isOpen}
                onOpenChange={(open) => setOpenMenuId(open ? project.id : null)}
            />
        );
    };

    if (isLoading) {
        return (
            <div className="mt-4 flex h-screen w-80 justify-center bg-neutral-100 text-sm text-neutral-300 dark:bg-neutral-900 dark:text-neutral-400">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-80 flex-col items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-900">
                <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
                <p className="text-center text-sm text-neutral-900 dark:text-white">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-80 flex-col bg-neutral-100 dark:bg-neutral-900">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {activeProject ? activeProject.name : 'All Projects'}
                </h1>
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
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400"
                    />
                </div>
                {!isCreatingProject ? (
                    <button
                        onClick={() => setIsCreatingProject(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        <Plus size={16} />
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
                                className="flex-1 rounded-lg bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreatingProject(false);
                                    setNewProjectName('');
                                }}
                                className="flex-1 rounded-lg border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Projects List */}
            <div className="isolate flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveProject(null)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setActiveProject(null);
                            }
                        }}
                        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-neutral-200 dark:hover:bg-neutral-700 ${!activeProject ? 'bg-neutral-200 dark:bg-neutral-700' : ''}`}
                    >
                        {!activeProject ? (
                            <FolderOpen
                                size={18}
                                className="text-primary-600 dark:text-primary-400"
                            />
                        ) : (
                            <Folder size={18} className="text-neutral-500 dark:text-neutral-400" />
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                All Projects
                            </div>
                        </div>
                    </div>
                    {filteredProjects
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((project) => (
                            <div key={project.id} className="relative">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveProject(project.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setActiveProject(project.id);
                                        }
                                    }}
                                    className={`group relative flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
                                        activeProject?.id === project.id
                                            ? 'bg-neutral-200 dark:bg-neutral-700'
                                            : ''
                                    } cursor-pointer`}
                                >
                                    {activeProject?.id === project.id ? (
                                        <FolderOpen
                                            size={18}
                                            className="text-primary-600 dark:text-primary-400"
                                        />
                                    ) : (
                                        <Folder
                                            size={18}
                                            className="text-neutral-500 dark:text-neutral-400"
                                        />
                                    )}
                                    <div className="flex-1 overflow-hidden">
                                        {editingProject === project.id ? (
                                            <input
                                                type="text"
                                                defaultValue={project.name}
                                                autoFocus
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                                    handleUpdateProject(project.id, e.target.value)
                                                }
                                                onKeyDown={(
                                                    e: React.KeyboardEvent<HTMLInputElement>
                                                ) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateProject(
                                                            project.id,
                                                            e.currentTarget.value
                                                        );
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
                                                <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                                                    {project.name}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!editingProject && <ProjectActions project={project} />}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
