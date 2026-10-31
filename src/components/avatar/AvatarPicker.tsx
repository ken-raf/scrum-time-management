'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AVATARS } from '@/lib/avatars';
import { Avatar } from './Avatar';
import { sfx } from '@/lib/sound';

interface AvatarPickerProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  size?: number;
}

export function AvatarPicker({ value, onChange, disabled, size = 46 }: AvatarPickerProps) {
  const t = useTranslations('participants');
  return (
    <div role="radiogroup" aria-label={t('chooseAvatar')} className="flex flex-wrap gap-2">
      {AVATARS.map((a) => {
        const active = a.id === value;
        return (
          <motion.button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(`animals.${a.kind}`)}
            title={t(`animals.${a.kind}`)}
            disabled={disabled}
            onClick={() => {
              onChange(a.id);
              sfx.click();
            }}
            whileHover={disabled ? undefined : { y: -3 }}
            whileTap={disabled ? undefined : { scale: 0.9 }}
            className="relative rounded-full transition-shadow duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              boxShadow: active
                ? '0 0 0 2px var(--theme-surface), 0 0 0 4px var(--theme-primary), 0 8px 24px -6px var(--theme-primary-glow)'
                : undefined,
            }}
          >
            <Avatar avatarId={a.id} seed={a.id} mood={active ? 'done' : 'idle'} size={size} />
          </motion.button>
        );
      })}
    </div>
  );
}
