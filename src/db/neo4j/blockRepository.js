import {v4 as uuidv4} from 'uuid';
import OpenAI from "openai";
import pLimit from 'p-limit';

const RATE_LIMIT = 80;
const PERIOD = 60 * 1000; // 1 minute in milliseconds
const limit = pLimit(Math.floor(RATE_LIMIT));

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class BlockRepository {
    constructor(neo4j) {
        this.neo4j = neo4j;
        this.openai = new OpenAI(process.env.OPENAI_API_KEY);
    }

    setSimilarityRepository(similarityRepository) {
        this.similarityRepository = similarityRepository;
    }

    getPlainText(content) {
        try {
            // Check if content is empty or not provided
            if (!content || typeof content !== 'string') {
                console.warn('Content is empty or invalid:', content);
                return ''; // Return an empty string for empty content
            }

            // Parse the JSON content
            const parsedContent = JSON.parse(content);

            // Recursive function to extract text from nodes
            const extractText = (node) => {
                if (!node) return '';

                // Handle text nodes
                if (node.type === 'text' && node.text) {
                    return node.text;
                }

                // Handle nodes with children
                if (node.children && Array.isArray(node.children)) {
                    return node.children.map(extractText).join('');
                }

                return ''; // Fallback for nodes without text or children
            };

            // Start extracting from the root node
            if (parsedContent.root && parsedContent.root.children) {
                return parsedContent.root.children.map(extractText).join('');
            }

            console.warn('Parsed content does not have a valid root or children:', parsedContent);
            return ''; // Return empty string if structure is invalid
        } catch (error) {
            console.error('Failed to parse content or extract plain text:', error);
            return ''; // Return empty string if parsing fails
        }
    }

    async createBlock(input) {
        const blockId = uuidv4();

        try {
            const plainText = this.getPlainText(input.content);
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: plainText,
                encoding_format: "float",
            });
            const embeddings = embeddingResponse.data[0].embedding;

            let query = `
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

            const block = result[0];

            this.similarityRepository.computeSimilaritiesForBlock(block['block'].id)
                .catch(error => console.error('Failed to compute similarities:', error));

            return {
                id: block['block'].id,
                title: block['block'].title,
                content: block['block'].content,
                type: block['block'].type,
                createdAt: new Date(block['block'].createdAt),
                updatedAt: new Date(block['block'].updatedAt),
            };
        } catch (error) {
            // Specific error handling for OpenAI or APOC-related issues
            if (error.message.includes('OpenAI')) {
                console.error('OpenAI API Error:', {
                    error: error.message,
                    input,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('Failed to generate embeddings. Please check the OpenAI API key or model configuration.');
            } else if (error.message.includes('APOC')) {
                console.error('APOC Procedure Error:', {
                    error: error.message,
                    input,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('An error occurred with APOC procedures. Please check the Neo4j setup.');
            } else {
                // Generic error handling
                console.error('Block creation failed:', {
                    error: error.message,
                    input,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('Failed to create block. See logs for details.');
            }
        }
    }

    async createManyBlocks(inputs) {
        try {
            const batchSize = 100;
            const results = [];
            const timePerRequest = PERIOD / RATE_LIMIT;
            const totalBlocks = inputs.length;
            let processedBlocks = 0;

            console.log(`Starting import of ${totalBlocks} blocks...`);

            for (let i = 0; i < inputs.length; i += batchSize) {
                const batch = inputs.slice(i, i + batchSize);
                console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(inputs.length/batchSize)}`);

                const batchPromises = batch.map(async (input, index) => {
                    return limit(async () => {
                        const blockId = uuidv4();
                        const plainText = this.getPlainText(input.content);

                        await sleep(timePerRequest * index);

                        const embeddingResponse = await this.openai.embeddings.create({
                            model: 'text-embedding-3-small',
                            input: plainText,
                            encoding_format: "float",
                        });

                        processedBlocks++;
                        console.log(`Processed ${processedBlocks}/${totalBlocks} blocks (${Math.round((processedBlocks/totalBlocks) * 100)}%)`);

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
                            blockId
                        };
                    });
                });

                const batchParams = await Promise.all(batchPromises);
                console.log(`Completed embeddings for batch ${Math.floor(i/batchSize) + 1}, writing to database...`);

                // Rest of the function remains the same...
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
                    embeddings: params.embeddings
                }));

                const result = await this.neo4j.executeWrite(query, { blocks: blocksParam });
                console.log(`Database write completed for batch ${Math.floor(i/batchSize) + 1}`);

                // Queue similarity computations
                console.log(`Computing similarities for batch ${Math.floor(i/batchSize) + 1}...`);
                const similarityPromises = batchParams.map(({ blockId }) =>
                    this.similarityRepository.computeSimilaritiesForBlock(blockId)
                        .catch(error => console.error('Failed to compute similarities for block:', blockId, error))
                );

                // Process similarities in background
                Promise.all(similarityPromises)
                    .catch(error => console.error('Failed to compute batch similarities:', error));

                const transformedResults = result.map(record => ({
                    id: record.block.id,
                    title: record.block.title,
                    content: record.block.content,
                    type: record.block.type,
                    createdAt: new Date(record.block.createdAt),
                    updatedAt: new Date(record.block.updatedAt),
                }));

                results.push(...transformedResults);
            }

            console.log(`Import completed. Processed ${totalBlocks} blocks successfully.`);
            return results;

        } catch (error) {
            // Error handling remains the same...
            if (error.message.includes('OpenAI')) {
                console.error('OpenAI API Error:', {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('Failed to generate embeddings. Please check the OpenAI API key or model configuration.');
            } else if (error.message.includes('APOC')) {
                console.error('APOC Procedure Error:', {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('An error occurred with APOC procedures. Please check the Neo4j setup.');
            } else {
                console.error('Batch block creation failed:', {
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('Failed to create blocks. See logs for details.');
            }
        }
    }

    async searchBlocks(query, threshold = 0.25) {
        try {
            const lowercaseQuery = query.toLowerCase().trim();

            // First get exact matches (case-insensitive)
            const exactMatches = await this.neo4j.executeQuery(`
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
                    .type,
                    .createdAt,
                    .updatedAt,
                    matchType: CASE 
                        WHEN lowerTitle CONTAINS searchQuery THEN 'title'
                        WHEN lowerContent CONTAINS searchQuery THEN 'content'
                    END
                } AS block
            `, { query: lowercaseQuery });

            // Separate exact matches into title and content arrays
            const titleMatches = exactMatches
                .filter(row => row.block.matchType === 'title')
                .map(row => ({
                    ...row.block,
                    similarity: 1
                }));

            const contentMatches = exactMatches
                .filter(row => row.block.matchType === 'content')
                .map(row => ({
                    ...row.block,
                    similarity: 1
                }));

            // Get embedding-based matches
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
                encoding_format: "float",
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;

            // Exclude IDs that we already found in exact matches
            const exactMatchIds = exactMatches.map(row => row.block.id);

            const similarityMatches = await this.neo4j.executeQuery(`
                MATCH (b:Block)
                WHERE NOT b.id IN $exactMatchIds
                WITH b, gds.similarity.cosine(b.embeddings, $queryEmbedding) AS similarity
                WHERE similarity > $threshold
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                } AS block, similarity
                ORDER BY similarity DESC
                LIMIT 10
            `, {
                queryEmbedding,
                threshold,
                limit: Math.floor(limit),
                exactMatchIds
            });

            const embeddingMatches = similarityMatches.map(row => ({
                ...row.block,
                similarity: row.similarity
            }));

            // Return array of arrays: [titleMatches, contentMatches, embeddingMatches]
            return [titleMatches, contentMatches, embeddingMatches];

        } catch (error) {
            console.error('Failed to perform search:', error);
            throw new Error('Search failed. Please try again.');
        }
    }

    async getBlocks(includeEmbeddings = false) {
        try {
            const result = await this.neo4j.executeQuery(`
                MATCH (b:Block)
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .embeddings,
                    .createdAt,
                    .updatedAt
                } as block
                ORDER BY b.updatedAt ASC
            `);

            return result.map(block => ({
                id: block['block'].id,
                title: block['block'].title,
                content: block['block'].content,
                type: block['block'].type || 'text',
                embeddings: includeEmbeddings ? block['block'].embeddings : undefined,
                createdAt: new Date(block['block'].createdAt),
                updatedAt: new Date(block['block'].updatedAt)
            }));
        } catch (error) {
            console.error('Failed to get blocks:', error);
            throw new Error('Failed to get blocks');
        }
    }

    async getBlock(id) {
        try {
            const result = await this.neo4j.executeQuery(`
                MATCH (b:Block {id: $id})
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .embeddings,
                    .type,
                    .createdAt,
                    .updatedAt
                } as block
            `, {id});

            if (!result.length) {
                throw new Error('Block not found');
            }

            const block = result[0];

            return {
                id: block['block'].id,
                title: block['block'].title,
                content: block['block'].content,
                embeddings: block['block'].embeddings,
                type: block['block'].type || 'text',
                createdAt: new Date(block['block'].createdAt),
                updatedAt: new Date(block['block'].updatedAt)
            };
        } catch (error) {
            console.error('Failed to get block:', error);
            throw new Error('Failed to get block');
        }
    }

    async updateBlock(id, updates) {
        try {
            let setClause = ['b.updatedAt = datetime()'];
            const params = {id};

            if (updates.title !== undefined) {
                setClause.push('b.title = $title');
                params.title = updates.title;
            }
            if (updates.content !== undefined) {
                setClause.push('b.content = $content');
                params.content = updates.content;
            }
            if (updates.type !== undefined) {
                setClause.push('b.type = $type');
                params.type = updates.type;
            }

            const plainText = this.getPlainText(updates.content);
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: plainText,
                encoding_format: "float",
            });
            const embeddings = embeddingResponse.data[0].embedding;

            setClause.push('b.plainText = $plainText');
            params.plainText = plainText;

            setClause.push('b.embeddings = $embeddings');
            params.embeddings = embeddings

            let query = `
                MATCH (b:Block {id: $id})
            `;

            query += `
                WITH b
                SET ${setClause.join(', ')}
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .plainText,
                    .embeddings,
                    .type,
                    .createdAt,
                    .updatedAt
                } as block
            `;

            const result = await this.neo4j.executeWrite(query, params);

            if (!result.length) {
                throw new Error('Block not found');
            }

            const block = result[0];

            this.similarityRepository.computeSimilaritiesForBlock(block['block'].id)
                .catch(error => console.error('Failed to compute similarities:', error));

            return {
                id: block['block'].id,
                title: block['block'].title || '',
                content: block['block'].content,
                type: block['block'].type || 'text',
                createdAt: new Date(block['block'].createdAt),
                updatedAt: new Date(block['block'].updatedAt)
            };
        } catch (error) {
            console.error('Failed to update block:', error);
            throw new Error('Failed to update block');
        }
    }

    async deleteBlock(id) {
        try {
            await this.neo4j.executeWrite(`
                MATCH (b:Block {id: $id})
                DETACH DELETE b
            `, {id});
        } catch (error) {
            console.error('Failed to delete block:', error);
            throw new Error('Failed to delete block');
        }
    }
}
