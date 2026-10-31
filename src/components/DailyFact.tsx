'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Check, Lightbulb, RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '@/components/avatar/Avatar';
import { DailyFact as Fact, DailyFactResponse, FactLang, questionParts, yearChoices } from '@/lib/dailyFact';
import { sfx } from '@/lib/sound';
import type { Participant } from '@/types';

// One request per language and day, shared by the prefetch and the card.
const cache = new Map<string, Promise<DailyFactResponse>>();

function factLang(locale: string): FactLang {
  return locale === 'en' ? 'en' : 'fr';
}

export function loadDailyFact(locale: string): Promise<DailyFactResponse> {
  const lang = factLang(locale);
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const key = `${lang}-${month}-${day}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/daily-fact?lang=${lang}&month=${month}&day=${day}`).then((res) => {
      if (!res.ok) throw new Error(`daily-fact ${res.status}`);
      return res.json() as Promise<DailyFactResponse>;
    });
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

type Stage = 'ask' | 'judge' | 'learn';

interface DailyFactProps {
  participants: Participant[];
  /** Shown instead when no fact can be loaded (offline, Wikipédia down). */
  fallback: ReactNode;
}

/** "Le saviez-vous ?": once everyone has spoken, guess the year of an event that happened on this day. */
export function DailyFact({ participants, fallback }: DailyFactProps) {
  const t = useTranslations('dailyFact');
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [data, setData] = useState<DailyFactResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>('ask');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    loadDailyFact(locale)
      .then((res) => {
        if (!alive) return;
        const idx = res.facts.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        setOrder(idx);
        setIndex(0);
        setData(res);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [locale]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const fact: Fact | undefined = data ? data.facts[order[index] ?? 0] : undefined;
  const currentYear = new Date().getFullYear();
  const choices = useMemo(() => (fact ? yearChoices(fact.year, currentYear) : []), [fact, currentYear]);
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date()),
    [locale]
  );

  if (failed) return <>{fallback}</>;

  const answer = (year: number) => {
    if (!fact || stage !== 'ask') return;
    setChoice(year);
    setStage('judge');
    if (year === fact.year) sfx.correct();
    else sfx.miss();
    timer.current = setTimeout(() => setStage('learn'), reduced ? 350 : 1100);
  };

  const another = () => {
    if (!data || data.facts.length < 2) return;
    if (timer.current) clearTimeout(timer.current);
    sfx.click();
    setIndex((i) => (i + 1) % data.facts.length);
    setChoice(null);
    setStage('ask');
  };

  const revealed = stage !== 'ask';
  const right = choice === fact?.year;
  const q = fact && data ? questionParts(fact.text, data.lang) : null;

  return (
    // Phones: the card sets the stage height. Desktop: it fills the stage and scrolls inside if ever needed.
    <div className="relative lg:absolute lg:inset-0 lg:overflow-y-auto">
      <div className="flex min-h-[360px] flex-col justify-center gap-3 px-4 py-5 sm:px-7 lg:min-h-full">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {participants.slice(0, 6).map((p) => (
              <Avatar key={p.id} avatarId={p.avatar} seed={p.id} mood="celebrate" size={34} className="rounded-full ring-2 ring-[var(--theme-background)]" />
            ))}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-semibold tracking-tight">{t('allSpoken')}</p>
            <p className="text-sm text-foreground-muted">{t('intro')}</p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[22px] border border-border p-4 sm:p-5"
          style={{ background: 'color-mix(in srgb, var(--theme-surface) 84%, transparent)' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, var(--theme-primary), var(--theme-accent-2), transparent)' }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow flex min-w-0 items-center gap-2 !text-primary">
              <Lightbulb size={14} className="flex-none" />
              <span className="truncate">
                {t('eyebrow')} · {dateLabel}
              </span>
            </span>
            {data && data.facts.length > 1 && (
              <button
                type="button"
                onClick={another}
                className="btn btn-ghost flex-none !px-2.5 !py-1.5 !text-xs"
                title={t('another')}
                aria-label={t('another')}
              >
                <RefreshCw size={13} />
                <span className="hidden sm:inline">{t('another')}</span>
              </button>
            )}
          </div>

          {!fact || !q ? (
            <FactSkeleton label={t('loading')} />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mt-3 text-base font-medium leading-snug text-balance sm:text-[1.05rem]">
                  {q.before}{' '}
                  <YearSlot year={fact.year} revealed={revealed} right={right} hiddenLabel={t('hidden')} />
                  {q.after}
                </p>

                <AnimatePresence mode="wait" initial={false}>
                  {stage !== 'learn' ? (
                    <motion.div key="ask" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                      <p className="eyebrow mt-4">{t('question')}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {choices.map((y) => {
                          const isAnswer = y === fact.year;
                          const isChoice = y === choice;
                          return (
                            <motion.button
                              key={y}
                              type="button"
                              disabled={revealed}
                              onClick={() => answer(y)}
                              whileHover={revealed ? undefined : { y: -2 }}
                              whileTap={revealed ? undefined : { scale: 0.96 }}
                              animate={
                                revealed && isChoice && !isAnswer && !reduced
                                  ? { x: [0, -7, 7, -4, 4, 0] }
                                  : revealed && isAnswer && !reduced
                                    ? { scale: [1, 1.06, 1] }
                                    : { x: 0, scale: 1 }
                              }
                              transition={{ duration: 0.45 }}
                              className={clsx(
                                'rounded-xl border py-2.5 font-mono text-lg tabular transition-colors sm:py-3 sm:text-xl',
                                !revealed && 'cursor-pointer border-border bg-[var(--theme-surface-raised)] hover:border-primary',
                                revealed && isAnswer && 'border-success bg-success/15 text-success',
                                revealed && isChoice && !isAnswer && 'border-error bg-error/15 text-error',
                                revealed && !isAnswer && !isChoice && 'border-border opacity-40'
                              )}
                            >
                              {y}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="learn"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className={clsx('mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium', right ? 'text-success' : 'text-error')}>
                        <span className={clsx('grid h-5 w-5 place-items-center rounded-full', right ? 'bg-success/20' : 'bg-error/20')}>
                          {right ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                        </span>
                        {right ? t('correct') : t('wrong', { year: fact.year })}
                        <span className="font-normal text-foreground-muted">· {t('ago', { count: currentYear - fact.year })}</span>
                      </p>
                      {fact.page && <PageCard fact={fact} readMore={t('readMore')} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

          <p className="mt-3 text-[11px] text-foreground-muted">{t('source')}</p>
        </div>
      </div>
    </div>
  );
}

/** The hidden year in the sentence: a dashed slot that pops into the answer. */
function YearSlot({ year, revealed, right, hiddenLabel }: { year: number; revealed: boolean; right: boolean; hiddenLabel: string }) {
  return (
    <span className="relative inline-grid align-baseline">
      <AnimatePresence mode="popLayout" initial={false}>
        {revealed ? (
          <motion.span
            key="year"
            initial={{ opacity: 0, y: 10, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={clsx('rounded-md px-1.5 font-mono tabular', right ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary')}
          >
            {year}
          </motion.span>
        ) : (
          <motion.span
            key="slot"
            exit={{ opacity: 0, y: -8 }}
            aria-label={hiddenLabel}
            className="rounded-md border border-dashed border-primary/60 px-1.5 font-mono tracking-[0.2em] text-primary/70"
          >
            ····
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function PageCard({ fact, readMore }: { fact: Fact; readMore: string }) {
  const page = fact.page!;
  return (
    <div className="mt-3 flex gap-3">
      {page.thumbnail ? (
        // Wikimedia thumbnails: plain <img>, no image optimisation needed for one 72px picture.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.thumbnail.src}
          alt=""
          width={72}
          height={72}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-16 w-16 flex-none rounded-xl border border-border object-cover sm:h-[72px] sm:w-[72px]"
        />
      ) : (
        <span className="grid h-16 w-16 flex-none place-items-center rounded-xl border border-border bg-primary/10 text-primary sm:h-[72px] sm:w-[72px]">
          <Lightbulb size={22} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold tracking-tight">{page.title}</p>
        {page.extract && <p className="mt-0.5 line-clamp-3 text-sm leading-snug text-foreground-secondary">{page.extract}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <a href={page.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {readMore}
            <ArrowUpRight size={13} />
          </a>
          {fact.links.slice(0, 2).map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[12rem] truncate text-foreground-muted hover:text-foreground hover:underline"
            >
              {l.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function FactSkeleton({ label }: { label: string }) {
  return (
    <div className="mt-3 animate-pulse" aria-busy="true" aria-label={label}>
      <div className="h-4 w-11/12 rounded bg-white/10" />
      <div className="mt-2 h-4 w-3/4 rounded bg-white/10" />
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
