'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/utils/time';
import { Clock } from 'lucide-react';

export const GlobalTimer = () => {
  const { globalTimer, incrementGlobalTimer, meetingState } = useMeetingStore();

  useTimer(
    meetingState.isStarted && !meetingState.isFinished,
    incrementGlobalTimer
  );

  if (!meetingState.isStarted) {
    return null;
  }

  return (
    <div className="bg-surface rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-center gap-3">
        <Clock size={24} className="text-primary" />
        <div className="text-center">
          <p className="text-sm text-foreground-secondary mb-1">Durée de la réunion</p>
          <p className="text-2xl font-mono font-bold text-foreground">
            {formatTime(globalTimer)}
          </p>
        </div>
      </div>
    </div>
  );
};