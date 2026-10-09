// Společné pomůcky Školního ostrova: výběr slov (s důrazem na právě
// probíranou lekci), distraktory a české tvary.

import { count } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { ChoiceOption } from '../../core/types';
import { CURRENT_UNITS, WORDS, type Word } from './ucivo';

/** Klíč pro id: a–z, číslice, pomlčky. */
export const key = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const letters = (n: number) => count(n, ['písmeno', 'písmena', 'písmen']);

/** Slova pro úroveň: 1 = základ ze školy, 2 = celé školní učivo, 3 = navíc
 *  (a k tomu delší školní slova). `filter` zúží výběr (např. jen s obrázkem). */
export function wordsFor(level: number, filter: (w: Word) => boolean = () => true): Word[] {
  const pool = WORDS.filter((w) => (level <= 1 ? w.level === 1 : level === 2 ? w.level <= 2 : w.level === 3) && filter(w));
  return pool.length ? pool : WORDS.filter(filter);
}

/** Vybere slovo: na úrovních 1–2 v polovině případů z lekce, která se právě
 *  probírá ve škole (na test), jinak z celé úrovně. */
export function pickWord(rng: Rng, level: number, filter: (w: Word) => boolean = () => true): Word {
  if (level <= 2 && rng.chance(0.5)) {
    const current = WORDS.filter((w) => w.unit && CURRENT_UNITS.includes(w.unit) && w.level <= level && filter(w));
    if (current.length) return rng.pick(current);
  }
  return rng.pick(wordsFor(level, filter));
}

/** Chybné možnosti ze stejného tématu (jiná slova). */
export function sameTopic(rng: Rng, target: Word, n: number, filter: (w: Word) => boolean = () => true): Word[] {
  const pool = WORDS.filter((w) => w.topic === target.topic && w.en !== target.en && w.cs !== target.cs && filter(w));
  return rng.shuffle(pool).slice(0, n);
}

/** Možnost k výběru podle režimu: obrázek, barevný vzorek, číslice, nebo česky. */
export type Mode = 'pic' | 'color' | 'cs';

export function optionOf(w: Word, mode: Mode): ChoiceOption {
  if (mode === 'color') return { label: w.en, color: w.color };
  if (mode === 'pic') return { label: w.pic! };
  return { label: w.cs };
}

/** Hláskování pro vysvětlení česky: „bí – ej – dží“. */
export function lettersCz(word: string, names: Record<string, string>): string {
  return [...word.toUpperCase()].filter((c) => names[c]).map((c) => names[c]).join(' – ');
}

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
