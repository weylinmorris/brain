// Helper function to extract text from Lexical node and its children
const getPreviewFromLexicalNode = (node) => {
    if (!node) return '';
    if (node.text) return node.text;
    if (node.children && Array.isArray(node.children)) {
        return node.children.map(child => getPreviewFromLexicalNode(child)).join(' ');
    }
    return '';
};

// Helper function to get all text content from Lexical structure
const getAllLexicalContent = (content) => {
    if (!content?.root?.children) return '';
    return content.root.children
        .map(node => getPreviewFromLexicalNode(node))
        .filter(text => text.length > 0)
        .join(' ');
};

// Helper function to generate fixed-length contextual preview
const generateContextualPreview = (content, searchTerm, previewLength = 100) => {
    if (!content) {
        return {
            preview: 'Empty block',
            matchStart: -1,
            matchEnd: -1
        };
    }

    // If no search term, return centered preview
    if (!searchTerm) {
        if (content.length <= previewLength) {
            return {
                preview: content,
                matchStart: -1,
                matchEnd: -1
            };
        }

        const start = 0;
        return {
            preview: content.substring(start, start + previewLength) + '...',
            matchStart: -1,
            matchEnd: -1
        };
    }

    const matchIndex = content.toLowerCase().indexOf(searchTerm.toLowerCase());

    // If no match found, return start of content
    if (matchIndex === -1) {
        return {
            preview: content.substring(0, previewLength) + '...',
            matchStart: -1,
            matchEnd: -1
        };
    }

    // Calculate the available space on each side of the match
    const matchLength = searchTerm.length;
    let leftPad = Math.floor((previewLength - matchLength) / 2);
    let rightPad = previewLength - matchLength - leftPad;

    // Calculate initial start and end positions
    let start = matchIndex - leftPad;
    let end = matchIndex + matchLength + rightPad;

    // Adjust padding if we're near the edges
    if (start < 0) {
        // If start would be negative, adjust right padding
        rightPad += Math.abs(start);
        start = 0;
        end = Math.min(content.length, previewLength);
    } else if (end > content.length) {
        // If end would exceed content length, adjust left padding
        const excess = end - content.length;
        start = Math.max(0, start - excess);
        end = content.length;
    }

    // Get the preview text
    const preview = content.slice(start, end);

    // Add ellipsis and track if we added it at the start
    const hasLeadingEllipsis = start > 0;
    const hasTrailingEllipsis = end < content.length;
    const finalPreview =
        (hasLeadingEllipsis ? '...' : '') +
        preview +
        (hasTrailingEllipsis ? '...' : '');

    // Calculate match positions in the preview, accounting for leading ellipsis
    const ellipsisOffset = hasLeadingEllipsis ? 3 : 0;
    const previewMatchStart = matchIndex - start + ellipsisOffset;

    return {
        preview: finalPreview,
        matchStart: previewMatchStart,
        matchEnd: previewMatchStart + matchLength
    };
};

// Get preview from block title
export const getPreviewFromBlock = (block) => {
    try {
        if (!block?.title) return 'Empty block';
        const firstLine = block.title.split('\n')[0];
        return firstLine.length > 40
            ? firstLine.substring(0, 40) + '...'
            : firstLine;
    } catch (error) {
        console.error('Error generating preview:', error);
        return 'Error generating preview';
    }
};

// Get preview from block content
export const getPreviewFromBlockContent = (block, previewLength = 100) => {
    try {
        const content = JSON.parse(block.content);
        const allContent = getAllLexicalContent(content);

        if (!allContent) return 'Empty block';

        return allContent.length > previewLength
            ? allContent.substring(0, previewLength) + '...'
            : allContent;
    } catch (error) {
        console.error('Error parsing Lexical content:', error);
        return 'Error parsing content';
    }
};

// Get contextual preview from block title
export const getContextualPreviewTitle = (block, searchTerm, previewLength = 100) => {
    try {
        return generateContextualPreview(block.title, searchTerm, previewLength);
    } catch (error) {
        console.error('Error generating contextual preview:', error);
        return 'Error generating preview';
    }
};

// Get contextual preview from block content
export const getContextualPreviewContent = (block, searchTerm, previewLength = 100) => {
    try {
        const content = JSON.parse(block.content);
        const allContent = getAllLexicalContent(content);

        return generateContextualPreview(allContent, searchTerm, previewLength);
    } catch (error) {
        console.error('Error parsing Lexical content:', error);
        return 'Error parsing content';
    }
};