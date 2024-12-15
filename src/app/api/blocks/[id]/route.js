import { NextResponse } from 'next/server';
import { db } from '@/db/client.js';

export async function GET(request, context) {
    const { id } = await Promise.resolve(context.params);

    try {
        await db.ensureConnection();

        const block = await db.blocks.getBlock(id);

        if (!block) {
            return NextResponse.json(
                { error: 'Block not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(block);
    } catch (error) {
        console.error('GET /api/blocks/[id] error:', {
            id,
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
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

export async function PATCH(request, context) {
    const { id } = await Promise.resolve(context.params);

    try {
        await db.ensureConnection();

        const body = await request.json();

        // Validate fields if they're present
        if (body.content !== undefined && typeof body.content !== 'string') {
            console.warn('PATCH /api/blocks/[id]: Invalid content', { id, content: body.content });
            return NextResponse.json(
                { error: 'Content must be a string' },
                { status: 400 }
            );
        }

        if (body.title !== undefined && typeof body.title !== 'string') {
            console.warn('PATCH /api/blocks/[id]: Invalid title', { id, title: body.title });
            return NextResponse.json(
                { error: 'Title must be a string' },
                { status: 400 }
            );
        }

        // Only include fields that are actually present in the request
        const updates = {};
        if (body.content !== undefined) updates.content = body.content;
        if (body.title !== undefined) updates.title = body.title;
        if (body.parentId !== undefined) updates.parentId = body.parentId;
        if (body.type !== undefined) updates.type = body.type;
        if (body.isPage !== undefined) updates.isPage = body.isPage;

        const block = await db.blocks.updateBlock(id, updates);

        return NextResponse.json(block);
    } catch (error) {
        console.error('PATCH /api/blocks/[id] error:', {
            id,
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        if (error.message === 'Block not found') {
            return NextResponse.json(
                { error: 'Block not found' },
                { status: 404 }
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

export async function DELETE(request, context) {
    const { id } = await Promise.resolve(context.params);

    try {
        await db.ensureConnection();

        await db.blocks.deleteBlock(id);

        return NextResponse.json(null);
    } catch (error) {
        console.error('DELETE /api/blocks/[id] error:', {
            id,
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });

        if (error.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        if (error.message === 'Block not found') {
            return NextResponse.json(
                { error: 'Block not found' },
                { status: 404 }
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