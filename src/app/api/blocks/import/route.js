import {db} from "@/db/client.js";
import {NextResponse} from "next/server";

async function importFromLogseq(fileContent) {
    try {
        // Parse the JSON content
        const logseqData = JSON.parse(fileContent);

        // Convert Logseq blocks to our format
        const blocks = transformLogseqBlocks(logseqData);

        // Create all blocks in the database
        await db.blocks.createManyBlocks(blocks);

        return blocks;
    } catch (error) {
        console.error('Error importing from Logseq:', error);
        throw error;
    }
}

function transformLogseqBlocks(logseqData) {
    const blocks = [];

    function createLexicalContent(text = '') {
        return {
            content: JSON.stringify({
                root: {
                    children: [
                        {
                            children: [
                                {
                                    detail: 0,
                                    format: 0,
                                    mode: "normal",
                                    style: "",
                                    text: text || '',
                                    type: "text",
                                    version: 1
                                }
                            ],
                            direction: "ltr",
                            format: "",
                            indent: 0,
                            type: "paragraph",
                            version: 1,
                            textFormat: 0,
                            textStyle: ""
                        }
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "root",
                    version: 1
                }
            })
        };
    }

    function collectContent(block) {
        let content = block.content || '';

        if (Array.isArray(block.children)) {
            const childContent = block.children
                .map(child => collectContent(child))
                .filter(text => text) // Remove empty strings
                .join('\n');

            if (childContent) {
                content = content ? `${content}\n${childContent}` : childContent;
            }
        }

        return content;
    }

    function processPage(block) {
        if (!block.id) {
            return;
        }

        // Collect all content from the page and its children
        const fullContent = collectContent(block);

        const blockData = {
            id: block.id,
            title: block['page-name'] || '',
            ...createLexicalContent(fullContent),
            type: 'text',
            isPage: true,
        };

        blocks.push(blockData);
    }

    // Process each block in the data that has a page-name (these are our pages)
    if (Array.isArray(logseqData.blocks)) {
        logseqData.blocks
            .filter(block => block['page-name'])
            .forEach(block => processPage(block));
    }

    return blocks;
}

export async function POST(request) {
    try {
        await db.ensureConnection();

        // Parse the form data from the request
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Read the file content
        const fileContent = await file.text();

        const importedBlocks = await importFromLogseq(fileContent);

        return NextResponse.json({
            success: true,
            importedCount: importedBlocks.length,
            blocks: importedBlocks
        });

    } catch (error) {
        console.error('POST /api/logseq/import error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message
            },
            { status: 500 }
        );
    }
}