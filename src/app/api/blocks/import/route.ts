import { db } from '@/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { BlockInput } from '@/types/database';
import { Block } from '@/types/block';

interface LogseqBlock {
    id: string;
    content?: string;
    'page-name'?: string;
    children?: LogseqBlock[];
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
    textFormat?: number;
    textStyle?: string;
}

interface LexicalContent {
    root: LexicalNode;
}

async function importFromLogseq(fileContent: string): Promise<Block[]> {
    try {
        // Parse the JSON content
        const logseqData = JSON.parse(fileContent) as LogseqData;

        // Convert Logseq blocks to our format
        const blocks = transformLogseqBlocks(logseqData);

        // Create all blocks in the database
        const createdBlocks = await db.blocks.createManyBlocks(blocks);

        return createdBlocks;
    } catch (error) {
        console.error('Error importing from Logseq:', error);
        throw error;
    }
}

function transformLogseqBlocks(logseqData: LogseqData): BlockInput[] {
    const blocks: BlockInput[] = [];

    function createLexicalContent(text = ''): { content: string } {
        const content: LexicalContent = {
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: 'normal',
                                style: '',
                                text: text || '',
                                type: 'text',
                                version: 1,
                            },
                        ],
                        direction: 'ltr',
                        format: 0,
                        indent: 0,
                        type: 'paragraph',
                        version: 1,
                        textFormat: 0,
                        textStyle: '',
                    },
                ],
                direction: 'ltr',
                format: 0,
                indent: 0,
                type: 'root',
                version: 1,
            },
        };

        return {
            content: JSON.stringify(content),
        };
    }

    function collectContent(block: LogseqBlock): string {
        let content = block.content || '';

        if (Array.isArray(block.children)) {
            const childContent = block.children
                .map((child) => collectContent(child))
                .filter((text) => text) // Remove empty strings
                .join('\n');

            if (childContent) {
                content = content ? `${content}\n${childContent}` : childContent;
            }
        }

        return content;
    }

    function processPage(block: LogseqBlock): void {
        if (!block.id) {
            return;
        }

        // Collect all content from the page and its children
        const fullContent = collectContent(block);

        const blockData: BlockInput = {
            title: block['page-name'] || '',
            ...createLexicalContent(fullContent),
            type: 'text',
        };

        blocks.push(blockData);
    }

    // Process each block in the data that has a page-name (these are our pages)
    if (Array.isArray(logseqData.blocks)) {
        logseqData.blocks
            .filter((block) => block['page-name'])
            .forEach((block) => processPage(block));
    }

    return blocks;
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
        await db.ensureConnection();

        // Parse the form data from the request
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read the file content
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
