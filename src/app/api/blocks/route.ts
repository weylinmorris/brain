import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { BlockInput } from '@/types/database';
import { Block } from '@/types/block';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET(
    request: NextRequest
): Promise<NextResponse<Block[] | { error: string; details?: string }>> {
    try {
        await db.ensureConnection();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const blocks = await db.blocks.getBlocks(userId);

        return NextResponse.json(blocks || []);
    } catch (error) {
        console.error('GET /api/blocks error:', {
            name: error instanceof Error ? error.name : 'Unknown error',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            cause: error instanceof Error ? error.cause : undefined,
            code:
                error instanceof Error && 'code' in error
                    ? (error as { code: string }).code
                    : undefined,
        });

        if (
            error instanceof Error &&
            'code' in error &&
            (error as { code: string }).code === 'ECONNREFUSED'
        ) {
            console.error('GET /api/blocks: Database connection refused');
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

interface CreateBlockRequest {
    title?: string;
    content?: string;
    parentId?: string | null;
    type?: 'text' | 'image' | 'code' | 'math';
    isPage?: boolean;
    device?: string | null;
    location?: { lat: number; lng: number } | null;
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<Block | { error: string; details?: string }>> {
    try {
        await db.ensureConnection();

        const body = (await request.json()) as CreateBlockRequest;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Ensure required fields with defaults
        const blockData: BlockInput = {
            userId: userId,
            title: body.title ?? '',
            content: body.content ?? '',
            type: body.type ?? 'text',
            device: body.device ?? undefined,
            location: body.location ?? undefined,
        };

        const block = await db.blocks.createBlock(blockData);

        return NextResponse.json(block);
    } catch (error) {
        console.error('POST /api/blocks error:', {
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
