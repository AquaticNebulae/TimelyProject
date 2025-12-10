import React, { createContext, useContext, useState, useEffect} from 'react';
import type { ReactNode } from "react";


type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Check localStorage first
        const saved = localStorage.getItem('timely_theme');
        if (saved === 'light' || saved === 'dark') return saved;

        // Check display prefs
        const displayPrefs = localStorage.getItem('timely_display');
        if (displayPrefs) {
            try {
                const prefs = JSON.parse(displayPrefs);
                return prefs.darkMode ? 'dark' : 'light';
            } catch {
                // Invalid JSON, use default
            }
        }

        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
        }

        // Default to dark
        return 'dark';
    });

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('timely_theme', theme);

        // Update display prefs to stay in sync
        try {
            const displayPrefs = localStorage.getItem('timely_display');
            const prefs = displayPrefs ? JSON.parse(displayPrefs) : {};
            prefs.darkMode = theme === 'dark';
            localStorage.setItem('timely_display', JSON.stringify(prefs));
        } catch {
            // Ignore errors
        }

        // Apply theme class to document for global CSS access
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;