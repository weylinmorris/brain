import {driver as createDriver, auth} from 'neo4j-driver'

export class Neo4jClient {
    constructor() {
        this.driver = null;
        this.uri = process.env.NEO4J_URI;
        this.username = process.env.NEO4J_USER;
        this.password = process.env.NEO4J_PASSWORD;
    }

    async connect() {
        if (this.driver) {
            return; // Already connected
        }

        try {
            this.driver = createDriver(
                this.uri,
                auth.basic(this.username, this.password),
                {
                    maxConnectionPoolSize: 50,
                    connectionTimeout: 5000, // 5 seconds
                    maxTransactionRetryTime: 30000 // 30 seconds
                }
            );

            await this.verifyConnectivity();
        } catch (error) {
            this.driver = null;
            throw new Error(
                `Failed to connect to Neo4j: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    async disconnect() {
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

    async verifyConnectivity() {
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

    async getSession() {
        if (!this.driver) {
            throw new Error('No driver instance found');
        }

        return this.driver.session();
    }

    async executeQuery(cypher, params = {}, options = { write: false }) {
        const session = await this.getSession();
        try {
            const result = await session.executeRead(
                tx => tx.run(cypher, params),
            );
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }

    async executeWrite(cypher, params = {}) {
        const session = await this.getSession();
        try {
            const result = await session.executeWrite(
                tx => tx.run(cypher, params),
            );
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }

    async executeTransaction(work, options = { write: false }) {
        const session = await this.getSession();
        try {
            // We need to wrap the work function to match what Neo4j expects
            const wrappedWork = (tx) => work(tx);

            if (options.write) {
                return await session.executeWrite(wrappedWork);
            }
            return await session.executeRead(wrappedWork);
        } finally {
            await session.close();
        }
    }
}