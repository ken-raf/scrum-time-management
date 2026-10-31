'use client';

import { useTranslations } from 'next-intl';
import { useMeetingStore } from '@/stores/meetingStore';
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/utils/time';

/** Meeting clock shown in the meeting bar, with a live dot. */
export const GlobalTimer = () => {
  const t = useTranslations('meeting');
  const globalTimer = useMeetingStore((s) => s.globalTimer);
  const incrementGlobalTimer = useMeetingStore((s) => s.incrementGlobalTimer);
  const meetingState = useMeetingStore((s) => s.meetingState);

  useTimer(meetingState.isStarted && !meetingState.isFinished, incrementGlobalTimer);

  if (!meetingState.isStarted) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-2.5 w-2.5">
        {!meetingState.isFinished && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-60" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meetingState.isFinished ? 'bg-foreground-muted' : 'bg-error'}`} />
      </span>
      <div>
        <p className="eyebrow">{t('duration')}</p>
        <p className="font-mono text-2xl font-semibold leading-tight tracking-tight tabular">{formatTime(globalTimer)}</p>
      </div>
    </div>
  );
};
