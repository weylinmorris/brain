import { Session, Transaction, Result, Driver, ManagedTransaction } from 'neo4j-driver';
import { Block } from './block';
import OpenAI from 'openai';

export interface Neo4jConfig {
    uri: string;
    username: string;
    password: string;
}

export interface QueryOptions {
    write?: boolean;
}

export interface DatabaseRecord {
    [key: string]: any;
}

export type TransactionWork<T = Result> = (tx: ManagedTransaction) => Promise<T>;

export interface Neo4jClientInterface {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    verifyConnectivity(): Promise<void>;
    getSession(): Promise<Session>;
    executeQuery(
        cypher: string,
        params?: Record<string, any>,
        options?: QueryOptions
    ): Promise<DatabaseRecord[]>;
    executeWrite(cypher: string, params?: Record<string, any>): Promise<DatabaseRecord[]>;
    executeTransaction(work: TransactionWork, options?: QueryOptions): Promise<Result>;
}

export interface DatabaseInterface {
    connect(): Promise<void>;
    ensureConnection(): Promise<void>;
    disconnect(): Promise<void>;
    readonly blocks: BlockRepositoryInterface;
    readonly smartLinks: SmartLinkRepositoryInterface;
}

export interface BlockInput {
    title?: string;
    content: string;
    type?: 'text' | 'image' | 'code' | 'math';
    device?: string;
    location?: GeoLocation;
    userId: string;
}

export interface BlockUpdate {
    title?: string;
    content?: string;
    type?: 'text' | 'image' | 'code' | 'math';
    userId?: string;
}

export interface BlockSearchResult {
    titleMatches: Block[];
    contentMatches: Block[];
    similarityMatches: Block[];
}

export interface BlockRepositoryInterface {
    createBlock(input: BlockInput): Promise<Block>;
    createManyBlocks(inputs: BlockInput[]): Promise<Block[]>;
    searchBlocks(query: string, userId: string, threshold?: number): Promise<BlockSearchResult>;
    getBlocks(userId: string, includeEmbeddings?: boolean): Promise<Block[]>;
    getBlock(
        id: string,
        userId: string,
        device?: string,
        location?: GeoLocation,
        includeEmbeddings?: boolean
    ): Promise<Block>;
    updateBlock(
        id: string,
        userId: string,
        updates: BlockUpdate,
        device?: string,
        location?: GeoLocation
    ): Promise<Block>;
    deleteBlock(id: string): Promise<void>;
    setSmartLinkRepository(repo: SmartLinkRepositoryInterface): void;
    initializeOpenAI(openai: OpenAI): void;
}

export interface GeoLocation {
    lat: number;
    lng: number;
    userId?: string;
}

export interface TimeMetadata {
    commonHours: number[];
    commonDays: number[];
    commonSegments: {
        EARLY_MORNING: number;
        MORNING: number;
        MIDDAY: number;
        AFTERNOON: number;
        EVENING: number;
        NIGHT: number;
    };
    totalInteractions: number;
    lastInteraction: Date;
}

export type DaySegment = 'EARLY_MORNING' | 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type Season = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
export type ActionType = 'CREATE' | 'UPDATE' | 'VIEW';
export type SimilarityType = 'LINKED' | 'SIMILAR' | 'MAYBE_SIMILAR' | 'POSSIBLY_SIMILAR';

export interface ActivityMetrics {
    titleLengthDelta: number;
    contentLengthDelta: number;
    totalLength: number;
    userId?: string;
}

export interface ActivityPatterns {
    isExpansion: boolean;
    isRefinement: boolean;
    userId?: string;
}

export interface BlockActivity {
    id: string;
    timestamp: Date;
    changeTypes: string[];
    metrics: ActivityMetrics;
    patterns: ActivityPatterns;
    blockMetadata: {
        totalEdits: number;
        lastEditTimestamp: Date;
        editFrequency: number;
        averageEditSize: number;
        userId?: string;
    };
}

export interface SmartLinkRepositoryInterface {
    neo4j: Neo4jClientInterface;
    blockRepository: BlockRepositoryInterface;
    traceBlockLinks(blockId: string, userId: string): Promise<void>;
    traceTime(blockId: string, userId: string, action: ActionType): Promise<TimeMetadata>;
    traceActivity(
        updatedBlock: Block,
        originalBlock: Block,
        userId: string
    ): Promise<BlockActivity>;
    traceContext(
        blockId: string,
        userId: string,
        device?: string,
        location?: GeoLocation
    ): Promise<void>;
    tracePreviousBlocks(blockId: string, userId: string, previousBlockId: string): Promise<void>;
    traceUserFeedback(
        blockId: string,
        userId: string,
        recommendation: string,
        feedback: boolean
    ): Promise<void>;
    getHomeFeedRecommendations(
        userId: string,
        device?: string,
        location?: GeoLocation
    ): Promise<Block[]>;
    getRelatedBlockRecommendations(blockId: string, userId: string): Promise<Block[]>;
}
