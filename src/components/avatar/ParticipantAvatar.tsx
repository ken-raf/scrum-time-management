'use client';

import { Avatar } from './Avatar';
import { useAvatarMood } from '@/hooks/useAvatarMood';
import type { AvatarMood } from '@/lib/avatars';
import type { Participant } from '@/types';

interface ParticipantAvatarProps {
  participant: Participant;
  size?: number;
  className?: string;
  /** Force a gesture instead of the one derived from the meeting. */
  mood?: AvatarMood;
}

export function ParticipantAvatar({ participant, size = 40, className, mood }: ParticipantAvatarProps) {
  const derived = useAvatarMood(participant);
  return (
    <Avatar
      avatarId={participant.avatar}
      seed={participant.id}
      mood={mood ?? derived}
      size={size}
      className={className}
    />
  );
}
