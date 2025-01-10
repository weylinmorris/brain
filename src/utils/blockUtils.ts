import { Block } from '@/types/block';
import { LexicalNode, LexicalContent, PreviewResult } from '@/types/lexical';

// Helper function to extract text from Lexical node and its children
const getPreviewFromLexicalNode = (node: LexicalNode): string => {
    if (!node) return '';
    if (node.text) return node.text;
    if (node.children && Array.isArray(node.children)) {
        return node.children.map((child) => getPreviewFromLexicalNode(child)).join(' ');
    }
    return '';
};

// Helper function to get all text content from Lexical structure
const getAllLexicalContent = (content: LexicalContent): string => {
    if (!content?.root?.children) return '';
    return content.root.children
        .map((node) => getPreviewFromLexicalNode(node))
        .filter((text) => text.length > 0)
        .join(' ');
};

// Helper function to get balanced context around a match
const getBalancedContext = (text: string, matchStart: number, matchLength: number, contextSize: number = 200): string => {
    // Calculate how much context we can show on each side
    const beforeContext = Math.min(matchStart, contextSize);
    const afterContext = Math.min(text.length - (matchStart + matchLength), contextSize);

    // Get the start and end positions
    const start = Math.max(0, matchStart - beforeContext);
    const end = Math.min(text.length, matchStart + matchLength + afterContext);

    // Extract the text
    let preview = text.slice(start, end);

    // Add ellipsis if we're not at the boundaries
    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';

    return preview;
};

// Helper function to generate contextual preview
const generateContextualPreview = (
    content: string,
    searchTerm: string
): PreviewResult => {
    if (!content) {
        return {
            preview: 'Empty block',
            matchStart: -1,
            matchEnd: -1,
        };
    }

    // If no search term, return start of content
    if (!searchTerm) {
        const preview = content.slice(0, 300);
        return {
            preview: preview + (content.length > 300 ? '...' : ''),
            matchStart: -1,
            matchEnd: -1,
        };
    }

    const matchIndex = content.toLowerCase().indexOf(searchTerm.toLowerCase());

    // If no match found, return start of content
    if (matchIndex === -1) {
        const preview = content.slice(0, 300);
        return {
            preview: preview + (content.length > 300 ? '...' : ''),
            matchStart: -1,
            matchEnd: -1,
        };
    }

    // Get balanced context around the match
    const preview = getBalancedContext(content, matchIndex, searchTerm.length);

    // Calculate the new match position relative to our preview
    const previewMatchStart = preview.startsWith('...') ? 
        preview.toLowerCase().indexOf(searchTerm.toLowerCase()) :
        matchIndex;

    return {
        preview,
        matchStart: previewMatchStart,
        matchEnd: previewMatchStart + searchTerm.length,
    };
};

// Get preview from block title
export const getPreviewFromBlock = (block: Block): string => {
    try {
        if (!block?.title) return 'Empty Note';
        return block.title;
    } catch (error) {
        console.error('Error generating preview:', error);
        return 'Error generating preview';
    }
};

// Get preview from block content
export const getPreviewFromBlockContent = (block: Block): string => {
    try {
        if (!block?.content) return 'Empty note';

        const content = JSON.parse(block.content) as LexicalContent;
        const allContent = getAllLexicalContent(content);

        if (!allContent) return 'Empty note';
        return allContent;
    } catch (error) {
        console.error('Error parsing Lexical content:', error);
        return 'Error parsing content';
    }
};

// Get contextual preview from block title
export const getContextualPreviewTitle = (
    block: Block,
    searchTerm: string
): PreviewResult | string => {
    try {
        if (!block?.title) return 'Empty Note';
        return generateContextualPreview(block.title, searchTerm);
    } catch (error) {
        console.error('Error generating contextual preview:', error);
        return 'Error generating preview';
    }
};

// Get contextual preview from block content
export const getContextualPreviewContent = (
    block: Block,
    searchTerm: string
): PreviewResult | string => {
    try {
        const content = JSON.parse(block.content) as LexicalContent;
        const allContent = getAllLexicalContent(content);
        if (!allContent) return 'Empty note';
        return generateContextualPreview(allContent, searchTerm);
    } catch (error) {
        console.error('Error parsing Lexical content:', error);
        return 'Error parsing content';
    }
};
