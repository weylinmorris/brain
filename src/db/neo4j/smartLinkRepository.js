import {v4 as uuidv4} from 'uuid';
import {cosineSimilarity, generateTimeMetadata, getPlainText} from "@/db/neo4j/utils.js";

export class SmartLinkRepository {
    constructor(neo4j, blockRepository) {
        this.neo4j = neo4j;
        this.blockRepository = blockRepository;
    }

    async traceBlockLinks(blockId) {
        try {
            console.log(`Computing similarities for block ${blockId}`);

            const block = await this.blockRepository.getBlock(blockId);
            if (!block) throw new Error('Block not found');

            const blocks = await this.blockRepository.getBlocks(true); // Get all blocks
            for (const otherBlock of blocks) {
                if (otherBlock.id === blockId) continue;

                const similarity = cosineSimilarity(block.embeddings, otherBlock.embeddings);

                let relationshipType = null;
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
                    await this.neo4j.executeWrite(`
                    MATCH (a:Block {id: $idA}), (b:Block {id: $idB})
                    MERGE (a)-[r:${relationshipType}]->(b)
                    SET r.similarity = $similarity, r.similarityCheckedAt = datetime()
                `, {
                        idA: blockId,
                        idB: otherBlock.id,
                        similarity,
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 100)); // Slow down to avoid rate limits
            }
            console.log(`Similarities updated for block ${blockId}`);
        } catch (error) {
            console.error('Failed to compute similarities for block:', error);
            throw new Error('Failed to compute similarities for block');
        }
    }

    async traceTime(blockId, actionType = 'VIEW') {
        try {
            const now = new Date();
            const metadata = generateTimeMetadata(now);

            const query = `
            MATCH (b:Block {id: $blockId})
            
            // Create a new time interaction node
            CREATE (t:TimeInteraction {
                id: $interactionId,
                timestamp: datetime(),
                hour: $hour,
                minute: $minute,
                dayOfWeek: $dayOfWeek,
                daySegment: $daySegment,
                season: $season,
                isWeekend: $isWeekend,
                isWorkHours: $isWorkHours,
                actionType: $actionType
            })
            
            // Create relationship with context
            CREATE (b)-[r:TIME_INTERACTION]->(t)
            
            // Update running averages on the block
            WITH b, t
            OPTIONAL MATCH (b)-[:TIME_INTERACTION]->(prev:TimeInteraction)
            WITH b, t, collect(prev) as prevInteractions
            
            SET b += {
                commonHours: [hour in range(0,23) | size([p in prevInteractions WHERE p.hour = hour])],
                commonDays: [day in range(0,6) | size([p in prevInteractions WHERE p.dayOfWeek = day])],
                segmentEarlyMorning: size([p in prevInteractions WHERE p.daySegment = 'EARLY_MORNING']),
                segmentMorning: size([p in prevInteractions WHERE p.daySegment = 'MORNING']),
                segmentMidday: size([p in prevInteractions WHERE p.daySegment = 'MIDDAY']),
                segmentAfternoon: size([p in prevInteractions WHERE p.daySegment = 'AFTERNOON']),
                segmentEvening: size([p in prevInteractions WHERE p.daySegment = 'EVENING']),
                segmentNight: size([p in prevInteractions WHERE p.daySegment = 'NIGHT']),
                totalInteractions: size(prevInteractions) + 1,
                lastInteraction: t.timestamp
            }
            
            RETURN {
                commonHours: b.commonHours,
                commonDays: b.commonDays,
                commonSegments: {
                    EARLY_MORNING: b.segmentEarlyMorning,
                    MORNING: b.segmentMorning,
                    MIDDAY: b.segmentMidday,
                    AFTERNOON: b.segmentAfternoon,
                    EVENING: b.segmentEvening,
                    NIGHT: b.segmentNight
                },
                totalInteractions: b.totalInteractions,
                lastInteraction: b.lastInteraction
            } as metadata
        `;

            return await this.neo4j.executeWrite(query, {
                blockId,
                interactionId: uuidv4(),
                actionType,
                ...metadata
            });

        } catch (error) {
            console.error('Failed to trace time metadata:', error);
            throw new Error('Failed to trace time metadata');
        }
    }

