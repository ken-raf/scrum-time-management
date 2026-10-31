'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Install app" button. Chrome and Edge fire `beforeinstallprompt`, which we
 * replay on click; Safari on iPhone/iPad has no such event, so we explain the
 * Share → Add to Home Screen steps instead. Hidden once the app is installed.
 */
export function InstallButton() {
  const t = useTranslations('header');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [tipOpen, setTipOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIos(isIos && !standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!tipOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setTipOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [tipOpen]);

  if (installed || (!deferred && !ios)) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => undefined);
      setDeferred(null);
      return;
    }
    setTipOpen((v) => !v);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={install} className="btn btn-ghost !px-3 !py-2" title={t('install')}>
        <Download size={17} />
        <span className="hidden md:inline">{t('install')}</span>
      </button>
      <AnimatePresence>
        {tipOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute right-0 z-50 mt-2 w-64 rounded-2xl p-4 text-sm shadow-2xl"
            role="dialog"
          >
            <p className="font-medium">{t('installIosTitle')}</p>
            <p className="mt-1 flex items-start gap-2 text-foreground-muted">
              <Share size={16} className="mt-0.5 flex-none" />
              {t('installIosBody')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
