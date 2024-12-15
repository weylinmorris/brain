import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Save } from 'lucide-react';

function SavePlugin({ onSave }) {
    const [editor] = useLexicalComposerContext();

    const saveContent = () => {
        editor.update(() => {
            const json = JSON.stringify(editor.getEditorState());
            onSave(json);
        });
    };

    return (
        <button
            onClick={saveContent}
            className="flex items-center font-bold gap-2 px-3 py-1 bg-primary-800 hover:bg-primary-700 rounded text-sm transition-colors duration-200"
        >
            <Save size={16} />
            Save
        </button>
    );
}

export default SavePlugin;