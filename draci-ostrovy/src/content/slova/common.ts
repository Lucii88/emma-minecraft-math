// Společné pomůcky pro dovednosti Ostrova slov.
//
// Každá dovednost má pro každou úroveň „zásobník“ položek (Entry). Položka má
// stabilní klíč odvozený z obsahu (slovo, id textu + číslo otázky…), takže
// stejná úloha má vždy stejné id. Generátor jen vybere položku a sestaví ji;
// náhoda ovlivní pouze výběr a pořadí možností.

import type { Rng } from '../../core/rng';
import type { AnswerSpec, Item, Level, Visual } from '../../core/types';

/** Úloha bez id, skillId a level – ty doplní generátor. */
export interface Draft {
  prompt: string;
  speak?: string;
  visual?: Visual;
  answer: AnswerSpec;
  hints: string[];
  explanation: string;
  difficulty?: number;
}

export interface Entry {
  /** Klíč obsahu, unikátní v rámci úrovně (bez diakritiky, a–z, 0–9, pomlčky). */
  key: string;
  build: (rng: Rng) => Draft;
}

export type Pools = Partial<Record<Level, Entry[]>>;

/** Klíč pro id: malá písmena bez diakritiky, mezery a jiné znaky → pomlčka. */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Nejbližší úroveň, kterou dovednost podporuje. */
export function nearestLevel(level: Level, levels: readonly Level[]): Level {
  let best = levels[0];
  for (const l of levels) if (Math.abs(l - level) < Math.abs(best - level)) best = l;
  return best;
}

/** Vytvoří funkci generate pro SkillDef ze zásobníků úloh. */
export function makeGenerator(skillId: string, levels: readonly Level[], pools: Pools) {
  return (level: Level, rng: Rng): Item => {
    const lv = nearestLevel(level, levels);
    const pool = pools[lv];
    if (!pool || pool.length === 0) throw new Error(`${skillId}: prázdný zásobník pro úroveň ${lv}`);
    const entry = rng.pick(pool);
    const d = entry.build(rng);
    const item: Item = {
      id: `${skillId}:${lv}:${entry.key}`,
      skillId,
      level: lv,
      prompt: d.prompt,
      answer: d.answer,
      hints: d.hints,
      explanation: d.explanation,
    };
    if (d.speak !== undefined) item.speak = d.speak;
    if (d.visual !== undefined) item.visual = d.visual;
    if (d.difficulty !== undefined) item.difficulty = d.difficulty;
    return item;
  };
}

/** Zkontroluje, že klíče v každé úrovni jsou unikátní (chyba = chyba v datech). */
export function assertUniqueKeys(skillId: string, pools: Pools): void {
  for (const [lv, pool] of Object.entries(pools)) {
    const seen = new Set<string>();
    for (const e of pool ?? []) {
      if (!/^[a-z0-9-]+$/.test(e.key)) throw new Error(`${skillId}:${lv}: neplatný klíč „${e.key}“`);
      if (seen.has(e.key)) throw new Error(`${skillId}:${lv}: duplicitní klíč „${e.key}“`);
      seen.add(e.key);
    }
  }
}

/** Obtížnost podle vzdálenosti „přirozené“ úrovně obsahu od úrovně úlohy. */
export function relDifficulty(contentLevel: number, level: number): number {
  const d = (contentLevel - level) * 0.3;
  return Math.max(-0.5, Math.min(0.5, Math.round(d * 10) / 10));
}
