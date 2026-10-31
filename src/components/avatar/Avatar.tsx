'use client';

import { CSSProperties, useId } from 'react';
import clsx from 'clsx';
import { AvatarMood, AvatarPreset, getAvatar, hashString } from '@/lib/avatars';
import styles from './Avatar.module.css';

interface AvatarProps {
  avatarId?: string;
  /** Stable seed (participant id) used for the fallback preset and to desync animations. */
  seed?: string;
  mood?: AvatarMood;
  size?: number;
  className?: string;
  title?: string;
}

const INK = '#2a1d26';

/** Ears, tufts or mane: drawn behind the head. */
function Back({ a }: { a: AvatarPreset }) {
  switch (a.kind) {
    case 'fox':
      return (
        <g>
          <path d="M38 41 L35 15 L55 30 Z" fill={a.fur} />
          <path d="M82 41 L85 15 L65 30 Z" fill={a.fur} />
          <path d="M40 36 L38.5 21 L50 30 Z" fill={a.accent} />
          <path d="M80 36 L81.5 21 L70 30 Z" fill={a.accent} />
        </g>
      );
    case 'cat':
      return (
        <g>
          <path d="M37 43 L38 18 L55 31 Z" fill={a.fur} />
          <path d="M83 43 L82 18 L65 31 Z" fill={a.fur} />
          <path d="M40 38 L41 24 L50 32 Z" fill={a.accent} />
          <path d="M80 38 L79 24 L70 32 Z" fill={a.accent} />
        </g>
      );
    case 'panda':
      return (
        <g fill={a.furDark}>
          <circle cx="40" cy="31" r="8.5" />
          <circle cx="80" cy="31" r="8.5" />
        </g>
      );
    case 'bear':
    case 'tiger':
      return (
        <g>
          <circle cx="40" cy="31" r="8" fill={a.fur} />
          <circle cx="80" cy="31" r="8" fill={a.fur} />
          <circle cx="40" cy="31" r="4.2" fill={a.kind === 'tiger' ? a.furDark : a.accent} />
          <circle cx="80" cy="31" r="4.2" fill={a.kind === 'tiger' ? a.furDark : a.accent} />
        </g>
      );
    case 'rabbit':
      return (
        <g>
          <ellipse cx="49" cy="23" rx="6.5" ry="15" fill={a.fur} transform="rotate(-8 49 23)" />
          <ellipse cx="71" cy="23" rx="6.5" ry="15" fill={a.fur} transform="rotate(8 71 23)" />
          <ellipse cx="49" cy="24" rx="3.2" ry="11" fill={a.accent} transform="rotate(-8 49 24)" />
          <ellipse cx="71" cy="24" rx="3.2" ry="11" fill={a.accent} transform="rotate(8 71 24)" />
        </g>
      );
    case 'koala':
      return (
        <g>
          <circle cx="36" cy="36" r="11.5" fill={a.fur} />
          <circle cx="84" cy="36" r="11.5" fill={a.fur} />
          <circle cx="36.5" cy="36.5" r="6.8" fill={a.belly} />
          <circle cx="83.5" cy="36.5" r="6.8" fill={a.belly} />
        </g>
      );
    case 'owl':
      return (
        <g fill={a.furDark}>
          <path d="M38 35 L33 17 L49 28 Z" />
          <path d="M82 35 L87 17 L71 28 Z" />
        </g>
      );
    case 'raccoon':
      return (
        <g>
          <path d="M38 40 L39 21 L54 31 Z" fill={a.fur} />
          <path d="M82 40 L81 21 L66 31 Z" fill={a.fur} />
          <path d="M41 36 L41.5 26 L50 32 Z" fill={a.belly} />
          <path d="M79 36 L78.5 26 L70 32 Z" fill={a.belly} />
        </g>
      );
    case 'lemur':
      return (
        <g>
          <path d="M39 39 L36 22 L51 31 Z" fill={a.fur} />
          <path d="M81 39 L84 22 L69 31 Z" fill={a.fur} />
        </g>
      );
    case 'lion': {
      const fluff = Array.from({ length: 12 }, (_, i) => {
        const t = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={(60 + Math.cos(t) * 28).toFixed(2)} cy={(49 + Math.sin(t) * 28).toFixed(2)} r="8.5" />;
      });
      return (
        <g fill={a.furDark}>
          <circle cx="60" cy="49" r="30" />
          {fluff}
          <circle cx="43" cy="32" r="6" fill={a.fur} />
          <circle cx="77" cy="32" r="6" fill={a.fur} />
        </g>
      );
    }
    default:
      return null;
  }
}

