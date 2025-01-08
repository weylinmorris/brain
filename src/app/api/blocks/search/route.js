import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { classifyQuery, generateAnswer } from '@/utils/aiUtils';

export async function GET(request) {
    try {
        await db.ensureConnection();

        // get query from the ?query= parameter
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        // Classify the query
        const queryType = await classifyQuery(query);
        
        const blocks = await db.blocks.searchBlocks(query, 25);

        // For questions, generate an answer using the relevant blocks
        if (queryType === 'question' && blocks.length > 0) {
            const { answer, sources } = await generateAnswer(query, blocks);
            
            return NextResponse.json({
                type: 'question',
                answer,
                sources,
                blocks: blocks || []
            });
        }

        // For regular searches, return just the blocks
        return NextResponse.json({ 
            type: 'search',
            blocks: blocks || []
        });
    } catch (error) {
        console.error('[Search Route] Error processing request:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            console.error('[Search Route] Database connection refused');
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message
            },
            { status: 500 }
        );
    }
}