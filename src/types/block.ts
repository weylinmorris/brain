export interface Block {
    id: string;
    title: string;
    content: string;
    type: 'text' | 'image' | 'code' | 'math';
    createdAt: Date;
    updatedAt: Date;
    embeddings?: number[];
    plainText?: string;
    similarity?: number;
}

export interface BlockContextType {
    blocks: Block[];
    createBlock: (block: Partial<Block>) => Promise<Block>;
    deleteBlock: (id: string) => Promise<void>;
}

export interface ActiveBlockContextType {
    activeBlockId: string | null;
    setActiveBlock: (id: string | null) => void;
}
