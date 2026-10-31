'use client';

import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Number that counts up/down to its new value. */
export function AnimatedNumber({ value, format, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const fmt = useRef(format ?? ((n: number) => String(Math.round(n))));
  fmt.current = format ?? ((n: number) => String(Math.round(n)));
  const reduced = useReducedMotion();

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (reduced || from === value) {
      if (ref.current) ref.current.textContent = fmt.current(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt.current(v);
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span ref={ref} className={className}>
      {fmt.current(value)}
    </span>
  );
}
