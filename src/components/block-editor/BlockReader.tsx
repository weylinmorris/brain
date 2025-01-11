import React from 'react';
import { LexicalContent } from '@/types/lexical';
import { LexicalNode } from 'lexical';
import './EditorTheme.css';

interface BlockReaderProps {
    content: string | null;
    className?: string;
}

interface BaseNodeType extends LexicalNode {
    type: string;
    format?: number;
    indent?: number;
    children?: Array<TextNodeType | ListItemNodeType | ListNodeType>;
    style?: string;
}

interface TextNodeType {
    type: 'text';
    text: string;
    format?: number;
    style?: string;
}

interface HeadingNodeType extends BaseNodeType {
    type: 'heading';
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

interface ListNodeType extends BaseNodeType {
    type: 'list';
    listType: 'bullet' | 'number' | 'check';
    children: Array<ListItemNodeType>;
    start?: number;
}

interface ListItemNodeType extends BaseNodeType {
    type: 'listitem';
    checked?: boolean;
    value?: number;
}

interface QuoteNodeType extends BaseNodeType {
    type: 'quote';
}

interface CodeNodeType extends BaseNodeType {
    type: 'code';
    language?: string;
}

type BlockNodeType = BaseNodeType | HeadingNodeType | ListNodeType | ListItemNodeType | QuoteNodeType | CodeNodeType;

// Format flags from Lexical
const IS_BOLD = 1;
const IS_ITALIC = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE = 8;
const IS_CODE = 16;
const IS_SUBSCRIPT = 32;
const IS_SUPERSCRIPT = 64;

function getTextClassNames(format?: number): string {
    const classNames: string[] = [];
    
    if (!format) return '';
    
    if (format & IS_BOLD) classNames.push('EditorTheme__textBold');
    if (format & IS_ITALIC) classNames.push('EditorTheme__textItalic');
    if (format & IS_STRIKETHROUGH) classNames.push('EditorTheme__textStrikethrough');
    if (format & IS_UNDERLINE) classNames.push('EditorTheme__textUnderline');
    if (format & IS_CODE) classNames.push('EditorTheme__textCode');
    if (format & IS_SUBSCRIPT) classNames.push('EditorTheme__textSubscript');
    if (format & IS_SUPERSCRIPT) classNames.push('EditorTheme__textSuperscript');
    
    return classNames.join(' ');
}

function renderTextContent(node: TextNodeType | BaseNodeType): React.ReactNode {
    if ('text' in node) {
        const className = getTextClassNames(node.format);
        return className ? <span className={className}>{node.text}</span> : node.text;
    }
    
    return node.children?.map((child, i) => <React.Fragment key={i}>{renderTextContent(child)}</React.Fragment>);
}

const BlockReader: React.FC<BlockReaderProps> = ({ content, className }) => {
    if (!content) return null;

    const renderNode = (node: BlockNodeType, index: number): React.ReactNode => {
        switch (node.type) {
            case 'paragraph': {
                const hasContent = node.children?.some(child => 
                    'text' in child && child.text.length > 0
                );
                return (
                    <p key={index} className="EditorTheme__paragraph">
                        {hasContent ? renderTextContent(node) : '\u00A0'}
                    </p>
                );
            }
            
            case 'heading': {
                const headingNode = node as HeadingNodeType;
                const HeadingTag = headingNode.tag;
                return (
                    <HeadingTag key={index} className={`EditorTheme__${headingNode.tag}`}>
                        {renderTextContent(node)}
                    </HeadingTag>
                );
            }

            case 'list': {
                const listNode = node as ListNodeType;
                const isOrdered = listNode.listType === 'number';
                const ListTag = isOrdered ? 'ol' : 'ul';
                
                const renderListItems = (items: ListItemNodeType[], depth: number = 0) => {
                    return items.map((item, i) => {
                        // Check if this item contains a nested list
                        const nestedList = item.children?.find(child => 
                            'type' in child && child.type === 'list'
                        ) as ListNodeType | undefined;

                        const textContent = item.children?.filter(child => 
                            'type' in child && child.type === 'text'
                        ) as TextNodeType[];

                        if (listNode.listType === 'check') {
                            return (
                                <li 
                                    key={i}
                                    className={item.checked ? 'EditorTheme__listItemChecked' : 'EditorTheme__listItemUnchecked'}
                                    value={item.value}
                                >
                                    {textContent && textContent.map((text, j) => renderTextContent(text))}
                                </li>
                            );
                        }

                        return (
                            <li 
                                key={i} 
                                className={`EditorTheme__listItem ${nestedList ? 'EditorTheme__nestedListItem' : 'EditorTheme__ltr'}`}
                                dir={nestedList ? undefined : "ltr"}
                                value={item.value}
                            >
                                {textContent && textContent.map((text, j) => renderTextContent(text))}
                                {nestedList && (
                                    <ListTag 
                                        className={isOrdered ? `EditorTheme__ol${Math.min(depth + 1, 5)}` : 'EditorTheme__ul'}
                                    >
                                        {renderListItems(nestedList.children, depth + 1)}
                                    </ListTag>
                                )}
                            </li>
                        );
                    });
                };
                
                return (
                    <ListTag 
                        key={index} 
                        className={isOrdered ? 'EditorTheme__ol1' : 'EditorTheme__ul'}
                        start={listNode.start}
                    >
                        {renderListItems(listNode.children)}
                    </ListTag>
                );
            }

            case 'quote':
                return (
                    <blockquote key={index} className="EditorTheme__quote">
                        {renderTextContent(node)}
                    </blockquote>
                );

            case 'code':
                const codeNode = node as CodeNodeType;
                return (
                    <pre key={index} className="EditorTheme__code" data-gutter="1">
                        <code>{renderTextContent(node)}</code>
                    </pre>
                );

            default:
                return null;
        }
    };

    try {
        const parsedContent = JSON.parse(content) as LexicalContent;
        return (
            <div className={`EditorTheme__ltr p-4 ${className || ''}`}>
                {(parsedContent.root.children as BlockNodeType[]).map((node, index) => renderNode(node, index))}
            </div>
        );
    } catch (error) {
        console.error('Error parsing content:', error);
        return <div className="p-4">Error displaying content</div>;
    }
};

export default BlockReader; 