import type { MeetingState, Participant } from '@/types';

export type AnimalKind =
  | 'fox'
  | 'cat'
  | 'panda'
  | 'bear'
  | 'rabbit'
  | 'koala'
  | 'owl'
  | 'penguin'
  | 'tiger'
  | 'raccoon'
  | 'lemur'
  | 'lion';

export interface AvatarPreset {
  id: string;
  kind: AnimalKind;
  /** Main fur / feather color. */
  fur: string;
  /** Darker fur: arms, stripes, masks. */
  furDark: string;
  /** Light parts: belly, muzzle, paws. */
  belly: string;
  /** Ear insides, nose or beak. */
  accent: string;
  bg: [string, string];
}

export const AVATARS: AvatarPreset[] = [
  { id: 'ani-fox', kind: 'fox', fur: '#f08a4b', furDark: '#c9612a', belly: '#fff4ea', accent: '#4a2618', bg: ['#ff9f5a', '#ffd35a'] },
  { id: 'ani-cat', kind: 'cat', fur: '#9aa3b8', furDark: '#6d7690', belly: '#eef0f6', accent: '#ff8fa3', bg: ['#a78bfa', '#f08bd6'] },
  { id: 'ani-panda', kind: 'panda', fur: '#f4f4f7', furDark: '#25272f', belly: '#ffffff', accent: '#25272f', bg: ['#3fd6a0', '#5ad1e6'] },
  { id: 'ani-bear', kind: 'bear', fur: '#a5703f', furDark: '#7b4f2a', belly: '#e9c9a0', accent: '#d9a877', bg: ['#ff6b7a', '#ff9f6b'] },
  { id: 'ani-rabbit', kind: 'rabbit', fur: '#f3ece6', furDark: '#d8cdc4', belly: '#ffffff', accent: '#ff9fb2', bg: ['#ff6fa5', '#c58bff'] },
  { id: 'ani-koala', kind: 'koala', fur: '#9ea3ae', furDark: '#757a86', belly: '#eceef2', accent: '#2a2c33', bg: ['#3fd1c7', '#6ab8ff'] },
  { id: 'ani-owl', kind: 'owl', fur: '#8d6b4f', furDark: '#5f4634', belly: '#efdcc0', accent: '#f2a33a', bg: ['#818cf8', '#60a5fa'] },
  { id: 'ani-penguin', kind: 'penguin', fur: '#2c3446', furDark: '#1c2230', belly: '#f4f6fb', accent: '#f2a33a', bg: ['#7d8cff', '#b38bff'] },
  { id: 'ani-tiger', kind: 'tiger', fur: '#f39a3c', furDark: '#2b1d16', belly: '#fff4e6', accent: '#ff8fa3', bg: ['#34d399', '#a3e635'] },
  { id: 'ani-raccoon', kind: 'raccoon', fur: '#8f919b', furDark: '#2c2d34', belly: '#f1f1f4', accent: '#2c2d34', bg: ['#a3b1d6', '#8fa0c9'] },
  { id: 'ani-lemur', kind: 'lemur', fur: '#aaadb7', furDark: '#26272d', belly: '#f4f4f6', accent: '#ffb84d', bg: ['#f08bd6', '#a78bfa'] },
  { id: 'ani-lion', kind: 'lion', fur: '#f2b552', furDark: '#c4691f', belly: '#fff1d6', accent: '#7a3b26', bg: ['#ffd35a', '#ff9f5a'] },
];

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Preset for an avatar id. Unknown ids (including the earlier human avatars)
 * fall back to a stable animal picked from `seed`, e.g. the participant id.
 */
export function getAvatar(avatarId?: string, seed = ''): AvatarPreset {
  const found = avatarId ? AVATARS.find((a) => a.id === avatarId) : undefined;
  return found ?? AVATARS[hashString(seed || avatarId || 'x') % AVATARS.length];
}

export function participantAvatar(p: Pick<Participant, 'id' | 'avatar'>): AvatarPreset {
  return getAvatar(p.avatar, p.id);
}

/** Identity color of a participant (used by the wheel and accents). */
export function participantColor(p: Pick<Participant, 'id' | 'avatar'>): [string, string] {
  return participantAvatar(p).bg;
}

/**
 * Gives an animal to every participant that has none (or an id that no longer
 * exists), avoiding animals already taken so the team stays recognizable.
 * Used by the storage migration and the JSON import.
 */
export function withAvatars<T extends { id: string; avatar?: string }>(list: T[]): T[] {
  const valid = new Set(AVATARS.map((a) => a.id));
  const taken = new Set(list.map((p) => p.avatar).filter((id): id is string => !!id && valid.has(id)));
  let cursor = 0;
  return list.map((p) => {
    if (p.avatar && valid.has(p.avatar)) return p;
    let pick = AVATARS.find((a) => !taken.has(a.id));
    if (!pick) pick = AVATARS[cursor++ % AVATARS.length];
    taken.add(pick.id);
    return { ...p, avatar: pick.id };
  });
}

/** An avatar nobody uses yet, otherwise a random one. */
export function suggestAvatarId(taken: Array<string | undefined>): string {
  const free = AVATARS.filter((a) => !taken.includes(a.id));
  const pool = free.length ? free : AVATARS;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export type AvatarMood =
  | 'idle'
  | 'waiting'
  | 'impatient'
  | 'selected'
  | 'speaking'
  | 'overtime'
  | 'done'
  | 'doneLate'
  | 'celebrate'
  | 'absent';

interface MoodContext {
  meetingState: MeetingState;
  isSpeaking: boolean;
  isOvertimeNow: boolean;
  progress: number; // share of present participants who already spoke, 0..1
}

/** What a participant's avatar should be doing at this point of the meeting. */
export function getAvatarMood(p: Participant, ctx: MoodContext): AvatarMood {
  const { meetingState } = ctx;
  if (!p.isPresent) return 'absent';
  const late = p.actualTime !== undefined && p.actualTime > p.allocatedTime;
  if (meetingState.isFinished) return late ? 'doneLate' : 'celebrate';
  if (!meetingState.isStarted) return 'idle';
  if (meetingState.currentParticipant === p.id) {
    if (!ctx.isSpeaking) return 'selected';
    return ctx.isOvertimeNow ? 'overtime' : 'speaking';
  }
  if (meetingState.spokenParticipants.includes(p.id)) return late ? 'doneLate' : 'done';
  return ctx.progress >= 0.5 ? 'impatient' : 'waiting';
}
