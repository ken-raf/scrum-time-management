'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorPalette, colorPalettes, Theme, ThemeColors } from '@/types/theme';

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setColorPalette: (palette: ColorPalette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'scrum-timer-theme';
const DEFAULT_THEME: Theme = { palette: 'blue' };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Theme>;
        if (parsed.palette && parsed.palette in colorPalettes) {
          setTheme({ palette: parsed.palette });
        }
      }
    } catch {
      // Ignore unreadable storage and keep the default palette
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Storage can be unavailable (private mode); the palette still applies
    }
  }, [theme, mounted]);

  const colors = colorPalettes[theme.palette];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const kebabKey = key.replace(/([A-Z0-9])/g, '-$1').toLowerCase();
      root.style.setProperty(`--theme-${kebabKey}`, value);
    });
    root.setAttribute('data-palette', theme.palette);
  }, [colors, theme.palette]);

  const setColorPalette = (palette: ColorPalette) => setTheme({ palette });

  return (
    <ThemeContext.Provider value={{ theme, colors, setColorPalette }}>
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
