'use client';

import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import baseTheme from './EditorTheme';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { MarkdownPastePlugin } from './plugins/MarkdownPastePlugin';
import { KEY_ENTER_COMMAND, LexicalEditor } from 'lexical';

// Import Prism languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-bash';

interface NoteEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    onSubmit?: () => void;
    isReadOnly?: boolean;
    placeholder?: React.ReactNode;
    className?: string;
    autoFocus?: boolean;
    onEditorReady?: (editor: LexicalEditor) => void;
}

const theme = {
    ...baseTheme,
    paragraph: baseTheme.paragraph + ' !text-sm',
    text: {
        ...(baseTheme.text || {}),
        base: (baseTheme.text?.base || '') + ' !text-sm',
    },
};

const EditorContent = ({
    onChange,
    onSubmit,
    isReadOnly,
    className,
    onEditorReady,
}: Pick<
    NoteEditorProps,
    'onChange' | 'onSubmit' | 'isReadOnly' | 'className' | 'onEditorReady'
>) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (isReadOnly) return;

        onEditorReady?.(editor);

        const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
            if (onChange) {
                const content = JSON.stringify(editorState);
                onChange(content);
            }
        });

        const removeKeyDownListener = editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                if (event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    onSubmit?.();
                    return true;
                }
                return false;
            },
            1
        );

        return () => {
            removeUpdateListener();
            removeKeyDownListener();
        };
    }, [editor, onChange, onSubmit, isReadOnly, onEditorReady]);

    return (
        <ContentEditable
            className={`outline-none ${className || ''}`}
            contentEditable={!isReadOnly}
        />
    );
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
    content,
    onChange,
    onSubmit,
    isReadOnly = false,
    placeholder,
    className,
    autoFocus = false,
    onEditorReady,
}) => {
    const editorConfig = {
        namespace: isReadOnly ? 'NoteReader' : 'NoteEditor',
        theme,
        nodes: [
            HeadingNode,
            QuoteNode,
            ListItemNode,
            ListNode,
            CodeNode,
            CodeHighlightNode,
            LinkNode,
        ],
        editable: !isReadOnly,
        editorState: content || undefined,
        onError: (error: Error) => {
            console.error('Error in NoteEditor:', error);
        },
    };

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div
                className={`relative text-sm [&:not(.EditorTheme__code)_*]:!text-sm ${className || ''}`}
            >
                <RichTextPlugin
                    contentEditable={
                        <EditorContent
                            onChange={onChange}
                            onSubmit={onSubmit}
                            isReadOnly={isReadOnly}
                            className={className}
                            onEditorReady={onEditorReady}
                        />
                    }
                    placeholder={placeholder}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <CodeHighlightPlugin />
                {!isReadOnly && (
                    <>
                        <CheckListPlugin />
                        {autoFocus && <AutoFocusPlugin />}
                        <TabIndentationPlugin />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                        <MarkdownPastePlugin />
                    </>
                )}
            </div>
        </LexicalComposer>
    );
};
