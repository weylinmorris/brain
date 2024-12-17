import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export async function POST(_, context) {
    try {
        await db.ensureConnection();

        const { id } = await Promise.resolve(context.params);

        await db.smartLinks.traceTime(id);

        return NextResponse.json({}, { status: 200 });
    } catch (error) {
        console.error('POST /api/metrics/time error:', {
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