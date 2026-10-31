'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { participantColor } from '@/lib/avatars';
import { sfx } from '@/lib/sound';
import { Avatar } from '@/components/avatar/Avatar';
import type { Participant } from '@/types';
import { easeInOutCubic, PickerProps } from './pickerTypes';

const R = 150;

type Item = { p: Participant; w: number };

function pt(angle: number, r: number): [number, number] {
  const t = (angle * Math.PI) / 180;
  return [r * Math.sin(t), -r * Math.cos(t)];
}

function arcPath(s: number, e: number) {
  if (e - s >= 359.9) return `M0 ${-R} A${R} ${R} 0 1 1 0 ${R} A${R} ${R} 0 1 1 0 ${-R}Z`;
  const [x1, y1] = pt(s, R);
  const [x2, y2] = pt(e, R);
  return `M0 0 L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${e - s > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`;
}

function anglesOf(items: Item[]) {
  const total = items.reduce((s, it) => s + it.w, 0) || 1;
  let a = 0;
  return items.map((it) => {
    const s = a;
    a += (it.w / total) * 360;
    return [s, a] as const;
  });
}

/** Classic wheel: palette-colored segments, a pointer that flicks on every peg, winner pops out. */
export function WheelPicker({ participants, target, spinId, winnerId, onSettled }: PickerProps) {
  const reduced = useReducedMotion();
  const rotorRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<SVGGElement>(null);
  const rot = useRef(0);
  const kick = useRef(0);
  const lastSpin = useRef(spinId);
  const [items, setItems] = useState<Item[]>(() => participants.map((p) => ({ p, w: 1 })));
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Reflow: someone who spoke leaves the wheel, the other segments widen.
  const idsKey = participants.map((p) => p.id).join('|');
  useEffect(() => {
    const cur = itemsRef.current;
    const ids = new Set(participants.map((p) => p.id));
    const merged = cur.map((it) => ({
      p: participants.find((p) => p.id === it.p.id) ?? it.p,
      from: it.w,
      to: ids.has(it.p.id) ? 1 : 0,
    }));
    participants.forEach((p) => {
      if (!cur.some((it) => it.p.id === p.id)) merged.push({ p, from: 0, to: 1 });
    });
    if (merged.every((m) => m.from === m.to)) {
      setItems(merged.map((m) => ({ p: m.p, w: m.to })));
      return;
    }
    const t0 = performance.now();
    const dur = reduced ? 1 : 650;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = easeInOutCubic(t);
      if (t < 1) {
        setItems(merged.map((m) => ({ p: m.p, w: m.from + (m.to - m.from) * e })));
        raf = requestAnimationFrame(step);
      } else {
        setItems(merged.filter((m) => m.to > 0).map((m) => ({ p: m.p, w: 1 })));
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const apply = () => {
    rotorRef.current?.setAttribute('transform', `rotate(${rot.current.toFixed(3)})`);
    pointerRef.current?.setAttribute('transform', `translate(0 -172) rotate(${kick.current.toFixed(2)})`);
  };

  useEffect(() => {
    if (spinId === lastSpin.current) return;
    lastSpin.current = spinId;
    if (!target) return;
    const list = itemsRef.current;
    const idx = list.findIndex((it) => it.p.id === target.id);
    if (idx < 0) return;
    const A = anglesOf(list);
    const [s, e] = A[idx];
    const center = (s + e) / 2 + (Math.random() - 0.5) * (e - s) * 0.6;
    const delta = (((-center - rot.current) % 360) + 360) % 360;
    const start = rot.current;
    const end = start + (reduced ? 1 : 6) * 360 + delta;
    const dur = reduced ? 900 : 5200;
    const t0 = performance.now();
    const indexAt = (r: number) => {
      const a = (((-r) % 360) + 360) % 360;
      return A.findIndex(([as, ae]) => a >= as && a < ae);
    };
    let last = indexAt(start);
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      const prev = rot.current;
      rot.current = start + (end - start) * eased;
      const speed = rot.current - prev;
      const i = indexAt(rot.current);
      if (i !== last) {
        last = i;
        kick.current = Math.max(-32, -12 - speed * 1.3);
        sfx.tick(Math.min(1, speed / 18));
      }
      kick.current *= 0.84;
      apply();
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        const tail = () => {
          kick.current *= 0.8;
          apply();
          if (Math.abs(kick.current) > 0.05) raf = requestAnimationFrame(tail);
        };
        tail();
        onSettled();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  useEffect(apply);

  const A = anglesOf(items);
  const visible = items.filter((it) => it.w > 0.5).length;
  const fontSize = visible > 9 ? 12 : visible > 6 ? 14 : 16;
  const winner = items.find((it) => it.p.id === winnerId)?.p;

  return (
    <div className="relative mx-auto aspect-square h-full max-h-full max-w-full">
      <div
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--theme-primary-glow) 0%, transparent 68%)', opacity: 0.35 }}
      />
      <svg viewBox="-180 -190 360 370" className="relative h-full w-full overflow-visible" role="img" aria-label="Roue">
        <defs>
          <radialGradient id="wheel-shine" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </radialGradient>
        </defs>
        <circle r="160" fill="var(--theme-surface)" stroke="var(--theme-border-hover)" strokeWidth="1.5" />
        <g ref={rotorRef}>
          {items.map((it, i) => {
            const [s, e] = A[i];
            if (e - s < 0.05) return null;
            const c = (s + e) / 2;
            const [c1] = participantColor(it.p);
            const isWin = winnerId === it.p.id;
            const [ox, oy] = pt(c, isWin ? 12 : 0);
            const flip = c > 180;
            const label = it.p.name.length > 10 ? it.p.name.slice(0, 9) + '…' : it.p.name;
            return (
              <g
                key={it.p.id}
                style={{
                  transform: `translate(${ox}px, ${oy}px)`,
                  opacity: winnerId && !isWin ? 0.28 : 1,
                  transition: 'transform .55s cubic-bezier(.34,1.56,.64,1), opacity .45s ease',
                }}
              >
                <path d={arcPath(s, e)} fill={c1} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                {e - s > 12 && (
                  <text
                    transform={`rotate(${(c - 90).toFixed(2)}) translate(${R * 0.6} 0)${flip ? ' rotate(180)' : ''}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontSize}
                    fontWeight={650}
                    fill="#fff"
                    style={{ fontFamily: 'var(--font-sans)', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          <circle r={R} fill="url(#wheel-shine)" pointerEvents="none" />
          {visible > 1 &&
            A.map(([s], i) => {
              if (items[i].w < 0.02) return null;
              const [x, y] = pt(s, R - 5);
              return <circle key={`peg-${items[i].p.id}`} cx={x} cy={y} r="3.4" fill="var(--theme-surface)" stroke="rgba(0,0,0,.2)" strokeWidth="0.8" />;
            })}
        </g>
        <g ref={pointerRef} transform="translate(0 -172)">
          <path d="M-13 -2 L13 -2 L0 27 Z" fill="var(--theme-foreground)" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }} />
          <circle cy="-2" r="7.5" fill="var(--theme-foreground)" />
          <circle cy="-2" r="3" fill="var(--theme-primary)" />
        </g>
      </svg>
      {/* hub */}
      <div className="pointer-events-none absolute left-1/2 top-[51.5%] grid h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border-hover bg-surface shadow-[0_8px_30px_-8px_rgba(0,0,0,.8)]">
        <AnimatePresence mode="wait">
          {winner ? (
            <motion.div
              key={winner.id}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="h-[86%] w-[86%]"
            >
              <Avatar avatarId={winner.avatar} seed={winner.id} mood="selected" size={200} className="!h-full !w-full" />
            </motion.div>
          ) : (
            <motion.span
              key={`n-${visible}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono text-xl font-semibold tabular text-foreground"
            >
              {visible}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
