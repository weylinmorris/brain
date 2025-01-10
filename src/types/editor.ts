import { Block } from './block';
import { MutableRefObject } from 'react';

export interface KeyHandlerConfig {
    block: Block;
    blocks: Block[];
    updateBlock: (updates: Partial<Block>) => Promise<void>;
    updateBlockImmediately: (updates: Partial<Block>) => Promise<void>;
    onCreateBlock: (block: Partial<Block>) => Promise<Block>;
    onDeleteBlock: (id: string) => Promise<void>;
    maintainFocus: (blockId: string) => void;
    cursorPositionRef: MutableRefObject<number>;
    previousSiblingId: string | null;
}

export interface KeyHandlers {
    handleEnterKey: (e: React.KeyboardEvent, cursorPosition: number) => Promise<void>;
    handleTabKey: (e: React.KeyboardEvent, cursorPosition: number) => Promise<void>;
    handleBackspaceKey: (e: React.KeyboardEvent, cursorPosition: number) => Promise<void>;
    handleArrowKeys: (e: React.KeyboardEvent) => void;
}

export interface BlockOrder {
    low: number;
    high?: number;
} 