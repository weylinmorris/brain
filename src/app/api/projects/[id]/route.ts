import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { ProjectUpdate } from '@/types/database';
import { Project } from '@/types/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
    request: NextRequest,
    context: RouteParams
): Promise<NextResponse<Project | { error: string; details?: string }>> {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await db.ensureConnection();

        const project = await db.projects.getProject(id, userId);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('GET /api/projects/[id] error:', {
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

interface UpdateProjectRequest {
    name?: string;
    description?: string;
}

export async function PATCH(
    request: Request,
    context: RouteParams
): Promise<NextResponse<Project | { error: string; details?: string }>> {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await db.ensureConnection();

        const body = (await request.json()) as UpdateProjectRequest;

        // Validate fields if they're present
        if (body.name !== undefined && typeof body.name !== 'string') {
            console.warn('PATCH /api/projects/[id]: Invalid name', { id, name: body.name });
            return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
        }

        if (body.description !== undefined && typeof body.description !== 'string') {
            console.warn('PATCH /api/projects/[id]: Invalid description', {
                id,
                description: body.description,
            });
            return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
        }

        // Only include fields that are actually present in the request
        const updates: ProjectUpdate = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;

        const project = await db.projects.updateProject(id, userId, updates);

        return NextResponse.json(project);
    } catch (error) {
        console.error('PATCH /api/projects/[id] error:', {
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

        if (error instanceof Error && error.message === 'Project not found') {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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

        await db.projects.deleteProject(id, userId);

        return NextResponse.json(null);
    } catch (error) {
        console.error('DELETE /api/projects/[id] error:', {
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

        if (error instanceof Error && error.message === 'Project not found') {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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