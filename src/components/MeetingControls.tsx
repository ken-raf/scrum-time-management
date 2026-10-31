'use client';

import { useTranslations } from 'next-intl';
import { Play, RotateCcw, Square } from 'lucide-react';
import { useMeetingStore } from '@/stores/meetingStore';
import { sfx } from '@/lib/sound';

interface MeetingControlsProps {
  onNewMeeting?: () => void;
}

export const MeetingControls = ({ onNewMeeting }: MeetingControlsProps) => {
  const t = useTranslations('meeting');
  const meetingState = useMeetingStore((s) => s.meetingState);
  const startMeeting = useMeetingStore((s) => s.startMeeting);
  const endMeeting = useMeetingStore((s) => s.endMeeting);
  const resetMeeting = useMeetingStore((s) => s.resetMeeting);
  const participants = useMeetingStore((s) => s.participants);

  const presentCount = participants.filter((p) => p.isPresent).length;
  const canStartMeeting = presentCount > 0 && !meetingState.isStarted;

  if (meetingState.isFinished) {
    return (
      <button type="button" onClick={onNewMeeting || resetMeeting} className="btn btn-primary btn-lg">
        <RotateCcw size={18} />
        {t('newMeeting')}
      </button>
    );
  }

  if (!meetingState.isStarted) {
    return (
      <button
        type="button"
        onClick={() => {
          if (!canStartMeeting) return;
          startMeeting();
          sfx.start();
        }}
        disabled={!canStartMeeting}
        title={canStartMeeting ? undefined : t('startHint')}
        className="btn btn-primary"
      >
        <Play size={18} />
        {t('startMeeting')}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          endMeeting();
          sfx.fanfare();
        }}
        className="btn btn-danger"
      >
        <Square size={16} />
        {t('endMeeting')}
      </button>
      <button type="button" onClick={resetMeeting} className="btn btn-ghost">
        <RotateCcw size={16} />
        {t('resetMeeting')}
      </button>
    </div>
  );
};
