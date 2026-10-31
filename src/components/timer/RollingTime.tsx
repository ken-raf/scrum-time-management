'use client';

import clsx from 'clsx';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Slot({ digit }: { digit: number }) {
  return (
    <span className="inline-block h-[1em] overflow-hidden">
      <span
        className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ transform: `translateY(${-digit}em)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] text-center leading-[1em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/** m:ss with digits that roll like an odometer. */
export function RollingTime({ seconds, sign, className }: { seconds: number; sign?: boolean; className?: string }) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.min(99, Math.floor(s / 60));
  const sec = s % 60;
  return (
    <span className={clsx('inline-flex items-center font-mono tabular', className)} aria-label={`${sign ? '+' : ''}${m}:${String(sec).padStart(2, '0')}`}>
      <span
        className="inline-block overflow-hidden transition-[width,opacity] duration-300"
        style={{ width: sign ? '0.62em' : 0, opacity: sign ? 1 : 0 }}
        aria-hidden
      >
        +
      </span>
      <span aria-hidden className="inline-flex">
        {m >= 10 && <Slot digit={Math.floor(m / 10)} />}
        <Slot digit={m % 10} />
        <span className="-translate-y-[0.05em] px-[0.02em] opacity-60">:</span>
        <Slot digit={Math.floor(sec / 10)} />
        <Slot digit={sec % 10} />
      </span>
    </span>
  );
}
