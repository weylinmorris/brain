import { Neo4jClient } from './neo4j/driver.js';
import { BlockRepository } from './neo4j/blockRepository.js';
import {SmartLinkRepository} from "@/db/neo4j/smartLinkRepository.js";

class Database {
    constructor() {
        this._neo4j = new Neo4jClient();

        this._blocks = new BlockRepository(this._neo4j);
        this._smartLinks = new SmartLinkRepository(this._neo4j, this._blocks);

        this._blocks.setSmartLinkRepository(this._smartLinks);
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

    get smartLinks() {
        return this._smartLinks;
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
