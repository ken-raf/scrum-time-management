'use client';

import { useSettingsStore } from '@/stores/settingsStore';

// Small synthesized sound effects (Web Audio). No audio files to ship,
// and every sound respects the global sound setting.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio(): { ac: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!useSettingsStore.getState().soundEnabled) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { ac: ctx, out: master! };
  } catch {
    return null;
  }
}

interface ToneOptions {
  freq: number;
  to?: number;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  delay?: number;
  attack?: number;
}

function tone({ freq, to, type = 'sine', dur = 0.12, vol = 0.12, delay = 0, attack = 0.005 }: ToneOptions) {
  const a = audio();
  if (!a) return;
  const { ac, out } = a;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

function noise({ dur = 0.25, vol = 0.12, from = 500, to = 2600, q = 1.2, delay = 0 }) {
  const a = audio();
  if (!a) return;
  const { ac, out } = a;
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  /** Wheel peg, card passing the marker, spotlight hop. `speed` in 0..1 raises the pitch. */
  tick(speed = 0.4) {
    tone({ freq: 540 + Math.min(1, speed) * 520, type: 'triangle', dur: 0.045, vol: 0.07 });
  },
  /** Cards shuffling or flying. */
  whoosh(delay = 0) {
    noise({ dur: 0.22, vol: 0.09, from: 600, to: 3200, delay });
  },
  /** Card flip / reveal swoosh. */
  flip() {
    noise({ dur: 0.18, vol: 0.1, from: 2400, to: 700, q: 0.9 });
    tone({ freq: 880, to: 1320, type: 'sine', dur: 0.16, vol: 0.05, delay: 0.08 });
  },
  /** Winner revealed. */
  reveal() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone({ freq: f, type: 'triangle', dur: 0.5, vol: 0.09, delay: i * 0.08 });
      tone({ freq: f * 2, type: 'sine', dur: 0.35, vol: 0.025, delay: i * 0.08 + 0.02 });
    });
  },
  /** Speaker starts. */
  start() {
    tone({ freq: 440, to: 660, type: 'sine', dur: 0.18, vol: 0.1 });
    tone({ freq: 660, to: 880, type: 'sine', dur: 0.22, vol: 0.09, delay: 0.14 });
  },
  /** Last quarter of the allotted time. */
  warning() {
    tone({ freq: 880, type: 'sine', dur: 0.14, vol: 0.08 });
    tone({ freq: 880, type: 'sine', dur: 0.14, vol: 0.08, delay: 0.2 });
  },
  /** One per second during the last ten seconds. */
  countdown() {
    tone({ freq: 1250, type: 'sine', dur: 0.06, vol: 0.05 });
  },
  /** Allotted time exceeded. */
  overtime() {
    tone({ freq: 330, to: 220, type: 'triangle', dur: 0.35, vol: 0.12 });
    tone({ freq: 330, to: 220, type: 'triangle', dur: 0.35, vol: 0.1, delay: 0.42 });
  },
  /** Speaker finished. */
  finish() {
    [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.45, vol: 0.08, delay: i * 0.07 }));
    noise({ dur: 0.5, vol: 0.03, from: 4000, to: 9000, delay: 0.25 });
  },
  /** Participant added. */
  pop() {
    tone({ freq: 320, to: 760, type: 'sine', dur: 0.09, vol: 0.1 });
  },
  /** Participant removed. */
  remove() {
    tone({ freq: 520, to: 200, type: 'sine', dur: 0.12, vol: 0.08 });
  },
  /** Soft UI confirmation (toggles, mode change). */
  click() {
    tone({ freq: 1100, type: 'triangle', dur: 0.03, vol: 0.04 });
  },
  /** Meeting finished. */
  fanfare() {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.6, vol: 0.08, delay: i * 0.1 }));
  },
};
