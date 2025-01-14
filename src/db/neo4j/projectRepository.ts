import { v4 as uuidv4 } from 'uuid';
import {
    Neo4jClientInterface,
    ProjectRepositoryInterface,
    Project,
    ProjectInput,
    ProjectUpdate
} from '@/types/database';

export class ProjectRepository implements ProjectRepositoryInterface {
    private neo4j: Neo4jClientInterface;

    constructor(neo4j: Neo4jClientInterface) {
        this.neo4j = neo4j;
    }

    async createProject(input: ProjectInput): Promise<Project> {
        const projectId = uuidv4();

        try {
            const query = `
                MATCH (u:User {id: $userId})
                CREATE (p:Project {
                    id: $id,
                    name: $name,
                    description: $description,
                    createdAt: datetime(),
                    updatedAt: datetime()
                })
                CREATE (u)-[:OWNS]->(p)
                RETURN p {
                    .id,
                    .name,
                    .description,
                    .createdAt,
                    .updatedAt
                } as project
            `;

            const result = await this.neo4j.executeWrite(query, {
                id: projectId,
                name: input.name,
                description: input.description || '',
                userId: input.userId,
            });

            if (!result.length) {
                throw new Error('Failed to create project: No result returned from query.');
            }

            const project = result[0].project;
            return {
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: new Date(project.createdAt),
                updatedAt: new Date(project.updatedAt),
                userId: input.userId,
            };
        } catch (error) {
            console.error('Project creation failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                input,
                timestamp: new Date().toISOString(),
            });
            throw new Error('Failed to create project. See logs for details.');
        }
    }

    async getProjects(userId: string): Promise<Project[]> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project)
            RETURN p {
                .id,
                .name,
                .description,
                .createdAt,
                .updatedAt
            } as project
            ORDER BY p.updatedAt DESC
        `;

        const result = await this.neo4j.executeQuery(query, { userId });

        return result.map(record => ({
            id: record.project.id,
            name: record.project.name,
            description: record.project.description,
            createdAt: new Date(record.project.createdAt),
            updatedAt: new Date(record.project.updatedAt),
            userId,
        }));
    }

    async getProject(id: string, userId: string): Promise<Project> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $id})
            RETURN p {
                .id,
                .name,
                .description,
                .createdAt,
                .updatedAt
            } as project
        `;

        const result = await this.neo4j.executeQuery(query, { id, userId });

        if (!result.length) {
            throw new Error('Project not found');
        }

        const project = result[0].project;
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
            userId,
        };
    }

    async updateProject(id: string, userId: string, updates: ProjectUpdate): Promise<Project> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $id})
            SET p += $updates,
                p.updatedAt = datetime()
            RETURN p {
                .id,
                .name,
                .description,
                .createdAt,
                .updatedAt
            } as project
        `;

        const result = await this.neo4j.executeWrite(query, {
            id,
            userId,
            updates: {
                ...(updates.name && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
            },
        });

        if (!result.length) {
            throw new Error('Project not found or update failed');
        }

        const project = result[0].project;
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
            userId,
        };
    }

    async deleteProject(id: string, userId: string): Promise<void> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $id})
            DETACH DELETE p
        `;

        await this.neo4j.executeWrite(query, { id, userId });
    }

    async addBlockToProject(
        projectId: string,
        blockId: string,
        userId: string,
        relationship: 'OWNS' | 'RELATED'
    ): Promise<void> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $projectId})
            MATCH (b:Block {id: $blockId})
            WHERE (u)-[:OWNS]->(b)
            MERGE (p)-[r:${relationship}]->(b)
            SET p.updatedAt = datetime()
        `;

        await this.neo4j.executeWrite(query, { projectId, blockId, userId });
    }

    async removeBlockFromProject(projectId: string, blockId: string, userId: string): Promise<void> {
        const query = `
            MATCH (u:User {id: $userId})-[:OWNS]->(p:Project {id: $projectId})
            MATCH (p)-[r:OWNS|RELATED]->(b:Block {id: $blockId})
            DELETE r
            SET p.updatedAt = datetime()
        `;

        await this.neo4j.executeWrite(query, { projectId, blockId, userId });
    }
} 