/** Face markings drawn on the head, under the eyes. */
function Markings({ a }: { a: AvatarPreset }) {
  const eyeWhites = (fill = '#fff', r = 4) => (
    <g fill={fill}>
      <circle cx="51" cy="51" r={r} />
      <circle cx="69" cy="51" r={r} />
    </g>
  );
  switch (a.kind) {
    case 'fox':
      return <path d="M37 52 C39 66 50 73.5 60 73.5 C70 73.5 81 66 83 52 C77 58 68 59.5 60 65.5 C52 59.5 43 58 37 52 Z" fill={a.belly} />;
    case 'cat':
      return (
        <g>
          <ellipse cx="60" cy="61" rx="10.5" ry="7.5" fill={a.belly} />
          <g stroke={a.furDark} strokeWidth="2" strokeLinecap="round">
            <path d="M56 29.5 L57 35" />
            <path d="M60 28.5 L60 34.5" />
            <path d="M64 29.5 L63 35" />
          </g>
          <g stroke={INK} strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round">
            <path d="M47 60 L35 58" />
            <path d="M47 62.5 L35 64" />
            <path d="M73 60 L85 58" />
            <path d="M73 62.5 L85 64" />
          </g>
        </g>
      );
    case 'panda':
      return (
        <g>
          <ellipse cx="50.5" cy="52" rx="6.5" ry="8.5" fill={a.furDark} transform="rotate(25 50.5 52)" />
          <ellipse cx="69.5" cy="52" rx="6.5" ry="8.5" fill={a.furDark} transform="rotate(-25 69.5 52)" />
          {eyeWhites('#fff', 3.9)}
        </g>
      );
    case 'bear':
      return <ellipse cx="60" cy="61" rx="10.5" ry="8" fill={a.belly} />;
    case 'rabbit':
      return <ellipse cx="60" cy="61" rx="9" ry="6.5" fill={a.belly} />;
    case 'koala':
      return <ellipse cx="60" cy="62" rx="9" ry="6" fill={a.belly} />;
    case 'owl':
      return (
        <g fill={a.belly}>
          <circle cx="51" cy="51" r="9" />
          <circle cx="69" cy="51" r="9" />
          <ellipse cx="60" cy="63" rx="9" ry="6" />
        </g>
      );
    case 'penguin':
      return <path d="M60 37 C52 30 39 35 39 48 C39 63 49 73 60 73 C71 73 81 63 81 48 C81 35 68 30 60 37 Z" fill={a.belly} />;
    case 'tiger':
      return (
        <g>
          <circle cx="55" cy="61.5" r="6.5" fill={a.belly} />
          <circle cx="65" cy="61.5" r="6.5" fill={a.belly} />
          <g stroke={a.furDark} strokeWidth="2.4" strokeLinecap="round">
            <path d="M54 30 L57 36" />
            <path d="M60 28 L60 35" />
            <path d="M66 30 L63 36" />
            <path d="M37.5 49 L44 50.5" />
            <path d="M38 55 L44.5 55" />
            <path d="M82.5 49 L76 50.5" />
            <path d="M82 55 L75.5 55" />
          </g>
        </g>
      );
    case 'raccoon':
      return (
        <g>
          <path d="M38 51 C42 44 54 44 60 49 C66 44 78 44 82 51 C78 59 68 59 60 55 C52 59 42 59 38 51 Z" fill={a.furDark} />
          {eyeWhites('#fff', 3.9)}
          <ellipse cx="60" cy="62" rx="9.5" ry="6.5" fill={a.belly} />
        </g>
      );
    case 'lemur':
      return (
        <g>
          <ellipse cx="60" cy="54" rx="18" ry="17" fill={a.belly} />
          <path d="M44 47 L57 48.5 L52 58 Z" fill={a.furDark} />
          <path d="M76 47 L63 48.5 L68 58 Z" fill={a.furDark} />
          {eyeWhites(a.accent, 4.2)}
          <ellipse cx="60" cy="57.5" rx="4.5" ry="3.2" fill={a.furDark} />
        </g>
      );
    case 'lion':
      return (
        <g fill={a.belly}>
          <circle cx="55" cy="61.5" r="6.5" />
          <circle cx="65" cy="61.5" r="6.5" />
        </g>
      );
    default:
      return null;
  }
}

