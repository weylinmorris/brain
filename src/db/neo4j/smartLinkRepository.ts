import { v4 as uuidv4 } from 'uuid';
import { cosineSimilarity, generateTimeMetadata, getPlainText } from './utils';
import {
    SmartLinkRepositoryInterface,
    Neo4jClientInterface,
    BlockRepositoryInterface,
    TimeMetadata,
    BlockActivity,
    ActionType,
    SimilarityType,
    GeoLocation,
} from '@/types/database';
import { Block } from '@/types/block';

export class SmartLinkRepository implements SmartLinkRepositoryInterface {
    public neo4j: Neo4jClientInterface;
    public blockRepository: BlockRepositoryInterface;

    constructor(neo4j: Neo4jClientInterface, blockRepository: BlockRepositoryInterface) {
        this.neo4j = neo4j;
        this.blockRepository = blockRepository;
    }

    async traceBlockLinks(blockId: string, userId: string): Promise<void> {
        console.log('blockId', blockId);
        console.log('userId', userId);

        try {
            const block = await this.blockRepository.getBlock(
                blockId,
                userId,
                undefined,
                undefined,
                true
            );

            if (!block) throw new Error('Block not found');

            const blocks = await this.blockRepository.getBlocks(userId, true);
            if (!blocks?.length) return; // No blocks to compare against

            for (const otherBlock of blocks) {
                if (otherBlock.id === blockId) continue;

                // Skip if either block doesn't have embeddings
                if (!block.embeddings?.length || !otherBlock.embeddings?.length) {
                    console.log(
                        `Skipping similarity computation for blocks without embeddings: ${blockId} or ${otherBlock.id}`
                    );
                    continue;
                }

                const similarity = cosineSimilarity(block.embeddings, otherBlock.embeddings);

                let relationshipType: SimilarityType | null = null;
                if (similarity > 0.8) {
                    relationshipType = 'LINKED';
                } else if (similarity > 0.6) {
                    relationshipType = 'SIMILAR';
                } else if (similarity > 0.4) {
                    relationshipType = 'MAYBE_SIMILAR';
                } else if (similarity > 0.2) {
                    relationshipType = 'POSSIBLY_SIMILAR';
                }

                if (relationshipType) {
                    const query = [
                        'MATCH (u:User {id: $userId})-[:OWNS]->(a:Block {id: $idA}), (u)-[:OWNS]->(b:Block {id: $idB})',
                        `MERGE (a)-[r:${relationshipType}]->(b)`,
                        'SET r.similarity = $similarity, r.similarityCheckedAt = datetime()',
                    ].join('\n');

                    await this.neo4j.executeWrite(query, {
                        userId,
                        idA: blockId,
                        idB: otherBlock.id,
                        similarity,
                    });
                }

                await new Promise((resolve) => setTimeout(resolve, 100)); // Slow down to avoid rate limits
            }
        } catch (error) {
            console.error('Failed to compute similarities for block:', error);
            throw new Error('Failed to compute similarities for block');
        }
    }

    async traceTime(
        blockId: string,
        userId: string,
        actionType: ActionType = 'VIEW'
    ): Promise<TimeMetadata> {
        // try {
        //     const now = new Date();
        //     const metadata = generateTimeMetadata(now);

        //     const query = `
        //         MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})

        //         // Create a new time interaction node
        //         CREATE (t:TimeInteraction {
        //             id: $interactionId,
        //             timestamp: datetime(),
        //             hour: datetime().hour,
        //             dayOfWeek: datetime().dayOfWeek,
        //             actionType: $actionType
        //         })

        //         // Create relationship with context
        //         CREATE (b)-[r:TIME_INTERACTION]->(t)

        //         // Update running averages on the block
        //         WITH b, t
        //         OPTIONAL MATCH (b)-[:TIME_INTERACTION]->(prev:TimeInteraction)
        //         WITH b, t, collect(prev) as prevInteractions

        //         SET b += {
        //             commonHours: $commonHours,
        //             commonDays: $commonDays,
        //             segmentEarlyMorning: $commonSegments.EARLY_MORNING,
        //             segmentMorning: $commonSegments.MORNING,
        //             segmentMidday: $commonSegments.MIDDAY,
        //             segmentAfternoon: $commonSegments.AFTERNOON,
        //             segmentEvening: $commonSegments.EVENING,
        //             segmentNight: $commonSegments.NIGHT,
        //             totalInteractions: $totalInteractions,
        //             lastInteraction: datetime()
        //         }

        //         RETURN {
        //             commonHours: b.commonHours,
        //             commonDays: b.commonDays,
        //             segmentEarlyMorning: b.segmentEarlyMorning,
        //             segmentMorning: b.segmentMorning,
        //             segmentMidday: b.segmentMidday,
        //             segmentAfternoon: b.segmentAfternoon,
        //             segmentEvening: b.segmentEvening,
        //             segmentNight: b.segmentNight,
        //             totalInteractions: b.totalInteractions,
        //             lastInteraction: b.lastInteraction
        //         } as timeMetadata
        //     `;

        //     const result = await this.neo4j.executeWrite(query, {
        //         blockId,
        //         interactionId: uuidv4(),
        //         actionType,
        //         userId,
        //         commonHours: metadata.commonHours,
        //         commonDays: metadata.commonDays,
        //         commonSegments: metadata.commonSegments,
        //         totalInteractions: metadata.totalInteractions,
        //     });

        //     if (!result?.[0]?.timeMetadata) {
        //         throw new Error('Failed to create time metadata');
        //     }

        //     const timeMetadata = result[0].timeMetadata;
        //     return {
        //         commonHours: timeMetadata.commonHours,
        //         commonDays: timeMetadata.commonDays,
        //         commonSegments: {
        //             EARLY_MORNING: timeMetadata.segmentEarlyMorning,
        //             MORNING: timeMetadata.segmentMorning,
        //             MIDDAY: timeMetadata.segmentMidday,
        //             AFTERNOON: timeMetadata.segmentAfternoon,
        //             EVENING: timeMetadata.segmentEvening,
        //             NIGHT: timeMetadata.segmentNight,
        //         },
        //         totalInteractions: timeMetadata.totalInteractions,
        //         lastInteraction: new Date(timeMetadata.lastInteraction),
        //     };
        // } catch (error) {
        //     console.error('Failed to trace time metadata:', error);
        //     throw new Error('Failed to trace time metadata');
        // }

        return Promise.resolve({} as TimeMetadata);
    }

