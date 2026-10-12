// Ostrov blesků – obvody. Kromě společných kontrol (úrovně, RVP, banky,
// generátory, karty, mise) nezávisle přepočítává, co svítí: obvod se převede
// na odpory (žárovka 1 Ω, drát 1 µΩ) a napětí v uzlech se spočítá
// z Kirchhoffových zákonů. Skládačku drátů kontroluje vlastním hledáním kruhu.

import { describe, expect, it } from 'vitest';
import { bleskyCards, bleskyMissions } from '../src/content/blesky/karty';
import { obvodSkill } from '../src/content/blesky/obvod';
import { vodiceSkill } from '../src/content/blesky/vodice';
import { FALLBACK, vypinaceSkill } from '../src/content/blesky/vypinace';
import { drateSkill } from '../src/content/blesky/drate';
import { explainNet } from '../src/content/blesky/common';
import { enumerateItems } from '../src/core/bank';
import { THINGS, allSwitchStates, bulbsOf, litBulbs, solveSwitches, switchesOf, type SwitchState } from '../src/core/circuit';
import { createRng } from '../src/core/rng';
import type { BulbColor, CircuitPart, Item, Level, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const SKILLS = [obvodSkill, vodiceSkill, vypinaceSkill, drateSkill];

const EXPECTED: Record<string, { levels: Level[]; ability: string }> = {
  'blesky.obvod': { levels: [1, 2, 3, 4, 5], ability: 'usuzovani' },
  'blesky.vodice': { levels: [1, 2, 3, 4], ability: 'znalosti' },
  'blesky.vypinace': { levels: [1, 2, 3, 4, 5], ability: 'usuzovani' },
  'blesky.drate': { levels: [1, 2, 3, 4, 5], ability: 'prostorove' },
};

/** Různé úlohy dovednosti a úrovně z generátoru i banky (podle id). */
function sample(s: SkillDef, level: Level, seeds = 300): Item[] {
  const byId = new Map<string, Item>();
  for (let seed = 1; seed <= seeds; seed++) {
    const item = s.generate(level, createRng(seed * 104729 + level));
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  for (const item of enumerateItems(s.id, level)) byId.set(item.id, item);
  return [...byId.values()];
}

// ---------------------------------------------------------------------------
// Nezávislý výpočet obvodu: uzlová napětí (Gaussova eliminace)

const E = 4.5;

function physics(net: CircuitPart, sw: SwitchState = {}): { lit: BulbColor[]; shorted: boolean } {
  const edges: { a: number; b: number; g: number; bulb?: BulbColor }[] = [];
  let nodes = 2; // 0 = minus (zem), 1 = plus
  const conducts = (p: CircuitPart): boolean | 'bulb' => {
    if (p.t === 'bulb') return p.broken ? false : 'bulb';
    if (p.t === 'switch') return sw[p.id] ?? p.on;
    if (p.t === 'wire') return true;
    if (p.t === 'thing') return THINGS[p.thing].stuff === 'kov';
    return false;
  };
  const build = (p: CircuitPart, a: number, b: number) => {
    if (p.t === 'series') {
      let from = a;
      p.parts.forEach((c, i) => {
        const to = i === p.parts.length - 1 ? b : nodes++;
        build(c, from, to);
        from = to;
      });
    } else if (p.t === 'parallel') {
      for (const c of p.parts) build(c, a, b);
    } else {
      const c = conducts(p);
      if (c === 'bulb') edges.push({ a, b, g: 1, bulb: (p as { id: BulbColor }).id });
      else if (c) edges.push({ a, b, g: 1e6 });
    }
  };
  build(net, 1, 0);
  const n = nodes - 1; // neznámé: uzly 1..nodes-1
  const G = Array.from({ length: n }, () => new Array<number>(n + 1).fill(0));
  const add = (i: number, j: number, g: number) => {
    if (i > 0) G[i - 1][i - 1] += g;
    if (j > 0) G[j - 1][j - 1] += g;
    if (i > 0 && j > 0) {
      G[i - 1][j - 1] -= g;
      G[j - 1][i - 1] -= g;
    }
  };
  for (const e of edges) add(e.a, e.b, e.g);
  for (let i = 1; i < nodes; i++) add(i, 0, 1e-9); // únik, ať soustava jde vyřešit
  // Baterka: zdroj proudu E/r s vnitřním odporem r = 1 mΩ.
  add(1, 0, 1e3);
  G[0][n] += E * 1e3;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(G[r][c]) > Math.abs(G[p][c])) p = r;
    [G[c], G[p]] = [G[p], G[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = G[r][c] / G[c][c];
      for (let k = c; k <= n; k++) G[r][k] -= f * G[c][k];
    }
  }
  const V = (i: number) => (i === 0 ? 0 : G[i - 1][n] / G[i - 1][i - 1]);
  const lit = edges.filter((e) => e.bulb && Math.abs(V(e.a) - V(e.b)) > 0.05 * E).map((e) => e.bulb!);
  return { lit, shorted: V(1) < 0.01 * E };
}

const sameSet = (a: readonly string[], b: readonly string[]) => [...a].sort().join() === [...b].sort().join();

type Circuit = Extract<Visual, { type: 'circuit' }>;
type Wires = Extract<Visual, { type: 'wires' }>;

// ---------------------------------------------------------------------------

describe('Ostrov blesků – dovednosti', () => {
  it('má čtyři dovednosti se správnými úrovněmi a typem myšlení', () => {
    expect(SKILLS.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const s of SKILLS) {
      expect(s.island).toBe('blesky');
      expect(s.levels, s.id).toEqual(EXPECTED[s.id].levels);
      expect(s.ability, s.id).toBe(EXPECTED[s.id].ability);
      expect(s.description.trim(), s.id).toMatch(/\.$/);
      for (const level of s.levels) expect(s.rvp[level]?.length ?? 0, `${s.id} L${level}`).toBeGreaterThan(0);
    }
  });

  for (const s of SKILLS) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 200);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: úlohy z banky jsou platné a jedinečné`, () => {
      for (const level of s.levels) {
        const items = enumerateItems(s.id, level);
        for (const item of items) expect(validateItem(item, s, level)).toEqual([]);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${s.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const s of SKILLS) {
      for (const level of s.levels) expect(s.generate(level, createRng(42))).toEqual(s.generate(level, createRng(42)));
    }
  });
});

describe('Co svítí: výpočet souhlasí s fyzikou', () => {
  it('ve všech obvodech všech dovedností a při každém nastavení vypínačů', () => {
    let checked = 0;
    for (const s of [obvodSkill, vodiceSkill, vypinaceSkill]) {
      for (const level of s.levels) {
        for (const item of sample(s, level, 150)) {
          if (item.visual?.type !== 'circuit') continue;
          for (const net of item.visual.nets) {
            for (const st of [{}, ...allSwitchStates(net)]) {
              const p = physics(net, st);
              expect(sameSet(litBulbs(net, st), p.lit), `${item.id} ${JSON.stringify(st)}`).toBe(true);
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(2000);
  });

  it('kovy vedou, ostatní věci ne', () => {
    for (const [k, t] of Object.entries(THINGS)) expect(t.conducts, k).toBe(t.stuff === 'kov');
  });
});

describe('Rozsvítí se?', () => {
  it('odpovědi sedí s fyzikou: kolik svítí, která svítí, svítí X?', () => {
    const seen = new Set<string>();
    for (const level of obvodSkill.levels) {
      for (const item of sample(obvodSkill, level)) {
        const v = item.visual as Circuit;
        const a = item.answer;
        if (v?.type !== 'circuit') throw new Error(`${item.id}: čekám obvod`);
        if (v.nets.length > 1) {
          // Ve kterém obvodu svítí: svítí právě jeden.
          const lit = v.nets.map((n) => physics(n).lit.length > 0);
          expect(lit.filter(Boolean).length, item.id).toBe(1);
          if (a.kind === 'choice') expect(a.options[a.correct].label, item.id).toBe('ABC'[lit.indexOf(true)]);
          seen.add('ktery');
          continue;
        }
        const net = v.nets[0];
        const p = physics(net);
        if (item.prompt === 'Kolik žárovek svítí?') {
          expect(a.kind === 'number' && a.correct, item.id).toBe(p.lit.length);
          seen.add('kolik');
        }
        const one = item.prompt.match(/^Svítí (\S+) žárovka\?$/);
        if (one && a.kind === 'choice') {
          const color = bulbsOf(net).find((b) => item.prompt.includes(`Svítí ${['červená', 'modrá', 'zelená', 'žlutá'][['r', 'b', 'g', 'y'].indexOf(b)]} `))!;
          expect(a.options[a.correct].label, item.id).toBe(p.lit.includes(color) ? 'Svítí' : 'Nesvítí');
          seen.add('svitix');
        }
        if (item.prompt.endsWith('Rozsvítí se žárovka?') && a.kind === 'choice') {
          expect(a.options[a.correct].label, item.id).toBe(p.lit.length ? 'Svítí' : 'Nesvítí');
          seen.add('sviti');
        }
        if (item.prompt === 'Která žárovka svítí?' && a.kind === 'choice') {
          expect(p.lit.length, item.id).toBe(1);
          expect(a.options[a.correct].speak, item.id).toBe(['červená', 'modrá', 'zelená', 'žlutá'][['r', 'b', 'g', 'y'].indexOf(p.lit[0])]);
          seen.add('ktera');
        }
      }
    }
    expect([...seen].sort()).toEqual(['kolik', 'ktera', 'ktery', 'sviti', 'svitix']);
  });

  it('vysvětlení zmíní každou žárovku a svítící vyjmenuje správně', () => {
    const NAME: Record<BulbColor, string> = { r: 'červená', b: 'modrá', g: 'zelená', y: 'žlutá' };
    for (const level of [3, 4, 5] as Level[]) {
      for (const item of sample(obvodSkill, level, 100)) {
        const net = (item.visual as Circuit).nets[0];
        const text = explainNet(net);
        const { lit, shorted } = physics(net);
        if (shorted) {
          expect(text, item.id).toMatch(/zkrat/);
          continue;
        }
        for (const b of bulbsOf(net)) {
          if (lit.includes(b)) expect(text.split('.')[0], item.id).toContain(NAME[b]);
          else expect(text, item.id).toMatch(new RegExp(`${NAME[b].replace(/^./, (c) => c.toUpperCase())} nesvítí`));
        }
      }
    }
  });

  it('na úrovni 4–5 bývá žárovka přemostěná drátem nebo vypínačem', () => {
    let bypassed = 0;
    for (const item of sample(obvodSkill, 4)) if (/vedle ní vede/.test(item.explanation)) bypassed++;
    expect(bypassed).toBeGreaterThan(20);
  });
});

describe('Vypínače', () => {
  it('cíl jde splnit, na začátku nesvítí a žádné nastavení neudělá zkrat (fyzikou)', () => {
    for (const level of vypinaceSkill.levels) {
      for (const item of sample(vypinaceSkill, level, 150)) {
        const net = (item.visual as Circuit).nets[0];
        const a = item.answer;
        if (a.kind !== 'switches') throw new Error(`${item.id}: čekám vypínače`);
        const states = allSwitchStates(net);
        expect(states.some((st) => sameSet(physics(net, st).lit, a.target)), item.id).toBe(true);
        expect(states.every((st) => !physics(net, st).shorted), item.id).toBe(true);
        expect(sameSet(physics(net).lit, a.target), item.id).toBe(false);
        const solved = solveSwitches(net, a.target)!;
        expect(sameSet(physics(net, solved).lit, a.target), item.id).toBe(true);
        // Vysvětlení začíná nastavením vypínačů (Play ho ukáže jako řešení).
        const on = switchesOf(net).filter((x) => solved[x.id]).map((x) => x.id);
        expect(item.explanation.startsWith(on.length ? `Zapnuté: ${on.join(', ')}` : 'Všechno vypnuté'), item.id).toBe(true);
      }
    }
  });

  it('úroveň 1–2 začíná se vším vypnutým, od 3 se vypínače musí i vypínat', () => {
    for (const level of [1, 2] as Level[]) {
      for (const item of sample(vypinaceSkill, level, 80)) expect(switchesOf((item.visual as Circuit).nets[0]).every((x) => !x.on), item.id).toBe(true);
    }
    let turnOff = 0;
    for (const item of sample(vypinaceSkill, 4, 150)) {
      const net = (item.visual as Circuit).nets[0];
      const solved = solveSwitches(net, (item.answer as { target: BulbColor[] }).target)!;
      if (switchesOf(net).some((x) => x.on && !solved[x.id])) turnOff++;
    }
    expect(turnOff).toBeGreaterThan(20);
  });

  it('náhradní obvody splňují podmínky', () => {
    for (const f of Object.values(FALLBACK)) {
      expect(sameSet(physics(f.net).lit, f.target)).toBe(false);
      expect(allSwitchStates(f.net).some((st) => sameSet(physics(f.net, st).lit, f.target))).toBe(true);
      expect(allSwitchStates(f.net).every((st) => !physics(f.net, st).shorted)).toBe(true);
    }
  });
});

describe('Spoj dráty', () => {
  /** Vlastní kontrola: dílky jsou spojené, když vedou k sobě navzájem.
   *  Správně = baterka leží na kruhu, kde má každý dílek dva sousedy,
   *  a na kruhu jsou všechny žárovky. */
  function closedLoop(v: Wires, rots: number[]): boolean {
    const open = (i: number): number[] => {
      const t = v.tiles[i];
      const r = rots[i] % 4;
      if (t.k === 'empty') return [];
      if (t.k === 'corner') return [r, (r + 1) % 4];
      return [r % 4, (r + 2) % 4];
    };
    const nb = (i: number, d: number) => {
      const x = (i % v.cols) + [0, 1, 0, -1][d];
      const y = Math.floor(i / v.cols) + [-1, 0, 1, 0][d];
      return x < 0 || y < 0 || x >= v.cols || y >= v.rows ? -1 : y * v.cols + x;
    };
    const linked = (i: number) => open(i).map((d) => nb(i, d)).filter((j) => j >= 0 && open(j).some((d) => nb(j, d) === i));
    const battery = v.tiles.findIndex((t) => t.k === 'battery');
    const seen = new Set([battery]);
    const stack = [battery];
    while (stack.length) for (const j of linked(stack.pop()!)) if (!seen.has(j)) (seen.add(j), stack.push(j));
    const cycle = [...seen].every((i) => linked(i).length === 2);
    const bulbs = v.tiles.flatMap((t, i) => (t.k === 'bulb' ? [i] : []));
    return seen.size > 2 && cycle && bulbs.every((b) => seen.has(b));
  }

  it('řešení uzavře kruh přes všechny žárovky, začátek ne', () => {
    for (const level of drateSkill.levels) {
      for (const item of sample(drateSkill, level, 150)) {
        const v = item.visual as Wires;
        const a = item.answer;
        if (a.kind !== 'wires') throw new Error(`${item.id}: čekám dráty`);
        expect(closedLoop(v, a.solution), item.id).toBe(true);
        expect(closedLoop(v, v.tiles.map((t) => t.rot)), item.id).toBe(false);
      }
    }
  });

  it('velikost, počet žárovek a nápověda s počtem špatně otočených dílků', () => {
    const SIZE: Record<number, [number, number, number]> = { 1: [3, 3, 1], 2: [4, 3, 1], 3: [4, 4, 1], 4: [5, 4, 2], 5: [5, 5, 2] };
    for (const level of drateSkill.levels) {
      for (const item of sample(drateSkill, level, 80)) {
        const v = item.visual as Wires;
        const [c, r, b] = SIZE[level];
        expect([v.cols, v.rows], item.id).toEqual([c, r]);
        expect(v.tiles.filter((t) => t.k === 'bulb').length, item.id).toBe(b);
        expect(item.hints[2], item.id).toMatch(/^Špatně otočen(ý je jen 1 dílek|é jsou [234] dílky|ých je \d+ dílků)\.$/);
      }
    }
  });
});

describe('Vede, nebo nevede?', () => {
  it('bouřka: kilometry a sekundy (3 sekundy na kilometr)', () => {
    for (const item of sample(vodiceSkill, 4)) {
      const a = item.answer;
      if (a.kind !== 'number') continue;
      // „napočítala 9 sekund“ → km, „je 2 km daleko“ → sekundy
      const km = Number(item.prompt.match(/je (\d+) km daleko/)?.[1]);
      const s = Number(item.prompt.match(/\} (\d+) sekund/)?.[1]);
      if (km) expect(a.correct, item.id).toBe(km * 3);
      else expect(a.correct, item.id).toBe(s / 3);
      expect(s || km, item.id).toBeTruthy();
    }
  });
});

describe('Ostrov blesků – karty a mise', () => {
  it('projdou kontrolou a jsou u všech čtyř dovedností', () => {
    expect(validateCards(bleskyCards, SKILLS)).toEqual([]);
    expect(validateMissions(bleskyMissions, 'blesky')).toEqual([]);
    expect(new Set(bleskyCards.map((c) => c.skillId)).size).toBe(4);
    expect(bleskyMissions.length).toBeGreaterThanOrEqual(5);
  });

  it('fakta: napětí, Volta, Diviš, Edison', () => {
    const text = (id: string) => bleskyCards.find((c) => c.id === id)!.text;
    expect(text('blesky.vodice.baterka-zasuvka')).toMatch(/4,5 voltu.*230 voltů/);
    expect(text('blesky.obvod.volta')).toMatch(/kolem roku 1800/);
    expect(text('blesky.vodice.divis')).toMatch(/1754 v Příměticích u Znojma/);
    expect(bleskyCards.find((c) => c.id === 'blesky.obvod.edison')!.fix?.evidence).toMatch(/Joseph Swan.*1879/);
  });

  it('mise s baterkou zdůrazní, že se zásuvkou ne', () => {
    expect(bleskyMissions.find((m) => m.id === 'blesky.vede-nevede')!.parentTip).toMatch(/nikdy se zásuvkou/);
  });
});
