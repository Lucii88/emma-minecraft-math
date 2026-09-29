// Vynálezecká dílna – algoritmy, data a šifry. Kromě společných kontrol
// (úrovně, RVP, banky, generátory, karty, mise) nezávisle přepočítává:
// řešitelnost letů (vlastní hledání do šířky), jedinou opravu chybného
// programu, dešifrování podle klíče (vlastní abeceda a Morseova abeceda),
// jediné maximum a minimum v grafech a výsledky programů s opakováním.

import { describe, expect, it } from 'vitest';
import { algoritmyCards, algoritmyMissions, algoritmySkills } from '../src/content/dilna/algoritmy';
import { CHYBA_FALLBACK, MISPLACED } from '../src/content/dilna/algoritmy-chyba';
import { LET_CHECK, LET_FALLBACK } from '../src/content/dilna/algoritmy-let';
import { PICTURES_5, PICTURES_6 } from '../src/content/dilna/algoritmy-sifry';
import { enumerateItems } from '../src/core/bank';
import { createRng } from '../src/core/rng';
import type { Cell, Item, Level, Move, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const EXPECTED: Record<string, { levels: Level[]; rvp: Partial<Record<Level, string[]>>; ability: string; testLike?: string }> = {
  'dilna.let': {
    levels: [1, 2, 3, 4, 5, 6],
    rvp: { 1: ['I-5-2-01'], 2: ['I-5-2-01'], 3: ['I-5-2-01'], 4: ['I-5-2-01', 'I-5-2-03'], 5: ['I-5-2-01', 'I-5-2-03'] },
    ability: 'prostorove',
  },
  'dilna.chyba': {
    levels: [2, 3, 4, 5],
    rvp: { 2: ['I-5-2-04'], 3: ['I-5-2-04'], 4: ['I-5-2-04'], 5: ['I-5-2-04'] },
    ability: 'usuzovani',
  },
  'dilna.postupy': {
    levels: [1, 2, 3, 4],
    rvp: { 1: ['I-5-2-02'], 2: ['I-5-2-02'], 3: ['I-5-2-02'], 4: ['I-5-2-02', 'I-5-2-03'] },
    ability: 'usuzovani',
  },
  'dilna.data': {
    levels: [1, 2, 3, 4, 5],
    rvp: { 1: ['I-5-1-01'], 2: ['I-5-1-01'], 3: ['I-5-1-01'], 4: ['I-5-1-03', 'M-5-2-02'], 5: ['I-5-1-03', 'M-5-2-02'] },
    ability: 'usuzovani',
  },
  'dilna.sifry': {
    levels: [1, 2, 3, 4, 5, 6],
    rvp: { 1: ['I-5-2-01'], 2: ['I-5-2-01'], 3: ['I-5-2-01'], 4: ['I-5-1-02', 'I-5-2-01'], 5: ['I-5-1-02', 'I-5-2-01'] },
    ability: 'usuzovani',
    testLike: 'sifry',
  },
};

const skill = (id: string) => algoritmySkills.find((s) => s.id === id)!;
const keyOf = (item: Item) => item.id.split(':')[2];

/** Různé úlohy dovednosti a úrovně z generátoru i banky (podle id). */
function sample(s: SkillDef, level: Level, seeds = 400): Item[] {
  const byId = new Map<string, Item>();
  for (let seed = 1; seed <= seeds; seed++) {
    const item = s.generate(level, createRng(seed * 104729 + level));
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  for (const item of enumerateItems(s.id, level)) byId.set(item.id, item);
  return [...byId.values()];
}

function correctLabel(item: Item): string | null {
  return item.answer.kind === 'choice' ? item.answer.options[item.answer.correct].label : null;
}

function answerText(item: Item): string {
  const a = item.answer;
  switch (a.kind) {
    case 'choice':
      return a.options[a.correct].label;
    case 'number':
      return String(a.correct);
    case 'order':
      return a.correct.join('|');
    case 'program':
      return `${a.maxSteps}|${JSON.stringify(a.collect ?? [])}`;
    default:
      return a.kind;
  }
}

// ---------------------------------------------------------------------------
// Nezávislá simulace letu

type Grid = Extract<Visual, { type: 'grid' }>;
const DIR: Record<Move, [number, number]> = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const MOVES: Move[] = ['U', 'D', 'L', 'R'];
const ARROW_OF: Record<string, Move> = { '↑': 'U', '→': 'R', '↓': 'D', '←': 'L' };

function simulate(g: Grid, program: Move[], eggs: Cell[]): boolean {
  const rocks = new Set((g.rocks ?? []).map((c) => `${c.x},${c.y}`));
  let [x, y] = [g.dragon!.x, g.dragon!.y];
  const got = new Set<string>();
  const pick = () => eggs.forEach((e) => e.x === x && e.y === y && got.add(`${x},${y}`));
  pick();
  for (const m of program) {
    const [nx, ny] = [x + DIR[m][0], y + DIR[m][1]];
    if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || rocks.has(`${nx},${ny}`)) return false;
    [x, y] = [nx, ny];
    pick();
  }
  return x === g.goal!.x && y === g.goal!.y && got.size === eggs.length;
}

function shortest(g: Grid, eggs: Cell[]): number | null {
  const rocks = new Set((g.rocks ?? []).map((c) => `${c.x},${c.y}`));
  const full = (1 << eggs.length) - 1;
  const bit = (x: number, y: number) => eggs.reduce((m, e, i) => (e.x === x && e.y === y ? m | (1 << i) : m), 0);
  let frontier: [number, number, number][] = [[g.dragon!.x, g.dragon!.y, bit(g.dragon!.x, g.dragon!.y)]];
  const seen = new Set(frontier.map((s) => s.join()));
  for (let steps = 0; frontier.length; steps++) {
    if (frontier.some(([x, y, m]) => m === full && x === g.goal!.x && y === g.goal!.y)) return steps;
    const next: [number, number, number][] = [];
    for (const [x, y, m] of frontier) {
      for (const [dx, dy] of Object.values(DIR)) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || rocks.has(`${nx},${ny}`)) continue;
        const state: [number, number, number] = [nx, ny, m | bit(nx, ny)];
        if (seen.has(state.join())) continue;
        seen.add(state.join());
        next.push(state);
      }
    }
    frontier = next;
  }
  return null;
}

/** Kolik je nejkratších letů (do 2 – stačí vědět, jestli je jediný). */
function shortestWays(g: Grid, eggs: Cell[]): number {
  const rocks = new Set((g.rocks ?? []).map((c) => `${c.x},${c.y}`));
  const bit = (x: number, y: number) => eggs.reduce((m, e, i) => (e.x === x && e.y === y ? m | (1 << i) : m), 0);
  const full = (1 << eggs.length) - 1;
  let layer = new Map<string, number>([[`${g.dragon!.x},${g.dragon!.y},${bit(g.dragon!.x, g.dragon!.y)}`, 1]]);
  const seen = new Set(layer.keys());
  while (layer.size) {
    const done = layer.get(`${g.goal!.x},${g.goal!.y},${full}`);
    if (done) return Math.min(2, done);
    const next = new Map<string, number>();
    for (const [state, ways] of layer) {
      const [x, y, m] = state.split(',').map(Number);
      for (const [dx, dy] of Object.values(DIR)) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows || rocks.has(`${nx},${ny}`)) continue;
        const key = `${nx},${ny},${m | bit(nx, ny)}`;
        if (seen.has(key) && !next.has(key)) continue;
        next.set(key, Math.min(2, (next.get(key) ?? 0) + ways));
      }
    }
    for (const k of next.keys()) seen.add(k);
    layer = next;
  }
  return 0;
}

