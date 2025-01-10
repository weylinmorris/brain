import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
    _: NextRequest,
    context: RouteParams
): Promise<NextResponse<Record<string, never> | { error: string; details?: string }>> {
    try {
        await db.ensureConnection();

        const { id } = await context.params;

        await db.smartLinks.traceTime(id, 'VIEW');

        return NextResponse.json({}, { status: 200 });
    } catch (error) {
        console.error('POST /api/metrics/time error:', {
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
