import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(false);
    
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update meta tags with the correct colors
        const updateMeta = (name: string, content: string): void => {
            let meta = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
            if (!meta) {
                meta = document.createElement('meta') as HTMLMetaElement;
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        if (isDark) {
            updateMeta('theme-color', '#121212'); // neutral-800
        } else {
            updateMeta('theme-color', '#fafafa'); // neutral-50
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="p-4 rounded-md bg-primary-600 dark:bg-primary-800 text-neutral-100 hover:bg-primary-700 dark:hover:bg-primary-700"
            aria-label="Toggle theme"
        >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}

export default ThemeToggle; 