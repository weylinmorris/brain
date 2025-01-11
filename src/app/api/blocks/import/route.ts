import { db } from '@/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { BlockInput } from '@/types/database';
import { Block } from '@/types/block';

interface LogseqBlock {
    id: string;
    content?: string;
    'page-name'?: string;
    children?: LogseqBlock[];
    properties?: any;
    format?: string;
}

interface LogseqData {
    blocks: LogseqBlock[];
}

interface LexicalNode {
    type: string;
    version: number;
    children?: LexicalNode[];
    text?: string;
    detail?: number;
    format?: number;
    mode?: string;
    style?: string;
    direction?: string;
    indent?: number;
    tag?: string;
    textFormat?: number;
    textStyle?: string;
    listType?: string;
    start?: number;
    value?: number;
}

interface LexicalContent {
    root: LexicalNode;
}

function parseDate(dateStr: string): Date {
    if (!isDateString(dateStr)) {
        throw new Error('Invalid date format');
    }

    const match = dateStr.match(/^([A-Z][a-z]+) (\d{1,2})(?:st|nd|rd|th)?, (\d{4})$/);
    if (!match) {
        throw new Error('Invalid date format');
    }

    const [_, month, day, year] = match; // Ensure we create the date in UTC to avoid timezone issues
    return new Date(
        Date.UTC(parseInt(year), new Date(`${month} 1, 2000`).getMonth(), parseInt(day))
    );
}

function isDateString(str: string): boolean {
    // Only allow "Month Day, Year" format (e.g., "May 15th, 2024")
    return /^[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?, \d{4}$/.test(str);
}

function createTextNode(text: string, format: number = 0) {
    return {
        detail: 0,
        format: format,
        mode: 'normal',
        style: '',
        text: text,
        type: 'text',
        version: 1,
    };
}

function convertLogseqToLexical(
    block: LogseqBlock,
    indent: number = 0,
    isJournalEntry: boolean = false
): LexicalNode[] {
    let nodes: LexicalNode[] = []; // Only create h1 for page-name if it's not a journal entry
    if (block['page-name'] && !isJournalEntry) {
        nodes.push({
            children: [createTextNode(block['page-name'])],
            direction: 'ltr',
            format: 0,
            indent: 0,
            type: 'heading',
            version: 1,
            tag: 'h1',
        });
    } // Handle content
    if (block.content) {
        // Check for markdown formatting
        let format = 0;
        let content = block.content;
        if (content.startsWith('**') && content.endsWith('**')) {
            format = 1; // bold
            content = content.slice(2, -2);
        } else if (content.startsWith('*') && content.endsWith('*')) {
            format = 2; // italic
            content = content.slice(1, -1);
        } else if (content.startsWith('__') && content.endsWith('__')) {
            format = 8; // underline
            content = content.slice(2, -2);
        } // Handle hashtags as paragraphs with bold formatting

        if (content.startsWith('#')) {
            const headerText = content.substring(1);
            nodes.push({
                children: [createTextNode(headerText)],
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 1, // Make hashtag content bold
            });
        } else {
            nodes.push({
                children: [createTextNode(content, format)],
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'paragraph',
                version: 1,
            });
        }
    } // Process children recursively

    if (block.children && block.children.length > 0) {
        const listItems = block.children.map((child, index) => ({
            children: convertLogseqToLexical(child, indent, isJournalEntry),
            direction: 'ltr',
            format: 0,
            indent: indent,
            type: 'listitem',
            version: 1,
            value: index + 1,
        }));

        nodes.push({
            children: listItems,
            direction: 'ltr',
            format: 0,
            indent: indent,
            type: 'list',
            version: 1,
            listType: 'bullet',
            start: 1,
            tag: 'ul',
        });
    }

    return nodes;
}

function transformLogseqBlocks(logseqData: LogseqData): BlockInput[] {
    const blocks: BlockInput[] = [];
    const journalEntries: LogseqBlock[] = [];
    const regularPages: LogseqBlock[] = []; // First, separate journal entries from regular pages

    if (Array.isArray(logseqData.blocks)) {
        logseqData.blocks
            .filter((block) => block['page-name'])
            .forEach((block) => {
                const pageName = block['page-name'] || ''; // Strictly validate date format
                try {
                    if (isDateString(pageName)) {
                        parseDate(pageName); // This will throw if date is invalid
                        journalEntries.push(block);
                    } else {
                        regularPages.push(block);
                    }
                } catch {
                    regularPages.push(block);
                }
            });
    } // Process regular pages normally

    function processPage(block: LogseqBlock): void {
        if (!block.id) {
            return;
        } // Convert the block and its children to Lexical format

        const lexicalNodes = convertLogseqToLexical(block); // Create the full Lexical content structure
        const content: LexicalContent = {
            root: {
                children: lexicalNodes,
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'root',
                version: 1,
            },
        };

        const blockData: BlockInput = {
            title: block['page-name'] || '',
            content: JSON.stringify(content),
            type: 'text',
        };

        blocks.push(blockData);
    } // Process all journal entries into a single block

    if (journalEntries.length > 0) {
        // Sort journal entries by date (newest first)
        journalEntries.sort((a, b) => {
            try {
                const dateA = parseDate(a['page-name'] || '');
                const dateB = parseDate(b['page-name'] || '');
                return dateB.getTime() - dateA.getTime();
            } catch {
                return 0; // Keep original order if dates can't be parsed
            }
        });

        const combinedNodes: LexicalNode[] = [];
        journalEntries.forEach((entry, index) => {
            // Add entry content with date as h1
            combinedNodes.push({
                children: [createTextNode(entry['page-name'] || '')],
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'heading',
                version: 1,
                tag: 'h1',
            }); // Add entry content

            const entryNodes = convertLogseqToLexical(entry, 0, true);
            combinedNodes.push(...entryNodes); // Add extra newline between entries (except for the last one)

            if (index < journalEntries.length - 1) {
                combinedNodes.push({
                    children: [createTextNode('')],
                    direction: 'ltr',
                    format: 0,
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                });
            }
        }); // Create the journal block

        const journalContent: LexicalContent = {
            root: {
                children: combinedNodes,
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'root',
                version: 1,
            },
        };

        blocks.push({
            title: 'Journal',
            content: JSON.stringify(journalContent),
            type: 'text',
        });
    } // Process regular pages

    regularPages.forEach((block) => processPage(block));

    return blocks;
}

async function importFromLogseq(fileContent: string): Promise<Block[]> {
    try {
        // Parse the JSON content
        const logseqData = JSON.parse(fileContent) as LogseqData; // Convert Logseq blocks to our format
        const blocks = transformLogseqBlocks(logseqData); // Create all blocks in the database
        const createdBlocks = await db.blocks.createManyBlocks(blocks);
        return createdBlocks;
    } catch (error) {
        console.error('Error importing from Logseq:', error);
        throw error;
    }
}

interface ImportResponse {
    success: boolean;
    importedCount: number;
    blocks: Block[];
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<ImportResponse | { error: string; details?: string }>> {
    try {
        await db.ensureConnection(); // Parse the form data from the request

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        } // Read the file content

        const fileContent = await file.text();

        const importedBlocks = await importFromLogseq(fileContent);

        return NextResponse.json({
            success: true,
            importedCount: importedBlocks.length,
            blocks: importedBlocks,
        });
    } catch (error) {
        console.error('POST /api/logseq/import error:', {
            name: error instanceof Error ? error.name : 'Unknown error',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            cause: error instanceof Error ? error.cause : undefined,
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
