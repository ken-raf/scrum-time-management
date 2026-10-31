'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { History, Timer } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { SoundToggle } from './SoundToggle';
import { InstallButton } from './InstallButton';

export function AppHeader() {
  const t = useTranslations();
  return (
    <header className="glass sticky top-0 z-40 !border-x-0 !border-t-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <span
            className="grid h-8 w-8 flex-none place-items-center rounded-[10px] text-primary-foreground shadow-[0_6px_20px_-6px_var(--theme-primary-glow)]"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent-2))' }}
          >
            <Timer size={17} strokeWidth={2.4} />
          </span>
          <span className="truncate">{t('app.shortTitle')}</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <InstallButton />
          <Link href="/history" className="btn btn-ghost !px-3 !py-2">
            <History size={17} />
            <span className="hidden sm:inline">{t('navigation.history')}</span>
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <SoundToggle />
        </nav>
      </div>
    </header>
  );
}
