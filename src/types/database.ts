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
    executeQuery(cypher: string, params?: Record<string, any>, options?: QueryOptions): Promise<DatabaseRecord[]>;
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
}

export interface BlockUpdate {
    title?: string;
    content?: string;
    type?: 'text' | 'image' | 'code' | 'math';
}

export interface BlockSearchResult {
    titleMatches: Block[];
    contentMatches: Block[];
    similarityMatches: Block[];
}

export interface BlockRepositoryInterface {
    createBlock(input: BlockInput): Promise<Block>;
    createManyBlocks(inputs: BlockInput[]): Promise<Block[]>;
    searchBlocks(query: string, threshold?: number): Promise<BlockSearchResult>;
    getBlocks(includeEmbeddings?: boolean): Promise<Block[]>;
    getBlock(id: string, device?: string, location?: GeoLocation, includeEmbeddings?: boolean): Promise<Block>;
    updateBlock(id: string, updates: BlockUpdate, device?: string, location?: GeoLocation): Promise<Block>;
    deleteBlock(id: string): Promise<void>;
    setSmartLinkRepository(repo: SmartLinkRepositoryInterface): void;
    initializeOpenAI(openai: OpenAI): void;
}

export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface TimeMetadata {
    hour: number;
    minute: number;
    dayOfWeek: number;
    daySegment: DaySegment;
    season: Season;
    isWeekend: boolean;
    isWorkHours: boolean;
}

export type DaySegment = 'EARLY_MORNING' | 'MORNING' | 'MIDDAY' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type Season = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
export type ActionType = 'CREATE' | 'UPDATE' | 'VIEW';
export type SimilarityType = 'LINKED' | 'SIMILAR' | 'MAYBE_SIMILAR' | 'POSSIBLY_SIMILAR';

export interface ActivityMetrics {
    titleLengthDelta: number;
    contentLengthDelta: number;
    totalLength: number;
}

export interface ActivityPatterns {
    isExpansion: boolean;
    isRefinement: boolean;
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
    };
}

export interface SmartLinkRepositoryInterface {
    neo4j: Neo4jClientInterface;
    blockRepository: BlockRepositoryInterface;
    traceBlockLinks(blockId: string): Promise<void>;
    traceTime(blockId: string, action: ActionType): Promise<TimeMetadata>;
    traceActivity(updatedBlock: Block, originalBlock: Block): Promise<BlockActivity>;
    traceContext(blockId: string, device?: string, location?: GeoLocation): Promise<void>;
    tracePreviousBlocks(blockId: string, previousBlockId: string): Promise<void>;
    traceUserFeedback(blockId: string, recommendation: string, feedback: boolean): Promise<void>;
    getHomeFeedRecommendations(device?: string, location?: GeoLocation): Promise<Block[]>;
    getRelatedBlockRecommendations(blockId: string): Promise<Block[]>;
} 