/** Nose or beak, drawn over the eyes' layer and under the mouth. */
function Nose({ a }: { a: AvatarPreset }) {
  switch (a.kind) {
    case 'cat':
    case 'rabbit':
    case 'tiger':
      return <path d="M57.2 56.6 L62.8 56.6 L60 59.6 Z" fill={a.accent} strokeLinejoin="round" stroke={a.accent} strokeWidth="1" />;
    case 'koala':
      return <ellipse cx="60" cy="55.5" rx="4.2" ry="4.8" fill={a.accent} />;
    case 'owl':
    case 'penguin':
      return <path d="M56.5 55.5 L63.5 55.5 L60 60.5 Z" fill={a.accent} strokeLinejoin="round" stroke={a.accent} strokeWidth="1" />;
    case 'lion':
      return <path d="M56.5 56 L63.5 56 L60 59.5 Z" fill={a.accent} strokeLinejoin="round" stroke={a.accent} strokeWidth="1" />;
    case 'lemur':
      return <ellipse cx="60" cy="56.3" rx="2.4" ry="1.6" fill={INK} />;
    default:
      return <ellipse cx="60" cy="57.5" rx="3.4" ry="2.4" fill={INK} />;
  }
}

export function Avatar({ avatarId, seed = '', mood = 'idle', size = 48, className, title }: AvatarProps) {
  const a = getAvatar(avatarId, seed);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const h = hashString(seed || a.id);
  const style = {
    width: size,
    height: size,
    '--av-delay': `-${(h % 4000) / 1000}s`,
  } as CSSProperties;
  const darkBody = a.kind === 'panda' || a.kind === 'penguin';
  const body = darkBody ? a.furDark : a.fur;

  return (
    <svg
      viewBox="0 0 120 120"
      className={clsx(styles.root, className)}
      data-mood={mood}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a.bg[0]} />
          <stop offset="1" stopColor={a.bg[1]} />
        </linearGradient>
        <clipPath id={`clip${uid}`}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="60" fill={`url(#bg${uid})`} />
      <circle cx="60" cy="60" r="59" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <g clipPath={`url(#clip${uid})`}>
        <svg x="-6" y="-5" width="132" height="132" viewBox="0 0 120 120" overflow="visible">
          <g className={styles.body}>
            {/* body */}
            <path d="M18 126 C18 99 36 87 60 87 C84 87 102 99 102 126 Z" fill={body} />
            <ellipse cx="60" cy="114" rx="22" ry="20" fill={a.belly} />
            <rect x="51" y="66" width="18" height="24" rx="8" fill={darkBody ? a.furDark : a.fur} />

            {/* head */}
            <g className={styles.head}>
              <rect x="16" y="8" width="88" height="88" fill="transparent" />
              <Back a={a} />
              <circle cx="60" cy="50" r="23" fill={a.fur} />
              <Markings a={a} />
              <ellipse cx="46" cy="59.5" rx="4.2" ry="2.5" fill="#ff7a8a" className={styles.blush} />
              <ellipse cx="74" cy="59.5" rx="4.2" ry="2.5" fill="#ff7a8a" className={styles.blush} />

              <g className={styles.brows} stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path className={styles.browL} d="M46.5 42.5 Q51 40.5 55 42.5" />
                <path className={styles.browR} d="M65 42.5 Q69 40.5 73.5 42.5" />
              </g>

              <g className={styles.eyesOpen}>
                <g className={styles.pupils}>
                  <ellipse className={styles.eye} cx="51" cy="51" rx="2.8" ry="3.4" fill={INK} />
                  <ellipse className={styles.eye} cx="69" cy="51" rx="2.8" ry="3.4" fill={INK} />
                  <circle className={styles.glint} cx="52.2" cy="49.8" r="0.9" fill="#fff" />
                  <circle className={styles.glint} cx="70.2" cy="49.8" r="0.9" fill="#fff" />
                </g>
              </g>
              <g className={styles.eyesHappy} stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
                <path d="M47.5 52 Q51 47.5 54.5 52" />
                <path d="M65.5 52 Q69 47.5 72.5 52" />
              </g>
              <g className={styles.eyesClosed} stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M47.5 51.5 Q51 53.5 54.5 51.5" />
                <path d="M65.5 51.5 Q69 53.5 72.5 51.5" />
              </g>

              <Nose a={a} />

              <g className={styles.mouth}>
                <path className={styles.mSmile} d="M54 62 Q60 66.5 66 62" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <ellipse className={styles.mTalk} cx="60" cy="63.5" rx="3.6" ry="3" fill={INK} />
                <g className={styles.mBig}>
                  <path d="M52 61 Q60 72.5 68 61 Z" fill={INK} />
                  <ellipse cx="60" cy="67" rx="3.2" ry="1.7" fill="#ff8fa0" />
                </g>
                <ellipse className={styles.mO} cx="60" cy="64" rx="2.8" ry="3.4" fill={INK} />
                <path className={styles.mFlat} d="M55 63.5 L65 63.5" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
                <path className={styles.mWavy} d="M53 63.5 Q56.5 61 60 63.5 Q63.5 66 67 63.5" stroke={INK} strokeWidth="2.1" strokeLinecap="round" fill="none" />
                <path className={styles.mSleep} d="M56 63.5 Q60 65 64 63.5" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>

              <path className={styles.sweat} d="M81 29 C84 34 85 37.5 81 39.5 C77 37.5 78 34 81 29 Z" fill="#8fd3ff" />
            </g>

            {/* paws (in front of the body, pivot at the shoulder) */}
            <g transform="translate(33 99)">
              <g className={styles.armL}>
                <rect x="-12" y="0" width="24" height="46" fill="transparent" />
                <line x1="0" y1="0" x2="0" y2="29" stroke={a.furDark} strokeWidth="13" strokeLinecap="round" />
                <rect x="-7" y="24" width="14" height="4" rx="1.5" fill="#dfe5ff" opacity="0.9" />
                <circle cx="0" cy="34" r="6.5" fill={a.belly} />
              </g>
            </g>
            <g transform="translate(87 99)">
              <g className={styles.armR}>
                <rect x="-12" y="0" width="24" height="46" fill="transparent" />
                <line x1="0" y1="0" x2="0" y2="29" stroke={a.furDark} strokeWidth="13" strokeLinecap="round" />
                <line className={styles.thumb} x1="0" y1="34" x2="3.2" y2="42.6" stroke={a.belly} strokeWidth="5" strokeLinecap="round" />
                <circle cx="0" cy="34" r="6.5" fill={a.belly} />
              </g>
            </g>
          </g>
        </svg>
      </g>
    </svg>
  );
}
