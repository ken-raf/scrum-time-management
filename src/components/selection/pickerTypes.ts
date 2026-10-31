import type { Participant } from '@/types';

export interface PickerProps {
  /** Participants shown in the picker (present and not yet spoken). */
  participants: Participant[];
  /** Who has to win the spin that `spinId` starts. */
  target: Participant | null;
  /** Increments each time a spin starts. A picker never spins on mount. */
  spinId: number;
  /** Set once the spin settled, so the picker can show the winner. */
  winnerId: string | null;
  /** Called when the animation landed on `target`. */
  onSettled: () => void;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function shuffledSequence<T>(pool: T[], length: number, avoidFirst?: T): T[] {
  const out: T[] = [];
  let prev = avoidFirst;
  for (let i = 0; i < length; i++) {
    let next = pool[Math.floor(Math.random() * pool.length)];
    let guard = 0;
    while (pool.length > 1 && next === prev && guard++ < 8) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
    out.push(next);
    prev = next;
  }
  return out;
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
