import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check if user has a theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }, []);

    useEffect(() => {
        // Update class for Tailwind dark mode
        document.documentElement.classList.toggle('dark', isDark);

        // Save preference to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="p-4 rounded-md bg-primary-600 dark:bg-primary-800 text-neutral-100 hover:bg-primary-700 dark:hover:bg-primary-700  "
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun size={16} />
            ) : (
                <Moon size={16} />
            )}
        </button>
    );
};

export default ThemeToggle;