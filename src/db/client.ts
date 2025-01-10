import { Neo4jClient } from './neo4j/driver';
import { BlockRepository } from './neo4j/blockRepository';
import { SmartLinkRepository } from "./neo4j/smartLinkRepository";
import { DatabaseInterface, BlockRepositoryInterface, SmartLinkRepositoryInterface } from '@/types/database';
import OpenAI from "openai";

class Database implements DatabaseInterface {
    private static instance: Database | null = null;
    private readonly _neo4j: Neo4jClient;
    private readonly _blocks: BlockRepositoryInterface;
    private readonly _smartLinks: SmartLinkRepositoryInterface;
    private _isConnected: boolean;
    private _connectionPromise: Promise<void> | null;

    private constructor() {
        this._neo4j = new Neo4jClient();
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this._blocks = new BlockRepository(this._neo4j);
        this._smartLinks = new SmartLinkRepository(this._neo4j, this._blocks);
        this._isConnected = false;
        this._connectionPromise = null;

        // Initialize OpenAI in BlockRepository
        (this._blocks as BlockRepository).initializeOpenAI(openai);
        (this._blocks as BlockRepository).setSmartLinkRepository(this._smartLinks);
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect(): Promise<void> {
        if (!this._isConnected && !this._connectionPromise) {
            this._connectionPromise = this._neo4j.connect().then(() => {
                this._isConnected = true;
                this._connectionPromise = null;
            });
        }
        return this._connectionPromise || Promise.resolve();
    }

    async ensureConnection(): Promise<void> {
        if (!this._isConnected) {
            await this.connect();
        }
    }

    get blocks(): BlockRepositoryInterface {
        return this._blocks;
    }

    get smartLinks(): SmartLinkRepositoryInterface {
        return this._smartLinks;
    }

    async disconnect(): Promise<void> {
        if (this._isConnected) {
            await this._neo4j.disconnect();
            this._isConnected = false;
        }
    }
}

const db = Database.getInstance();
export { db }; 