/** Nakreslená cesta jako na obrazovce: vede i přes skálu, z mapy už ne. */
function drawn(g: Grid, path: Move[]): { rocks: number[]; goal: number[]; exit: number } {
  const rocks = new Set((g.rocks ?? []).map((c) => `${c.x},${c.y}`));
  const out = { rocks: [] as number[], goal: [] as number[], exit: -1 };
  let [x, y] = [g.dragon!.x, g.dragon!.y];
  for (let i = 0; i < path.length; i++) {
    [x, y] = [x + DIR[path[i]][0], y + DIR[path[i]][1]];
    if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return { ...out, exit: i };
    if (rocks.has(`${x},${y}`)) out.rocks.push(i);
    if (x === g.goal!.x && y === g.goal!.y) out.goal.push(i);
  }
  return out;
}

/** Tvary podstatných jmen podle čísla (1 / 2–4 / 0 a 5+); u 2–4 i 4. pád. */
const NOUNS: [string[], string[], string[]][] = [
  [['krok'], ['kroky'], ['kroků']],
  [['stupeň'], ['stupně'], ['stupňů']],
  [['den'], ['dny'], ['dní', 'dnů']],
  [['drak'], ['draci', 'draky'], ['draků']],
  [['vajíčko'], ['vajíčka'], ['vajíček']],
  [['jablko'], ['jablka'], ['jablek']],
  [['dítě'], ['děti'], ['dětí']],
  [['čárka'], ['čárky'], ['čárek']],
  [['sloupec'], ['sloupce'], ['sloupců']],
];

// ---------------------------------------------------------------------------

