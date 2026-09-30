// Pomůcky pro správnou češtinu v generovaných úlohách a pro sestavení
// odpovědí s výběrem.

import type { AnswerSpec, ChoiceOption } from './types';
import type { Rng } from './rng';

/** Tvary podstatného jména pro počet: [1, 2–4, 0 a 5+].
 *  Příklad (1. pád): ['drak', 'draci', 'draků'];
 *  (4. pád):          ['draka', 'draky', 'draků']. */
export type Forms = readonly [string, string, string];

export function form(n: number, forms: Forms): string {
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  if (abs >= 2 && abs <= 4) return forms[1];
  return forms[2];
}

/** „3 draci“, „5 draků“, „1 drak“. */
export function count(n: number, forms: Forms): string {
  return `${formatNumber(n)} ${form(n, forms)}`;
}

/** Český zápis čísla s mezerou mezi tisíci (10 000). Čísla do 9 999 bez mezery. */
export function formatNumber(n: number): string {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (abs < 10000) return sign + String(abs);
  return sign + String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);
}

/** Sestaví výběr z možností: správná + distraktory, zamíchané, bez duplicit. */
export function choice(
  rng: Rng,
  correct: string | ChoiceOption,
  distractors: (string | ChoiceOption)[],
  max = 4,
): Extract<AnswerSpec, { kind: 'choice' }> {
  const toOpt = (o: string | ChoiceOption): ChoiceOption => (typeof o === 'string' ? { label: o } : o);
  const correctOpt = toOpt(correct);
  const seen = new Set([correctOpt.label]);
  const unique: ChoiceOption[] = [];
  for (const d of distractors.map(toOpt)) {
    if (!seen.has(d.label)) {
      seen.add(d.label);
      unique.push(d);
    }
  }
  const picked = rng.shuffle(unique).slice(0, max - 1);
  const options = rng.shuffle([correctOpt, ...picked]);
  return { kind: 'choice', options, correct: options.indexOf(correctOpt) };
}

/** Číselné distraktory: blízké, kladné (pokud není povoleno jinak), různé. */
export function numberDistractors(
  rng: Rng,
  correct: number,
  opts: { spread?: number; allowNegative?: boolean; count?: number; typical?: number[] } = {},
): number[] {
  const { spread = Math.max(3, Math.round(Math.abs(correct) * 0.2)), allowNegative = false, count: k = 3, typical = [] } = opts;
  const out = new Set<number>();
  for (const t of typical) {
    if (t !== correct && (allowNegative || t >= 0)) out.add(t);
    if (out.size >= k) break;
  }
  let guard = 0;
  while (out.size < k && guard++ < 200) {
    const delta = rng.int(1, spread) * (rng.chance(0.5) ? 1 : -1);
    const v = correct + delta;
    if (v === correct) continue;
    if (!allowNegative && v < 0) continue;
    out.add(v);
  }
  return [...out].slice(0, k);
}

/** Výběr z čísel (správné + distraktory). */
export function numberChoice(
  rng: Rng,
  correct: number,
  opts: Parameters<typeof numberDistractors>[2] = {},
): Extract<AnswerSpec, { kind: 'choice' }> {
  const ds = numberDistractors(rng, correct, opts);
  return choice(rng, formatNumber(correct), ds.map(formatNumber));
}
