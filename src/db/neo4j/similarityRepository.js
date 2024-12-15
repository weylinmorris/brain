export class SimilarityRepository {
    constructor(neo4j, blockRepository) {
        this.neo4j = neo4j;
        this.blockRepository = blockRepository;
    }

    cosineSimilarity(embeddingA, embeddingB) {
        if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) {
            throw new Error('Both embeddings must be arrays.');
        }
        if (embeddingA.length !== embeddingB.length) {
            throw new Error('Embeddings must have the same length.');
        }

        const dotProduct = embeddingA.reduce((sum, value, index) => sum + value * embeddingB[index], 0);
        const magnitudeA = Math.sqrt(embeddingA.reduce((sum, value) => sum + value ** 2, 0));
        const magnitudeB = Math.sqrt(embeddingB.reduce((sum, value) => sum + value ** 2, 0));

        if (magnitudeA === 0 || magnitudeB === 0) {
            throw new Error('One of the embeddings has zero magnitude.');
        }

        return dotProduct / (magnitudeA * magnitudeB);
    }

    async computeSimilaritiesForBlock(blockId) {
        try {
            console.log(`Computing similarities for block ${blockId}`);

            const block = await this.blockRepository.getBlock(blockId);
            if (!block) throw new Error('Block not found');

            const blocks = await this.blockRepository.getBlocks(true); // Get all blocks
            for (const otherBlock of blocks) {
                if (otherBlock.id === blockId) continue;

                const similarity = this.cosineSimilarity(block.embeddings, otherBlock.embeddings);

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
            }
            console.log(`Similarities updated for block ${blockId}`);
        } catch (error) {
            console.error('Failed to compute similarities for block:', error);
            throw new Error('Failed to compute similarities for block');
        }
    }

    async getRecommendations(blockId) {
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
