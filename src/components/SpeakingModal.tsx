'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Play, Square, X } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/utils/time';
import { sfx } from '@/lib/sound';
import { Avatar } from '@/components/avatar/Avatar';
import { TimerDial } from '@/components/timer/TimerDial';
import type { AvatarMood } from '@/lib/avatars';

interface SpeakingModalProps {
  isOpen: boolean;
  participantId: string;
  onClose: () => void;
}

export const SpeakingModal = ({ isOpen, participantId, onClose }: SpeakingModalProps) => {
  const t = useTranslations('timer');
  const participants = useMeetingStore((s) => s.participants);
  const currentSpeakingTime = useMeetingStore((s) => s.currentSpeakingTime);
  const isSpeaking = useMeetingStore((s) => s.isSpeaking);
  const startSpeaking = useMeetingStore((s) => s.startSpeaking);
  const stopSpeaking = useMeetingStore((s) => s.stopSpeaking);
  const incrementSpeakingTimer = useMeetingStore((s) => s.incrementSpeakingTimer);
  const resetCurrentSpeakingTime = useMeetingStore((s) => s.resetCurrentSpeakingTime);
  const [finished, setFinished] = useState<{ used: number; name: string } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const participant = participants.find((p) => p.id === participantId);

  useTimer(isSpeaking, incrementSpeakingTimer);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Sound cues while the speaker talks.
  useEffect(() => {
    if (!isSpeaking || !participant || currentSpeakingTime === 0) return;
    const alloc = participant.allocatedTime;
    const remaining = alloc - currentSpeakingTime;
    const warnAt = Math.max(1, Math.ceil(alloc * 0.75));
    if (currentSpeakingTime === warnAt && remaining > 10) sfx.warning();
    else if (remaining > 0 && remaining <= 10) sfx.countdown();
    else if (remaining === 0) sfx.overtime();
    else if (remaining < 0 && -remaining % 30 === 0) sfx.overtime();
  }, [currentSpeakingTime, isSpeaking, participant]);

  // Escape closes the modal before the turn starts.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSpeaking && !finished) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isSpeaking, finished, onClose]);

  if (!participant) return null;

  const isOvertime = currentSpeakingTime > participant.allocatedTime;

  const handleStart = () => {
    resetCurrentSpeakingTime();
    startSpeaking(participantId);
    sfx.start();
  };

  const handleFinish = () => {
    const used = currentSpeakingTime;
    stopSpeaking();
    setFinished({ used, name: participant.name });
    sfx.finish();
    closeTimer.current = setTimeout(onClose, 2400);
  };

  let mood: AvatarMood = 'selected';
  if (finished) mood = finished.used > participant.allocatedTime ? 'doneLate' : 'done';
  else if (isSpeaking) mood = isOvertime ? 'overtime' : 'speaking';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="speaking-title"
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="card relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)] sm:p-8"
            style={{ background: 'radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface)) 0%, var(--theme-surface) 65%)' }}
          >
            <div className="mb-4 flex items-center gap-4">
              <Avatar avatarId={participant.avatar} seed={participant.id} mood={mood} size={72} />
              <div className="min-w-0 flex-1">
                <h2 id="speaking-title" className="truncate text-2xl font-semibold tracking-tight">
                  {participant.name}
                </h2>
                <p className="text-sm text-foreground-muted">
                  {t('allocatedTime')} <span className="font-mono tabular">{formatTime(participant.allocatedTime)}</span>
                </p>
              </div>
              {!isSpeaking && !finished && (
                <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label={t('close')}>
                  <X size={18} />
                </button>
              )}
            </div>

            <TimerDial
              elapsed={finished ? finished.used : currentSpeakingTime}
              allocated={participant.allocatedTime}
              running={isSpeaking}
              finished={finished}
            />

            <div className="mt-6 grid gap-3">
              {finished ? null : !isSpeaking ? (
                <button type="button" onClick={handleStart} className="btn btn-primary btn-lg w-full">
                  <Play size={20} />
                  {t('start')}
                </button>
              ) : (
                <button type="button" onClick={handleFinish} className={`btn btn-lg w-full ${isOvertime ? 'btn-danger' : 'btn-primary'}`}>
                  <Square size={18} />
                  {t('finish')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
