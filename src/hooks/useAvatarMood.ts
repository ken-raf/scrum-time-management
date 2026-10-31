'use client';

import { useMeetingStore } from '@/stores/meetingStore';
import { AvatarMood, getAvatarMood } from '@/lib/avatars';
import type { Participant } from '@/types';

/** Gesture of a participant's avatar, derived from where the meeting stands. */
export function useAvatarMood(p: Participant | undefined): AvatarMood {
  const meetingState = useMeetingStore((s) => s.meetingState);
  const isSpeaking = useMeetingStore((s) => s.isSpeaking);
  const isOvertimeNow = useMeetingStore(
    (s) => !!p && s.meetingState.currentParticipant === p.id && s.currentSpeakingTime > p.allocatedTime
  );
  const progress = useMeetingStore((s) => {
    const present = s.participants.filter((x) => x.isPresent).length;
    return present ? s.meetingState.spokenParticipants.length / present : 0;
  });
  if (!p) return 'idle';
  return getAvatarMood(p, { meetingState, isSpeaking, isOvertimeNow, progress });
}
