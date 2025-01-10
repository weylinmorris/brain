import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { Block } from '@/types/block';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
    request: NextRequest,
    context: RouteParams
): Promise<NextResponse<Block[] | { error: string; details?: string }>> {
    const { id } = await context.params;

    try {
        await db.ensureConnection();

        const blocks = await db.smartLinks.getRelatedBlockRecommendations(id);

        return NextResponse.json(blocks || []);
    } catch (error) {
        console.error('GET /api/blocks/recommended error:', {
            name: error instanceof Error ? error.name : 'Unknown error',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            cause: error instanceof Error ? error.cause : undefined,
            code: error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined
        });

        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ECONNREFUSED') {
            console.error('GET /api/blocks/recommended: Database connection refused');
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 