import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { classifyQuery, generateAnswer } from '../../../../utils/aiUtils';
import { Block } from '@/types/block';
import { BlockSource } from '@/types/ai';
import { BlockSearchResult } from '@/types/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

type QueryType = 'question' | 'search';

interface QuestionResponse {
    type: 'question';
    answer: string;
    sources: BlockSource[];
    blocks: BlockSearchResult;
}

interface SearchResponse {
    type: 'search';
    blocks: BlockSearchResult;
}

type ErrorResponse = {
    error: string;
    details?: string;
};

export async function GET(
    request: NextRequest
): Promise<NextResponse<QuestionResponse | SearchResponse | ErrorResponse>> {
    try {
        await db.ensureConnection();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // get query from the ?query= parameter
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');
        const projectId = searchParams.get('projectId');
        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        // Classify the query
        const queryType = (await classifyQuery(query)) as QueryType;

        const blocks = await db.blocks.searchBlocks(query, userId, 0.25, projectId ?? undefined);

        // Flatten the blocks object
        const flattenedBlocks: Block[] = [
            ...blocks.contentMatches,
            ...blocks.titleMatches,
            ...blocks.similarityMatches,
        ];

        // For questions, generate an answer using the relevant blocks
        if (queryType === 'question' && flattenedBlocks.length > 0) {
            const { answer, sources } = await generateAnswer(query, flattenedBlocks);

            return NextResponse.json({
                type: 'question',
                answer,
                blocks,
                sources,
            });
        }

        // For regular searches, return just the blocks
        return NextResponse.json({
            type: 'search',
            blocks,
        });
    } catch (error) {
        console.error('[Search Route] Error processing request:', {
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
            console.error('[Search Route] Database connection refused');
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
