'use client';

import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  twinkle: number;
}

/** Burst of glowing sparks over its parent each time `burst` changes (0 = nothing). */
export function Sparkles({ burst, color }: { burst: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!burst) return;
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const palette = [
      color || css.getPropertyValue('--theme-primary').trim() || '#7d8cff',
      css.getPropertyValue('--theme-accent-2').trim() || '#b38bff',
      '#ffffff',
      '#f6d27a',
    ];
    const sparks: Spark[] = Array.from({ length: 110 }, (_, k) => {
      const a = Math.random() * Math.PI * 2;
      const v = 1.5 + Math.random() * 6.5;
      return {
        x: rect.width / 2,
        y: rect.height / 2,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 1.5,
        size: 0.8 + Math.random() * 2.4,
        color: palette[k % palette.length],
        life: 1,
        twinkle: Math.random() * 6,
      };
    });
    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      let alive = 0;
      for (const s of sparks) {
        if (s.life <= 0) continue;
        alive++;
        s.vx *= 0.965;
        s.vy = s.vy * 0.965 + 0.06;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.009;
        s.twinkle += 0.3;
        ctx.globalAlpha = Math.max(0, s.life) * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (alive) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, rect.width, rect.height);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [burst, color]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-30 h-full w-full" />;
}
