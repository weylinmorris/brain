import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useMemo, useCallback } from 'react';
import { Check, Loader2 } from 'lucide-react';
import _ from 'lodash';
import { Block } from '../../../types/block';

const formatDate = (date: Date) => {
    if (!date) return '';
    const now = new Date();
    const updateDate = new Date(date);

    // If it's today, show time
    if (updateDate.toDateString() === now.toDateString()) {
        return updateDate.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // If it's this year, show month and day
    if (updateDate.getFullYear() === now.getFullYear()) {
        return updateDate.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
    }

    // Otherwise show the full date
    return updateDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

function SavePlugin({ onSave, saveStatus, block }: { onSave: (json: string) => void, saveStatus: string, block: Block }) {
    const [editor] = useLexicalComposerContext();

    const saveContent = useCallback(async () => {
        try {
            const editorState = editor.getEditorState();
            const json = JSON.stringify(editorState);
            onSave(json);
        } catch (error) {
            console.error('Failed to save:', error);
        }
    }, [editor, onSave]);

    const debouncedSave = useMemo(
        () => _.debounce(saveContent, 5000, { maxWait: 10000 }),
        [saveContent]
    );

    useEffect(() => {
        const removeUpdateListener = editor.registerUpdateListener(() => {
            debouncedSave();
        });

        return () => {
            removeUpdateListener();
            debouncedSave.cancel();
        };
    }, [editor, debouncedSave]);

    const renderText = () => {
        if (saveStatus === 'saving') return 'Saving...';
        if (block?.updatedAt) return `Updated ${formatDate(block.updatedAt)}`;
        return 'New block';
    };

    return (
        <div 
            className="flex items-center gap-2 text-xs text-neutral-400 mr-2 cursor-pointer hover:text-neutral-300"
            onClick={saveContent}
        >
            <div className="flex items-center gap-1.5">
                {saveStatus === 'saving' ? (
                    <Loader2 size={12} className="animate-spin text-neutral-400" />
                ) : (
                    <Check size={12} className="text-green-500" />
                )}
                <span>{renderText()}</span>
            </div>
        </div>
    );
}

export default SavePlugin;