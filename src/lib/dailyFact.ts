/**
 * "Le saviez-vous ?" — a historical event that happened on today's date, from
 * Wikipédia's "On this day" feed, turned into a guess-the-year question.
 * Pure helpers shared by the API route (parsing) and the card (quiz).
 */

export type FactLang = 'fr' | 'en';

export interface FactPage {
  title: string;
  description?: string;
  extract?: string;
  thumbnail?: { src: string; width: number; height: number };
  url: string;
}

export interface DailyFact {
  id: string;
  year: number;
  /** The event, first letter as Wikipédia wrote it, picture hints removed. */
  text: string;
  /** The article that best explains the event. */
  page?: FactPage;
  /** Other linked articles, for curious readers. */
  links: { title: string; url: string }[];
}

export interface DailyFactResponse {
  lang: FactLang;
  month: number;
  day: number;
  facts: DailyFact[];
}

/** Raw shapes of the Wikimedia feed (only the fields we read). */
interface RawPage {
  type?: string;
  titles?: { normalized?: string };
  normalizedtitle?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source?: string; width?: number; height?: number };
  content_urls?: { desktop?: { page?: string } };
}
export interface RawEvent {
  text?: string;
  year?: number;
  pages?: RawPage[];
}

// "(photo)", "(portrait)", "(pictured)"… point at the illustrated article.
const PICTURE_HINT = /\s*\((?:photo|portrait|illustration|image|ci-contre|tableau|gravure|pictured|shown)\)/i;
const LIST_PAGE = /^(?:liste|list of)\b/i;
const PLACE = /^(?:pays|country|nation|état|state|ville|city|town|capitale|capital|commune|région|region|province|île|island|continent|village|quartier|borough|county|comté|département|territoire|territory|consolidated town|(?:southern|northern|eastern|western) part)(?:\s|,|$)/iu;
const STOP_WORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'en', 'et', 'au', 'aux', 'à', 'un', 'une', 'pour', 'par', 'sur', 'dans',
  'the', 'of', 'and', 'in', 'on', 'for', 'to', 'at', 'by', 'a', 'an',
]);

const MAX_EXTRACT = 420;

function titleOf(p: RawPage) {
  return p.titles?.normalized ?? p.normalizedtitle ?? '';
}

/** "Fayçal II" from "Fayçal II", "Eudes" from "Eudes (roi des Francs)". */
function baseTitle(title: string) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function words(s: string) {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
  return `${cut.slice(0, end > max * 0.6 ? end + (cut[end] === '.' ? 1 : 0) : max).trimEnd()}…`;
}

/**
 * Picks the article that best explains the event: the one a picture hint points
 * at, else the earliest article named in the sentence, else the closest match by
 * words. Lists, places and year pages are only a last resort.
 */
