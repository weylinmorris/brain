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

const RATE_LIMIT = 80;
const PERIOD = 60 * 1000; // 1 minute in milliseconds
const limit = pLimit(Math.floor(RATE_LIMIT));

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
            const plainText = `${input.title} ${getPlainText(input.content)}`;
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: plainText,
                encoding_format: 'float',
            });
            const embeddings = embeddingResponse.data[0].embedding;

            console.log(embeddings);

            const query = `
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
            });

            if (!result.length) {
                throw new Error('Failed to create block: No result returned from query.');
            }

            const block = result[0].block;

            // Queue background tasks
            smartLinks
                .traceBlockLinks(block.id)
                .catch((error) => console.error('Failed to compute similarities:', error));

            smartLinks
                .traceTime(block.id, 'CREATE')
                .catch((error) => console.error('Failed to save time data:', error));

            smartLinks
                .traceContext(block.id, input.device, input.location)
                .catch((error) => console.error('Failed to trace context:', error));

            return {
                id: block.id,
                title: block.title,
                content: block.content,
                type: block.type,
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

                        const embeddingResponse = await this.ensureOpenAI().embeddings.create({
                            model: 'text-embedding-3-small',
                            input: plainText,
                            encoding_format: 'float',
                        });

                        processedBlocks++;
                        console.log(
                            `Processed ${processedBlocks}/${totalBlocks} blocks (${Math.round((processedBlocks / totalBlocks) * 100)}%)`
                        );

                        const embeddings = embeddingResponse.data[0].embedding;

                        return {
                            params: {
                                id: blockId,
                                title: input.title || '',
                                content: input.content,
                                type: input.type || 'text',
                                plainText,
                                embeddings,
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

                const result = await this.neo4j.executeWrite(query, { blocks: blocksParam });
                console.log(`Database write completed for batch ${Math.floor(i / batchSize) + 1}`);

                // Queue similarity computations
                console.log(`Computing similarities for batch ${Math.floor(i / batchSize) + 1}...`);
                batchParams.forEach(({ blockId }, index) => {
                    setTimeout(() => {
                        this.ensureSmartLinkRepository()
                            .traceBlockLinks(blockId)
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

    async searchBlocks(query: string, threshold = 0.25): Promise<BlockSearchResult> {
        const openai = this.ensureOpenAI();

        try {
            const lowercaseQuery = query.toLowerCase().trim();

            // First get exact matches (case-insensitive)
            const exactMatches = await this.neo4j.executeQuery(
                `
                MATCH (b:Block)
                WITH b, 
                    toLower(b.title) AS lowerTitle,
                    toLower(b.plainText) AS lowerContent,
                    $query AS searchQuery
                WHERE lowerTitle CONTAINS searchQuery OR lowerContent CONTAINS searchQuery
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .plainText,
                    .type,
                    .createdAt,
                    .updatedAt,
                    matchType: CASE 
                        WHEN lowerTitle CONTAINS searchQuery THEN 'title'
                        WHEN lowerContent CONTAINS searchQuery THEN 'content'
                    END
                } AS block
            `,
                { query: lowercaseQuery }
            );

            // Separate exact matches into title and content arrays
            const titleMatches = exactMatches
                .filter((row) => row.block.matchType === 'title')
                .map((row) => ({
                    ...row.block,
                    similarity: 1,
                }));

            const contentMatches = exactMatches
                .filter((row) => row.block.matchType === 'content')
                .map((row) => ({
                    ...row.block,
                    similarity: 1,
                }));

            // Get embedding-based matches
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
                encoding_format: 'float',
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;

            // Exclude IDs that we already found in exact matches
            const exactMatchIds = exactMatches.map((row) => row.block.id);

            const similarityMatches = await this.neo4j.executeQuery(
                `
                MATCH (b:Block)
                WHERE NOT b.id IN $exactMatchIds
                WITH b, gds.similarity.cosine(b.embeddings, $queryEmbedding) AS similarity
                WHERE similarity > $threshold
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .plainText,
                    .type,
                    .createdAt,
                    .updatedAt
                } AS block, similarity
                ORDER BY similarity DESC
                LIMIT 10
            `,
                {
                    queryEmbedding,
                    threshold,
                    exactMatchIds,
                }
            );

            const embeddingMatches = similarityMatches.map((row) => ({
                ...row.block,
                similarity: row.similarity,
            }));

            // Return array of arrays: [titleMatches, contentMatches, embeddingMatches]
            return {
                titleMatches: titleMatches,
                contentMatches: contentMatches,
                similarityMatches: embeddingMatches,
            };
        } catch (error) {
            console.error('Failed to perform search:', error);
            throw new Error('Search failed. Please try again.');
        }
    }

    async getBlocks(includeEmbeddings = false): Promise<Block[]> {
        try {
            const query = `
                MATCH (b:Block)
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                    ${includeEmbeddings ? ', .embeddings' : ''}
                } as block
                ORDER BY b.updatedAt DESC
            `;

            const result = await this.neo4j.executeQuery(query);

            return result.map((record) => ({
                id: record.block.id,
                title: record.block.title,
                content: record.block.content,
                type: record.block.type,
                createdAt: new Date(record.block.createdAt),
                updatedAt: new Date(record.block.updatedAt),
                ...(includeEmbeddings && { embeddings: record.block.embeddings }),
            }));
        } catch (error) {
            console.error('Failed to get blocks:', error);
            throw new Error('Failed to retrieve blocks. See logs for details.');
        }
    }

    async getBlock(
        id: string,
        device?: string,
        location?: GeoLocation,
        includeEmbeddings = false
    ): Promise<Block> {
        try {
            const query = `
                MATCH (b:Block {id: $id})
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                    ${includeEmbeddings ? ', .embeddings' : ''}
                } as block
            `;

            const result = await this.neo4j.executeQuery(query, { id });

            if (!result.length) {
                throw new Error(`Block with id ${id} not found`);
            }

            const block = result[0].block;

            // Track view in background
            this.ensureSmartLinkRepository()
                .traceTime(id, 'VIEW')
                .catch((error) => console.error('Failed to save time data:', error));

            if (device || location) {
                this.ensureSmartLinkRepository()
                    .traceContext(id, device, location)
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
            };
        } catch (error) {
            console.error('Failed to get block:', error);
            throw error;
        }
    }

    async updateBlock(
        id: string,
        updates: BlockUpdate,
        device?: string,
        location?: GeoLocation
    ): Promise<Block> {
        try {
            const plainText = `${updates.title} ${getPlainText(updates.content || '')}`;
            const embeddingResponse = await this.ensureOpenAI().embeddings.create({
                model: 'text-embedding-3-small',
                input: plainText,
                encoding_format: 'float',
            });
            const embeddings = embeddingResponse.data[0].embedding;

            const query = `
                MATCH (b:Block {id: $id})
                SET b += $updates,
                    b.plainText = $plainText,
                    b.embeddings = $embeddings,
                    b.updatedAt = datetime()
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                } as block
            `;

            const result = await this.neo4j.executeWrite(query, {
                id,
                updates: {
                    ...(updates.title !== undefined && { title: updates.title }),
                    ...(updates.content !== undefined && { content: updates.content }),
                    ...(updates.type !== undefined && { type: updates.type }),
                },
                plainText,
                embeddings,
            });

            if (!result.length) {
                throw new Error(`Block with id ${id} not found`);
            }

            const block = result[0].block;

            // Queue background tasks
            this.ensureSmartLinkRepository()
                .traceBlockLinks(id)
                .catch((error) => console.error('Failed to compute similarities:', error));

            this.ensureSmartLinkRepository()
                .traceTime(id, 'UPDATE')
                .catch((error) => console.error('Failed to save time data:', error));

            if (device || location) {
                this.ensureSmartLinkRepository()
                    .traceContext(id, device, location)
                    .catch((error) => console.error('Failed to trace context:', error));
            }

            return {
                id: block.id,
                title: block.title,
                content: block.content,
                type: block.type,
                createdAt: new Date(block.createdAt),
                updatedAt: new Date(block.updatedAt),
            };
        } catch (error) {
            console.error('Failed to update block:', error);
            throw error;
        }
    }

    async deleteBlock(id: string): Promise<void> {
        try {
            const query = `
                MATCH (b:Block {id: $id})
                DETACH DELETE b
            `;

            await this.neo4j.executeWrite(query, { id });
        } catch (error) {
            console.error('Failed to delete block:', error);
            throw error;
        }
    }
}
