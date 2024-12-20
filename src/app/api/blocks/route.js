// app/api/blocks/route.js
import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function GET(request) {
    try {
        await db.ensureConnection();

        const blocks = await db.blocks.getBlocks();

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

export async function POST(request) {
    try {
        await db.ensureConnection();

        const body = await request.json();

        // Ensure required fields with defaults
        const blockData = {
            title: body.title ?? '',
            content: body.content ?? '',
            parentId: body.parentId ?? null,
            type: body.type ?? 'text',
            isPage: body.isPage ?? false,
            device: body.device ?? null,
            location: body.location ?? null
        };

        const block = await db.blocks.createBlock(blockData);

        // Ensure the response includes all required fields
        const response = {
            ...block,
            title: block.title ?? '',
            parentId: block.parentId ?? null,
            type: block.type ?? 'text',
            isPage: block.isPage ?? false
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('POST /api/blocks error:', {
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