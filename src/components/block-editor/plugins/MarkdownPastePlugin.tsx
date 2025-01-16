import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { PASTE_COMMAND, $getSelection, $isRangeSelection } from 'lexical';
import { useEffect } from 'react';
import { TRANSFORMERS } from '@lexical/markdown';
import { $convertFromMarkdownString } from '@lexical/markdown';

export function MarkdownPastePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand<ClipboardEvent>(
            PASTE_COMMAND,
            (event) => {
                const text = event.clipboardData?.getData('text/plain');
                if (!text) return false;

                // Convert markdown to Lexical nodes
                editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        $convertFromMarkdownString(text, TRANSFORMERS);
                    }
                });

                // Prevent default paste behavior
                event.preventDefault();
                return true;
            },
            1
        );
    }, [editor]);

    return null;
}
