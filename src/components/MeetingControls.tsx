'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { Play, Square, RotateCcw } from 'lucide-react';

interface MeetingControlsProps {
  onNewMeeting?: () => void;
}

export const MeetingControls = ({ onNewMeeting }: MeetingControlsProps) => {
  const {
    meetingState,
    startMeeting,
    endMeeting,
    resetMeeting,
    participants
  } = useMeetingStore();

  const presentParticipants = participants.filter(p => p.isPresent);
  const canStartMeeting = presentParticipants.length > 0 && !meetingState.isStarted;

  const handleStartMeeting = () => {
    if (canStartMeeting) {
      startMeeting();
    }
  };

  const handleEndMeeting = () => {
    endMeeting();
    // Summary will be shown automatically via useEffect in main component
  };

  const handleResetMeeting = () => {
    resetMeeting();
  };

  if (meetingState.isFinished) {
    return (
      <div className="flex justify-center">
        <button
          onClick={onNewMeeting || handleResetMeeting}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center gap-2"
        >
          <RotateCcw size={20} />
          Nouvelle réunion
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {!meetingState.isStarted ? (
        <button
          onClick={handleStartMeeting}
          disabled={!canStartMeeting}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-foreground-muted disabled:cursor-not-allowed flex items-center gap-3"
        >
          <Play size={24} />
          Démarrer la réunion
        </button>
      ) : (
        <>
          <button
            onClick={handleEndMeeting}
            className="bg-error text-white px-6 py-3 rounded-lg font-semibold hover:bg-error focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 flex items-center gap-2"
          >
            <Square size={20} />
            Finir la réunion
          </button>
          <button
            onClick={handleResetMeeting}
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Réinitialiser
          </button>
        </>
      )}
    </div>
  );
};