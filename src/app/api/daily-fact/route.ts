import { NextRequest, NextResponse } from 'next/server';
import { DailyFact, DailyFactResponse, FactLang, parseOnThisDay, RawEvent } from '@/lib/dailyFact';

// Wikimedia asks API clients to identify themselves.
const USER_AGENT = 'DailyScrumTimeManagement/1.0 (https://github.com/ken-raf/scrum-time-management)';
const LANGS: FactLang[] = ['fr', 'en'];
const HALF_DAY = 60 * 60 * 12;

type Kind = 'selected' | 'events';

/** Wikipédia's own REST endpoint first, the Wikimedia API gateway as a backup. */
async function fetchFeed(lang: FactLang, kind: Kind, mm: string, dd: string): Promise<RawEvent[] | null> {
  const urls = [
    `https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${mm}/${dd}`,
    `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/${kind}/${mm}/${dd}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        next: { revalidate: HALF_DAY },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as Partial<Record<Kind, RawEvent[]>>;
      if (Array.isArray(body[kind])) return body[kind]!;
    } catch {
      // Network error or timeout: try the next endpoint
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lang = (LANGS as string[]).includes(params.get('lang') ?? '') ? (params.get('lang') as FactLang) : 'fr';
  const now = new Date();
  let month = Number(params.get('month'));
  let day = Number(params.get('day'));
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    month = now.getUTCMonth() + 1;
    day = now.getUTCDate();
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const currentYear = now.getUTCFullYear();

  // "selected" is the hand-picked list shown on Wikipédia's home page; the full
  // "events" list only tops it up on the rare days it is too short.
  let facts: DailyFact[] = parseOnThisDay((await fetchFeed(lang, 'selected', mm, dd)) ?? [], currentYear);
  if (facts.length < 4) {
    const extra = parseOnThisDay((await fetchFeed(lang, 'events', mm, dd)) ?? [], currentYear);
    const seen = new Set(facts.map((f) => f.text));
    facts = [...facts, ...extra.filter((f) => !seen.has(f.text))].slice(0, 12);
  }

  if (facts.length === 0) {
    return NextResponse.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }

  const body: DailyFactResponse = { lang, month, day, facts };
  return NextResponse.json(body, {
    headers: { 'Cache-Control': `public, max-age=3600, s-maxage=${HALF_DAY}, stale-while-revalidate=86400` },
  });
}
