import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef } from '../src/core/types';
import { skills } from '../src/content/slova';
import type { Pools } from '../src/content/slova/common';
import { pools as cteniPools } from '../src/content/slova/cteni';
import { pools as hadankyPools } from '../src/content/slova/hadanky';
import { pools as presmyckyPools, scramble, WORDS } from '../src/content/slova/presmycky';
import { pools as rymyPools } from '../src/content/slova/rymy';
import { GAP_ITEMS, pools as pravopisPools } from '../src/content/slova/pravopis';
import { pools as hlaskyPools } from '../src/content/slova/hlasky';
import { pools as druhyPools } from '../src/content/slova/druhy';
import { pools as skupinyPools } from '../src/content/slova/skupiny';
import { pools as protikladyPools } from '../src/content/slova/protiklady';
import { pools as tvoreniPools } from '../src/content/slova/tvoreni';
import { sweepSkill, validateItem } from './validate';

const POOLS: Record<string, Pools> = {
  'slova.cteni': cteniPools,
  'slova.hadanky': hadankyPools,
  'slova.presmycky': presmyckyPools,
  'slova.rymy': rymyPools,
  'slova.pravopis': pravopisPools,
  'slova.hlasky': hlaskyPools,
  'slova.druhy': druhyPools,
  'slova.skupiny': skupinyPools,
  'slova.protiklady': protikladyPools,
  'slova.tvoreni': tvoreniPools,
};

/** Minimální počet různých úloh na úroveň. */
const MIN_DISTINCT: Record<string, number> = { 'slova.cteni': 12 };

/** Všechny úlohy ze zásobníků (každá položka jednou). */
function allItems(skill: SkillDef): Item[] {
  const pools = POOLS[skill.id];
  const out: Item[] = [];
  for (const level of skill.levels) {
    for (const [i, entry] of (pools[level] ?? []).entries()) {
      const d = entry.build(createRng(1000 + i));
      out.push({ id: `${skill.id}:${level}:${entry.key}`, skillId: skill.id, level, ...d });
    }
  }
  return out;
}

/** Všechny řetězce v objektu (rekurzivně). */
function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out));
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out));
  return out;
}

