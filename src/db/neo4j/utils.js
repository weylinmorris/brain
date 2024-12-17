const SEGMENTS = {
    EARLY_MORNING: { start: 5, end: 8 },
    MORNING: { start: 9, end: 11 },
    MIDDAY: { start: 12, end: 14 },
    AFTERNOON: { start: 15, end: 17 },
    EVENING: { start: 18, end: 21 },
    NIGHT: { start: 22, end: 4 }
};

const SEASONS = {
    SPRING: [3, 4, 5],
    SUMMER: [6, 7, 8],
    FALL: [9, 10, 11],
    WINTER: [12, 1, 2]
};

export function cosineSimilarity(embeddingA, embeddingB) {
    if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) {
        throw new Error('Both embeddings must be arrays.');
    }
    if (embeddingA.length !== embeddingB.length) {
        throw new Error('Embeddings must have the same length.');
    }

    const dotProduct = embeddingA.reduce((sum, value, index) => sum + value * embeddingB[index], 0);
    const magnitudeA = Math.sqrt(embeddingA.reduce((sum, value) => sum + value ** 2, 0));
    const magnitudeB = Math.sqrt(embeddingB.reduce((sum, value) => sum + value ** 2, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
        throw new Error('One of the embeddings has zero magnitude.');
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

export function generateTimeMetadata(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dayOfWeek = date.getDay(); // 0-6, 0 is Sunday
    const month = date.getMonth() + 1;

    const daySegment = Object.keys(SEGMENTS).find(segment => {
        const { start, end } = SEGMENTS[segment];
        if (end < start) { // Handles overnight segments
            return hour >= start || hour <= end;
        }
        return hour >= start && hour <= end;
    });

    const season = Object.keys(SEASONS).find(s =>
        SEASONS[s].includes(month)
    );

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWorkHours = hour >= 9 && hour <= 17 && !isWeekend;

    return {
        hour,
        minute,
        dayOfWeek,
        daySegment,
        season,
        isWeekend,
        isWorkHours
    };
}

export function getPlainText(content) {
    try {
        // Check if content is empty or not provided
        if (!content || typeof content !== 'string') {
            console.warn('Content is empty or invalid:', content);
            return ''; // Return an empty string for empty content
        }

        // Parse the JSON content
        const parsedContent = JSON.parse(content);

        // Recursive function to extract text from nodes
        const extractText = (node) => {
            if (!node) return '';

            // Handle text nodes
            if (node.type === 'text' && node.text) {
                return node.text;
            }

            // Handle nodes with children
            if (node.children && Array.isArray(node.children)) {
                return node.children.map(extractText).join('');
            }

            return ''; // Fallback for nodes without text or children
        };

        // Start extracting from the root node
        if (parsedContent.root && parsedContent.root.children) {
            return parsedContent.root.children.map(extractText).join('');
        }

        console.warn('Parsed content does not have a valid root or children:', parsedContent);
        return ''; // Return empty string if structure is invalid
    } catch (error) {
        console.error('Failed to parse content or extract plain text:', error);
        return ''; // Return empty string if parsing fails
    }
}
