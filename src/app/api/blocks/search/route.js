import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function GET(request) {
    try {
        await db.ensureConnection();

        // get query from the ?query= parameter
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        const blocks = await db.blocks.searchBlocks(query);

        return NextResponse.json(blocks || []);
    } catch (error) {
        console.error('GET /api/blocks error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            console.error('GET /api/blocks: Database connection refused');
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