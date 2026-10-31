'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Avatar } from '@/components/avatar/Avatar';
import { sfx } from '@/lib/sound';
import { formatTime } from '@/utils/time';
import { PickerProps, wait } from './pickerTypes';

// Every card keeps the same transform function list so the browser
// interpolates rotateY(180deg) as a real flip.
const T = (x: number, y: number, a: number, f: number, s: number) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${a.toFixed(2)}deg) rotateY(${f}deg) scale(${s})`;
const stackT = (i: number) => T(i * 0.5, -i * 0.7, ((i % 3) - 1) * 1.2, 0, 1);

/** Deck of cards: riffle shuffle, fan out, a highlight scans the fan, the winner flips face up. */
export function DeckPicker({ participants, target, spinId, onSettled }: PickerProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSpin = useRef(spinId);
  const fanned = useRef(false);
  const alive = useRef(true);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const cardsInOrder = () =>
    participants.map((p) => cardRefs.current.get(p.id)).filter((el): el is HTMLDivElement => !!el);

  const moveTo = (el: HTMLElement, tf: string, dur: number, easing = 'cubic-bezier(.16,1,.3,1)', delay = 0) => {
    const from = el.style.transform || stackT(0);
    if (reduced) {
      el.style.transform = tf;
      return Promise.resolve();
    }
    const anim = el.animate([{ transform: from }, { transform: tf }], { duration: dur, easing, delay, fill: 'both' });
    return anim.finished
      .then(() => {
        el.style.transform = tf;
        anim.cancel();
      })
      .catch(() => undefined);
  };

  const fanPos = (i: number, n: number) => {
    const w = rootRef.current?.clientWidth ?? 600;
    const spread = Math.min(10, 64 / Math.max(1, n - 1));
    const a = (i - (n - 1) / 2) * spread;
    const radius = Math.min(620, w * 0.9);
    const rad = (a * Math.PI) / 180;
    return { x: Math.sin(rad) * radius * 0.62, y: (1 - Math.cos(rad)) * radius * 0.55 + 24, a };
  };

  const reset = async (animate: boolean) => {
    const cards = cardsInOrder();
    cards.forEach((c) => {
      c.dataset.dim = 'false';
      c.querySelector<HTMLElement>('[data-flip]')!.dataset.up = 'false';
      c.dataset.win = 'false';
    });
    if (animate) {
      await Promise.all(cards.map((c, i) => moveTo(c, stackT(i), 420, 'cubic-bezier(.65,0,.35,1)', i * 15)));
    } else {
      cards.forEach((c, i) => (c.style.transform = stackT(i)));
    }
    cards.forEach((c, i) => (c.style.zIndex = String(i + 1)));
    fanned.current = false;
  };

  // New cards start stacked; a departed participant makes the deck regroup.
  const idsKey = participants.map((p) => p.id).join('|');
  useLayoutEffect(() => {
    void reset(fanned.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const riffle = async () => {
    const cards = cardsInOrder();
    const n = cards.length;
    sfx.whoosh();
    await Promise.all(
      cards.map((c, i) => {
        const side = i < n / 2 ? -1 : 1;
        return moveTo(c, T(side * (92 + i * 2), -i * 0.7, side * 7, 0, 1), 260, 'cubic-bezier(.3,0,.2,1)');
      })
    );
    const half = Math.ceil(n / 2);
    const order: number[] = [];
    for (let i = 0; i < half; i++) {
      order.push(i);
      if (i + half < n) order.push(i + half);
    }
    order.forEach((ci, k) => {
      cards[ci].style.zIndex = String(k + 1);
      setTimeout(() => sfx.tick(0.3), k * 34);
    });
    await Promise.all(order.map((ci, k) => moveTo(cards[ci], T(k * 0.5, -k * 0.7, ((k % 3) - 1) * 1.2, 0, 1), 300, 'cubic-bezier(.2,.8,.2,1)', k * 34)));
  };

  useEffect(() => {
    if (spinId === lastSpin.current) return;
    lastSpin.current = spinId;
    if (!target) return;
    void (async () => {
      if (fanned.current) await reset(true);
      const cards = cardsInOrder();
      const n = cards.length;
      const targetIndex = participants.findIndex((p) => p.id === target.id);
      if (targetIndex < 0 || !alive.current) return;
      if (!reduced) {
        await riffle();
        await riffle();
      }
      if (!alive.current) return;
      sfx.whoosh();
      await Promise.all(
        cards.map((c, i) => {
          const p = fanPos(i, n);
          c.style.zIndex = String(i + 1);
          return moveTo(c, T(p.x, p.y, p.a, 0, 1), 520, undefined, i * 28);
        })
      );
      fanned.current = true;

      const hops: number[] = [];
      if (reduced) hops.push(targetIndex);
      else for (let k = 0; k <= n * 2 + targetIndex; k++) hops.push(k % n);
      let delay = 55;
      for (let k = 0; k < hops.length; k++) {
        if (!alive.current) return;
        cards.forEach((c, i) => (c.querySelector<HTMLElement>('[data-flip]')!.dataset.up = i === hops[k] ? 'true' : 'false'));
        sfx.tick(0.5);
        await wait(reduced ? 20 : delay);
        delay *= k > hops.length - 12 ? 1.22 : 1.02;
      }

      const wc = cards[targetIndex];
      wc.querySelector<HTMLElement>('[data-flip]')!.dataset.up = 'false';
      wc.style.zIndex = '200';
      cards.forEach((c, i) => {
        if (c === wc) return;
        c.dataset.dim = 'true';
        const p = fanPos(i, n);
        void moveTo(c, T(p.x, p.y + 40, p.a, 0, 0.94), 500);
      });
      await moveTo(wc, T(0, -50, 0, 0, 1.22), 380);
      sfx.flip();
      wc.dataset.win = 'true';
      await moveTo(wc, T(0, -34, 0, 180, 1.4), 760, 'cubic-bezier(.34,1.3,.64,1)');
      if (alive.current) settledRef.current();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  return (
    <div ref={rootRef} className="absolute inset-0" style={{ perspective: 1400 }}>
      {participants.map((p) => (
        <div
          key={p.id}
          ref={(el) => {
            if (el) cardRefs.current.set(p.id, el);
            else cardRefs.current.delete(p.id);
          }}
          className="deck-card group absolute left-1/2 top-[54%] -ml-[60px] -mt-[84px] h-[168px] w-[120px] will-change-transform [transform-style:preserve-3d] data-[dim=true]:[&>div]:opacity-25"
        >
          <div
            data-flip
            className="absolute inset-0 transition-[transform,opacity] duration-150 ease-out [transform-style:preserve-3d] data-[up=true]:-translate-y-[26px]"
          >
            {/* back */}
            <div className="absolute inset-0 grid place-items-center rounded-[15px] border border-border-hover shadow-[0_18px_30px_-18px_rgba(0,0,0,.9)] transition-[border-color,box-shadow] duration-150 [backface-visibility:hidden] group-has-[[data-up=true]]:border-primary group-has-[[data-up=true]]:shadow-[0_0_34px_-4px_var(--theme-primary-glow)]"
              style={{
                background:
                  'repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 6px, transparent 6px 12px), linear-gradient(160deg, color-mix(in srgb, var(--theme-primary) 38%, #141a3c), #10152f)',
              }}
            >
              <Clock size={38} className="text-white/45" strokeWidth={1.6} />
            </div>
            {/* face */}
            <div
              className="absolute inset-0 grid content-center justify-items-center gap-2 rounded-[15px] border border-primary p-3 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                background: 'linear-gradient(165deg, var(--theme-surface-raised), var(--theme-surface))',
                boxShadow: '0 0 0 1px var(--theme-primary), 0 0 60px -6px var(--theme-primary-glow)',
              }}
            >
              <Avatar avatarId={p.avatar} seed={p.id} mood="selected" size={58} />
              <span className="max-w-full truncate text-[0.95rem] font-semibold">{p.name}</span>
              <span className="font-mono text-[0.7rem] text-foreground-muted tabular">{formatTime(p.allocatedTime)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