    async traceActivity(updatedBlock, originalBlock) {
        try {
            // Analyze content changes
            const originalText = getPlainText(originalBlock.content);
            const updatedText = getPlainText(updatedBlock.content);

            const changes = {
                type: [],
                metrics: {
                    titleLengthDelta: (updatedBlock.title?.length || 0) - (originalBlock.title?.length || 0),
                    contentLengthDelta: updatedText.length - originalText.length,
                    totalLength: updatedText.length
                },
                patterns: {
                    isExpansion: updatedText.length > originalText.length,
                    isRefinement: updatedText.length <= originalText.length
                }
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

            if (changes.type.length === 0) return;

            const query = `
            MATCH (b:Block {id: $blockId})
            
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
            OPTIONAL MATCH (b)-[:ACTIVITY]->(prevActivity:Activity)
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

            return await this.neo4j.executeWrite(query, {
                blockId: updatedBlock.id,
                activityId: uuidv4(),
                changeTypes: changes.type,
                metrics: changes.metrics,
                patterns: changes.patterns
            });

        } catch (error) {
            console.error('Failed to trace activity:', error);
            throw new Error('Failed to trace activity');
        }
    }

    async traceContext(blockId, deviceType = 'unknown', location = 'unknown') {
        try {
            const query = `
                MATCH (b:Block {id: $blockId})
                
                CREATE (c:Context {
                    id: $contextId,
                    timestamp: datetime(),
                    deviceType: $deviceType,
                    location: $location
                })
                
                CREATE (b)-[:CONTEXT]->(c)
                
                // Update block's context patterns
                WITH b, c
                OPTIONAL MATCH (b)-[:CONTEXT]->(prevContext:Context)
                WITH b, c, collect(prevContext) as previousContexts
                
                SET b.contextPatterns = {
                    deviceTypes: apoc.agg.maxItems([ctx in previousContexts | ctx.deviceType], 3),
                    locations: apoc.agg.maxItems([ctx in previousContexts | ctx.location], 3)
                }
                
                RETURN c {
                    .*,
                    patterns: b.contextPatterns
                } as context
            `;

            return await this.neo4j.executeWrite(query, {
                blockId,
                contextId: uuidv4(),
                deviceType,
                location
            });

        } catch (error) {
            console.error('Failed to trace context:', error);
            throw new Error('Failed to trace context');
        }
    }

    async tracePreviousBlocks(blockId, previousBlockId) {
        try {
            const query = `
                MATCH (current:Block {id: $blockId})
                MATCH (previous:Block {id: $previousBlockId})
                
                // Create or update the navigation relationship
                MERGE (previous)-[nav:NAVIGATES_TO]->(current)
                ON CREATE SET 
                    nav.count = 1,
                    nav.firstNavigation = datetime(),
                    nav.lastNavigation = datetime()
                ON MATCH SET 
                    nav.count = nav.count + 1,
                    nav.lastNavigation = datetime()
                
                // Track chains of navigation (up to 3 blocks back)
                WITH current, previous
                OPTIONAL MATCH (twoBack:Block)-[prev2:NAVIGATES_TO]->(previous)
                WHERE prev2.lastNavigation > datetime.subtract(datetime(), duration('PT30M'))
                
                OPTIONAL MATCH (threeBack:Block)-[prev3:NAVIGATES_TO]->(twoBack)
                WHERE prev3.lastNavigation > datetime.subtract(datetime(), duration('PT30M'))
                
                // Create a chain if we have a sequence
                WITH current, previous, twoBack, threeBack
                WHERE twoBack IS NOT NULL
                
                MERGE (chain:NavigationChain {
                    blocks: CASE 
                        WHEN threeBack IS NOT NULL THEN 
                            [threeBack.id, twoBack.id, previous.id, current.id]
                        ELSE 
                            [twoBack.id, previous.id, current.id]
                    END
                })
                ON CREATE SET 
                    chain.count = 1,
                    chain.firstSeen = datetime()
                ON MATCH SET 
                    chain.count = chain.count + 1,
                    chain.lastSeen = datetime()
                
                RETURN {
                    current: current.id,
                    previous: previous.id,
                    navigationCount: nav.count,
                    chain: CASE 
                        WHEN chain IS NOT NULL THEN chain.blocks
                        ELSE null
                    END,
                    chainCount: CASE 
                        WHEN chain IS NOT NULL THEN chain.count
                        ELSE 0
                    END
                } as navigation
            `;

            return await this.neo4j.executeWrite(query, {
                blockId,
                previousBlockId
            });

        } catch (error) {
            console.error('Failed to trace block navigation:', error);
            throw new Error('Failed to trace block navigation');
        }
    }

    async traceUserFeedback(blockId, recommendation, feedback) {
        try {
            const query = `
                MATCH (block:Block {id: $blockId})
                MATCH (recommendedBlock:Block {id: $recommendedBlockId})
                
                // Create feedback node
                CREATE (f:Feedback {
                    id: $feedbackId,
                    timestamp: datetime(),
                    type: $feedbackType,
                    isHelpful: $isHelpful,
                    recommendationType: $recommendationType,
                    scores: $scores
                })
                
                // Connect feedback to both blocks
                CREATE (block)-[:RECEIVED_RECOMMENDATION]->(f)
                CREATE (f)-[:RECOMMENDED_BLOCK]->(recommendedBlock)
                
                // Update success rates on the relationship between blocks
                WITH block, recommendedBlock, f
                MERGE (block)-[r:RECOMMENDATION_PATTERN]->(recommendedBlock)
                ON CREATE SET 
                    r.totalRecommendations = 1,
                    r.successfulRecommendations = CASE WHEN f.isHelpful THEN 1 ELSE 0 END,
                    r.firstRecommendation = datetime()
                ON MATCH SET 
                    r.totalRecommendations = r.totalRecommendations + 1,
                    r.successfulRecommendations = r.successfulRecommendations + 
                        CASE WHEN f.isHelpful THEN 1 ELSE 0 END,
                    r.successRate = (r.successfulRecommendations + 
                        CASE WHEN f.isHelpful THEN 1 ELSE 0 END) * 1.0 / 
                        (r.totalRecommendations + 1)
                
                // Update the block's recommendation patterns
                WITH block, f, r
                SET block.recommendationMetadata = {
                    lastFeedbackAt: datetime(),
                    recommendationPatterns: {
                        successRate: r.successRate,
                        totalFeedback: r.totalRecommendations
                    }
                }
                
                RETURN {
                    feedbackId: f.id,
                    sourceBlock: block.id,
                    recommendedBlock: recommendedBlock.id,
                    successRate: r.successRate,
                    totalRecommendations: r.totalRecommendations,
                    pattern: block.recommendationMetadata
                } as result
            `;

            return await this.neo4j.executeWrite(query, {
                blockId,
                feedbackId: uuidv4(),
                recommendedBlockId: recommendation.blockId,
                feedbackType: feedback.type || 'GENERAL',
                isHelpful: feedback.isHelpful,
                recommendationType: recommendation.type || 'GENERAL',
                scores: {
                    contentSimilarity: recommendation.scores?.content || 0,
                    contextSimilarity: recommendation.scores?.context || 0,
                    temporalSimilarity: recommendation.scores?.temporal || 0,
                    behavioralSimilarity: recommendation.scores?.behavioral || 0
                }
            });

        } catch (error) {
            console.error('Failed to trace feedback:', error);
            throw new Error('Failed to trace feedback');
        }
    }

    async getHomeFeedRecommendations(device, location) {
        return [];
    }

    async getRelatedBlockRecommendations(blockId) {
        try {
            // Fetch blocks with their relationships, grouped by relationship type
            const result = await this.neo4j.executeQuery(`
                MATCH (b:Block {id: $blockId})-[r]-(related:Block)
                WHERE type(r) IN ['LINKED', 'SIMILAR', 'MAYBE_SIMILAR']
                RETURN related {
                    .id,
                    .title,
                    .content,
                    .type,
                    .createdAt,
                    .updatedAt,
                    similarity: r.similarity,
                    relationshipType: type(r)
                } as recommendation
                ORDER BY r.similarity DESC
            `, {blockId});

            // Transform the results into recommendation objects
            const recommendations = result.map(row => ({
                id: row.recommendation.id,
                title: row.recommendation.title,
                content: row.recommendation.content,
                type: row.recommendation.type,
                createdAt: new Date(row.recommendation.createdAt),
                updatedAt: new Date(row.recommendation.updatedAt),
                similarity: row.recommendation.similarity,
                relationshipType: row.recommendation.relationshipType
            }));

            // Group recommendations by their similarity tiers
            const linked = recommendations.filter(rec => rec.relationshipType === 'LINKED');          // similarity > 0.8
            const similar = recommendations.filter(rec => rec.relationshipType === 'SIMILAR');        // similarity > 0.6
            const maybeSimilar = recommendations.filter(rec => rec.relationshipType === 'MAYBE_SIMILAR'); // similarity > 0.4

            // Run each category through a filter to remove duplicates
            const seenIds = new Set();
            const filteredLinked = linked.filter(rec => !seenIds.has(rec.id) && seenIds.add(rec.id));
            const filteredSimilar = similar.filter(rec => !seenIds.has(rec.id) && seenIds.add(rec.id));
            const filteredMaybeSimilar = maybeSimilar.filter(rec => !seenIds.has(rec.id) && seenIds.add(rec.id));

            // Return arrays in order of decreasing similarity
            return [filteredLinked, filteredSimilar, filteredMaybeSimilar];

        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
            throw new Error('Failed to fetch recommendations');
        }
    }
}
