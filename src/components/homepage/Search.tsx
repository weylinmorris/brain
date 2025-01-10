import {useEffect, useState, useRef, MouseEvent, KeyboardEvent, ReactNode} from "react";
import {useBlock} from "../../hooks/useBlock";
import {useSearch} from "../../hooks/useSearch";
import {getContextualPreviewContent, getContextualPreviewTitle} from "../../utils/blockUtils";
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { Block } from "../../types/block";

interface PreviewResult {
    preview: string;
    context?: string;
}

interface Source {
    id: string;
    title: string;
}

interface AnswerDisplayProps {
    answer: string;
    sources: Source[];
    onSourceClick: (id: string) => void;
}

interface HighlightedTextProps {
    text: string;
    searchTerm: string;
}

interface ResultBlockProps {
    block: Block;
    similarity: number;
}

interface ResultSectionProps {
    title: string;
    results: Block[];
}

function formatSimilarityPercent(similarity: number): string {
    return `${Math.round(similarity * 100)}%`;
}

function AnswerDisplay({ answer, sources, onSourceClick }: AnswerDisplayProps) {
    // Function to parse and render text with clickable source citations
    const renderAnswerWithSources = (text: string): ReactNode[] => {
        // Split by citation pattern [Title]
        const parts = text.split(/(\[[^\]]+\])/g);
        
        return parts.map((part, index) => {
            // Check if this part is a citation
            if (part.match(/^\[[^\]]+\]$/)) {
                const title = part.slice(1, -1); // Remove brackets
                const source = sources.find(s => s.title === title);
                
                if (source) {
                    return (
                        <button
                            key={index}
                            onClick={() => onSourceClick(source.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium mx-0.5"
                        >
                            {part}
                        </button>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="px-4 py-3">
            <div className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
                {renderAnswerWithSources(answer)}
            </div>
        </div>
    );
}

function Search() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [hasResults, setHasResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const {setActiveBlock} = useBlock();
    const {performSearch, results: searchResults} = useSearch();

    // Destructure the categorized results with proper null checks
    const titleMatches = searchResults?.blocks?.titleMatches ?? [];
    const contentMatches = searchResults?.blocks?.contentMatches ?? [];
    const similarityMatches = searchResults?.blocks?.similarityMatches ?? [];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | Event) {
            if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        console.log('searchResults', searchResults);
    }, [searchResults]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const results = await performSearch(query);
            setHasResults(true);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleResultClick = (blockId: string) => {
        setActiveBlock(blockId);
        setIsOpen(false);
    };

    useEffect(() => {
        // Close the dropdown if the query becomes empty
        if (!query) {
            setIsOpen(false);
            setHasResults(false);
        }
    }, [query]);

    const handleClear = () => {
        setQuery('');
    };

    const HighlightedText = ({ text, searchTerm }: HighlightedTextProps) => {
        // Handle empty or null search terms
        if (!searchTerm) {
            return (
                <div className="max-w-full truncate whitespace-nowrap">
                    <span>{text}</span>
                </div>
            );
        }

        const lowerText = text.toLowerCase();
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchStart = lowerText.indexOf(lowerSearchTerm);

        if (matchStart === -1) {
            return (
                <div className="max-w-full truncate whitespace-nowrap">
                    <span>{text}</span>
                </div>
            );
        }

        const matchEnd = matchStart + searchTerm.length;

        return (
            <div className="max-w-full truncate whitespace-nowrap">
            <span>
                {text.slice(0, matchStart)}
                <span className="bg-yellow-300/30 text-yellow-800 dark:text-yellow-100">
                    {text.slice(matchStart, matchEnd)}
                </span>
                {text.slice(matchEnd)}
            </span>
            </div>
        );
    };

    const ResultBlock = ({ block, similarity }: ResultBlockProps) => {
        const titlePreview = getContextualPreviewTitle(block, query) as PreviewResult;
        const contentPreview = getContextualPreviewContent(block, query) as PreviewResult;

        return (
            <div
                onClick={() => handleResultClick(block.id)}
                key={block.id}
                className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
            >
                <div className="flex justify-between items-start">
                    <div className="text-sm font-bold text-neutral-700 dark:text-neutral-100">
                        <HighlightedText
                            text={titlePreview.preview}
                            searchTerm={query}
                        />
                    </div>
                    <span className="text-xs text-neutral-300 ml-2">
                        {formatSimilarityPercent(similarity)} match
                    </span>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-300 justify-between">
                    <span className="flex items-center max-w-[80%]">
                        <HighlightedText
                            text={contentPreview.preview}
                            searchTerm={query}
                        />
                    </span>
                </div>
            </div>
        );
    };

    const ResultSection = ({ title, results }: ResultSectionProps) => {
        if (!results || results.length === 0) return null;

        return (
            <div className="py-2">
                <div className="px-4 py-2  dark:bg-neutral-700/50">
                    <h3 className="text-xs font-medium text-neutral-400 dark:text-neutral-300 uppercase tracking-wider">
                        {title}
                    </h3>
                </div>
                {results.map(result => (
                    <ResultBlock
                        key={result.id}
                        block={result}
                        similarity={result.similarity || 0}
                    />
                ))}
            </div>
        );
    };

    const hasAnyResults = titleMatches?.length > 0 || contentMatches?.length > 0 || similarityMatches?.length > 0;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="w-full relative z-40" ref={searchRef}>
                <div className="relative">
                    <div className="relative flex items-center">
                        <input
                            className="w-full mt-0.5 px-5 py-2 pl-10 bg-neutral-100 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-50 rounded-md
                                     focus:outline-none focus:ring-2 focus:ring-neutral-400"
                            type="text"
                            placeholder="Search notes..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onFocus={() => query && setIsOpen(true)}
                        />
                        <SearchIcon
                            className="absolute left-3 text-neutral-400"
                            size={16}
                        />
                        {isLoading ? (
                            <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-neutral-400" />
                        ) : query && (
                            <button
                                onClick={handleClear}
                                className="absolute right-3 text-neutral-400 hover:text-neutral-200 "
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {hasResults && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute right-0 -bottom-6 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 "
                        >
                            {isOpen ? 'Hide' : 'Show'} results
                        </button>
                    )}

                    <div className={`
                        absolute w-full bg-neutral-50 dark:bg-neutral-800 rounded-md mt-1 shadow-lg
                        duration-200 ease-in-out overflow-hidden
                        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                    `}>
                        {query && !hasAnyResults ? (
                            <div className="px-4 py-3 text-sm text-neutral-400 text-center">
                                No results found
                            </div>
                        ) : (
                            <div className="max-h-[40rem] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-700">
                                {searchResults?.answer && (
                                    <AnswerDisplay
                                        answer={searchResults.answer}
                                        sources={searchResults.sources ?? []}
                                        onSourceClick={handleResultClick}
                                    />
                                )}
                                <ResultSection
                                    title="Exact Title Matches"
                                    results={titleMatches}
                                />
                                <ResultSection
                                    title="Exact Content Matches"
                                    results={contentMatches}
                                />
                                <ResultSection
                                    title="Similar Notes"
                                    results={similarityMatches}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Search;