    async traceActivity(
        updatedBlock: Block,
        originalBlock: Block,
        userId: string
    ): Promise<BlockActivity> {
        try {
            // Analyze content changes
            const originalText = getPlainText(originalBlock.content);
            const updatedText = getPlainText(updatedBlock.content);

            const changes = {
                type: [] as string[],
                metrics: {
                    titleLengthDelta:
                        (updatedBlock.title?.length || 0) - (originalBlock.title?.length || 0),
                    contentLengthDelta: updatedText.length - originalText.length,
                    totalLength: updatedText.length,
                },
                patterns: {
                    isExpansion: updatedText.length > originalText.length,
                    isRefinement: updatedText.length <= originalText.length,
                },
            };

            // Track what changed
            if (updatedBlock.title !== originalBlock.title) {
                changes.type.push('TITLE_EDIT');
            }
            if (updatedText !== originalText) {
                changes.type.push('CONTENT_EDIT');

                // Classify the edit size
                if (changes.metrics.contentLengthDelta > 100) {
                    changes.type.push('MAJOR_EXPANSION');
                } else if (changes.metrics.contentLengthDelta < -100) {
                    changes.type.push('MAJOR_REDUCTION');
                } else {
                    changes.type.push('MINOR_EDIT');
                }
            }

            if (changes.type.length === 0) {
                throw new Error('No changes detected');
            }

            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})
                
                CREATE (a:Activity {
                    id: $activityId,
                    timestamp: datetime(),
                    changeTypes: $changeTypes,
                    titleLengthDelta: $metrics.titleLengthDelta,
                    contentLengthDelta: $metrics.contentLengthDelta,
                    totalLength: $metrics.totalLength,
                    isExpansion: $patterns.isExpansion,
                    isRefinement: $patterns.isRefinement
                })
                
                CREATE (b)-[:ACTIVITY]->(a)
                
                // Update block's activity summary
                WITH b, a
                OPTIONAL MATCH (u:User {id: $userId})-[:OWNS]->(b)-[:ACTIVITY]->(prevActivity:Activity)
                WITH b, a, collect(prevActivity) as previousActivities
                
                WITH b, a, previousActivities,
                     [act in previousActivities | abs(act.contentLengthDelta)] as editSizes,
                     CASE 
                        WHEN duration.between(b.createdAt, datetime()).days = 0 
                        THEN 1 
                        ELSE duration.between(b.createdAt, datetime()).days 
                     END as daysSinceCreation
                
                SET b += {
                    totalEdits: size(previousActivities) + 1,
                    lastEditTimestamp: a.timestamp,
                    editFrequency: toFloat(size(previousActivities) + 1) / daysSinceCreation,
                    averageEditSize: CASE 
                        WHEN size(editSizes) > 0 
                        THEN toFloat(reduce(total = 0, size IN editSizes | total + size)) / size(editSizes)
                        ELSE 0
                    END
                }
                