export function pickMainPage(rawText: string, pages: RawPage[]): RawPage | undefined {
  const usable = pages.filter((p) => p.type !== 'disambiguation' && titleOf(p) && !LIST_PAGE.test(titleOf(p)) && !/^\d+$/.test(titleOf(p)));
  if (usable.length === 0) return pages[0];
  const lower = rawText.toLowerCase();
  const isPlace = (p: RawPage) => PLACE.test(p.description ?? '');

  const hint = rawText.search(PICTURE_HINT);
  if (hint >= 0) {
    let best: RawPage | undefined;
    let bestAt = -1;
    for (const p of usable) {
      const at = lower.lastIndexOf(baseTitle(titleOf(p)).toLowerCase(), hint);
      if (at > bestAt) {
        best = p;
        bestAt = at;
      }
    }
    if (best) return best;
  }

  const named = usable
    .filter((p) => !isPlace(p))
    .map((p) => ({ p, at: lower.indexOf(baseTitle(titleOf(p)).toLowerCase()) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (named.length) return named[0].p;

  const textWords = new Set(words(rawText));
  let best = usable[0];
  let bestScore = -Infinity;
  for (const p of usable) {
    const w = words(baseTitle(titleOf(p)));
    const ratio = w.length ? w.filter((x) => textWords.has(x)).length / w.length : 0;
    const score = ratio * 2 + (p.thumbnail ? 0.3 : 0) - (isPlace(p) ? 3 : 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

function toPage(p: RawPage): FactPage | undefined {
  const url = p.content_urls?.desktop?.page;
  const title = titleOf(p);
  if (!url || !title) return undefined;
  const t = p.thumbnail;
  return {
    title,
    description: p.description || undefined,
    extract: p.extract ? clip(p.extract.replace(/\s+/g, ' ').trim(), MAX_EXTRACT) : undefined,
    thumbnail: t?.source && t.width && t.height ? { src: t.source, width: t.width, height: t.height } : undefined,
    url,
  };
}

/** Turns feed events into quiz-ready facts. Events that give the year away are skipped. */
export function parseOnThisDay(events: RawEvent[], currentYear: number): DailyFact[] {
  const facts: DailyFact[] = [];
  for (const ev of events) {
    const year = ev.year;
    const raw = ev.text?.trim();
    if (!raw || typeof year !== 'number' || year < 1 || year > currentYear) continue;
    const text = raw.replace(PICTURE_HINT, '').replace(/\s+/g, ' ').trim();
    if (new RegExp(`(^|\\D)${year}(\\D|$)`).test(text)) continue;
    if (text.length < 25 || text.length > 320) continue;
    const pages = ev.pages ?? [];
    const main = pickMainPage(raw, pages);
    const page = main ? toPage(main) : undefined;
    const links = pages
      .filter((p) => p !== main && titleOf(p) && !LIST_PAGE.test(titleOf(p)) && p.content_urls?.desktop?.page)
      .slice(0, 3)
      .map((p) => ({ title: titleOf(p), url: p.content_urls!.desktop!.page! }));
    facts.push({ id: `${year}-${facts.length}-${text.slice(0, 24)}`, year, text, page, links });
  }
  return facts;
}

/** Four plausible years, the right one included, in random order. */
export function yearChoices(answer: number, currentYear: number, random: () => number = Math.random): number[] {
  const age = Math.max(1, currentYear - answer);
  const span = Math.min(250, Math.max(6, Math.round(age * 0.35)));
  const gap = Math.max(2, Math.round(span / 5));
  const picked = [answer];
  for (let tries = 0; picked.length < 4 && tries < 200; tries++) {
    const y = answer + Math.round((random() * 2 - 1) * span);
    if (y < 1 || y > currentYear) continue;
    if (picked.every((p) => Math.abs(p - y) >= gap)) picked.push(y);
  }
  for (let step = 1; picked.length < 4; step++) {
    for (const y of [answer - step * gap, answer + step * gap]) {
      if (picked.length < 4 && y >= 1 && y <= currentYear && !picked.includes(y)) picked.push(y);
    }
  }
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}

// French events read "la population mondiale atteint…" or start with a name;
// these common words are lowered on the rare occasions they come capitalised.
const FR_LOWER_FIRST = new Set([
  'le', 'la', 'les', "l'", 'un', 'une', 'des', 'début', 'fin', 'création', 'fondation', 'signature', 'ouverture',
  'inauguration', 'lancement', 'publication', 'premier', 'première', 'naissance', 'mort', 'exécution',
]);

/**
 * Splits the question around the hidden year. French events continue the
 * sentence naturally ("En ____, la population mondiale…"); English ones start
 * with a capital that may be a name, so they follow a colon ("In ____: World War I…").
 */
export function questionParts(text: string, lang: FactLang): { before: string; after: string } {
  if (lang === 'en') return { before: 'In', after: `: ${text}` };
  const first = (text.match(/^[\p{L}]+'?/u)?.[0] ?? '').toLowerCase();
  const body = FR_LOWER_FIRST.has(first) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
  return { before: 'En', after: `, ${body}` };
}
