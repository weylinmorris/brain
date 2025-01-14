import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { getPlainText } from './utils';
import {
    BlockRepositoryInterface,
    Neo4jClientInterface,
    SmartLinkRepositoryInterface,
    BlockInput,
    BlockUpdate,
    BlockSearchResult,
    GeoLocation,
} from '@/types/database';
import { Block } from '@/types/block';

const RATE_LIMIT = 500;
const PERIOD = 60 * 1000; // 1 minute in milliseconds
const TOKEN_LIMIT = 8192; // OpenAI's token limit for embeddings
const limit = pLimit(Math.floor(RATE_LIMIT));

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rough approximation of token count - OpenAI generally uses ~4 chars per token
function isWithinTokenLimit(text: string): boolean {
    // Using a conservative 4 characters per token estimate
    return text.length <= TOKEN_LIMIT * 4;
}

async function generateEmbeddings(openai: OpenAI, text: string): Promise<number[] | null> {
    if (!isWithinTokenLimit(text)) {
        console.warn('Text exceeds token limit, skipping embeddings generation');
        return null;
    }

    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    });
    return embeddingResponse.data[0].embedding;
}

export class BlockRepository implements BlockRepositoryInterface {
    private neo4j: Neo4jClientInterface;
    private smartLinkRepository?: SmartLinkRepositoryInterface;
    private openai?: OpenAI;

    constructor(neo4j: Neo4jClientInterface) {
        this.neo4j = neo4j;
    }

    initializeOpenAI(openai: OpenAI): void {
        this.openai = openai;
    }

    setSmartLinkRepository(repo: SmartLinkRepositoryInterface): void {
        this.smartLinkRepository = repo;
    }

