'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useMeetingStore } from '@/stores/meetingStore';
import { formatTime } from '@/utils/time';
import { ParticipantAvatar } from '@/components/avatar/ParticipantAvatar';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { MeetingControls } from '@/components/MeetingControls';

export const MeetingSummary = () => {
  const t = useTranslations('summary');
  const participants = useMeetingStore((s) => s.participants);
  const globalTimer = useMeetingStore((s) => s.globalTimer);
  const meetingName = useMeetingStore((s) => s.meetingState.name);

  const present = participants.filter((p) => p.isPresent);
  const spoke = present.filter((p) => p.actualTime !== undefined);
  const overtimes = spoke.filter((p) => (p.actualTime ?? 0) > p.allocatedTime);
  const totalAllocated = present.reduce((s, p) => s + p.allocatedTime, 0);
  const totalUsed = spoke.reduce((s, p) => s + (p.actualTime ?? 0), 0);
  const maxTime = Math.max(1, ...present.map((p) => Math.max(p.allocatedTime, p.actualTime ?? 0)));

  return (
    <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <div className="card grid flex-1 place-content-center overflow-hidden p-6 text-center lg:min-h-0">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient">{t('title')}</span>
          </h2>
          {meetingName && <p className="mt-1 text-sm text-foreground-muted">{meetingName}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {present.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ y: 30, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 + i * 0.07 }}
                className="grid justify-items-center gap-1"
              >
                <ParticipantAvatar participant={p} size={present.length > 8 ? 48 : 60} />
                <span className="max-w-20 truncate text-xs text-foreground-muted">{p.name}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <MeetingControls />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={t('totalDuration')} value={globalTimer} time />
          <Stat label={t('participants')} value={present.length} />
          <Stat label={t('timeUsedOfAllocated')} value={totalUsed} time suffix={` / ${formatTime(totalAllocated)}`} />
          <Stat label={t('overtimes')} value={overtimes.length} alert={overtimes.length > 0} />
        </div>
      </div>

      <div className="card flex flex-col p-5 sm:p-6 lg:h-full lg:min-h-0">
        <h3 className="mb-4 text-lg font-semibold tracking-tight">{t('participantDetails')}</h3>
        <ul className="-mr-2 grid content-start gap-3 overflow-y-auto pr-2 lg:min-h-0 lg:flex-1">
          {present.map((p, i) => {
            const spoken = p.actualTime !== undefined;
            const used = p.actualTime ?? 0;
            const late = used > p.allocatedTime;
            const diff = used - p.allocatedTime;
            return (
              <li key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <ParticipantAvatar participant={p} size={38} />
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="font-mono text-xs text-foreground-muted tabular">
                      {spoken ? formatTime(used) : '—'} / {formatTime(p.allocatedTime)}
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-white/10" style={{ width: `${(p.allocatedTime / maxTime) * 100}%` }} />
                    <motion.div
                      className={clsx('absolute inset-y-0 left-0 rounded-full', late ? 'bg-error' : 'bg-success')}
                      initial={{ width: 0 }}
                      animate={{ width: `${(used / maxTime) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.3 + i * 0.06 }}
                    />
                  </div>
                </div>
                <span
                  className={clsx(
                    'w-[7.5rem] rounded-full px-2 py-0.5 text-center font-mono text-xs tabular',
                    !spoken ? 'bg-white/5 text-foreground-muted' : late ? 'bg-error/15 text-error' : 'bg-success/15 text-success'
                  )}
                >
                  {!spoken ? t('didNotSpeak') : diff > 0 ? `+${formatTime(diff)}` : diff < 0 ? `-${formatTime(-diff)}` : '±00:00'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

function Stat({ label, value, time, suffix, alert }: { label: string; value: number; time?: boolean; suffix?: string; alert?: boolean }) {
  return (
    <div className={clsx('card grid gap-1 !rounded-2xl p-4', alert && '!border-error/40')}>
      <span className="text-xs text-foreground-muted">{label}</span>
      <span className={clsx('font-mono text-2xl font-semibold tracking-tight tabular', alert && 'text-error')}>
        <AnimatedNumber value={value} format={time ? (n) => formatTime(Math.round(n)) : undefined} />
        {suffix && <span className="text-base font-normal text-foreground-muted">{suffix}</span>}
      </span>
    </div>
  );
}
