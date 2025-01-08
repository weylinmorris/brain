import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { classifyQuery, generateAnswer } from '@/utils/aiUtils';

export async function GET(request) {
    console.log('\n[Search Route] Starting new search request');
    console.time('[Search Route] Total request time');
    
    try {
        await db.ensureConnection();
        console.log('[Search Route] Database connection established');

        // get query from the ?query= parameter
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        console.log('[Search Route] Received query:', query);

        // Classify the query
        console.time('[Search Route] Query classification');
        const queryType = await classifyQuery(query);
        console.timeEnd('[Search Route] Query classification');
        console.log('[Search Route] Query classified as:', queryType);
        
        // Get relevant blocks with appropriate threshold
        const threshold = queryType === 'question' ? 0.15 : 0.25;
        console.log(`[Search Route] Using similarity threshold: ${threshold}`);
        console.time('[Search Route] Block search');
        const blocks = await db.blocks.searchBlocks(query, threshold);
        console.timeEnd('[Search Route] Block search');
        console.log(`[Search Route] Found ${blocks.length} relevant blocks`);

        // For questions, generate an answer using the relevant blocks
        if (queryType === 'question' && blocks.length > 0) {
            console.log('[Search Route] Generating answer from blocks');
            console.time('[Search Route] Answer generation');
            const { answer, sources } = await generateAnswer(query, blocks);
            console.timeEnd('[Search Route] Answer generation');
            console.log('[Search Route] Answer generated with', sources.length, 'sources');
            
            console.timeEnd('[Search Route] Total request time');
            return NextResponse.json({
                type: 'question',
                answer,
                sources,
                blocks: blocks || []
            });
        }

        // For regular searches, return just the blocks
        console.log('[Search Route] Returning search results');
        console.timeEnd('[Search Route] Total request time');
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
            console.timeEnd('[Search Route] Total request time');
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        console.timeEnd('[Search Route] Total request time');
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message
            },
            { status: 500 }
        );
    }
}