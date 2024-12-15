import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function GET(request, context) {
    const { id } = await Promise.resolve(context.params);

    try {
        await db.ensureConnection();

        const blocks = await db.similarities.getRecommendations(id);

        return NextResponse.json(blocks || []);
    } catch (error) {
        console.error('GET /api/blocks/recommended error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            console.error('GET /api/blocks/recommended: Database connection refused');
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