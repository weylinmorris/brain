import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { BlockUpdate, GeoLocation } from '@/types/database';
import { Block } from '@/types/block';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
    request: NextRequest,
    context: RouteParams
): Promise<NextResponse<Block | { error: string; details?: string }>> {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await db.ensureConnection();

        const block = await db.blocks.getBlock(id, userId);

        if (!block) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        return NextResponse.json(block);
    } catch (error) {
        console.error('GET /api/blocks/[id] error:', {
            id,
            userId,
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

interface UpdateBlockRequest {
    content?: string;
    title?: string;
    type?: 'text' | 'image' | 'code' | 'math';
    device?: string;
    location?: GeoLocation;
    projectId?: string;
}

export async function PATCH(
    request: Request,
    context: RouteParams
): Promise<NextResponse<Block | { error: string; details?: string }>> {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await db.ensureConnection();

        const body = (await request.json()) as UpdateBlockRequest;

        // Validate fields if they're present
        if (body.content !== undefined && typeof body.content !== 'string') {
            console.warn('PATCH /api/blocks/[id]: Invalid content', { id, content: body.content });
            return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
        }

        if (body.title !== undefined && typeof body.title !== 'string') {
            console.warn('PATCH /api/blocks/[id]: Invalid title', { id, title: body.title });
            return NextResponse.json({ error: 'Title must be a string' }, { status: 400 });
        }

        // Only include fields that are actually present in the request
        const updates: BlockUpdate = {};
        if (body.content !== undefined) updates.content = body.content;
        if (body.title !== undefined) updates.title = body.title;
        if (body.type !== undefined) updates.type = body.type;
        if (body.projectId !== undefined) updates.projectId = body.projectId;

        const block = await db.blocks.updateBlock(id, userId, updates, body.device, body.location);

        return NextResponse.json(block);
    } catch (error) {
        console.error('PATCH /api/blocks/[id] error:', {
            id,
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
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        if (error instanceof Error && error.message === 'Block not found') {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
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

export async function DELETE(
    request: Request,
    context: RouteParams
): Promise<NextResponse<null | { error: string; details?: string }>> {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await db.ensureConnection();

        await db.blocks.deleteBlock(id);

        return NextResponse.json(null);
    } catch (error) {
        console.error('DELETE /api/blocks/[id] error:', {
            id,
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
            return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
        }

        if (error instanceof Error && error.message === 'Block not found') {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
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