                RETURN {
                    id: a.id,
                    timestamp: a.timestamp,
                    changeTypes: a.changeTypes,
                    metrics: {
                        titleLengthDelta: a.titleLengthDelta,
                        contentLengthDelta: a.contentLengthDelta,
                        totalLength: a.totalLength
                    },
                    patterns: {
                        isExpansion: a.isExpansion,
                        isRefinement: a.isRefinement
                    },
                    blockMetadata: {
                        totalEdits: b.totalEdits,
                        lastEditTimestamp: b.lastEditTimestamp,
                        editFrequency: b.editFrequency,
                        averageEditSize: b.averageEditSize
                    }
                } as activity
            `;

            const result = await this.neo4j.executeWrite(query, {
                blockId: updatedBlock.id,
                activityId: uuidv4(),
                userId,
                changeTypes: changes.type,
                metrics: changes.metrics,
                patterns: changes.patterns,
            });

            return {
                ...result[0].activity,
                timestamp: new Date(result[0].activity.timestamp),
                blockMetadata: {
                    ...result[0].activity.blockMetadata,
                    lastEditTimestamp: new Date(result[0].activity.blockMetadata.lastEditTimestamp),
                },
            };
        } catch (error) {
            console.error('Failed to trace activity:', error);
            throw error;
        }
    }

    async traceContext(
        blockId: string,
        userId: string,
        deviceType = 'unknown',
        location?: GeoLocation
    ): Promise<void> {
        try {
            // Extract latitude and longitude if they exist and are valid numbers
            const latitude = location?.lat;
            const longitude = location?.lng;

            // Only use the coordinates if both values are valid numbers
            const hasValidCoordinates =
                typeof latitude === 'number' &&
                typeof longitude === 'number' &&
                !isNaN(latitude) &&
                !isNaN(longitude);

            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})
                CREATE (c:Context {
                    id: $contextId,
                    timestamp: datetime(),
                    deviceType: $deviceType
                    ${hasValidCoordinates ? ', latitude: $latitude, longitude: $longitude' : ''}
                })
                CREATE (b)-[:CONTEXT]->(c)
            `;

            await this.neo4j.executeWrite(query, {
                blockId,
                contextId: uuidv4(),
                deviceType,
                userId,
                ...(hasValidCoordinates ? { latitude, longitude } : {}),
            });
        } catch (error) {
            console.error('Failed to trace context:', error);
            throw error;
        }
    }

    async tracePreviousBlocks(
        blockId: string,
        userId: string,
        previousBlockId: string
    ): Promise<void> {
        try {
            await this.neo4j.executeWrite(
                `
                MATCH (u:User {id: $userId})-[:OWNS]->(current:Block {id: $blockId}), (u)-[:OWNS]->(previous:Block {id: $previousBlockId})
                MERGE (current)-[r:PREVIOUS]->(previous)
                SET r.timestamp = datetime()
            `,
                {
                    blockId,
                    previousBlockId,
                    userId,
                }
            );
        } catch (error) {
            console.error('Failed to trace previous blocks:', error);
            throw error;
        }
    }

    async traceUserFeedback(
        blockId: string,
        userId: string,
        recommendation: string,
        feedback: boolean
    ): Promise<void> {
        try {
            await this.neo4j.executeWrite(
                `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})
                CREATE (f:Feedback {
                    id: $feedbackId,
                    timestamp: datetime(),
                    recommendationType: $recommendation,
                    wasHelpful: $feedback
                })
                CREATE (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})-[:FEEDBACK]->(f)
            `,
                {
                    blockId,
                    feedbackId: uuidv4(),
                    recommendation,
                    feedback,
                    userId,
                }
            );
        } catch (error) {
            console.error('Failed to trace user feedback:', error);
            throw error;
        }
    }

    async getHomeFeedRecommendations(
        userId: string,
        device?: string,
        location?: GeoLocation
    ): Promise<Block[]> {
        try {
            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block)
                WHERE b.totalInteractions > 0
                WITH b
                ORDER BY b.lastInteraction DESC
                LIMIT 10
                RETURN b {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt
                } as block
            `;

            const result = await this.neo4j.executeQuery(query, { userId });

            return result.map((record) => ({
                ...record.block,
                createdAt: new Date(record.block.createdAt),
                updatedAt: new Date(record.block.updatedAt),
            }));
        } catch (error) {
            console.error('Failed to get home feed recommendations:', error);
            throw error;
        }
    }

    async getRelatedBlockRecommendations(blockId: string, userId: string): Promise<Block[]> {
        try {
            const query = `
                MATCH (u:User {id: $userId})-[:OWNS]->(b:Block {id: $blockId})<-[r:LINKED|SIMILAR|MAYBE_SIMILAR|POSSIBLY_SIMILAR]->(related:Block)
                RETURN related {
                    .id,
                    .title,
                    .content,
                    .plainText,
                    .type,
                    .createdAt,
                    .updatedAt
                } as block,
                r.similarity as similarity
                ORDER BY r.similarity DESC
                LIMIT 5
            `;

            const result = await this.neo4j.executeQuery(query, { blockId, userId });

            return result.map((record) => ({
                ...record.block,
                createdAt: new Date(record.block.createdAt),
                updatedAt: new Date(record.block.updatedAt),
                similarity: record.similarity,
            }));
        } catch (error) {
            console.error('Failed to get related block recommendations:', error);
            throw error;
        }
    }
}
