import { DaySegment, Season, TimeMetadata } from '@/types/database';

interface TimeSegment {
    start: number;
    end: number;
}

interface TimeSegments {
    [key: string]: TimeSegment;
}

interface SeasonMonths {
    [key: string]: number[];
}

const SEGMENTS: TimeSegments = {
    EARLY_MORNING: { start: 5, end: 8 },
    MORNING: { start: 9, end: 11 },
    MIDDAY: { start: 12, end: 14 },
    AFTERNOON: { start: 15, end: 17 },
    EVENING: { start: 18, end: 21 },
    NIGHT: { start: 22, end: 4 },
};

const SEASONS: SeasonMonths = {
    SPRING: [3, 4, 5],
    SUMMER: [6, 7, 8],
    FALL: [9, 10, 11],
    WINTER: [12, 1, 2],
};

export function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
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

export function generateTimeMetadata(date: Date): TimeMetadata {
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0-6, 0 is Sunday

    // Initialize arrays for common hours and days
    const commonHours = Array(24).fill(0);
    commonHours[hour] = 1;

    const commonDays = Array(7).fill(0);
    commonDays[dayOfWeek] = 1;

    // Initialize segments with 0 counts
    const commonSegments = {
        EARLY_MORNING: 0,
        MORNING: 0,
        MIDDAY: 0,
        AFTERNOON: 0,
        EVENING: 0,
        NIGHT: 0,
    };

    // Determine current segment and set its count to 1
    const currentSegment = Object.keys(SEGMENTS).find((segment) => {
        const { start, end } = SEGMENTS[segment];
        if (end < start) {
            // Handles overnight segments
            return hour >= start || hour <= end;
        }
        return hour >= start && hour <= end;
    }) as DaySegment;

    commonSegments[currentSegment] = 1;

    return {
        commonHours,
        commonDays,
        commonSegments,
        totalInteractions: 1,
        lastInteraction: date,
    };
}

interface TextNode {
    type: string;
    text?: string;
    children?: TextNode[];
}

interface RootNode {
    root: {
        children?: TextNode[];
    };
}

export function getPlainText(content: string): string {
    console.log('=== getPlainText START ===');
    console.log('Input content:', content);
    console.log('Content type:', typeof content);

    try {
        // Check if content is empty or not provided
        if (!content || typeof content !== 'string') {
            console.warn('Content validation failed:', {
                isEmpty: !content,
                type: typeof content,
                content,
            });
            return '';
        }

        // Parse the JSON content
        console.log('Attempting to parse JSON content...');
        const parsedContent = JSON.parse(content) as RootNode;
        console.log('Parsed content:', parsedContent);

        // Recursive function to extract text from nodes
        const extractText = (node: TextNode): string => {
            console.log('Processing node:', {
                type: node?.type,
                hasText: !!node?.text,
                hasChildren: !!node?.children,
                childrenCount: node?.children?.length,
            });

            if (!node) {
                console.log('Node is null/undefined');
                return '';
            }

            // Handle text nodes
            if (node.type === 'text' && node.text) {
                console.log('Found text node:', node.text);
                return node.text;
            }

            // Handle nodes with children
            if (node.children && Array.isArray(node.children)) {
                console.log(`Processing ${node.children.length} children`);
                const result = node.children.map(extractText).join('');
                console.log('Combined children result:', result);
                return result;
            }

            console.log('No text or children found in node');
            return '';
        };

        // Start extracting from the root node
        if (parsedContent.root && parsedContent.root.children) {
            console.log(`Processing root with ${parsedContent.root.children.length} children`);
            const result = parsedContent.root.children.map(extractText).join('');
            console.log('Final result:', result);
            return result;
        }

        console.warn('Invalid content structure:', {
            hasRoot: !!parsedContent.root,
            hasChildren: !!parsedContent.root?.children,
        });
        return '';
    } catch (error) {
        console.error('Error in getPlainText:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            content: content.slice(0, 100) + '...', // Show first 100 chars of content
        });
        return '';
    } finally {
        console.log('=== getPlainText END ===');
    }
}
