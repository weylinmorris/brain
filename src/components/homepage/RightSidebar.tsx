'use client';

import React, { useState } from 'react';
import { useBlock } from '@/hooks/useBlock';
import { useSearch } from '@/hooks/useSearch';
import { Search, X, Loader2 } from 'lucide-react';
import { Block } from '@/types/block';
import { getContextualPreviewContent, getContextualPreviewTitle } from '@/utils/blockUtils';

interface PreviewResult {
    preview: string;
    context?: string;
}

interface ResultBlockProps {
    block: Block;
    similarity: number;
    searchTerm: string;
    onClick: (blockId: string) => void;
}

interface Source {
    id: string;
    title: string;
}

interface AnswerDisplayProps {
    query: string;
    answer: string;
    sources: Source[];
    onSourceClick: (id: string) => void;
}

function formatSimilarityPercent(similarity: number): string {
    return `${Math.round(similarity * 100)}%`;
}

const HighlightedText = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
    if (!searchTerm || !text) return <span className="whitespace-pre-line">{text}</span>;

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchStart = lowerText.indexOf(lowerSearchTerm);

    if (matchStart === -1) return <span className="whitespace-pre-line">{text}</span>;

    const matchEnd = matchStart + searchTerm.length;

    return (
        <span className="whitespace-pre-line">
            {text.slice(0, matchStart)}
            <span className="rounded-sm bg-primary-200/50 font-bold text-primary-900 dark:bg-primary-600/50 dark:text-primary-100">
                {text.slice(matchStart, matchEnd)}
            </span>
            {text.slice(matchEnd)}
        </span>
    );
};

const ResultBlock = ({ block, similarity, searchTerm, onClick }: ResultBlockProps) => {
    const titlePreview = getContextualPreviewTitle(block, searchTerm) as PreviewResult;
    const contentPreview = getContextualPreviewContent(block, searchTerm) as PreviewResult;

    return (
        <div
            onClick={() => onClick(block.id)}
            className="cursor-pointer p-4 pt-2 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 text-sm font-bold text-neutral-700 dark:text-neutral-100">
                    <div className="line-clamp-1">
                        <HighlightedText
                            text={
                                typeof titlePreview === 'string'
                                    ? titlePreview
                                    : titlePreview.preview || 'Untitled'
                            }
                            searchTerm={searchTerm}
                        />
                    </div>
                </div>
                <span className="ml-2 flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                    {formatSimilarityPercent(similarity)} match
                </span>
            </div>
            <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
                <div className="line-clamp-3">
                    <HighlightedText text={contentPreview.preview} searchTerm={searchTerm} />
                </div>
            </div>
        </div>
    );
};

function AnswerDisplay({ answer, sources, onSourceClick, query }: AnswerDisplayProps) {
    const renderAnswerWithSources = (text: string): React.ReactNode[] => {
        const parts = text.split(/(\[[^\]]+\])/g);

        return parts.map((part, index) => {
            if (part.match(/^\[[^\]]+\]$/)) {
                const title = part.slice(1, -1).trim();
                const source = sources?.find((s) => s.title.trim() === title);

                if (source) {
                    return (
                        <button
                            key={index}
                            onClick={() => onSourceClick(source.id)}
                            className="mx-0.5 font-medium italic text-primary-600 hover:underline dark:text-primary-400"
                        >
                            ({index})
                        </button>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            <div className="px-4 pb-2 pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
                    {query}
                </h3>
            </div>
            <div className="p-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                {renderAnswerWithSources(answer)}
            </div>
        </div>
    );
}

const RightSidebar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setActiveBlock } = useBlock();
    const { performSearch, results: searchResults, clearSearch } = useSearch();

    const titleMatches = searchResults?.blocks?.titleMatches ?? [];
    const contentMatches = searchResults?.blocks?.contentMatches ?? [];
    const similarityMatches = searchResults?.blocks?.similarityMatches ?? [];
    const aiAnswer = searchResults?.answer;
    const sources = searchResults?.sources;

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            await performSearch(query);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleResultClick = (blockId: string) => {
        setActiveBlock(blockId);
        // Find and scroll to the block
        const element = document.querySelector(`[data-block-id="${blockId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleClear = () => {
        setQuery('');
        clearSearch();
        setActiveBlock(null);
    };

    return (
        <div className="flex h-[calc(var(--vh,1vh)*100)] w-full flex-shrink-0 flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200 xl:w-[32rem]">
            <div className="flex-shrink-0 border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            clearSearch();
                        }}
                        onKeyDown={handleKeyPress}
                        placeholder="Search notes..."
                        className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400"
                    />
                    <Search
                        className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 dark:text-neutral-500"
                        aria-hidden="true"
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="scrollable flex-1">
                {aiAnswer && sources && (
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <AnswerDisplay
                            query={query}
                            answer={aiAnswer}
                            sources={sources}
                            onSourceClick={handleResultClick}
                        />
                    </div>
                )}

                {titleMatches.length > 0 && (
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 pb-2 pt-4">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
                                Title Matches
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {titleMatches.map((block) => (
                                <ResultBlock
                                    key={block.id}
                                    block={block}
                                    similarity={block.similarity || 0}
                                    searchTerm={query}
                                    onClick={handleResultClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {contentMatches.length > 0 && (
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 pb-2 pt-4">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
                                Content Matches
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {contentMatches.map((block) => (
                                <ResultBlock
                                    key={block.id}
                                    block={block}
                                    similarity={block.similarity || 0}
                                    searchTerm={query}
                                    onClick={handleResultClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {similarityMatches.length > 0 && (
                    <div className="border-b border-neutral-200 dark:border-neutral-700">
                        <div className="px-4 pb-2 pt-4">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
                                Similar Notes
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {similarityMatches.map((block) => (
                                <ResultBlock
                                    key={block.id}
                                    block={block}
                                    similarity={block.similarity || 0}
                                    searchTerm={query}
                                    onClick={handleResultClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {query &&
                    !isLoading &&
                    !aiAnswer &&
                    !titleMatches.length &&
                    !contentMatches.length &&
                    !similarityMatches.length && (
                        <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            No results found
                        </div>
                    )}
            </div>
        </div>
    );
};

export default RightSidebar;
