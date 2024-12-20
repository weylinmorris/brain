import {NextResponse} from 'next/server';
import { db } from '@/db/client';

export async function POST(request, context) {
    try {
        await db.ensureConnection();

        const body = await request.json();

        const { id } = await Promise.resolve(context.params);

        await db.smartLinks.traceContext(id, body.device, body.location);

        return NextResponse.json({}, { status: 200 });
    } catch (error) {
        console.error('POST /api/metrics/context error:', {
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