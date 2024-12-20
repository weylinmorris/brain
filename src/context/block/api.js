import {getDeviceLocation, getDeviceName} from "@/utils/metadataUtils.js";

export async function fetchBlocks() {
    try {
        const response = await fetch('/api/blocks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading pages:', error);
        throw error;
    }
}

export async function searchBlocks(query) {
    try {
        const response = await fetch(`/api/blocks/search?query=${query}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching blocks:', error);
        throw error;
    }
}

export async function fetchRecommendedBlocks(blockId) {
    try {
        const response = await fetch(`/api/blocks/recommended/${blockId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading recommended blocks:', error);
        throw error;
    }
}

export async function createBlock(block) {
    const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...block,
            device: getDeviceName(),
            location: await getDeviceLocation()
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

export async function updateBlock(block) {
    const response = await fetch(`/api/blocks/${block.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...block,
            device: getDeviceName(),
            location: await getDeviceLocation()
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

export async function deleteBlock(id) {
    const response = await fetch(`/api/blocks/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

export async function traceInteractionTime(id) {
    const response = await fetch(`/api/metrics/time/${id}`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

export async function traceInteractionContext(id) {
    const response = await fetch(`/api/metrics/context/${id}`, {
        method: 'POST',
        body: JSON.stringify({
            device: getDeviceName(),
            location: await getDeviceLocation()
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}
