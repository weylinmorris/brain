import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { ProjectInput } from '@/types/database';
import { Project } from '@/types/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET(
    request: NextRequest
): Promise<NextResponse<Project[] | { error: string; details?: string }>> {
    try {
        await db.ensureConnection();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const projects = await db.projects.getProjects(userId);

        return NextResponse.json(projects || []);
    } catch (error) {
        console.error('GET /api/projects error:', {
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
            console.error('GET /api/projects: Database connection refused');
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

interface CreateProjectRequest {
    name: string;
    description?: string;
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<Project | { error: string; details?: string }>> {
    try {
        await db.ensureConnection();

        const body = (await request.json()) as CreateProjectRequest;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Validate required fields
        if (!body.name || typeof body.name !== 'string') {
            return NextResponse.json(
                { error: 'Name is required and must be a string' },
                { status: 400 }
            );
        }

        const projectData: ProjectInput = {
            name: body.name,
            description: body.description,
            userId,
        };

        const project = await db.projects.createProject(projectData);

        return NextResponse.json(project);
    } catch (error) {
        console.error('POST /api/projects error:', {
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
