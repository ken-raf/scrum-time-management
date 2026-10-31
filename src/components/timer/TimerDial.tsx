'use client';

import { useId } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { formatTime } from '@/utils/time';
import { RollingTime } from './RollingTime';

const R = 122;
const C = 2 * Math.PI * R;
const TICKS = 60;

interface TimerDialProps {
  elapsed: number;
  allocated: number;
  running: boolean;
  /** Set when the turn is over: shows the green sweep and the recap. */
  finished?: { used: number; name: string } | null;
}

/**
 * Speaking-time dial: 60 graduations go dark behind a glowing head.
 * The center shows the remaining time, then the overtime on a second, red lap.
 */
export function TimerDial({ elapsed, allocated, running, finished }: TimerDialProps) {
  const t = useTranslations('timer');
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const alloc = Math.max(1, allocated);
  const over = Math.max(0, elapsed - alloc);
  const isOver = over > 0;
  const used = Math.min(1, elapsed / alloc);
  const overFrac = Math.min(1, over / alloc);
  const left = 1 - used;
  const warn = !isOver && left <= 0.25 && elapsed > 0;
  const color = finished ? 'var(--theme-success)' : isOver ? 'var(--theme-error)' : warn ? 'var(--theme-warning)' : 'var(--theme-primary)';
  const headAngle = Math.min(720, (elapsed / alloc) * 360);
  const litIndex = Math.floor((isOver ? overFrac : used) * TICKS);
  const shown = isOver ? over : Math.ceil(alloc - elapsed);
  const lastSeconds = running && !isOver && shown <= 10 && shown > 0;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <div
        className={clsx(
          'pointer-events-none absolute inset-[10%] rounded-full blur-xl transition-opacity duration-700',
          isOver && running && !finished ? 'animate-pulse opacity-100' : 'opacity-0'
        )}
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--theme-error) 45%, transparent), transparent 65%)' }}
      />
      <svg viewBox="-160 -160 320 320" className="relative h-full w-full overflow-visible" aria-hidden>
        <defs>
          <filter id={`glow${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <circle r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="3" />

        {/* remaining arc (glow + line) */}
        {[true, false].map((glow) => (
          <circle
            key={`m${glow}`}
            r={R}
            fill="none"
            transform="rotate(-90)"
            strokeLinecap="round"
            strokeWidth={glow ? 9 : 3}
            filter={glow ? `url(#glow${uid})` : undefined}
            opacity={glow ? 0.7 : 1}
            style={{
              stroke: color,
              strokeDasharray: `${C} ${C}`,
              strokeDashoffset: finished ? 0 : -C * used,
              transition: 'stroke-dashoffset 1s linear, stroke .6s ease',
              opacity: !finished && isOver ? 0 : undefined,
            }}
          />
        ))}
        {/* overtime arc */}
        {[true, false].map((glow) => (
          <circle
            key={`o${glow}`}
            r={R}
            fill="none"
            transform="rotate(-90)"
            strokeLinecap="round"
            strokeWidth={glow ? 9 : 3}
            filter={glow ? `url(#glow${uid})` : undefined}
            style={{
              stroke: 'var(--theme-error)',
              strokeDasharray: `${C} ${C}`,
              strokeDashoffset: C * (1 - overFrac),
              transition: 'stroke-dashoffset 1s linear, opacity .3s',
              opacity: isOver && !finished ? (glow ? 0.7 : 1) : 0,
            }}
          />
        ))}

        {/* graduations */}
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const major = i % 5 === 0;
          const r1 = major ? 132 : 135;
          const r2 = major ? 146 : 143;
          const lit = finished ? true : isOver ? i < litIndex : i >= litIndex;
          return (
            <line
              key={i}
              x1={r1 * Math.sin(a)}
              y1={-r1 * Math.cos(a)}
              x2={r2 * Math.sin(a)}
              y2={-r2 * Math.cos(a)}
              strokeWidth={major ? 2.6 : 1.6}
              strokeLinecap="round"
              style={{
                stroke: lit ? color : '#ffffff',
                strokeOpacity: lit ? (major ? 1 : 0.75) : 0.1,
                transition: `stroke .45s ease ${finished ? i * 9 : 0}ms, stroke-opacity .45s ease ${finished ? i * 9 : 0}ms`,
              }}
            />
          );
        })}

        {/* glowing head */}
        {!finished && (
          <g style={{ transform: `rotate(${headAngle}deg)`, transition: running ? 'transform 1s linear' : 'transform .4s ease' }}>
            <circle cx="0" cy={-R} r="13" filter={`url(#glow${uid})`} style={{ fill: color, transition: 'fill .6s ease' }} />
            <circle cx="0" cy={-R} r="4.5" fill="#fff" />
          </g>
        )}
      </svg>

      <AnimatePresence mode="wait">
        {finished ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 grid place-content-center justify-items-center gap-1.5 text-center"
          >
            <svg viewBox="0 0 24 24" className="h-14 w-14" aria-hidden>
              <motion.path
                d="M5 12.5 L10 17.5 L19.5 7"
                fill="none"
                stroke="var(--theme-success)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <span className="text-xl font-semibold tracking-tight">{t('thanks', { name: finished.name })}</span>
            <span className="font-mono text-sm text-foreground-muted tabular">
              {t('usedOf', { used: formatTime(finished.used), allocated: formatTime(alloc) })}
              {finished.used > alloc && <span className="text-error"> · +{formatTime(finished.used - alloc)}</span>}
            </span>
          </motion.div>
        ) : (
          <motion.div key="live" exit={{ opacity: 0, scale: 0.92 }} className="absolute inset-0 grid place-content-center justify-items-center gap-1 text-center">
            <span className={clsx('eyebrow', isOver && '!text-error')}>{isOver ? t('overtimeLabel') : t('timeRemaining')}</span>
            <motion.span
              key={lastSeconds ? shown : 'steady'}
              initial={lastSeconds ? { scale: 1.08 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <RollingTime
                seconds={shown}
                sign={isOver}
                className={clsx(
                  'text-[clamp(2.8rem,10vw,4.2rem)] font-medium leading-none tracking-tight transition-colors duration-500',
                  isOver ? 'text-error' : warn ? 'text-warning' : 'text-foreground'
                )}
              />
            </motion.span>
            <span className="text-sm text-foreground-muted tabular">{t('ofAllocated', { allocated: formatTime(alloc) })}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