    private ensureOpenAI(): OpenAI {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }
        return this.openai;
    }

    private ensureSmartLinkRepository(): SmartLinkRepositoryInterface {
        if (!this.smartLinkRepository) {
            throw new Error('SmartLinkRepository not initialized');
        }
        return this.smartLinkRepository;
    }

    async createBlock(input: BlockInput): Promise<Block> {
        const blockId = uuidv4();
        const openai = this.ensureOpenAI();
        const smartLinks = this.ensureSmartLinkRepository();

        try {
            const plainText = getPlainText(input.content);
            const combinedText = `${input.title} ${plainText}`;
            const embeddings = await generateEmbeddings(openai, combinedText);

            const query = `
                MATCH (u:User {id: $userId})
                ${input.projectId ? 'MATCH (p:Project {id: $projectId}) WHERE (u)-[:OWNS|CAN_EDIT]->(p)' : ''}
                CREATE (b:Block {
                    id: $id,
                    title: $title,
                    content: $content,
                    plainText: $plainText,
                    embeddings: $embeddings,
                    type: $type,
                    createdAt: datetime(),
                    updatedAt: datetime()
                })
                CREATE (u)-[:OWNS]->(b)
                ${input.projectId ? 'CREATE (b)-[:IN_PROJECT]->(p)' : ''}
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .plainText,
                    .embeddings,
                    .createdAt,
                    .updatedAt
                } as block
            `;

            const result = await this.neo4j.executeWrite(query, {
                id: blockId,
                title: input.title || '',
                content: input.content,
                type: input.type || 'text',
                plainText,
                embeddings,
                userId: input.userId,
                projectId: input.projectId,
            });

            if (!result.length) {
                throw new Error('Failed to create block: No result returned from query.');
            }

            const block = result[0].block;

            // Queue background tasks
            smartLinks
                .traceBlockLinks(block.id, input.userId)
                .catch((error) => console.error('Failed to compute similarities:', error));

            smartLinks
                .traceTime(block.id, input.userId, 'CREATE')
                .catch((error) => console.error('Failed to save time data:', error));

            smartLinks
                .traceContext(block.id, input.userId, input.device, input.location)
                .catch((error) => console.error('Failed to trace context:', error));

            return {
                id: block.id,
                title: block.title,
                content: block.content,
                type: block.type,
                projectId: input.projectId,
                createdAt: new Date(block.createdAt),
                updatedAt: new Date(block.updatedAt),
                plainText: block.plainText,
                embeddings: block.embeddings,
            };
        } catch (error) {
            // Specific error handling for OpenAI or APOC-related issues
            if (error instanceof Error) {
                if (error.message.includes('OpenAI')) {
                    console.error('OpenAI API Error:', {
                        error: error.message,
                        input,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(
                        'Failed to generate embeddings. Please check the OpenAI API key or model configuration.'
                    );
                } else if (error.message.includes('APOC')) {
                    console.error('APOC Procedure Error:', {
                        error: error.message,
                        input,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(
                        'An error occurred with APOC procedures. Please check the Neo4j setup.'
                    );
                }
            }
            // Generic error handling
            console.error('Block creation failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                input,
                timestamp: new Date().toISOString(),
            });
            throw new Error('Failed to create block. See logs for details.');
        }
    }

    async createManyBlocks(inputs: BlockInput[]): Promise<Block[]> {
        try {
            const batchSize = 100;
            const results: Block[] = [];
            const timePerRequest = PERIOD / RATE_LIMIT;
            const totalBlocks = inputs.length;
            let processedBlocks = 0;

            console.log(`Starting import of ${totalBlocks} blocks...`);

            for (let i = 0; i < inputs.length; i += batchSize) {
                const batch = inputs.slice(i, i + batchSize);
                console.log(
                    `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(inputs.length / batchSize)}`
                );

                const batchPromises = batch.map(async (input, index) => {
                    return limit(async () => {
                        const blockId = uuidv4();
                        const plainText = `${input.title} ${getPlainText(input.content)}`;

                        await sleep(timePerRequest * index);

                        const embeddings = await generateEmbeddings(this.ensureOpenAI(), plainText);

                        processedBlocks++;
                        console.log(
                            `Processed ${processedBlocks}/${totalBlocks} blocks (${Math.round((processedBlocks / totalBlocks) * 100)}%)`
                        );

                        return {
                            params: {
                                id: blockId,
                                title: input.title || '',
                                content: input.content,
                                type: input.type || 'text',
                                plainText,
                                embeddings,
                                userId: input.userId,
                            },
                            blockId,
                        };
                    });
                });

                const batchParams = await Promise.all(batchPromises);
                console.log(
                    `Completed embeddings for batch ${Math.floor(i / batchSize) + 1}, writing to database...`
                );

                const query = `
                    MATCH (u:User {id: $userId})
                    UNWIND $blocks as block
                    CREATE (b:Block {
                        id: block.id,
                        title: block.title,
                        content: block.content,
                        plainText: block.plainText,
                        embeddings: block.embeddings,
                        type: block.type,
                        createdAt: datetime(),
                        updatedAt: datetime()
                    })
                    CREATE (u)-[:OWNS]->(b)
                    RETURN b {
                        .id,
                        .title,
                        .content,
                        .type,
                        .plainText,
                        .embeddings,
                        .createdAt,
                        .updatedAt
                    } as block
                `;

                const blocksParam = batchParams.map(({ params }) => ({
                    id: params.id,
                    title: params.title,
                    content: params.content,
                    type: params.type,
                    plainText: params.plainText,
                    embeddings: params.embeddings,
                }));

                const result = await this.neo4j.executeWrite(query, {
                    blocks: blocksParam,
                    userId: inputs[0].userId, // All blocks in a batch should have the same userId
                });
                console.log(`Database write completed for batch ${Math.floor(i / batchSize) + 1}`);

                // Queue similarity computations
                console.log(`Computing similarities for batch ${Math.floor(i / batchSize) + 1}...`);
                batchParams.forEach(({ blockId }, index) => {
                    setTimeout(() => {
                        this.ensureSmartLinkRepository()
                            .traceBlockLinks(blockId, inputs[index].userId)
                            .catch((error) =>
                                console.error('Failed to compute similarities:', error)
                            );
                    }, timePerRequest * index);
                });

                const transformedResults = result.map((record) => ({
                    id: record.block.id,
                    title: record.block.title,
                    content: record.block.content,
                    type: record.block.type,
                    createdAt: new Date(record.block.createdAt),
                    updatedAt: new Date(record.block.updatedAt),
                    plainText: record.block.plainText,
                    embeddings: record.block.embeddings,
                }));

                results.push(...transformedResults);
            }

            console.log(`Import completed. Processed ${totalBlocks} blocks successfully.`);
            return results;
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('OpenAI')) {
                    console.error('OpenAI API Error:', {
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(
                        'Failed to generate embeddings. Please check the OpenAI API key or model configuration.'
                    );
                } else if (error.message.includes('APOC')) {
                    console.error('APOC Procedure Error:', {
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(
                        'An error occurred with APOC procedures. Please check the Neo4j setup.'
                    );
                }
            }
            console.error('Batch block creation failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });
            throw new Error('Failed to create blocks in batch. See logs for details.');
        }
    }

    async searchBlocks(
        query: string,
        userId: string,
        threshold = 0.1,
        projectId?: string
    ): Promise<BlockSearchResult> {
        const openai = this.ensureOpenAI();
        const embeddings = await generateEmbeddings(openai, query);

        if (!embeddings) {
            throw new Error('Failed to generate embeddings for search query');
        }

        const cypher = `
            MATCH (u:User {id: $userId})-[:OWNS]->(b:Block)
            ${projectId !== undefined ? 'MATCH (b)-[:IN_PROJECT]->(p:Project)' : ''}
            WHERE b.embeddings IS NOT NULL
            ${projectId ? 'AND p.id = $projectId' : ''}
            WITH b, gds.similarity.cosine(b.embeddings, $embeddings) AS score
            WHERE score >= $threshold
            RETURN b {
                .id,
                .title,
                .content,
                .type,
                .plainText,
                .createdAt,
                .updatedAt
            } as block,
            score
            ORDER BY score DESC
        `;

        const result = await this.neo4j.executeQuery(cypher, {
            embeddings,
            threshold,
            userId,
            projectId,
        });

        const transformedResults = result.map((row) => ({
            ...row.block,
            createdAt: new Date(row.block.createdAt),
            updatedAt: new Date(row.block.updatedAt),
            similarity: row.score,
        }));

        return {
            titleMatches: [],
            contentMatches: [],
            similarityMatches: transformedResults,
        };
    }

    async getBlocks(
        userId: string,
        includeEmbeddings = false,
        projectId?: string
    ): Promise<Block[]> {
        try {
            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block)
                ${projectId ? 'MATCH (b)-[:IN_PROJECT]->(p:Project {id: $projectId})' : ''}
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .plainText,
                    .type,
                    .createdAt,
                    .updatedAt,
                    ${includeEmbeddings ? '.embeddings,' : ''}
                    project: head([(b)-[:IN_PROJECT]->(p:Project) | p { .id, .name }])
                } as block
                ORDER BY b.updatedAt DESC
            `;

            const result = await this.neo4j.executeQuery(query, { userId, projectId });

            return result.map((record) => ({
                id: record.block.id,
                title: record.block.title,
                content: record.block.content,
                plainText: record.block.plainText,
                type: record.block.type,
                createdAt: new Date(record.block.createdAt),
                updatedAt: new Date(record.block.updatedAt),
                ...(includeEmbeddings && { embeddings: record.block.embeddings }),
                projectId: record.block.project?.id,
            }));
        } catch (error) {
            console.error('Failed to get blocks:', error);
            throw new Error('Failed to retrieve blocks. See logs for details.');
        }
    }

    async getBlock(
        id: string,
        userId: string,
        device?: string,
        location?: GeoLocation,
        includeEmbeddings = false
    ): Promise<Block> {
        try {
            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $id})
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                    ${includeEmbeddings ? ', .embeddings' : ''},
                    project: head([(b)-[:IN_PROJECT]->(p:Project) | p { .id, .name }])
                } as block
            `;

            const result = await this.neo4j.executeQuery(query, { id, userId });

            if (!result.length) {
                throw new Error(`Block with id ${id} not found`);
            }

            const block = result[0].block;

            // Track view in background
            this.ensureSmartLinkRepository()
                .traceTime(block.id, userId, 'VIEW')
                .catch((error) => console.error('Failed to save time data:', error));

            if (device || location) {
                this.ensureSmartLinkRepository()
                    .traceContext(id, userId, device, location)
                    .catch((error) => console.error('Failed to trace context:', error));
            }

            return {
                id: block.id,
                title: block.title,
                content: block.content,
                type: block.type,
                createdAt: new Date(block.createdAt),
                updatedAt: new Date(block.updatedAt),
                ...(includeEmbeddings && { embeddings: block.embeddings }),
                projectId: block.project?.id,
            };
        } catch (error) {
            console.error('Failed to get block:', error);
            throw error;
        }
    }

    async updateBlock(id: string, userId: string, updates: BlockUpdate): Promise<Block> {
        try {
            // Only generate new plainText if content is being updated
            const blockUpdates: Record<string, any> = {
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            if (updates.content !== undefined) {
                blockUpdates.plainText = getPlainText(updates.content);
                // Only generate new embeddings if title or content changed
                const combinedText = `${updates.title || ''} ${blockUpdates.plainText}`;
                blockUpdates.embeddings = await generateEmbeddings(
                    this.ensureOpenAI(),
                    combinedText
                );
            }

            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $id})
                ${
                    updates.projectId !== undefined
                        ? `
                    OPTIONAL MATCH (b)-[r:IN_PROJECT]->(:Project)
                    DELETE r
                    WITH b, u
                `
                        : ''
                }
                SET b += $blockUpdates
                ${
                    updates.projectId
                        ? `
                    WITH b
                    MATCH (p:Project {id: $projectId})
                    CREATE (b)-[:IN_PROJECT]->(p)
                    WITH b
                `
                        : ''
                }
                RETURN b { .* } as block
            `;

            const result = await this.neo4j.executeWrite(query, {
                id,
                userId,
                blockUpdates,
                projectId: updates.projectId,
            });

            if (!result.length) {
                throw new Error('Block not found');
            }

            const block = result[0].block;
            return {
                ...block,
                createdAt: new Date(block.createdAt),
                updatedAt: new Date(block.updatedAt),
                projectId: block.projectId?.id,
            };
        } catch (error) {
            console.error('Failed to update block:', error);
            throw error;
        }
    }

    async deleteBlock(id: string): Promise<void> {
        try {
            const query = `
                MATCH (u:User)-[:OWNS]->(b:Block {id: $id})
                DETACH DELETE b
            `;

            await this.neo4j.executeWrite(query, { id });
        } catch (error) {
            console.error('Failed to delete block:', error);
            throw error;
        }
    }
}
