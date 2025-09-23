/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        background: 'var(--theme-background)',
        surface: 'var(--theme-surface)',
        'surface-hover': 'var(--theme-surface-hover)',
        foreground: 'var(--theme-foreground)',
        'foreground-secondary': 'var(--theme-foreground-secondary)',
        'foreground-muted': 'var(--theme-foreground-muted)',
        primary: 'var(--theme-primary)',
        'primary-hover': 'var(--theme-primary-hover)',
        'primary-foreground': 'var(--theme-primary-foreground)',
        secondary: 'var(--theme-secondary)',
        'secondary-hover': 'var(--theme-secondary-hover)',
        'secondary-foreground': 'var(--theme-secondary-foreground)',
        border: 'var(--theme-border)',
        'border-hover': 'var(--theme-border-hover)',
        success: 'var(--theme-success)',
        warning: 'var(--theme-warning)',
        error: 'var(--theme-error)',
        info: 'var(--theme-info)',
        // Color states for better theming
        'primary-hover': 'var(--theme-primary-hover)',
        'secondary-hover': 'var(--theme-secondary-hover)',
        'border-hover': 'var(--theme-border-hover)',
      },
      backgroundImage: {
        'gradient-theme': 'linear-gradient(to bottom right, var(--theme-gradient-from), var(--theme-gradient-to))',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
};