// Společné pomůcky pro Ostrov světa: zkrácený zápis otázek do bank úloh.
//
// Každá dovednost ostrova se staví přes `bankSkill` (src/core/bank.ts). Tady
// jsou jen krátké zápisy otázek, aby banky zůstaly čitelné.

import type { ChoiceSpec, FixedSpec, NumberSpec, OrderSpec } from '../../core/bank';
import type { ChoiceOption, Visual } from '../../core/types';

export interface Extra {
  /** Co přečíst nahlas, pokud zadání obsahuje symboly, šipky nebo emoji. */
  speak?: string;
  visual?: Visual;
  /** Jemné posunutí obtížnosti v rámci úrovně (−0,5 až +0,5). */
  difficulty?: number;
}

type Hints = string | string[];
const list = (h: Hints): string[] => (typeof h === 'string' ? [h] : h);

/** Výběr z možností: správná odpověď a 3–5 chybných (ukážou se nejvýš 3). */
export function q(
  key: string,
  prompt: string,
  correct: string | ChoiceOption,
  wrong: (string | ChoiceOption)[],
  hints: Hints,
  explain: string,
  extra: Extra = {},
): ChoiceSpec {
  return { key, prompt, correct, wrong, hints: list(hints), explain, ...extra };
}

/** Stálá tlačítka ve stálém pořadí (roční období, světové strany, Ano × Ne). */
export function fixed(
  key: string,
  prompt: string,
  options: (string | ChoiceOption)[],
  correct: number,
  hints: Hints,
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return { kind: 'fixed', key, prompt, options, correct, hints: list(hints), explain, ...extra };
}

/** Seřazení 3–6 položek; `correct` je správné pořadí. */
export function ord(key: string, prompt: string, correct: string[], hints: Hints, explain: string, extra: Extra = {}): OrderSpec {
  return { kind: 'order', key, prompt, correct, hints: list(hints), explain, ...extra };
}

/** Číselná odpověď na klávesnici. */
export function num(
  key: string,
  prompt: string,
  correct: number,
  hints: Hints,
  explain: string,
  extra: Extra & { unit?: string } = {},
): NumberSpec {
  return { kind: 'number', key, prompt, correct, hints: list(hints), explain, ...extra };
}

/** Klíč pro id: malá písmena bez diakritiky, mezery a jiné znaky → pomlčka. */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Vybere `n` různých prvků (bez `except`) v náhodném pořadí. */
export function pickSome<T>(rng: { shuffle<U>(items: readonly U[]): U[] }, items: readonly T[], n: number, except: readonly T[] = []): T[] {
  return rng.shuffle(items.filter((x) => !except.includes(x))).slice(0, n);
}
