import { Block } from './block';

export type QueryType = 'question' | 'search';

export interface BlockSource {
    id: string;
    title: string;
}

export interface AnswerResult {
    answer: string;
    sources: BlockSource[];
}
