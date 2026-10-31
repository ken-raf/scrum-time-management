'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useReducedMotion } from 'framer-motion';
import { Avatar } from '@/components/avatar/Avatar';
import { sfx } from '@/lib/sound';
import { formatTime } from '@/utils/time';
import type { Participant } from '@/types';
import { PickerProps, shuffledSequence } from './pickerTypes';

const VIS = 6;

/** Card reel: a coverflow strip that races past a marker and settles on the winner. */
export function ReelPicker({ participants, target, spinId, winnerId, onSettled }: PickerProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offset = useRef(8);
  const lastSpin = useRef(spinId);
  const pending = useRef<{ targetIdx: number } | null>(null);
  const [reel, setReel] = useState<Participant[]>(() => shuffledSequence(participants, 30));
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const reelRef = useRef(reel);
  reelRef.current = reel;
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  const dims = () => {
    const w = rootRef.current?.clientWidth ?? 600;
    const small = w < 520;
    return { w, cw: small ? 124 : 152, ch: small ? 172 : 208, gap: small ? 14 : 20 };
  };

  const layout = (vel: number) => {
    const { w, cw, ch, gap } = dims();
    const step = cw + gap;
    const cx = w / 2;
    const off = offset.current;
    cardRefs.current.forEach((el, idx) => {
      if (!el) return;
      const d = idx - off;
      const ad = Math.abs(d);
      if (ad > VIS + 0.5) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      el.style.width = `${cw}px`;
      el.style.height = `${ch}px`;
      el.style.marginTop = `${-ch / 2}px`;
      const x = cx + d * step - cw / 2;
      const scale = Math.max(0.7, 1.12 - ad * 0.15);
      const ry = Math.max(-55, Math.min(55, -d * 24));
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,0) perspective(900px) rotateY(${ry.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = Math.max(0, 1 - Math.max(0, ad - 1.3) * 0.32).toFixed(3);
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.dataset.center = ad < 0.5 ? 'true' : 'false';
    });
    if (stripRef.current) stripRef.current.style.filter = vel > 0.04 ? `blur(${Math.min(5, vel * 8).toFixed(2)}px)` : '';
  };

  // Participants changed (someone spoke): rebuild a fresh reel.
  const idsKey = participants.map((p) => p.id).join('|');
  const firstIds = useRef(idsKey);
  useEffect(() => {
    if (firstIds.current === idsKey) return;
    firstIds.current = idsKey;
    offset.current = 8;
    setWinIdx(null);
    setReel(participants.length ? shuffledSequence(participants, 30) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // A new spin: keep the visible window, append fresh cards, plant the target far ahead.
  useEffect(() => {
    if (spinId === lastSpin.current) return;
    lastSpin.current = spinId;
    if (!target || !participants.length) return;
    setWinIdx(null);
    const cur = Math.round(offset.current);
    const keepFrom = Math.max(0, cur - VIS - 1);
    const kept = reelRef.current.slice(keepFrom, cur + VIS + 2);
    offset.current -= keepFrom;
    const next = kept.concat(shuffledSequence(participants, 52, kept[kept.length - 1]));
    const targetIdx = Math.round(offset.current) + 38 + Math.floor(Math.random() * 4);
    next[targetIdx] = target;
    const other = participants.find((p) => p.id !== target.id);
    if (other) {
      if (next[targetIdx - 1]?.id === target.id) next[targetIdx - 1] = other;
      if (next[targetIdx + 1]?.id === target.id) next[targetIdx + 1] = other;
    }
    pending.current = { targetIdx };
    setReel(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  useLayoutEffect(() => {
    layout(0);
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    const start = offset.current;
    const D = job.targetIdx - start;
    const OV = 0.34;
    const dur = reduced ? 700 : 5600;
    const t0 = performance.now();
    let prev = start;
    let last = Math.round(start);
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      if (t < 0.85) {
        const u = t / 0.85;
        offset.current = start + (D + OV) * (1 - Math.pow(1 - u, 5));
      } else {
        const u = (t - 0.85) / 0.15;
        offset.current = start + D + OV * (0.5 + 0.5 * Math.cos(Math.PI * u));
      }
      const vel = Math.abs(offset.current - prev);
      prev = offset.current;
      const c = Math.round(offset.current);
      if (c !== last) {
        last = c;
        sfx.tick(Math.min(1, vel * 1.4));
      }
      layout(vel);
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        offset.current = job.targetIdx;
        layout(0);
        setWinIdx(job.targetIdx);
        settledRef.current();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel]);

  useEffect(() => {
    const onResize = () => layout(0);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showWinner = winIdx !== null && winnerId !== null;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      style={{
        maskImage: 'linear-gradient(90deg, transparent 0, #000 15%, #000 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 15%, #000 85%, transparent 100%)',
      }}
    >
      <div ref={stripRef} className="absolute inset-0">
        {reel.map((p, idx) => {
          const isWin = showWinner && idx === winIdx;
          return (
            <div
              key={`${idx}-${p.id}`}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="absolute left-0 top-1/2 will-change-transform"
              style={{ display: 'none' }}
            >
              <div
                className={clsx(
                  'absolute inset-0 grid content-center justify-items-center gap-2.5 rounded-[20px] border px-3 text-center',
                  'transition-[transform,box-shadow,border-color,opacity] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]',
                  isWin ? '-translate-y-2.5 scale-[1.08] border-primary' : 'border-border-hover',
                  showWinner && !isWin && 'opacity-30'
                )}
                style={{
                  background: 'linear-gradient(165deg, var(--theme-surface-raised) 0%, var(--theme-surface) 100%)',
                  boxShadow: isWin
                    ? '0 0 0 1px var(--theme-primary), 0 0 70px -8px var(--theme-primary-glow), 0 30px 50px -24px rgba(0,0,0,.9)'
                    : '0 24px 40px -22px rgba(0,0,0,.9)',
                }}
              >
                <Avatar avatarId={p.avatar} seed={p.id} mood={isWin ? 'selected' : 'idle'} size={72} />
                <span className="max-w-full truncate text-[1.02rem] font-semibold tracking-tight">{p.name}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-xs text-foreground-muted tabular">
                  {formatTime(p.allocatedTime)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* marker */}
      <div className={clsx('pointer-events-none absolute inset-y-0 left-1/2 z-[200] w-0 transition-opacity duration-300', showWinner && 'opacity-0')}>
        <span className="absolute left-1/2 top-3 h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[12px] border-x-transparent border-t-primary drop-shadow-[0_0_8px_var(--theme-primary-glow)]" />
        <span className="absolute bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[12px] border-x-transparent border-b-primary drop-shadow-[0_0_8px_var(--theme-primary-glow)]" />
      </div>
    </div>
  );
}
