'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Disc3, GalleryHorizontalEnd, Layers, Shuffle, Sparkles as SparklesIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { PICKER_MODES, PickerMode, PickerPreference, useSettingsStore } from '@/stores/settingsStore';
import { participantColor } from '@/lib/avatars';
import { sfx } from '@/lib/sound';
import { Avatar } from '@/components/avatar/Avatar';
import type { Participant } from '@/types';
import { WheelPicker } from './WheelPicker';
import { ReelPicker } from './ReelPicker';
import { DeckPicker } from './DeckPicker';
import { SpotlightPicker } from './SpotlightPicker';
import { Sparkles } from './Sparkles';
import { wait } from './pickerTypes';

const MODE_ICONS: Record<PickerPreference, LucideIcon> = {
  random: Shuffle,
  wheel: Disc3,
  reel: GalleryHorizontalEnd,
  deck: Layers,
  spotlight: SparklesIcon,
};

const COMPONENTS = { wheel: WheelPicker, reel: ReelPicker, deck: DeckPicker, spotlight: SpotlightPicker };

interface ParticipantPickerProps {
  /** Called when the winner has been revealed (opens the speaking modal). */
  onParticipantSelected: (participantId: string) => void;
}

export function ParticipantPicker({ onParticipantSelected }: ParticipantPickerProps) {
  const t = useTranslations('picker');
  const reduced = useReducedMotion();
  const participants = useMeetingStore((s) => s.participants);
  const meetingState = useMeetingStore((s) => s.meetingState);
  const preferenceStored = useSettingsStore((s) => s.pickerPreference);
  const setPickerPreference = useSettingsStore((s) => s.setPickerPreference);
  const [mounted, setMounted] = useState(false);
  const preference: PickerPreference = mounted ? preferenceStored : 'random';

  const preview = !meetingState.isStarted;
  const present = participants.filter((p) => p.isPresent);
  const available = preview ? present : present.filter((p) => !meetingState.spokenParticipants.includes(p.id));

  const [mode, setMode] = useState<PickerMode>('wheel');
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed'>('idle');
  const [target, setTarget] = useState<Participant | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  // Follow the stored preference; in random mode, start on a random concept.
  useEffect(() => {
    if (!mounted) return;
    if (preferenceStored !== 'random') setMode(preferenceStored);
    else setMode(PICKER_MODES[Math.floor(Math.random() * PICKER_MODES.length)]);
  }, [mounted, preferenceStored]);

  // Once the speaker's turn is over (or the modal closed), go back to idle.
  useEffect(() => {
    if (phase === 'revealed' && !meetingState.currentParticipant && !openTimer.current) {
      setPhase('idle');
      setWinnerId(null);
      setTarget(null);
    }
  }, [meetingState.currentParticipant, meetingState.spokenParticipants.length, phase]);

  const spin = async () => {
    if (phase === 'spinning' || preview || available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    let next = mode;
    if (preference === 'random') {
      const others = PICKER_MODES.filter((m) => m !== mode);
      next = others[Math.floor(Math.random() * others.length)];
    }
    setWinnerId(null);
    setTarget(pick);
    setPhase('spinning');
    if (next !== mode) {
      setMode(next);
      await wait(reduced ? 30 : 560);
    }
    setSpinId((n) => n + 1);
  };

  const handleSettled = () => {
    if (!target) return;
    setWinnerId(target.id);
    setPhase('revealed');
    setBurst((n) => n + 1);
    sfx.reveal();
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      onParticipantSelected(target.id);
    }, reduced ? 600 : 2000);
  };

  const choosePreference = (p: PickerPreference) => {
    if (phase === 'spinning') return;
    sfx.click();
    setPickerPreference(p);
  };

  const Picker = COMPONENTS[mode];
  const winner = available.find((p) => p.id === winnerId) ?? (winnerId ? present.find((p) => p.id === winnerId) : undefined);
  const ModeIcon = MODE_ICONS[mode];
  const allSpoken = !preview && present.length > 0 && available.length === 0 && phase !== 'revealed';

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label={t('modeLabel')}>
          {(['random', ...PICKER_MODES] as PickerPreference[]).map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <button
                key={m}
                type="button"
                aria-pressed={preference === m}
                onClick={() => choosePreference(m)}
                disabled={phase === 'spinning'}
                title={t(`modes.${m}`)}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{t(`modes.${m}`)}</span>
              </button>
            );
          })}
        </div>
        <span className="eyebrow tabular">
          {preview ? t('present', { count: available.length }) : t('remaining', { count: available.length })}
        </span>
      </div>

      <div className="stage h-[360px] sm:h-[420px] lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="stage-grid" />
        <div className="absolute left-5 top-4 z-40 flex items-center gap-2 eyebrow">
          <ModeIcon size={13} />
          {t(`modes.${mode}`)}
          {preference === 'random' && <span className="rounded-full bg-white/5 px-2 py-0.5 normal-case tracking-normal">{t('modes.random')}</span>}
        </div>

        {present.length === 0 ? (
          <EmptyStage title={t('noneTitle')} body={t('noneBody')} />
        ) : allSpoken ? (
          <EmptyStage title={t('allSpokenTitle')} body={t('allSpokenBody')} participants={present} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              className="absolute inset-0 flex items-center justify-center px-4 pb-4 pt-10"
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Picker participants={available} target={target} spinId={spinId} winnerId={winnerId} onSettled={handleSettled} />
            </motion.div>
          </AnimatePresence>
        )}

        <Sparkles burst={burst} color={winner ? participantColor(winner)[0] : undefined} />

        <AnimatePresence>
          {phase === 'revealed' && winner && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="glass absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-2 pr-5 shadow-2xl"
            >
              <Avatar avatarId={winner.avatar} seed={winner.id} mood="selected" size={40} />
              <span className="whitespace-nowrap text-sm text-foreground-muted">{t('itsTurn')}</span>
              <span className="max-w-[10rem] truncate whitespace-nowrap text-lg font-semibold tracking-tight">{winner.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!preview && available.length > 0 && (
        <div className="flex justify-center">
          <motion.button
            type="button"
            onClick={spin}
            disabled={phase !== 'idle'}
            className="btn btn-primary btn-lg min-w-[220px]"
            whileTap={{ scale: 0.95 }}
          >
            <Shuffle size={18} />
            {phase === 'spinning' ? t('selecting') : phase === 'revealed' ? t('openingTimer') : t('whosTurn')}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function EmptyStage({ title, body, participants }: { title: string; body: string; participants?: Participant[] }) {
  return (
    <div className="absolute inset-0 grid place-content-center justify-items-center gap-4 px-6 text-center">
      {participants && (
        <div className="flex flex-wrap justify-center gap-2">
          {participants.slice(0, 12).map((p) => (
            <Avatar key={p.id} avatarId={p.avatar} seed={p.id} mood="celebrate" size={52} />
          ))}
        </div>
      )}
      <p className="text-xl font-semibold tracking-tight">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{body}</p>
    </div>
  );
}
