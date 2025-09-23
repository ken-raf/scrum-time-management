'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeMode, ColorPalette, colorPalettes, ThemeColors } from '@/types/theme';

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setColorPalette: (palette: ColorPalette) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const DEFAULT_THEME: Theme = {
  mode: 'system',
  palette: 'blue',
};

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check system preference
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemDark(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('scrum-timer-theme');
        if (stored) {
          const parsedTheme = JSON.parse(stored) as Theme;
          setTheme(parsedTheme);
        }
      } catch (error) {
        console.warn('Failed to load theme from localStorage:', error);
      }
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      try {
        localStorage.setItem('scrum-timer-theme', JSON.stringify(theme));
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [theme, mounted]);

  // Determine if dark mode should be active
  const isDark = theme.mode === 'dark' || (theme.mode === 'system' && systemDark);

  // Get current colors
  const colors = colorPalettes[theme.palette][isDark ? 'dark' : 'light'];

  // Update CSS variables
  useEffect(() => {
    if (typeof window !== 'undefined' && mounted) {
      const root = document.documentElement;

      // Set all CSS variables
      Object.entries(colors).forEach(([key, value]) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--theme-${kebabKey}`, value);
      });

      // Set theme mode class
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);

      // Set data attributes for theme
      root.setAttribute('data-theme', theme.palette);
      root.setAttribute('data-mode', isDark ? 'dark' : 'light');
    }
  }, [colors, isDark, theme.palette, mounted]);

  const setThemeMode = (mode: ThemeMode) => {
    console.log('Setting theme mode:', mode);
    setTheme(prev => ({ ...prev, mode }));
  };

  const setColorPalette = (palette: ColorPalette) => {
    console.log('Setting color palette:', palette);
    setTheme(prev => ({ ...prev, palette }));
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const value: ThemeContextType = {
    theme,
    colors,
    isDark,
    setThemeMode,
    setColorPalette,
    toggleTheme,
  };

  // Prevent hydration issues by only rendering after mount
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}