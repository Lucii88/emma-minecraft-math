// Společné pomůcky pro Ostrov čísel: postavy, podstatná jména ve správných
// tvarech a sestavení úlohy.

import type { Forms } from '../../core/czech';
import type { AnswerSpec, Item, Level, Visual } from '../../core/types';
import type { Rng } from '../../core/rng';

export interface Character {
  name: string;
  female: boolean;
  /** 3. pád (komu): „Frídě“, „Knutovi“. */
  dat: string;
}

export const CHARACTERS: Character[] = [
  { name: 'Frída', female: true, dat: 'Frídě' },
  { name: 'Ingrid', female: true, dat: 'Ingrid' },
  { name: 'Liv', female: true, dat: 'Liv' },
  { name: 'Sigrun', female: true, dat: 'Sigrun' },
  { name: 'Knut', female: false, dat: 'Knutovi' },
  { name: 'Sven', female: false, dat: 'Svenovi' },
  { name: 'Olaf', female: false, dat: 'Olafovi' },
  { name: 'Bjorn', female: false, dat: 'Bjornovi' },
];

/** Minulý čas slovesa podle rodu: v(c, ['našel', 'našla']). */
export function v(c: Character, forms: readonly [string, string]): string {
  return c.female ? forms[1] : forms[0];
}

/** Podstatné jméno v 1. a 4. pádě pro počty [1, 2–4, 5+]. */
export interface Noun {
  nom: Forms;
  acc: Forms;
  /** 2. pád množného čísla (po „kolik“): „kolik draků“. */
  gen: string;
}

const noun = (nom: Forms, acc: Forms = nom): Noun => ({ nom, acc, gen: nom[2] });

export const N = {
  drak: noun(['drak', 'draci', 'draků'], ['draka', 'draky', 'draků']),
  drace: noun(['dráče', 'dráčata', 'dráčat']),
  ryba: noun(['ryba', 'ryby', 'ryb'], ['rybu', 'ryby', 'ryb']),
  ovce: noun(['ovce', 'ovce', 'ovcí'], ['ovci', 'ovce', 'ovcí']),
  vejce: noun(['vejce', 'vejce', 'vajec']),
  jablko: noun(['jablko', 'jablka', 'jablek']),
  supina: noun(['šupina', 'šupiny', 'šupin'], ['šupinu', 'šupiny', 'šupin']),
  kaminek: noun(['kamínek', 'kamínky', 'kamínků']),
  pirko: noun(['pírko', 'pírka', 'pírek']),
  mince: noun(['mince', 'mince', 'mincí'], ['minci', 'mince', 'mincí']),
  sud: noun(['sud', 'sudy', 'sudů']),
  stit: noun(['štít', 'štíty', 'štítů']),
  lod: noun(['loď', 'lodě', 'lodí']),
  viking: noun(['Viking', 'Vikingové', 'Vikingů'], ['Vikinga', 'Vikingy', 'Vikingů']),
  hodina: noun(['hodina', 'hodiny', 'hodin'], ['hodinu', 'hodiny', 'hodin']),
  minuta: noun(['minuta', 'minuty', 'minut'], ['minutu', 'minuty', 'minut']),
  kos: noun(['koš', 'koše', 'košů']),
  hnizdo: noun(['hnízdo', 'hnízda', 'hnízd']),
} as const;

export interface ItemParts {
  key: string;
  prompt: string;
  speak?: string;
  visual?: Visual;
  answer: AnswerSpec;
  hints: string[];
  explanation: string;
  difficulty?: number;
}

export function mk(skillId: string, level: Level, p: ItemParts): Item {
  return {
    id: `${skillId}:${level}:${p.key}`,
    skillId,
    level,
    prompt: p.prompt,
    speak: p.speak,
    visual: p.visual,
    answer: p.answer,
    hints: p.hints,
    explanation: p.explanation,
    difficulty: p.difficulty,
  };
}

/** Číselná odpověď. */
export const num = (correct: number, unit?: string, allowNegative = false): AnswerSpec => ({
  kind: 'number',
  correct,
  unit,
  allowNegative,
});

/** Náhodné číslo z rozsahu, které není násobkem 10 (kvůli přechodům). */
export function notRound(rng: Rng, min: number, max: number): number {
  for (let i = 0; i < 50; i++) {
    const n = rng.int(min, max);
    if (n % 10 !== 0) return n;
  }
  return min + 1;
}

/** Symbol pro speak: „−“ čte jako „mínus“, „×“ jako „krát“, „:“ jako „děleno“. */
export function speakMath(s: string): string {
  return s
    .replace(/−/g, ' mínus ')
    .replace(/\+/g, ' plus ')
    .replace(/×/g, ' krát ')
    .replace(/ : /g, ' děleno ')
    .replace(/=/g, ' rovná se ')
    .replace(/\?/g, ' kolik ')
    .replace(/_/g, ' kolik ')
    .replace(/\s+/g, ' ')
    .trim();
}
