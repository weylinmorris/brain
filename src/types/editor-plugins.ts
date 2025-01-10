import { Block } from '@/types/block';
import { SaveStatus } from './editor-config';
import { LucideIcon } from 'lucide-react';

export interface ToolbarPluginProps {
    handleSave: (json: string) => Promise<void>;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    block: Block;
}

export interface ToolbarButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    isActive?: boolean;
    tooltip?: string;
}

export interface SavePluginProps {
    handleSave: () => Promise<void>;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}
