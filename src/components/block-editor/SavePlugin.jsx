import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import _ from 'lodash';

const formatDate = (date) => {
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

function SavePlugin({ onSave, saveStatus, lastSaved, block }) {
    const [editor] = useLexicalComposerContext();

    async function saveContent() {
        try {
            await editor.update(() => {
                const json = JSON.stringify(editor.getEditorState());
                onSave(json);
            });
        } catch (error) {
            console.error('Failed to save:', error);
        }
    }

    const debouncedSave = useMemo(
        () => _.debounce(saveContent, 5000, { maxWait: 10000 }),
        [editor, onSave]
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
        <div className="flex items-center gap-2 text-xs text-neutral-500 mr-2">
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