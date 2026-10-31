'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { colorPalettes, paletteOrder } from '@/types/theme';

/** Palette picker. The app is dark-only, so only the accent pair changes. */
export function ThemeToggle() {
  const t = useTranslations('header');
  const { theme, setColorPalette } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-icon"
        aria-label={t('palette')}
        aria-expanded={open}
        title={t('palette')}
      >
        <Palette size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute right-0 z-50 mt-2 w-56 rounded-2xl p-3 shadow-2xl"
          >
            <p className="eyebrow mb-3">{t('palette')}</p>
            <div className="grid grid-cols-5 gap-2">
              {paletteOrder.map((key) => {
                const c = colorPalettes[key];
                const active = theme.palette === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setColorPalette(key);
                      setOpen(false);
                    }}
                    aria-label={t(`palettes.${key}`)}
                    aria-pressed={active}
                    title={t(`palettes.${key}`)}
                    className="relative grid h-9 w-9 place-items-center rounded-full transition-transform duration-200 hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${c.primary}, ${c.accent2})`,
                      boxShadow: active ? `0 0 0 2px var(--theme-surface), 0 0 0 4px ${c.primary}` : undefined,
                    }}
                  >
                    {active && <Check size={14} className="text-[#0a0d1f]" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
