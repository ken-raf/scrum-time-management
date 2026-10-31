import { create } from 'zustand';
import { DailyFactResponse, FactLang, yearChoices } from '@/lib/dailyFact';

/**
 * State of the "Le saviez-vous ?" quiz, shared by the live screen (once everyone
 * has spoken) and the meeting summary, so an answered question stays answered
 * when the meeting ends. Not persisted: a reload simply asks a fresh question.
 */

type Stage = 'ask' | 'judge' | 'learn';
type Status = 'idle' | 'loading' | 'ready' | 'error';

interface DailyFactStore {
  /** `${lang}-${month}-${day}` of the facts in `data`. */
  key: string | null;
  status: Status;
  data: DailyFactResponse | null;
  /** Shuffled fact indexes and the position of the current question in it. */
  order: number[];
  index: number;
  /** The four years offered for the current question, so both screens show the same ones. */
  choices: number[];
  choice: number | null;
  stage: Stage;
  /** Meeting the current question belongs to. */
  meetingKey: string | null;
  load: (locale: string) => void;
  bindMeeting: (meetingKey: string) => void;
  answer: (year: number, quick?: boolean) => void;
  next: () => void;
}

// One request per language and day.
const requests = new Map<string, Promise<DailyFactResponse>>();

function fetchFacts(lang: FactLang, month: number, day: number, key: string) {
  let pending = requests.get(key);
  if (!pending) {
    pending = fetch(`/api/daily-fact?lang=${lang}&month=${month}&day=${day}`).then((res) => {
      if (!res.ok) throw new Error(`daily-fact ${res.status}`);
      return res.json() as Promise<DailyFactResponse>;
    });
    pending.catch(() => requests.delete(key));
    requests.set(key, pending);
  }
  return pending;
}

function shuffled(n: number) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

function freshQuestion(data: DailyFactResponse, order: number[], index: number) {
  const fact = data.facts[order[index]];
  return { choices: yearChoices(fact.year, new Date().getFullYear()), choice: null, stage: 'ask' as Stage };
}

let judgeTimer: ReturnType<typeof setTimeout> | null = null;
function clearJudge() {
  if (judgeTimer) clearTimeout(judgeTimer);
  judgeTimer = null;
}

export const useDailyFactStore = create<DailyFactStore>()((set, get) => ({
  key: null,
  status: 'idle',
  data: null,
  order: [],
  index: 0,
  choices: [],
  choice: null,
  stage: 'ask',
  meetingKey: null,

  load: (locale) => {
    const lang: FactLang = locale === 'en' ? 'en' : 'fr';
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const key = `${lang}-${month}-${day}`;
    const { key: current, status } = get();
    if (current === key && (status === 'loading' || status === 'ready')) return;
    clearJudge();
    set({ key, status: 'loading', data: null });
    fetchFacts(lang, month, day, key)
      .then((data) => {
        if (get().key !== key) return;
        if (!data.facts?.length) {
          set({ status: 'error' });
          return;
        }
        const order = shuffled(data.facts.length);
        set({ status: 'ready', data, order, index: 0, ...freshQuestion(data, order, 0) });
      })
      .catch(() => {
        if (get().key === key) set({ status: 'error' });
      });
  },

  // A new meeting the same day gets a new question if the last one was answered.
  bindMeeting: (meetingKey) => {
    const { meetingKey: previous, stage } = get();
    if (previous === meetingKey) return;
    set({ meetingKey });
    if (previous !== null && stage !== 'ask') get().next();
  },

  answer: (year, quick) => {
    const { status, stage } = get();
    if (status !== 'ready' || stage !== 'ask') return;
    clearJudge();
    set({ choice: year, stage: 'judge' });
    judgeTimer = setTimeout(() => {
      judgeTimer = null;
      set({ stage: 'learn' });
    }, quick ? 350 : 1100);
  },

  next: () => {
    const { data, order, index } = get();
    if (!data || data.facts.length === 0) return;
    clearJudge();
    const i = (index + 1) % data.facts.length;
    set({ index: i, ...freshQuestion(data, order, i) });
  },
}));
