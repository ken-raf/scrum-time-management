'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { sfx } from '@/lib/sound';

export function SoundToggle() {
  const t = useTranslations('header');
  const { soundEnabled, setSoundEnabled } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const on = mounted ? soundEnabled : true;
  const label = on ? t('soundOn') : t('soundOff');

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        if (next) sfx.click();
      }}
    >
      {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
