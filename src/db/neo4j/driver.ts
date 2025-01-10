import {
    driver as createDriver,
    auth,
    Driver,
    Session,
    Transaction,
    Result,
    ManagedTransaction,
} from 'neo4j-driver';
import {
    Neo4jClientInterface,
    Neo4jConfig,
    QueryOptions,
    DatabaseRecord,
    TransactionWork,
} from '@/types/database';

export class Neo4jClient implements Neo4jClientInterface {
    private driver: Driver | null;
    private readonly uri: string;
    private readonly username: string;
    private readonly password: string;

    constructor() {
        this.driver = null;
        this.uri = process.env.NEO4J_URI || '';
        this.username = process.env.NEO4J_USER || '';
        this.password = process.env.NEO4J_PASSWORD || '';
    }

    async connect(): Promise<void> {
        if (this.driver) {
            return; // Already connected
        }

        try {
            this.driver = createDriver(this.uri, auth.basic(this.username, this.password), {
                maxConnectionPoolSize: 50,
                connectionTimeout: 5000, // 5 seconds
                maxTransactionRetryTime: 30000, // 30 seconds
            });

            await this.verifyConnectivity();
        } catch (error) {
            this.driver = null;
            throw new Error(
                `Failed to connect to Neo4j: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    async disconnect(): Promise<void> {
        if (!this.driver) {
            return; // Already disconnected
        }

        try {
            await this.driver.close();
            this.driver = null;
        } catch (error) {
            throw new Error(
                `Failed to disconnect from Neo4j: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    async verifyConnectivity(): Promise<void> {
        if (!this.driver) {
            throw new Error('No driver instance found');
        }

        try {
            await this.driver.verifyConnectivity();

            // Optional: Run a test query
            const session = this.driver.session();
            try {
                await session.run('RETURN 1');
            } finally {
                await session.close();
            }
        } catch (error) {
            throw new Error(
                `Failed to verify Neo4j connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    async getSession(): Promise<Session> {
        if (!this.driver) {
            throw new Error('No driver instance found');
        }

        return this.driver.session();
    }

    async executeQuery(
        cypher: string,
        params: Record<string, any> = {},
        options: QueryOptions = { write: false }
    ): Promise<DatabaseRecord[]> {
        const session = await this.getSession();
        try {
            const result = await session.executeRead(async (tx: ManagedTransaction) =>
                tx.run(cypher, params)
            );
            return result.records.map((record) => record.toObject());
        } finally {
            await session.close();
        }
    }

    async executeWrite(
        cypher: string,
        params: Record<string, any> = {}
    ): Promise<DatabaseRecord[]> {
        const session = await this.getSession();
        try {
            const result = await session.executeWrite(async (tx: ManagedTransaction) =>
                tx.run(cypher, params)
            );
            return result.records.map((record) => record.toObject());
        } finally {
            await session.close();
        }
    }

    async executeTransaction<T = Result>(
        work: TransactionWork<T>,
        options: QueryOptions = { write: false }
    ): Promise<T> {
        const session = await this.getSession();
        try {
            if (options.write) {
                return await session.executeWrite(work);
            }
            return await session.executeRead(work);
        } finally {
            await session.close();
        }
    }
}