describe('Dílna (algoritmy) – dovednosti', () => {
  it('má pět dovedností se správnými id, ostrovem, úrovněmi a RVP', () => {
    expect(algoritmySkills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const s of algoritmySkills) {
      const e = EXPECTED[s.id];
      expect(s.island).toBe('dilna');
      expect(s.levels, s.id).toEqual(e.levels);
      expect(s.ability, s.id).toBe(e.ability);
      expect(s.testLike, s.id).toBe(e.testLike);
      expect(s.name.trim()).not.toBe('');
      expect(s.description.trim(), s.id).toMatch(/\.$/);
      expect(s.rvp, s.id).toEqual(e.rvp);
      for (const level of s.levels.filter((l) => l <= 5)) {
        for (const code of s.rvp[level] ?? []) expect(code).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
        expect(s.rvp[level]?.length ?? 0, `${s.id} L${level}`).toBeGreaterThan(0);
      }
    }
  });

  for (const s of algoritmySkills) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 300);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: úlohy z banky jsou platné, klíče i zadání jedinečné`, () => {
      for (const level of s.levels) {
        const items = enumerateItems(s.id, level);
        for (const item of items) expect(validateItem(item, s, level)).toEqual([]);
        expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${s.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const s of algoritmySkills) {
      for (const level of s.levels) expect(s.generate(level, createRng(42))).toEqual(s.generate(level, createRng(42)));
    }
  });

  it('stejné id = stejné zadání, vizuál i správná odpověď; stejné zadání = stejné id', () => {
    for (const s of algoritmySkills) {
      for (const level of s.levels) {
        const byId = new Map<string, string>();
        const byPrompt = new Map<string, string>();
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const shown = `${item.prompt}|${JSON.stringify(item.visual ?? null)}`;
          const content = `${shown}|${answerText(item)}`;
          if (byId.has(item.id)) expect(content, item.id).toBe(byId.get(item.id));
          byId.set(item.id, content);
          if (byPrompt.has(shown)) expect(item.id, shown).toBe(byPrompt.get(shown));
          byPrompt.set(shown, item.id);
        }
      }
    }
  });

  it('úroveň mimo rozsah dovednosti dá úlohu nejbližší úrovně', () => {
    for (const s of algoritmySkills) {
      for (const level of [1, 2, 3, 4, 5, 6] as Level[]) {
        const item = s.generate(level, createRng(7));
        expect(s.levels).toContain(item.level);
        expect(validateItem(item, s, item.level)).toEqual([]);
      }
    }
  });
});

describe('Dílna (algoritmy) – karty a mise', () => {
  it('karty a mise projdou kontrolou', () => {
    expect(validateCards(algoritmyCards, algoritmySkills)).toEqual([]);
    expect(validateMissions(algoritmyMissions, 'dilna')).toEqual([]);
  });

  it('každá dovednost má aspoň dvě karty a aspoň dvě karty jsou opravené stránky', () => {
    for (const s of algoritmySkills) expect(algoritmyCards.filter((c) => c.skillId === s.id).length, s.id).toBeGreaterThanOrEqual(2);
    expect(algoritmyCards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(2);
  });

  it('mise jsou 3–4 a mají smysluplnou úroveň', () => {
    expect(algoritmyMissions.length).toBeGreaterThanOrEqual(3);
    expect(algoritmyMissions.length).toBeLessThanOrEqual(4);
    for (const m of algoritmyMissions) expect(m.level).toBeLessThanOrEqual(2);
  });

  it('fakta v kartách odpovídají nezávislé tabulce', () => {
    const text = (id: string) => algoritmyCards.find((c) => c.id === id)!.text;
    expect(text('dilna.let.slovo-robot')).toMatch(/Josef Čapek/);
    expect(text('dilna.let.slovo-robot')).toMatch(/R\.U\.R\. z roku 1920/);
    expect(text('dilna.postupy.ada')).toMatch(/1843/);
    expect(text('dilna.chyba.mura')).toMatch(/1947/);
    expect(text('dilna.chyba.mura')).toMatch(/Mark II/);
    expect(text('dilna.data.klementinum')).toMatch(/1775/);
    expect(text('dilna.let.zelva-logo')).toMatch(/1967/);
    expect(text('dilna.let.vozitko-mars')).toMatch(/3 až 22 minut/);
    expect(text('dilna.let.nejkratsi-cesta')).toMatch(/Dijkstra v roce 1956/);
    expect(text('dilna.sifry.braillovo-pismo')).toMatch(/patnáct let/);
    expect(algoritmyCards.find((c) => c.id === 'dilna.sifry.sos')!.fix!.evidence).toMatch(/1906/);
  });
});

// ---------------------------------------------------------------------------

describe('Naprogramuj let draka', () => {
  const s = skill('dilna.let');
  const RANGE: Record<number, [number, number]> = { 1: [2, 3], 2: [3, 6], 3: [5, 9], 4: [6, 11], 5: [8, 12], 6: [9, 12] };
  const SHAPE: Record<number, (g: Grid, eggs: number) => boolean> = {
    1: (g, e) => (g.cols === 3 || g.cols === 4) && g.rows === 3 && !g.rocks?.length && e === 0,
    2: (g, e) => g.cols === 4 && g.rows === 4 && (g.rocks?.length ?? 0) >= 1 && (g.rocks?.length ?? 0) <= 3 && e === 0
      && g.dragon!.x !== g.goal!.x && g.dragon!.y !== g.goal!.y,
    3: (g, e) => g.cols === 5 && g.rows === 5 && (g.rocks?.length ?? 0) >= 1 && e === 1,
    4: (g, e) => g.cols >= 5 && g.cols <= 6 && g.rows >= 5 && g.rows <= 6 && e === 2,
    5: (g, e) => g.cols === 6 && g.rows === 6 && e === 0 && (g.rocks?.length ?? 0) >= 10,
    6: (g, e) => g.cols === 7 && g.rows === 7 && (e === 2 || e === 3),
  };

  it('každý let je řešitelný v povoleném počtu kroků a úrovně odpovídají popisu', () => {
    const eggCounts = new Set<number>();
    for (const level of s.levels) {
      for (const item of sample(s, level)) {
        const g = item.visual as Grid;
        const a = item.answer;
        if (a.kind !== 'program' || g?.type !== 'grid') throw new Error(`${item.id}: čekám program`);
        const eggs = a.collect ?? [];
        expect(SHAPE[level](g, eggs.length), item.id).toBe(true);
        expect(g.path, item.id).toBeUndefined();
        const best = shortest(g, eggs);
        expect(best, item.id).not.toBeNull();
        expect(best!, item.id).toBeGreaterThanOrEqual(RANGE[level][0]);
        expect(best!, item.id).toBeLessThanOrEqual(RANGE[level][1]);
        expect(a.maxSteps, item.id).toBe(level >= 5 ? best : Math.min(12, best! + 3));
        if (level >= 5) expect(item.prompt, item.id).toContain(`Máš jen ${best}`);
        if (level === 6) eggCounts.add(eggs.length);
      }
    }
    expect([...eggCounts].sort()).toEqual([2, 3]);
  });

  it('vysvětlení popisuje nejkratší let, který opravdu doletí', () => {
    const WORD: Record<string, Move> = { nahoru: 'U', dolů: 'D', doleva: 'L', doprava: 'R' };
    for (const level of s.levels) {
      for (const item of sample(s, level, 150)) {
        const g = item.visual as Grid;
        const program = [...item.explanation.matchAll(/(\d+)× (nahoru|dolů|doleva|doprava)/g)]
          .flatMap((m) => Array(Number(m[1])).fill(WORD[m[2]]) as Move[]);
        const eggs = item.answer.kind === 'program' ? item.answer.collect ?? [] : [];
        expect(simulate(g, program, eggs), item.id).toBe(true);
        expect(program.length, item.id).toBe(shortest(g, eggs));
      }
    }
  });

  it('nápověda ke skalám je ve správném čísle a „třeba“ jen u více nejkratších letů', () => {
    let unique = 0;
    let several = 0;
    for (const level of s.levels) {
      for (const item of sample(s, level, 150)) {
        const g = item.visual as Grid;
        const rocks = g.rocks?.length ?? 0;
        if (item.hints.some((h) => /obletět/.test(h))) {
          expect(item.hints, item.id).toContain(rocks === 1 ? 'Skálu musíš obletět.' : 'Skály musíš obletět.');
        }
        const eggs = item.answer.kind === 'program' ? item.answer.collect ?? [] : [];
        const ways = shortestWays(g, eggs);
        expect(item.explanation.includes(', třeba:'), item.id).toBe(ways > 1);
        if (ways > 1) several++;
        else unique++;
      }
    }
    expect(unique).toBeGreaterThan(20);
    expect(several).toBeGreaterThan(20);
  });

  it('náhradní světy splňují podmínky své úrovně', () => {
    for (const level of s.levels) expect(LET_CHECK[level as 1](LET_FALLBACK[level as 1]), `L${level}`).not.toBeNull();
  });
});

describe('Najdi chybu v programu', () => {
  const s = skill('dilna.chyba');
  const all = s.levels.flatMap((level) => sample(s, level));

  it('„Ve kterém kroku je chyba?“ – chybu opraví jediná záměna, a to v označeném kroku', () => {
    const items = all.filter((i) => keyOf(i).startsWith('krok-'));
    expect(items.length).toBeGreaterThan(40);
    for (const item of items) {
      const g = item.visual as Grid;
      const path = g.path!;
      const eggs = g.eggs ?? [];
      expect(simulate(g, path, eggs), item.id).toBe(false);
      const fixes: [number, Move][] = [];
      path.forEach((orig, j) => MOVES.forEach((m) => {
        if (m === orig) return;
        const fixed = [...path];
        fixed[j] = m;
        if (simulate(g, fixed, eggs)) fixes.push([j, m]);
      }));
      expect(fixes.length, item.id).toBe(1);
      expect(correctLabel(item), item.id).toBe(`${fixes[0][0] + 1}. krok`);
      // Program v zadání je nakreslená cesta.
      const arrows = item.prompt.match(/programu ([←↑→↓ ]+),/)![1].split(' ').map((a) => ARROW_OF[a]);
      expect(arrows, item.id).toEqual(path);
      expect(item.speak, item.id).toBeTruthy();
      // Možnosti jsou po sobě jdoucí kroky ve správném pořadí.
      if (item.answer.kind !== 'choice') throw new Error(item.id);
      const nums = item.answer.options.map((o) => Number(o.label.match(/^(\d+)\. krok$/)![1]));
      expect(nums.length, item.id).toBe(Math.min(4, path.length));
      nums.forEach((n, i) => i > 0 && expect(n, item.id).toBe(nums[i - 1] + 1));
      expect(nums[nums.length - 1], item.id).toBeLessThanOrEqual(path.length);
    }
  });

  it('„Ve kterém kroku je chyba?“ – nakreslená cesta chybu neschovává', () => {
    const items = all.filter((i) => keyOf(i).startsWith('krok-'));
    const outcomes = new Set<string>();
    for (const item of items) {
      const g = item.visual as Grid;
      const d = drawn(g, g.path!);
      const step = Number(correctLabel(item)!.split('.')[0]) - 1;
      // Cesta nevede hnízdem a přejde nejvýš jednu skálu (jeden ✖ na skále).
      expect(d.goal, item.id).toEqual([]);
      expect(d.rocks.length, item.id).toBeLessThanOrEqual(1);
      // Za okrajem mapy se cesta nekreslí: z mapy smí vyletět jen chybný krok
      // sám, jen na L2–L3 a bez nárazu do skály předtím.
      if (d.exit >= 0) {
        expect(d.exit, item.id).toBe(step);
        expect(d.rocks, item.id).toEqual([]);
        expect(item.level, item.id).toBeLessThanOrEqual(3);
        expect(item.prompt, item.id).toContain('vyletěl z mapy');
      } else if (d.rocks.length) {
        expect(item.prompt, item.id).toContain('narazil do skály');
        expect(d.rocks[0], item.id).toBeGreaterThanOrEqual(step);
        if (item.level >= 4) expect(d.rocks[0], item.id).toBeGreaterThan(step);
      } else {
        expect(item.prompt, item.id).toContain('do hnízda nedoletěl');
      }
      const early = item.hints.includes('Chyba může být i dřív, než drak narazil.');
      expect(early, item.id).toBe(d.exit < 0 && d.rocks.length === 1 && d.rocks[0] > step);
      outcomes.add(item.prompt.match(/ale ([^,.]+)\. Ve kterém/)![1]);
    }
    expect([...outcomes].sort()).toEqual(['do hnízda nedoletěl', 'narazil do skály', 'vyletěl z mapy']);
    const fb: Grid = { type: 'grid', ...CHYBA_FALLBACK.w };
    expect(drawn(fb, CHYBA_FALLBACK.bug)).toEqual({ rocks: [], goal: [], exit: -1 });
  });

  it('„Oprav program“ – nakreslený program nefunguje, jednou záměnou jde opravit a vejde se do limitu', () => {
    const items = all.filter((i) => keyOf(i).startsWith('oprav-'));
    expect(items.length).toBeGreaterThan(40);
    for (const item of items) {
      const g = item.visual as Grid;
      const a = item.answer;
      if (a.kind !== 'program') throw new Error(item.id);
      const eggs = a.collect ?? [];
      const path = g.path!;
      expect(simulate(g, path, eggs), item.id).toBe(false);
      const fixable = path.some((orig, j) => MOVES.some((m) => m !== orig && simulate(g, path.map((x, k) => (k === j ? m : x)), eggs)));
      expect(fixable, item.id).toBe(true);
      expect(a.maxSteps, item.id).toBeGreaterThanOrEqual(path.length);
      const best = shortest(g, eggs)!;
      expect(best, item.id).toBeLessThanOrEqual(a.maxSteps);
      if (item.level === 5) expect(a.maxSteps, item.id).toBe(best);
    }
  });

  it('náhradní chybný program má jedinou opravu', () => {
    const g: Grid = { type: 'grid', ...CHYBA_FALLBACK.w };
    const fixes = CHYBA_FALLBACK.bug.flatMap((orig, j) => MOVES.filter((m) => m !== orig && simulate(g, CHYBA_FALLBACK.bug.map((x, k) => (k === j ? m : x)), [])));
    expect(fixes).toEqual([CHYBA_FALLBACK.move]);
  });

  it('krok na špatném místě se dá vrátit jediným přesunem a je to ten správný', () => {
    expect(MISPLACED.length).toBeGreaterThanOrEqual(6);
    const bankItems = s.levels.flatMap((level) => enumerateItems(s.id, level));
    for (const { key, correct } of MISPLACED) {
      const item = bankItems.find((i) => keyOf(i) === key)!;
      expect(item, key).toBeDefined();
      const steps = (item.visual as Extract<Visual, { type: 'steps' }>).steps;
      const movers = new Set<string>();
      steps.forEach((_, i) => steps.forEach((__, j) => {
        if (i === j) return;
        const moved = [...steps];
        const [x] = moved.splice(i, 1);
        moved.splice(j, 0, x);
        if (moved.join('|') === correct.join('|')) movers.add(x);
      }));
      expect([...movers], key).toEqual([correctLabel(item)]);
    }
  });

  it('„Který krok je špatně?“ z banky nabízí všechny kroky postupu', () => {
    for (const item of all.filter((i) => keyOf(i).startsWith('spatne-'))) {
      const steps = (item.visual as Extract<Visual, { type: 'steps' }>).steps;
      if (item.answer.kind !== 'choice') throw new Error(item.id);
      expect(item.answer.options.map((o) => o.label), item.id).toEqual(steps.map((_, i) => `${i + 1}. krok`));
    }
  });
});

describe('Postupy a algoritmy', () => {
  const s = skill('dilna.postupy');
  const all = s.levels.flatMap((level) => sample(s, level));
  const count = (text: string, ch: string) => [...text].filter((c) => c === ch).length;

  /** Rozbalí zápis na šipky: „Opakuj 3×: → ↑“, „3× →, 2× ↑“ nebo „→ → ↑“. */
  function expand(label: string): string {
    const loop = label.match(/^Opakuj (\d+)×: (.+)$/);
    if (loop) return expand(loop[2]).repeat(Number(loop[1]));
    if (label.includes('×')) {
      return label.split(', ').map((part) => {
        const [n, arrow] = part.split('× ');
        return ARROW_OF[arrow].repeat(Number(n));
      }).join('');
    }
    return label.split(' ').map((a) => ARROW_OF[a]).join('');
  }

  it('počty z programů s opakováním sedí s klíčem úlohy', () => {
    let checked = 0;
    for (const item of all) {
      if (item.answer.kind !== 'number') continue;
      const key = keyOf(item);
      const got = item.answer.correct;
      let m: RegExpMatchArray | null;
      if ((m = key.match(/^opakuj-(\d)-([a-z]+)-([a-z])$/))) {
        expect(got, item.id).toBe(Number(m[1]) * count(m[2], m[3]));
        expect(item.prompt, item.id).toContain(`Opakuj ${m[1]}×:`);
      } else if ((m = key.match(/^program-([a-z])-(\d)([a-z]+)-([a-z])-([a-z])$/))) {
        const [, before, n, body, after, asked] = m;
        expect(got, item.id).toBe(Number(n) * count(body, asked) + Number(before === asked) + Number(after === asked));
      } else if ((m = key.match(/^dve-(\d)([a-z]+)-(\d)([a-z]+)-([a-z])$/))) {
        expect(got, item.id).toBe(Number(m[1]) * count(m[2], m[5]) + Number(m[3]) * count(m[4], m[5]));
      } else if ((m = key.match(/^vnorene-(\d)-(\d)([a-z])-([a-z])-([a-z])$/))) {
        expect(m[3], item.id).toBe(m[5]);
        expect(got, item.id).toBe(Number(m[1]) * Number(m[2]));
      } else if ((m = key.match(/^sipky-(\d)-([urdl]+)$/))) {
        expect(got, item.id).toBe(Number(m[1]) * m[2].length);
      } else if ((m = key.match(/^cisla-([a-z]+\d?)-([\d-]+)-([td])$/))) {
        const nums = m[2].split('-').map(Number);
        const test = conditionOf(m[1]);
        const yes = nums.filter(test).length;
        expect(got, item.id).toBe(m[3] === 't' ? yes : nums.length - yes);
      } else if ((m = key.match(/^rada-([a-z]+\d?)-(\d+)$/))) {
        const n = Number(m[2]);
        expect(got, item.id).toBe(Array.from({ length: n }, (_, i) => i + 1).filter(conditionOf(m[1])).length);
      } else continue;
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  function conditionOf(code: string): (x: number) => boolean {
    const m = code.match(/^(vetsi|mensi)(\d)$/);
    if (m) return m[1] === 'vetsi' ? (x) => x > Number(m[2]) : (x) => x < Number(m[2]);
    return { sude: (x: number) => x % 2 === 0, liche: (x: number) => x % 2 === 1, nasobek3: (x: number) => x % 3 === 0, nasobek5: (x: number) => x % 5 === 0 }[code]!;
  }

  it('zkrácený zápis: právě jedna možnost dává stejný program', () => {
    let checked = 0;
    for (const item of all) {
      const key = keyOf(item);
      const m = key.match(/^(zkrat|rozbal)-([urdl]+)$/) ?? key.match(/^vzor-(\d)-([urdl]+)$/);
      if (!m || item.answer.kind !== 'choice') continue;
      const target = key.startsWith('vzor') ? m[2].toUpperCase().repeat(Number(m[1])) : m[2].toUpperCase();
      const matching = item.answer.options.filter((o) => expand(o.label) === target);
      expect(matching.map((o) => o.label), item.id).toEqual([correctLabel(item)]);
      if (key.startsWith('rozbal')) expect(expand(item.prompt.match(/programu (.+)\?$/)![1]), item.id).toBe(target);
      else expect(expand(item.prompt.match(/program ([←↑→↓ ]+)\./)![1]), item.id).toBe(target);
      for (const o of item.answer.options) expect(o.speak, `${item.id}: ${o.label}`).toBeTruthy();
      checked++;
    }
    expect(checked).toBeGreaterThan(40);
  });

  it('zkrácený zápis se nabízí, jen když program jde opravdu zkrátit', () => {
    let checked = 0;
    for (const item of all) {
      const m = keyOf(item).match(/^zkrat-([urdl]+)$/);
      if (!m) continue;
      const groups = m[1].replace(/(.)\1*/g, '$1').length;
      expect(m[1].length, item.id).toBeGreaterThanOrEqual(groups + 2);
      expect(item.prompt, item.id).toMatch(/zkráceně\?$/);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('seřazení: položky jsou krátké, různé a v každé úrovni je jich víc druhů', () => {
    for (const level of s.levels) {
      const orders = enumerateItems(s.id, level).filter((i) => i.answer.kind === 'order');
      expect(orders.length, `L${level}`).toBeGreaterThanOrEqual(3);
      for (const item of orders) {
        if (item.answer.kind !== 'order') continue;
        expect(item.answer.correct.length).toBeGreaterThanOrEqual(3);
        expect(item.answer.correct.length).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('Data a grafy', () => {
  const s = skill('dilna.data');
  const all = s.levels.flatMap((level) => sample(s, level));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  it('sloupce mají různé hodnoty a otázky „nejvíc/nejméně“ mají jedinou odpověď', () => {
    let extremes = 0;
    for (const item of all) {
      if (item.visual?.type !== 'bars') continue;
      const bars = item.visual.bars;
      const values = bars.map((b) => b.value);
      expect(new Set(values).size, item.id).toBe(values.length);
      const key = keyOf(item);
      const m = key.match(/^graf-([a-z]+)-((?:[a-z]+\d+)+)-(.+)$/)!;
      expect(m, item.id).not.toBeNull();
      const pairs = [...m[2].matchAll(/([a-z]+?)(\d+)/g)].map((x) => [x[1], Number(x[2])] as const);
      expect(pairs.map((p) => p[1]), item.id).toEqual(values);
      const val = (code: string) => pairs.find((p) => p[0] === code)![1];
      const q = m[3];
      const a = item.answer;
      if (q === 'max' || q === 'min') {
        const extreme = q === 'max' ? Math.max(...values) : Math.min(...values);
        expect(values.filter((v) => v === extreme).length, item.id).toBe(1);
        expect(correctLabel(item), item.id).toBe(bars[values.indexOf(extreme)].label);
        extremes++;
        continue;
      }
      if (a.kind !== 'number') continue;
      let r: RegExpMatchArray | null;
      if ((r = q.match(/^kolik-([a-z]+)$/))) expect(a.correct, item.id).toBe(val(r[1]));
      else if ((r = q.match(/^dohromady-([a-z]+)-([a-z]+)$/))) expect(a.correct, item.id).toBe(val(r[1]) + val(r[2]));
      else if ((r = q.match(/^rozdil-([a-z]+)-([a-z]+)$/))) {
        expect(val(r[1]) - val(r[2]), item.id).toBeGreaterThan(0);
        expect(a.correct, item.id).toBe(val(r[1]) - val(r[2]));
      } else if ((r = q.match(/^krat-([a-z]+)-([a-z]+)$/))) expect(a.correct * val(r[2]), item.id).toBe(val(r[1]));
      else if (q === 'celkem') expect(a.correct, item.id).toBe(sum(values));
      else if (q === 'rozpeti') expect(a.correct, item.id).toBe(Math.max(...values) - Math.min(...values));
      else if (q === 'rovnym-dilem') expect(a.correct * values.length, item.id).toBe(sum(values));
      else if ((r = q.match(/^nad-(\d+)$/))) {
        expect(values, item.id).not.toContain(Number(r[1]));
        expect(a.correct, item.id).toBe(values.filter((v) => v > Number(r![1])).length);
      } else throw new Error(`${item.id}: neznámá otázka`);
    }
    expect(extremes).toBeGreaterThan(20);
  });

  it('čárkovací tabulky: čárky sedí s čísly a odpovědi s čárkami', () => {
    let checked = 0;
    for (const item of all.filter((i) => keyOf(i).startsWith('carky-'))) {
      const v = item.visual as Extract<Visual, { type: 'table' }>;
      expect(v.head).toBe('row');
      const rows: [string, number][] = [];
      for (let i = v.cols; i < v.cells.length; i += v.cols) {
        const tally = String(v.cells[i + 1]);
        expect(tally, item.id).toMatch(/^(\|{5} )*\|{1,5}$/);
        rows.push([String(v.cells[i]), [...tally].filter((c) => c === '|').length]);
      }
      const values = rows.map((r) => r[1]);
      expect(new Set(values).size, item.id).toBe(values.length);
      const m = keyOf(item).match(/^carky-((?:[a-z]+\d+)+)-(.+)$/)!;
      const pairs = [...m[1].matchAll(/([a-z]+?)(\d+)/g)].map((x) => [x[1], Number(x[2])] as const);
      expect(pairs.map((p) => p[1]), item.id).toEqual(values);
      const val = (code: string) => pairs.find((p) => p[0] === code)![1];
      const q = m[2];
      const a = item.answer;
      let r: RegExpMatchArray | null;
      if (q === 'max') expect(correctLabel(item), item.id).toBe(rows[values.indexOf(Math.max(...values))][0]);
      else if (a.kind !== 'number') throw new Error(`${item.id}: čekám číslo`);
      else if (q === 'celkem') expect(a.correct, item.id).toBe(sum(values));
      else if ((r = q.match(/^kolik-([a-z]+)$/))) expect(a.correct, item.id).toBe(val(r[1]));
      else if ((r = q.match(/^rozdil-([a-z]+)-([a-z]+)$/))) expect(a.correct, item.id).toBe(val(r[1]) - val(r[2]));
      else throw new Error(`${item.id}: neznámá otázka`);
      expect(a.kind === 'number' ? a.correct : 1, item.id).toBeGreaterThan(0);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('karty s draky: počty a skupiny odpovídají kartám', () => {
    let checked = 0;
    for (const item of all.filter((i) => keyOf(i).startsWith('karty-'))) {
      const v = item.visual as Extract<Visual, { type: 'cards' }>;
      const color = (c: (typeof v.cards)[number]) => c.lines![0].replace('Barva: ', '');
      const breath = (c: (typeof v.cards)[number]) => c.lines![1].replace('Chrlí ', '');
      const key = keyOf(item);
      const COLOR: Record<string, string> = { z: 'zelená', m: 'modrá', c: 'červená' };
      const BREATH: Record<string, string> = { o: 'oheň', l: 'led' };
      let m: RegExpMatchArray | null;
      if ((m = key.match(/-barva-([zmc])$/)) && item.answer.kind === 'number') {
        expect(item.answer.correct, item.id).toBe(v.cards.filter((c) => color(c) === COLOR[m![1]]).length);
      } else if ((m = key.match(/-dech-([ol])$/)) && item.answer.kind === 'number') {
        expect(item.answer.correct, item.id).toBe(v.cards.filter((c) => breath(c) === BREATH[m![1]]).length);
      } else if ((m = key.match(/-oboji-([zmc])([ol])$/)) && item.answer.kind === 'number') {
        expect(item.answer.correct, item.id).toBe(v.cards.filter((c) => color(c) === COLOR[m![1]] && breath(c) === BREATH[m![2]]).length);
        expect(item.answer.correct, item.id).toBeGreaterThan(0);
      } else if (key.endsWith('-skupina')) {
        const sizes = Object.values(COLOR).map((c) => v.cards.filter((x) => color(x) === c).length);
        const best = Math.max(...sizes);
        expect(sizes.filter((x) => x === best).length, item.id).toBe(1);
        expect(correctLabel(item), item.id).toBe(['Zelení', 'Modří', 'Červení'][sizes.indexOf(best)]);
      } else throw new Error(`${item.id}: neznámá otázka`);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('tabulky s více sloupci: odpovědi sedí s čísly v tabulce a maximum je jediné', () => {
    let checked = 0;
    for (const item of all.filter((i) => /^(tabulka|teploty)-/.test(keyOf(i)))) {
      const v = item.visual as Extract<Visual, { type: 'table' }>;
      expect(v.head).toBe('row');
      const rows: (string | number | null)[][] = [];
      for (let i = v.cols; i < v.cells.length; i += v.cols) rows.push(v.cells.slice(i, i + v.cols));
      const key = keyOf(item);
      const a = item.answer;
      let m: RegExpMatchArray | null;
      if ((m = key.match(/-chybi-(\d)-(\d)$/)) && a.kind === 'number') {
        const [r, c] = [Number(m[1]), Number(m[2])];
        expect(v.ask, item.id).toBe(v.cols * (r + 1) + c);
        const row = rows[r].map((x, i) => (i === c ? a.correct : x)) as (string | number)[];
        expect(sum(row.slice(1, 4) as number[]), item.id).toBe(row[4]);
      } else if (key.startsWith('tabulka-')) {
        const nums = rows.map((r) => r.slice(1, 4) as number[]);
        const rowSums = nums.map(sum);
        const colSums = [0, 1, 2].map((d) => sum(nums.map((r) => r[d])));
        if ((m = key.match(/-radek-([a-z]+)$/)) && a.kind === 'number') expect(rowSums).toContain(a.correct);
        else if ((m = key.match(/-sloupec-(\d)$/)) && a.kind === 'number') expect(a.correct, item.id).toBe(colSums[Number(m[1])]);
        else if (key.endsWith('-kdo')) {
          expect(rowSums.filter((x) => x === Math.max(...rowSums)).length, item.id).toBe(1);
          expect(correctLabel(item), item.id).toBe(rows[rowSums.indexOf(Math.max(...rowSums))][0]);
        } else if (key.endsWith('-den')) {
          expect(colSums.filter((x) => x === Math.max(...colSums)).length, item.id).toBe(1);
          expect(correctLabel(item), item.id).toBe(['V pondělí', 'V úterý', 'Ve středu'][colSums.indexOf(Math.max(...colSums))]);
        } else throw new Error(`${item.id}: neznámá otázka`);
      } else {
        const DAY: Record<string, string> = { Po: 'V pondělí', Út: 'V úterý', St: 'Ve středu', Čt: 'Ve čtvrtek', Pá: 'V pátek' };
        const warm = rows.map((r) => (r[2] as number) - (r[1] as number));
        const noon = rows.map((r) => r[2] as number);
        if ((m = key.match(/-oteplilo-(\d)$/)) && a.kind === 'number') expect(a.correct, item.id).toBe(warm[Number(m[1])]);
        else if (key.endsWith('-poledne')) {
          expect(noon.filter((x) => x === Math.max(...noon)).length, item.id).toBe(1);
          expect(correctLabel(item), item.id).toBe(DAY[rows[noon.indexOf(Math.max(...noon))][0] as string]);
        } else if (key.endsWith('-nejvic')) {
          expect(warm.filter((x) => x === Math.max(...warm)).length, item.id).toBe(1);
          expect(correctLabel(item), item.id).toBe(DAY[rows[warm.indexOf(Math.max(...warm))][0] as string]);
        } else throw new Error(`${item.id}: neznámá otázka`);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(40);
  });

  it('počasí: otázky se ptají na zápisy, ne na počasí samo (při bouřce taky prší)', () => {
    let checked = 0;
    for (const item of all.filter((i) => keyOf(i).startsWith('graf-pocasi-'))) {
      const texts = [item.prompt, ...(item.answer.kind === 'choice' ? item.answer.options.map((o) => o.label) : [])];
      for (const t of texts) expect(t, item.id).not.toMatch(/(^|[^\p{L}])(pršelo|sněžilo)|bylo (slunečno|polojasno|zataženo)|byla bouřka|počasí bylo/u);
      if (/-(kolik|dohromady|rozdil)-/.test(keyOf(item))) expect(item.prompt, item.id).toMatch(/si zapsala/);
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('tabulka se sloupcem Celkem se neptá na součet řádku ani na to, kdo má nejvíc', () => {
    for (const item of all.filter((i) => keyOf(i).startsWith('tabulka-'))) {
      const v = item.visual as Extract<Visual, { type: 'table' }>;
      if (v.cells.includes('Celkem')) expect(keyOf(item), item.id).not.toMatch(/-(radek-[a-z]+|kdo)$/);
    }
  });

  it('„Na kterou otázku graf neodpoví?“ je jen na L4–L5 a nabízí samé otázky', () => {
    const items = all.filter((i) => keyOf(i).includes('-neodpovi-'));
    expect(items.length).toBeGreaterThan(5);
    for (const item of items) {
      expect(item.level).toBeGreaterThanOrEqual(4);
      if (item.answer.kind !== 'choice') throw new Error(item.id);
      for (const o of item.answer.options) expect(o.label, item.id).toMatch(/\?$/);
    }
  });
});

describe('Šifry a tajné kódy', () => {
  const s = skill('dilna.sifry');
  const all = s.levels.flatMap((level) => sample(s, level));
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  /** Mezinárodní Morseova abeceda – nezávislá tabulka. */
  const MORSE: Record<string, string> = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
    M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..',
  };
  const plainMorse = (shown: string) => shown.replace(/ /g, '').replace(/•/g, '.').replace(/–/g, '-');
  const shiftBy = (word: string, by: number) => [...word].map((l) => ABC[(ABC.indexOf(l) + by + 26) % 26]).join('');
  const table = (item: Item) => item.visual as Extract<Visual, { type: 'table' }>;
  const keyRows = (item: Item) => {
    const v = table(item);
    expect(v.head, item.id).toBe('row');
    expect(v.cells.length, item.id).toBe(2 * v.cols);
    return { top: v.cells.slice(0, v.cols), bottom: v.cells.slice(v.cols) };
  };

  it('dešifrování podle klíče v úloze dává správnou odpověď', () => {
    const kinds = new Set<string>();
    for (const item of all) {
      const key = keyOf(item);
      const kind = key.split('-')[0];
      const label = correctLabel(item);
      const word = key.split('-')[1]?.toUpperCase();
      switch (kind) {
        case 'znaky': {
          const { top, bottom } = keyRows(item);
          expect(new Set(top).size, item.id).toBe(top.length);
          expect(new Set(bottom).size, item.id).toBe(bottom.length);
          const map = new Map(top.map((sym, i) => [sym, bottom[i]]));
          const msg = item.prompt.match(/zprávě (.+)\?$/)![1].split(' ');
          expect(msg.map((x) => map.get(x)).join(''), item.id).toBe(label);
          expect(label, item.id).toBe(word);
          expect(bottom.join(''), item.id).not.toContain(word);
          break;
        }
        case 'zapis': {
          const { top, bottom } = keyRows(item);
          const map = new Map(top.map((sym, i) => [sym, bottom[i]]));
          expect(label!.split(' ').map((x) => map.get(x)).join(''), item.id).toBe(word);
          expect(item.prompt, item.id).toContain(word);
          break;
        }
        case 'cisla':
        case 'cislazapis': {
          const v = table(item);
          const map = new Map<number, string>();
          if (v.head) {
            const { top, bottom } = keyRows(item);
            top.forEach((n, i) => map.set(Number(n), String(bottom[i])));
          } else {
            expect(v.cells.slice(0, 26), item.id).toEqual([...ABC].map((l, i) => `${l} = ${i + 1}`));
            v.cells.slice(0, 26).forEach((c) => map.set(Number(String(c).split(' = ')[1]), String(c).split(' = ')[0]));
          }
          for (const [n, l] of map) expect(ABC.indexOf(l) + 1, item.id).toBe(n);
          if (kind === 'cisla') {
            const nums = item.prompt.match(/zprávě ([\d, ]+)\?$/)![1].split(', ').map(Number);
            expect(nums.map((n) => map.get(n)).join(''), item.id).toBe(label);
            expect(label, item.id).toBe(word);
          } else {
            expect(label!.split(', ').map((n) => map.get(Number(n))).join(''), item.id).toBe(word);
          }
          break;
        }
        case 'posun':
        case 'zpet':
        case 'caesar3':
        case 'zasifruj': {
          const v = table(item);
          expect(v.cells.slice(0, 26).join(''), item.id).toBe(ABC);
          if (kind === 'zasifruj') {
            expect(label, item.id).toBe(shiftBy(word, 1));
            expect(item.prompt, item.id).toContain(word);
          } else {
            const msg = item.prompt.match(/zpráva ([A-Z]+)\?$/)![1];
            const back = { posun: -1, zpet: 1, caesar3: -3 }[kind];
            expect(shiftBy(msg, back), item.id).toBe(label);
            expect(label, item.id).toBe(word);
          }
          break;
        }
        case 'morse':
        case 'morsezapis': {
          const { top, bottom } = keyRows(item);
          bottom.forEach((l, i) => expect(plainMorse(String(top[i])), `${item.id}: ${l}`).toBe(MORSE[String(l)]));
          const decode = (code: string) => code.split(' / ').map((c) => Object.keys(MORSE).find((l) => MORSE[l] === plainMorse(c))).join('');
          if (kind === 'morse') {
            expect(decode(item.prompt.match(/zprávě (.+)\?$/)![1]), item.id).toBe(label);
            expect(label, item.id).toBe(word);
          } else {
            expect(decode(label!), item.id).toBe(word);
          }
          break;
        }
        case 'svetla':
        case 'zapni':
        case 'plus1': {
          const { top, bottom } = keyRows(item);
          expect(top, item.id).toEqual([16, 8, 4, 2, 1]);
          const shown = bottom.reduce<number>((acc, lamp, i) => acc + (lamp === '💡' ? (top[i] as number) : 0), 0);
          const value = (bits: string) => parseInt(bits, 2);
          if (kind === 'svetla' && item.answer.kind === 'number') expect(item.answer.correct, item.id).toBe(shown);
          if (kind === 'zapni') {
            const n = Number(key.split('-')[1]);
            expect(shown, item.id).toBe(0);
            expect(value(label!), item.id).toBe(n);
          }
          if (kind === 'plus1') {
            const n = Number(key.split('-')[1]);
            expect(shown, item.id).toBe(n);
            expect(value(label!), item.id).toBe(n + 1);
          }
          if (item.answer.kind === 'choice') {
            const hits = item.answer.options.filter((o) => value(o.label) === value(label!));
            expect(hits.length, item.id).toBe(1);
          }
          break;
        }
        case 'obrazek': {
          const v = table(item);
          const size = item.level === 4 ? 5 : 6;
          expect(v.cols, item.id).toBe(size);
          expect(v.cells.length, item.id).toBe(size * size);
          for (const c of v.cells) expect([0, 1], item.id).toContain(c);
          break;
        }
        case 'lampy':
          break;
        default:
          throw new Error(`${item.id}: neznámý druh šifry`);
      }
      kinds.add(kind);
    }
    expect([...kinds].sort()).toEqual(['caesar3', 'cisla', 'cislazapis', 'lampy', 'morse', 'morsezapis', 'obrazek', 'plus1', 'posun', 'svetla', 'zapis', 'zapni', 'zasifruj', 'znaky', 'zpet']);
  });

  it('obrázky z nul a jedniček jsou navzájem různé a mají jiná jména', () => {
    for (const pics of [PICTURES_5, PICTURES_6]) {
      expect(new Set(pics.map((p) => p.rows.join())).size).toBe(pics.length);
      expect(new Set(pics.map((p) => p.name)).size).toBe(pics.length);
      const size = pics[0].rows.length;
      for (const p of pics) {
        expect(p.rows.length, p.code).toBe(size);
        for (const r of p.rows) expect(r, p.code).toMatch(new RegExp(`^[01]{${size}}$`));
      }
    }
  });

  /** Nezávislý seznam schválených slov: česká slova, která se píšou bez
   *  diakritiky a nejdou přečíst jinak (ne MAMA za „máma“). */
  const APPROVED = new Set(`LES PES KOS NOS DUB BUK LEV VLK OKO MED LED SYN OBR SUD ROK DRAK SOVA RYBA KOZA KOLO VLAK NORA
    VODA ZIMA JARO NOHA RUKA LAMA MAPA VOSA LIPA HORA DORT LAMPA VEJCE MOTYL SLON TYGR ZEBRA KAPR VLNA OSEL PERO KOPEC
    KOZEL HUSA BUBEN KOTVA HOUBA MRKEV OKNO STROM MOST POKLAD OSTROV KOMPAS VESLO ROBOT KOMETA PLANETA OBLAKA MALINA
    DOMINO KAKTUS HOLUB TUNEL KLOBOUK PARAPLE BALON SOPKA MOTOR ZUB MOZEK JAZYK ZVON ZLATO AUTO ANDULKA ANO ANANAS
    ZAHRADA ZOO SOS ROSA TMA SEN DEN MRAK`.split(/\s+/));
  const UNSUITABLE = /DREK|SRAK|SRAC|PRD|SUK|KAKA|KREV|BLB|KURV|PICA|HOVN|CURA|KOKOT|SMRT|MRTV|VRAH|HROB|SEX/;

  it('luštěná a zapisovaná slova jsou ze schváleného seznamu a mezi možnostmi nejsou nevhodná slova', () => {
    let checked = 0;
    for (const item of all) {
      const [kind, word] = keyOf(item).split('-');
      if (['znaky', 'zapis', 'cisla', 'cislazapis', 'posun', 'zpet', 'caesar3', 'zasifruj', 'morse', 'morsezapis'].includes(kind)) {
        expect(APPROVED.has(word.toUpperCase()), item.id).toBe(true);
        checked++;
      }
      if (item.answer.kind === 'choice') for (const o of item.answer.options) expect(o.label, item.id).not.toMatch(UNSUITABLE);
      expect(item.prompt, item.id).not.toMatch(UNSUITABLE);
    }
    expect(checked).toBeGreaterThan(200);
  });

  it('obrázek z nul a jedniček: podobné obrázky se nenabízí spolu a vysvětlení má správný tvar slovesa', () => {
    for (const item of all.filter((i) => keyOf(i).startsWith('obrazek-'))) {
      if (item.answer.kind !== 'choice') throw new Error(item.id);
      const labels = item.answer.options.map((o) => o.label);
      const similar: Record<string, string> = { 'Písmeno U': 'Pohár', Pohár: 'Písmeno U' };
      const label = correctLabel(item)!;
      if (similar[label]) expect(labels, item.id).not.toContain(similar[label]);
      expect(item.explanation, item.id).toMatch(correctLabel(item) === 'Schody' ? /vzniknou schody\.$/ : /vznikne /);
    }
  });

  it('lampy z banky mají v zadání pravidlo, jak lampy ukazují číslo', () => {
    for (const item of enumerateItems(s.id, 6)) {
      if (keyOf(item) === 'lampy-dalsi') continue;
      expect(item.prompt, item.id).toContain('Každá rozsvícená lampa přidá své číslo.');
    }
  });

  it('slova v šifrách jsou bez diakritiky', () => {
    for (const item of all) {
      const label = correctLabel(item);
      if (label && /^[A-Z]+$/.test(label)) expect(label).toMatch(/^[A-Z]{2,7}$/);
    }
  });
});

// ---------------------------------------------------------------------------

describe('Dílna (algoritmy) – texty', () => {
  const all = algoritmySkills.flatMap((s) => s.levels.flatMap((level) => sample(s, level, 250)));
  const SYMBOL = /[←↑→↓•×]|\p{Extended_Pictographic}/u;

  it('zadání, nápovědy a vysvětlení jsou čisté a úplné', () => {
    for (const item of all) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.prompt.length, item.id).toBeLessThanOrEqual(200);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      const texts = [item.prompt, item.explanation, ...item.hints, ...(item.speak ? [item.speak] : [])];
      if (item.answer.kind === 'choice') for (const o of item.answer.options) texts.push(o.label, ...(o.speak ? [o.speak] : []));
      for (const t of texts) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!]/);
        expect(t, item.id).not.toMatch(/\b(undefined|null|NaN)\b/);
        expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(/\bem+a\b/);
      }
      if (SYMBOL.test(item.prompt)) expect(item.speak, `${item.id}: zadání se symboly potřebuje speak`).toBeTruthy();
      if (item.speak) expect(item.speak, item.id).not.toMatch(SYMBOL);
    }
  });

  it('číslo a podstatné jméno za ním mají správný tvar (1 krok, 3 kroky, 5 kroků)', () => {
    let checked = 0;
    for (const item of all) {
      const texts = [item.prompt, item.explanation, ...item.hints, ...(item.speak ? [item.speak] : [])];
      for (const t of texts) {
        for (const m of t.matchAll(/(?<![\d.,])(\d+) (\p{L}+)/gu)) {
          const n = Number(m[1]);
          const forms = NOUNS.find((f) => f.some((alts) => alts.includes(m[2])));
          if (!forms) continue;
          const expected = n === 1 ? forms[0] : n >= 2 && n <= 4 ? forms[1] : forms[2];
          expect(expected, `${item.id}: „${m[0]}“ v „${t}“`).toContain(m[2]);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('klíče úloh jsou jen z malých písmen, číslic a pomlček', () => {
    for (const item of all) expect(keyOf(item), item.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('možnosti jsou krátké, s velkým písmenem, bez tečky; symboly mají předčítání', () => {
    for (const item of all) {
      if (item.answer.kind !== 'choice') continue;
      expect(item.answer.options.length, item.id).toBeGreaterThanOrEqual(3);
      for (const o of item.answer.options) {
        expect(o.label.length, `${item.id}: ${o.label}`).toBeLessThanOrEqual(40);
        expect(o.label, item.id).not.toMatch(/^\p{Ll}/u);
        expect(o.label, item.id).not.toMatch(/\.$/);
        if (SYMBOL.test(o.label)) expect(o.speak, `${item.id}: ${o.label}`).toBeTruthy();
        if (o.speak) expect(o.speak, item.id).not.toMatch(SYMBOL);
      }
    }
  });

  it('nápovědy neprozrazují správnou odpověď', () => {
    for (const item of all) {
      const label = correctLabel(item);
      if (!label || label.length < 3 || !/\p{L}/u.test(label)) continue;
      const escaped = label.toLocaleLowerCase('cs').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const word = new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'u');
      for (const h of item.hints) expect(word.test(h.toLocaleLowerCase('cs')), `${item.id}: „${h}“`).toBe(false);
    }
  });
});
