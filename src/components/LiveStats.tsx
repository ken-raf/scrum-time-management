'use client';

import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Mic } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { ParticipantAvatar } from '@/components/avatar/ParticipantAvatar';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { Participant } from '@/types';

const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

export const LiveStats = () => {
  const t = useTranslations('liveStats');
  const participants = useMeetingStore((s) => s.participants);
  const meetingState = useMeetingStore((s) => s.meetingState);
  const globalTimer = useMeetingStore((s) => s.globalTimer);
  const currentSpeakingTime = useMeetingStore((s) => s.currentSpeakingTime);
  const isSpeaking = useMeetingStore((s) => s.isSpeaking);

  const present = participants.filter((p) => p.isPresent);
  const spoken = meetingState.spokenParticipants
    .map((id) => present.find((p) => p.id === id))
    .filter((p): p is Participant => !!p);
  const current = present.find((p) => p.id === meetingState.currentParticipant);
  const waiting = present.filter((p) => !meetingState.spokenParticipants.includes(p.id) && p.id !== current?.id);

  const totalAllocated = present.reduce((s, p) => s + p.allocatedTime, 0);
  const totalUsed = spoken.reduce((s, p) => s + (p.actualTime ?? 0), 0);
  const overtimes = spoken.filter((p) => (p.actualTime ?? 0) > p.allocatedTime).length;
  const progress = present.length ? spoken.length / present.length : 0;

  return (
    <div className="card flex flex-col gap-4 p-5 sm:p-6 lg:h-full lg:min-h-0">
      <div>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{t('title')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Tile label={t('presentParticipants')}>
          <AnimatedNumber value={present.length} />
        </Tile>
        <Tile label={t('haveSpoken')}>
          <AnimatedNumber value={spoken.length} />
          <span className="text-foreground-muted">/{present.length}</span>
        </Tile>
        <Tile label={t('timeUsed')}>
          <AnimatedNumber value={totalUsed} format={(n) => formatTime(Math.round(n))} />
        </Tile>
        <Tile label={t('overtimes')} alert={overtimes > 0}>
          <AnimatedNumber value={overtimes} />
        </Tile>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm text-foreground-muted">
          <span>{t('meetingProgress')}</span>
          <span className="font-mono tabular">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--theme-primary), var(--theme-accent-2))', boxShadow: '0 0 16px var(--theme-primary-glow)' }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-foreground-muted tabular">
          <span>
            {t('elapsedTime')} {formatTime(globalTimer)}
          </span>
          <span>
            {t('totalAllocatedTime')} {formatTime(totalAllocated)}
          </span>
        </div>
      </div>

      <LayoutGroup>
        <AnimatePresence>
          {current && (
            <motion.div
              key="on-air"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <motion.div
                layoutId={`live-${current.id}`}
                transition={spring}
                className="flex items-center gap-3 rounded-2xl border border-primary/40 p-2.5 pr-4"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}
              >
                <ParticipantAvatar participant={current} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Mic size={12} />
                    {t('onAir')}
                  </p>
                  <p className="truncate font-semibold">{current.name}</p>
                </div>
                <span className={clsx('font-mono text-sm tabular', isSpeaking && currentSpeakingTime > current.allocatedTime ? 'text-error' : 'text-foreground-secondary')}>
                  {isSpeaking ? formatTime(currentSpeakingTime) : '—'} / {formatTime(current.allocatedTime)}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="-mr-2 grid content-start gap-4 overflow-y-auto pr-2 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-1 xl:grid-cols-2">
          <Lane title={t('waiting')} count={waiting.length}>
            {waiting.map((p) => (
              <PersonRow key={p.id} p={p} right={<span className="text-foreground-muted">{formatTime(p.allocatedTime)}</span>} />
            ))}
          </Lane>
          <Lane title={t('haveSpokenList')} count={spoken.length}>
            {spoken.map((p) => {
              const late = (p.actualTime ?? 0) > p.allocatedTime;
              return (
                <PersonRow
                  key={p.id}
                  p={p}
                  right={
                    <span className={late ? 'text-error' : 'text-success'}>
                      {formatTime(p.actualTime ?? 0)}
                      <span className="text-foreground-muted"> / {formatTime(p.allocatedTime)}</span>
                    </span>
                  }
                />
              );
            })}
          </Lane>
        </div>
      </LayoutGroup>
    </div>
  );
};

function Tile({ label, alert, children }: { label: string; alert?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'grid gap-0.5 rounded-2xl border p-3 transition-colors duration-500',
        alert ? 'border-error/40 bg-error/10' : 'border-border bg-surface-hover/60'
      )}
    >
      <span className="truncate text-xs text-foreground-muted" title={label}>{label}</span>
      <span className={clsx('font-mono text-2xl font-semibold tracking-tight tabular xl:text-xl', alert && 'text-error')}>{children}</span>
    </div>
  );
}

function Lane({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex justify-between text-xs text-foreground-muted">
        <span>{title}</span>
        <span className="font-mono tabular">{count}</span>
      </div>
      <ul className="grid min-h-10 gap-1.5">
        <AnimatePresence initial={false}>{children}</AnimatePresence>
      </ul>
    </div>
  );
}

function PersonRow({ p, right }: { p: Participant; right: React.ReactNode }) {
  return (
    <motion.li
      layout
      layoutId={`live-${p.id}`}
      transition={spring}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface-hover/60 py-1 pl-1 pr-3"
    >
      <ParticipantAvatar participant={p} size={30} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
      <span className="font-mono text-xs tabular">{right}</span>
    </motion.li>
  );
}
