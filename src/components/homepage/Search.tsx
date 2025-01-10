import { useEffect, useState, useRef, MouseEvent, KeyboardEvent, ReactNode } from 'react';
import { useBlock } from '../../hooks/useBlock';
import { useSearch } from '../../hooks/useSearch';
import { getContextualPreviewContent, getContextualPreviewTitle } from '../../utils/blockUtils';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { Block } from '../../types/block';

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
                const source = sources.find((s) => s.title === title);

                if (source) {
                    return (
                        <button
                            key={index}
                            onClick={() => onSourceClick(source.id)}
                            className="mx-0.5 font-medium text-blue-600 hover:underline dark:text-blue-400"
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
            <div className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
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
    const { setActiveBlock } = useBlock();
    const { performSearch, results: searchResults } = useSearch();

    // Destructure the categorized results with proper null checks
    const titleMatches = searchResults?.blocks?.titleMatches ?? [];
    const contentMatches = searchResults?.blocks?.contentMatches ?? [];
    const similarityMatches = searchResults?.blocks?.similarityMatches ?? [];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | Event) {
            if (
                searchRef.current &&
                event.target instanceof Node &&
                !searchRef.current.contains(event.target)
            ) {
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
            return <span className="whitespace-pre-line">{text}</span>;
        }

        const lowerText = text?.toLowerCase();
        const lowerSearchTerm = searchTerm?.toLowerCase();
        const matchStart = lowerText?.indexOf(lowerSearchTerm);

        if (matchStart === -1) {
            return <span className="whitespace-pre-line">{text}</span>;
        }

        const matchEnd = matchStart + searchTerm?.length;

        return (
            <span className="whitespace-pre-line">
                {text?.slice(0, matchStart)}
                <span className="rounded-sm bg-primary-200/50 font-bold text-primary-900 dark:bg-primary-600/50 dark:text-primary-100">
                    {text?.slice(matchStart, matchEnd)}
                </span>
                {text?.slice(matchEnd)}
            </span>
        );
    };

    const ResultBlock = ({ block, similarity }: ResultBlockProps) => {
        const titlePreview = getContextualPreviewTitle(block, query) as PreviewResult;
        const contentPreview = getContextualPreviewContent(block, query) as PreviewResult;

        return (
            <div
                onClick={() => handleResultClick(block.id)}
                key={block.id}
                className="cursor-pointer px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-600"
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
                                searchTerm={query}
                            />
                        </div>
                    </div>
                    <span className="ml-2 flex-shrink-0 text-xs text-neutral-300">
                        {formatSimilarityPercent(similarity)} match
                    </span>
                </div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">
                    <div className="line-clamp-3">
                        <HighlightedText text={contentPreview.preview} searchTerm={query} />
                    </div>
                </div>
            </div>
        );
    };

    const ResultSection = ({ title, results }: ResultSectionProps) => {
        if (!results || results.length === 0) return null;

        return (
            <div className="space-y-2 divide-y divide-neutral-200 py-2 dark:divide-neutral-600">
                <div className="px-4 py-2 dark:bg-neutral-700/50">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
                        {title}
                    </h3>
                </div>
                {results.map((result) => (
                    <ResultBlock
                        key={result.id}
                        block={result}
                        similarity={result.similarity || 0}
                    />
                ))}
            </div>
        );
    };

    const hasAnyResults =
        titleMatches?.length > 0 || contentMatches?.length > 0 || similarityMatches?.length > 0;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="relative z-40 w-full" ref={searchRef}>
                <div className="relative">
                    <div className="relative flex items-center">
                        <input
                            className="mt-0.5 w-full rounded-md bg-neutral-100 px-5 py-2 pl-10 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-600 dark:text-neutral-50"
                            type="text"
                            placeholder="Search notes..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onFocus={() => query && setIsOpen(true)}
                        />
                        <SearchIcon className="absolute left-3 text-neutral-400" size={16} />
                        {isLoading ? (
                            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-neutral-400" />
                        ) : (
                            query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 text-neutral-400 hover:text-neutral-200"
                                >
                                    <X size={16} />
                                </button>
                            )
                        )}
                    </div>

                    {hasResults && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="absolute -bottom-6 right-0 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            {isOpen ? 'Hide' : 'Show'} results
                        </button>
                    )}

                    <div
                        className={`absolute mt-1 w-full overflow-hidden rounded-md bg-neutral-50 shadow-lg duration-200 ease-in-out dark:bg-neutral-800 ${isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'} `}
                    >
                        {query && !hasAnyResults ? (
                            <div className="px-4 py-3 text-center text-sm text-neutral-400">
                                No results found
                            </div>
                        ) : (
                            <div className="max-h-[40rem] divide-y divide-neutral-200 overflow-y-auto dark:divide-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:bg-transparent">
                                {searchResults?.answer && (
                                    <AnswerDisplay
                                        answer={searchResults.answer}
                                        sources={searchResults.sources ?? []}
                                        onSourceClick={handleResultClick}
                                    />
                                )}
                                <ResultSection title="Exact Title Matches" results={titleMatches} />
                                <ResultSection
                                    title="Exact Content Matches"
                                    results={contentMatches}
                                />
                                <ResultSection title="Similar Notes" results={similarityMatches} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Search;
