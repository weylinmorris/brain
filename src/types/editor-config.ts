import { EditorThemeClasses } from 'lexical';
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode } from '@lexical/code';

export type EditorNodes = typeof HeadingNode | typeof QuoteNode | typeof ListItemNode | typeof ListNode | typeof CodeNode;

export interface EditorConfig {
    namespace: string;
    theme: EditorThemeClasses;
    nodes: EditorNodes[];
    onError: (error: Error) => void;
    editorState?: string | null;
}

export interface BlockEditorProps {
    className?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'not-saved'; 