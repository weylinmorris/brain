import { Neo4jClient } from './neo4j/driver.js';
import { BlockRepository } from './neo4j/blockRepository.js';
import { SimilarityRepository } from './neo4j/similarityRepository.js';

class Database {
    constructor() {
        this._neo4j = new Neo4jClient(); // Initialize Neo4j client

        // Initialize repositories without dependencies
        this._blocks = null;
        this._similarities = null;

        // Create the repositories and inject dependencies
        this._blocks = new BlockRepository(this._neo4j);
        this._similarities = new SimilarityRepository(this._neo4j, this._blocks);

        // Inject SimilarityRepository into BlockRepository
        this._blocks.setSimilarityRepository(this._similarities);
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect() {
        if (!this._isConnected && !this._connectionPromise) {
            this._connectionPromise = this._neo4j.connect().then(() => {
                this._isConnected = true;
                this._connectionPromise = null;
            });
        }
        return this._connectionPromise;
    }

    async ensureConnection() {
        if (!this._isConnected) {
            await this.connect();
        }
    }

    get blocks() {
        return this._blocks;
    }

    get similarities() {
        return this._similarities;
    }

    async disconnect() {
        if (this._isConnected) {
            await this._neo4j.disconnect();
            this._isConnected = false;
        }
    }
}

const db = Database.getInstance();
export { db };