describe('Ostrov slov', () => {
  it('má všech deset dovedností se správným ostrovem a prefixem', () => {
    expect(skills.map((s) => s.id).sort()).toEqual(Object.keys(POOLS).sort());
    for (const s of skills) {
      expect(s.island).toBe('slova');
      expect(s.id.startsWith('slova.')).toBe(true);
      for (const l of s.levels) expect(s.rvp[l]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  for (const skill of skills) {
    describe(skill.id, () => {
      it('sweepSkill(300) bez chyb a dost různých úloh', () => {
        const { errors, distinct } = sweepSkill(skill, 300);
        expect(errors).toEqual([]);
        const min = MIN_DISTINCT[skill.id] ?? 30;
        for (const level of skill.levels) expect(distinct[level], `úroveň ${level}`).toBeGreaterThanOrEqual(min);
      });

      it('každá položka zásobníku projde kontrolou', () => {
        const errors: string[] = [];
        for (const item of allItems(skill)) errors.push(...validateItem(item, skill, item.level as Level));
        expect(errors.slice(0, 20)).toEqual([]);
      });

      it('je deterministická a id závisí jen na obsahu', () => {
        for (const level of skill.levels) {
          for (let seed = 1; seed <= 20; seed++) {
            const a = skill.generate(level, createRng(seed));
            const b = skill.generate(level, createRng(seed));
            expect(a).toEqual(b);
            expect(a.id).toMatch(new RegExp(`^${skill.id.replace('.', '\\.')}:${level}:[a-z0-9-]+$`));
          }
        }
      });

      it('texty: bez dvojitých mezer, bez ASCII uvozovek, v NFC', () => {
        const bad: string[] = [];
        for (const item of allItems(skill)) {
          for (const s of strings(item)) {
            if (s.includes('  ')) bad.push(`${item.id}: dvě mezery v „${s}“`);
            if (s.includes('"')) bad.push(`${item.id}: ASCII uvozovky v „${s}“`);
            if (s !== s.normalize('NFC')) bad.push(`${item.id}: není NFC „${s}“`);
            if (/\s$|^\s/.test(s) && s.trim()) bad.push(`${item.id}: mezera na kraji „${s}“`);
          }
        }
        expect(bad.slice(0, 20)).toEqual([]);
      });

      it('správná odpověď u výběru je jen jednou a nápovědy ji neprozradí doslova', () => {
        const bad: string[] = [];
        for (const item of allItems(skill)) {
          if (item.answer.kind !== 'choice') continue;
          const labels = item.answer.options.map((o) => o.label.toLocaleLowerCase('cs'));
          const correct = labels[item.answer.correct];
          if (correct.length >= 4) {
            for (const h of item.hints.map((x) => x.toLocaleLowerCase('cs'))) {
              // Nápověda, která jen vyjmenuje všechny možnosti (např. „děj, věc,
              // vlastnost“), odpověď neprozrazuje.
              if (h.includes(correct) && !labels.every((l) => h.includes(l))) bad.push(`${item.id}: nápověda obsahuje odpověď „${correct}“`);
            }
          }
        }
        expect(bad).toEqual([]);
      });
    });
  }
});

describe('Přesmyčky', () => {
  const all = Object.values(WORDS).flat().map(([w]) => w);

  it('každé slovo má v seznamu jednoznačné řešení', () => {
    const sig = (w: string) => [...w].sort().join('');
    const seen = new Map<string, string>();
    for (const w of all) {
      const s = sig(w);
      expect(seen.get(s), `${w} × ${seen.get(s)}`).toBeUndefined();
      seen.set(s, w);
    }
  });

  it('slova jsou velkými písmeny, bez „CH“ a s délkou podle úrovně', () => {
    const len: Record<number, [number, number]> = { 1: [3, 4], 2: [5, 5], 3: [6, 6], 4: [7, 8] };
    for (const [lv, list] of Object.entries(WORDS)) {
      for (const [w] of list) {
        expect(w).toBe(w.toLocaleUpperCase('cs'));
        expect(w.includes('CH'), w).toBe(false);
        const n = [...w].length;
        const [min, max] = len[Number(lv)];
        expect(n >= min && n <= max, `${w} (${n}) na úrovni ${lv}`).toBe(true);
      }
    }
  });

  it('zamíchaná písmena se nikdy nerovnají slovu', () => {
    for (const w of all) {
      for (let seed = 1; seed <= 200; seed++) {
        const s = scramble(w, createRng(seed));
        expect(s.join('')).not.toBe(w);
        expect([...s].sort().join('')).toBe([...w].sort().join(''));
      }
    }
  });
});

describe('Pravopis', () => {
  it('správná možnost je chybějící písmeno uloženého slova', () => {
    for (const [lv, list] of Object.entries(GAP_ITEMS)) {
      for (const g of list) {
        expect(g.gapped.split('_').length, g.gapped).toBe(2);
        expect(g.gapped.replace('_', g.letter), `${lv}: ${g.gapped}`).toBe(g.full);
        expect(g.options).toContain(g.letter);
      }
    }
  });

  it('vygenerovaná úloha má správnou odpověď shodnou s doplněným písmenem', () => {
    const skill = skills.find((s) => s.id === 'slova.pravopis')!;
    for (const item of allItems(skill)) {
      if (item.answer.kind !== 'choice' || item.visual?.type !== 'big') throw new Error('čekám výběr a velký text');
      const letter = item.answer.options[item.answer.correct].label;
      const g = GAP_ITEMS[item.level as 2 | 3 | 4].find((x) => item.id.endsWith(`:${x.key}`))!;
      expect(item.visual.text).toBe(g.gapped);
      expect(item.visual.text.replace('_', letter)).toBe(g.full);
    }
  });
});
