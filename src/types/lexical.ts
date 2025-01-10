export interface LexicalNode {
    text?: string;
    children?: LexicalNode[];
    type?: string;
}

export interface LexicalContent {
    root: {
        children: LexicalNode[];
    };
}

export interface PreviewResult {
    preview: string;
    matchStart: number;
    matchEnd: number;
}
