import { Block } from '@/types/block';
import {
    BlockInput,
    BlockUpdate,
    BlockSearchResult,
    Project,
    ProjectInput,
    ProjectUpdate,
} from '@/types/database';
import { SearchResults } from '@/types/state';
import { getDeviceLocation, getDeviceName } from '@/utils/metadataUtils';

class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiError(response.status, error.error || 'Unknown error');
    }
    return response.json();
}

export async function fetchBlocks(projectId?: string): Promise<Block[]> {
    if (projectId) {
        const response = await fetch(`/api/blocks?projectId=${projectId}`);
        return handleResponse<Block[]>(response);
    }
    const response = await fetch(`/api/blocks`);
    return handleResponse<Block[]>(response);
}

export async function searchBlocks(query: string, projectId?: string): Promise<SearchResults> {
    if (projectId) {
        const response = await fetch(
            `/api/blocks/search?query=${encodeURIComponent(query)}&projectId=${projectId}`
        );
        return handleResponse<SearchResults>(response);
    }
    const response = await fetch(`/api/blocks/search?query=${encodeURIComponent(query)}`);
    return handleResponse<SearchResults>(response);
}

export async function fetchRecommendedBlocks(blockId: string): Promise<Block[]> {
    const response = await fetch(`/api/blocks/recommended/${blockId}`);
    const blocks = await handleResponse<Block[]>(response);
    // Deduplicate blocks by ID
    return Array.from(new Map(blocks.map((block) => [block.id, block])).values());
}

export async function createBlock(block: BlockInput): Promise<Block> {
    const metadata = {
        device: getDeviceName(),
        location: await getDeviceLocation(),
    };

    const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...block, ...metadata }),
    });

    return handleResponse<Block>(response);
}

export async function updateBlock(id: string, block: BlockUpdate): Promise<Block> {
    const metadata = {
        device: getDeviceName(),
        location: await getDeviceLocation(),
    };

    const response = await fetch(`/api/blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...block, ...metadata }),
    });

    return handleResponse<Block>(response);
}

export async function deleteBlock(id: string): Promise<void> {
    const response = await fetch(`/api/blocks/${id}`, {
        method: 'DELETE',
    });

    return handleResponse<void>(response);
}

export async function traceInteractionTime(id: string): Promise<void> {
    const response = await fetch(`/api/metrics/time/${id}`, {
        method: 'POST',
    });

    return handleResponse<void>(response);
}

export async function traceInteractionContext(id: string): Promise<void> {
    const metadata = {
        device: getDeviceName(),
        location: await getDeviceLocation(),
    };

    const response = await fetch(`/api/metrics/context/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
    });

    return handleResponse<void>(response);
}

export async function importBlocks(file: File): Promise<void> {
    const response = await fetch('/api/blocks/import', {
        method: 'POST',
        body: file,
    });

    return handleResponse<void>(response);
}

export async function fetchProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects');
    return handleResponse<Project[]>(response);
}

export async function createProject(project: ProjectInput): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });

    return handleResponse<Project>(response);
}

export async function updateProject(id: string, project: ProjectUpdate): Promise<Project> {
    const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });

    return handleResponse<Project>(response);
}

export async function deleteProject(id: string): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
    });

    return handleResponse<void>(response);
}
