'use client';

import React, { useState, useEffect } from 'react';
// import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorPalette, ThemeMode } from '@/types/theme';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

export function ThemeToggle() {
  // const t = useTranslations();
  const { theme, setThemeMode, setColorPalette, isDark } = useTheme();
  const [showPalettes, setShowPalettes] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('ThemeToggle - current theme:', theme, 'isDark:', isDark);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const themeModes: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={16} />, label: 'Light' },
    { mode: 'dark', icon: <Moon size={16} />, label: 'Dark' },
    { mode: 'system', icon: <Monitor size={16} />, label: 'System' },
  ];

  const colorPalettes: { palette: ColorPalette; name: string; colors: string[] }[] = [
    { palette: 'blue', name: 'Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd'] },
    { palette: 'green', name: 'Green', colors: ['#10b981', '#34d399', '#6ee7b7'] },
    { palette: 'purple', name: 'Purple', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'] },
    { palette: 'orange', name: 'Orange', colors: ['#f97316', '#fb923c', '#fdba74'] },
    { palette: 'red', name: 'Red', colors: ['#ef4444', '#f87171', '#fca5a5'] },
    { palette: 'teal', name: 'Teal', colors: ['#14b8a6', '#5eead4', '#99f6e4'] },
    { palette: 'rose', name: 'Rose', colors: ['#e11d48', '#fb7185', '#fda4af'] },
    { palette: 'slate', name: 'Slate', colors: ['#475569', '#94a3b8', '#cbd5e1'] },
    { palette: 'emerald', name: 'Emerald', colors: ['#059669', '#34d399', '#6ee7b7'] },
    { palette: 'indigo', name: 'Indigo', colors: ['#4f46e5', '#818cf8', '#c7d2fe'] },
  ];

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {/* Theme Mode Toggle */}
        <div className="flex items-center bg-surface rounded-lg p-1 shadow-md border border-border">
          {themeModes.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => {
                console.log('Button clicked, setting mode:', mode);
                setThemeMode(mode);
              }}
              className={`
                flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200
                ${
                  theme.mode === mode
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Color Palette Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowPalettes(!showPalettes)}
            className="flex items-center justify-center w-10 h-10 bg-surface hover:bg-surface-hover rounded-lg shadow-md border border-border text-foreground-muted transition-all duration-200"
            title="Color Palette"
          >
            <Palette size={18} />
          </button>

          {showPalettes && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPalettes(false)}
              />

              {/* Palette Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border z-20">
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Color Themes
                  </h3>
                  <div className="space-y-2">
                    {colorPalettes.map(({ palette, name, colors }) => (
                      <button
                        key={palette}
                        onClick={() => {
                          console.log('Palette clicked:', palette);
                          setColorPalette(palette);
                          setShowPalettes(false);
                        }}
                        className={`
                          w-full flex items-center justify-between p-2 rounded-md transition-all duration-200
                          ${
                            theme.palette === palette
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {name}
                          </span>
                        </div>
                        {theme.palette === palette && (
                          <Check size={14} className="text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}