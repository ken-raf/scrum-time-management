export type ColorPalette =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'teal'
  | 'rose'
  | 'slate'
  | 'emerald'
  | 'indigo';

export interface Theme {
  palette: ColorPalette;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceRaised: string;

  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;

  primary: string;
  primaryHover: string;
  primaryForeground: string;
  primaryGlow: string;
  accent2: string;

  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;

  border: string;
  borderHover: string;

  success: string;
  warning: string;
  error: string;
  info: string;
}

// The app is dark-only: every palette shares the same deep neutrals
// and only changes its accent pair (primary + accent2).
const darkBase = {
  background: '#06080f',
  surface: '#0e1324',
  surfaceHover: '#151c33',
  surfaceRaised: '#1a2240',
  foreground: '#eef1fb',
  foregroundSecondary: '#c4cae0',
  foregroundMuted: '#8890ae',
  primaryForeground: '#0a0d1f',
  secondary: '#151c33',
  secondaryHover: '#1d2645',
  secondaryForeground: '#c4cae0',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.16)',
  success: '#3fd6a0',
  warning: '#f6b84b',
  error: '#ff5d6c',
};

const accents: Record<ColorPalette, { primary: string; primaryHover: string; accent2: string; glow: string }> = {
  blue: { primary: '#7d8cff', primaryHover: '#97a3ff', accent2: '#b38bff', glow: 'rgba(125, 140, 255, 0.5)' },
  indigo: { primary: '#818cf8', primaryHover: '#a5b4fc', accent2: '#60a5fa', glow: 'rgba(129, 140, 248, 0.5)' },
  purple: { primary: '#a78bfa', primaryHover: '#c4b5fd', accent2: '#f08bd6', glow: 'rgba(167, 139, 250, 0.5)' },
  rose: { primary: '#ff6fa5', primaryHover: '#ff94bd', accent2: '#c58bff', glow: 'rgba(255, 111, 165, 0.45)' },
  red: { primary: '#ff6b7a', primaryHover: '#ff8f9a', accent2: '#ff9f6b', glow: 'rgba(255, 107, 122, 0.45)' },
  orange: { primary: '#ff9f5a', primaryHover: '#ffb680', accent2: '#ffd35a', glow: 'rgba(255, 159, 90, 0.45)' },
  green: { primary: '#3fd6a0', primaryHover: '#6be3b8', accent2: '#5ad1e6', glow: 'rgba(63, 214, 160, 0.45)' },
  emerald: { primary: '#34d399', primaryHover: '#6ee7b7', accent2: '#a3e635', glow: 'rgba(52, 211, 153, 0.45)' },
  teal: { primary: '#3fd1c7', primaryHover: '#6fe0d8', accent2: '#6ab8ff', glow: 'rgba(63, 209, 199, 0.45)' },
  slate: { primary: '#a3b1d6', primaryHover: '#c3cde8', accent2: '#8fa0c9', glow: 'rgba(163, 177, 214, 0.4)' },
};

export const colorPalettes: Record<ColorPalette, ThemeColors> = Object.fromEntries(
  (Object.keys(accents) as ColorPalette[]).map((key) => {
    const a = accents[key];
    return [
      key,
      {
        ...darkBase,
        primary: a.primary,
        primaryHover: a.primaryHover,
        primaryGlow: a.glow,
        accent2: a.accent2,
        info: a.primary,
      },
    ];
  })
) as Record<ColorPalette, ThemeColors>;

export const paletteOrder: ColorPalette[] = [
  'blue',
  'indigo',
  'purple',
  'rose',
  'red',
  'orange',
  'green',
  'emerald',
  'teal',
  'slate',
];
