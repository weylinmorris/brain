import {useEffect, useState, useRef} from "react";
import {useActiveBlock, useBlocks} from "@/context/block";
import {getContextualPreviewContent, getContextualPreviewTitle} from "@/utils/blockUtils.js";
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';

function formatSimilarityPercent(similarity) {
    return `${Math.round(similarity * 100)}%`;
}

function Search() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [hasResults, setHasResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const {search, searchResults} = useBlocks();
    const {setActiveBlock} = useActiveBlock();

    // Destructure the categorized results
    const [titleMatches, contentMatches, similarityMatches] = searchResults || [[], [], []];

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            await search(query);
            setHasResults(true);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleResultClick = (blockId) => {
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

    const HighlightedText = ({ text, searchTerm }) => {
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

    const ResultBlock = ({ block, similarity }) => {
        const titlePreview = getContextualPreviewTitle(block, query);
        const contentPreview = getContextualPreviewContent(block, query);

        return (
            <div
                onClick={() => handleResultClick(block.id)}
                key={block.id}
                className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
            >
                <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-100">
                        <HighlightedText
                            text={titlePreview.preview}
                            searchTerm={query}
                        />
                    </p>
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

    const ResultSection = ({ title, results }) => {
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
                        similarity={result.similarity}
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

            <div className="w-full p-4 relative z-40" ref={searchRef}>
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