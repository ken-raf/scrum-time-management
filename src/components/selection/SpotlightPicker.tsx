'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Avatar } from '@/components/avatar/Avatar';
import { sfx } from '@/lib/sound';
import { PickerProps, wait } from './pickerTypes';

/** Spotlight: a beam hops between the avatars, slows down, and the winner flies to center stage. */
export function SpotlightPicker({ participants, target, spinId, winnerId, onSettled }: PickerProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSpin = useRef(spinId);
  const alive = useRef(true);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const [litId, setLitId] = useState<string | null>(null);
  const [cols, setCols] = useState(3);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const w = rootRef.current?.clientWidth ?? 600;
      const isSmall = w < 520;
      const itemW = isSmall ? 72 : 96;
      const gap = isSmall ? 10 : 18;
      const maxCols = Math.max(2, Math.floor((w - 40 + gap) / (itemW + gap)));
      setSmall(isSmall);
      setCols(Math.max(1, Math.min(participants.length <= 6 ? 3 : participants.length <= 8 ? 4 : 6, maxCols, participants.length)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [participants.length]);

  const aim = (id: string) => {
    const host = rootRef.current;
    const item = itemRefs.current.get(id);
    const beam = beamRef.current;
    if (!host || !item || !beam) return;
    const hr = host.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    const size = beam.offsetWidth;
    beam.style.opacity = '1';
    beam.style.transform = `translate(${(r.left + r.width / 2 - hr.left - size / 2).toFixed(1)}px, ${(r.top + r.width / 2 - hr.top - size / 2).toFixed(1)}px)`;
  };

  useEffect(() => {
    if (spinId === lastSpin.current) return;
    lastSpin.current = spinId;
    if (!target) return;
    void (async () => {
      const n = participants.length;
      const seq: string[] = [];
      if (!reduced && n > 1) {
        let prev = -1;
        for (let k = 0; k < 26; k++) {
          let j = Math.floor(Math.random() * n);
          let guard = 0;
          while ((j === prev || (k === 25 && participants[j].id === target.id)) && guard++ < 10) j = Math.floor(Math.random() * n);
          seq.push(participants[j].id);
          prev = j;
        }
      }
      seq.push(target.id);
      let delay = 55;
      for (let k = 0; k < seq.length; k++) {
        if (!alive.current) return;
        setLitId(seq[k]);
        aim(seq[k]);
        sfx.tick(0.6);
        await wait(delay);
        delay *= k > seq.length - 9 ? 1.3 : 1.03;
      }
      await wait(reduced ? 50 : 260);
      if (!alive.current) return;
      if (beamRef.current) beamRef.current.style.opacity = '0';
      setLitId(null);
      settledRef.current();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  const winner = participants.find((p) => p.id === winnerId);
  const itemW = small ? 72 : 96;
  const avatarSize = small ? 52 : 68;

  return (
    <div ref={rootRef} className="absolute inset-0 grid place-content-center px-5 pb-6 pt-12">
      <div
        ref={beamRef}
        className="pointer-events-none absolute left-0 top-0 z-[1] rounded-full opacity-0 transition-[transform,opacity] duration-[130ms] ease-out"
        style={{
          width: small ? 130 : 170,
          height: small ? 130 : 170,
          background: 'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 40%, transparent) 0%, color-mix(in srgb, var(--theme-primary) 10%, transparent) 40%, transparent 68%)',
        }}
      />
      <div
        className={clsx('relative z-[2] grid justify-center transition-[filter,opacity] duration-500', winner && 'opacity-25 blur-[3px]')}
        style={{ gridTemplateColumns: `repeat(${cols}, ${itemW}px)`, gap: small ? '16px 10px' : '24px 18px' }}
      >
        {participants.map((p) => {
          const lit = litId === p.id;
          return (
            <div
              key={p.id}
              ref={(el) => {
                if (el) itemRefs.current.set(p.id, el);
                else itemRefs.current.delete(p.id);
              }}
              className="grid justify-items-center gap-2"
            >
              <div
                className="rounded-full transition-[transform,box-shadow] duration-150 ease-out"
                style={{
                  transform: lit ? 'scale(1.14)' : undefined,
                  boxShadow: lit ? '0 0 0 2px #fff, 0 0 34px 6px var(--theme-primary-glow)' : '0 0 0 2px rgba(255,255,255,.06)',
                  visibility: winner?.id === p.id ? 'hidden' : undefined,
                }}
              >
                {winner?.id !== p.id && (
                  <motion.div layoutId={`spot-${p.id}`} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
                    <Avatar avatarId={p.avatar} seed={p.id} mood={lit ? 'selected' : 'waiting'} size={avatarSize} />
                  </motion.div>
                )}
                {winner?.id === p.id && <div style={{ width: avatarSize, height: avatarSize }} />}
              </div>
              <span className={clsx('max-w-full truncate text-sm transition-colors duration-150', lit ? 'text-foreground' : 'text-foreground-muted')}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {winner && (
          <div className="pointer-events-none absolute inset-0 z-[5] grid place-content-center justify-items-center gap-4">
            {!reduced &&
              [0, 0.28, 0.56].map((d) => (
                <motion.span
                  key={d}
                  className="absolute left-1/2 top-1/2 h-[120px] w-[120px] rounded-full border-[1.5px] border-primary"
                  style={{ marginLeft: -60, marginTop: -88 }}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 3.6, opacity: 0 }}
                  transition={{ duration: 2.2, delay: 0.45 + d, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            <motion.div
              layoutId={`spot-${winner.id}`}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="rounded-full"
              style={{ boxShadow: '0 0 0 3px #fff, 0 0 80px 10px var(--theme-primary-glow)' }}
            >
              <Avatar avatarId={winner.avatar} seed={winner.id} mood="selected" size={124} />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl font-semibold tracking-tight"
            >
              {winner.name}
            </motion.span>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
