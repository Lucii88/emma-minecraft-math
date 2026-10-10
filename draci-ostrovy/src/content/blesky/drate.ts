// Spoj dráty: skládačka z dílků drátu. Klepnutím se dílek otočí; proud musí
// oběhnout z plusu baterky přes všechny žárovky zpátky do minusu. Kruh bez
// žárovky je zkrat, kruh jen přes některé žárovky nechá ostatní zhasnuté.

import { bankSkill, type WiresSpec } from '../../core/bank';
import { DIR_DELTA, rotations, tileLinks, traceWires } from '../../core/circuit';
import { count } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { WireTile } from '../../core/types';

const DILEK = ['dílek', 'dílky', 'dílků'] as const;

interface Plan {
  cols: number;
  rows: number;
  /** Délka kruhu bez baterky (políčka). */
  len: [number, number];
  bulbs: number;
  /** Kolik dílků na cestě je špatně otočených (nejméně). */
  wrong: number;
  /** Podíl volných políček s rušivým dílkem. */
  decoys: number;
}

export const DRATE_PLAN: Record<1 | 2 | 3 | 4 | 5, Plan> = {
  1: { cols: 3, rows: 3, len: [5, 7], bulbs: 1, wrong: 2, decoys: 0.2 },
  2: { cols: 4, rows: 3, len: [7, 9], bulbs: 1, wrong: 3, decoys: 0.4 },
  3: { cols: 4, rows: 4, len: [9, 13], bulbs: 1, wrong: 5, decoys: 0.6 },
  4: { cols: 5, rows: 4, len: [11, 15], bulbs: 2, wrong: 6, decoys: 0.7 },
  5: { cols: 5, rows: 5, len: [13, 19], bulbs: 2, wrong: 8, decoys: 0.9 },
};

const opposite = (d: number) => (d + 2) % 4;

/** „Špatně otočené jsou 3 dílky.“ (shoda podle čísla) */
function wrongText(n: number): string {
  if (n === 1) return 'Špatně otočený je jen 1 dílek.';
  if (n >= 2 && n <= 4) return `Špatně otočené jsou ${n} dílky.`;
  return `Špatně otočených je ${n} dílků.`;
}

/** Dílek, který spojí směry a, b (rovný nebo roh) se správným otočením. */
function tileFor(a: number, b: number): WireTile {
  if (opposite(a) === b) return { k: 'straight', rot: Math.min(a, b) % 2 };
  // Roh v rot r vede směry r a r+1.
  const r = (b - a + 4) % 4 === 1 ? a : b;
  return { k: 'corner', rot: r };
}

/** Náhodný kruh: z plusu baterky přes políčka zpátky do minusu.
 *  Vrací políčka kruhu v pořadí (bez baterky). */
function randomLoop(rng: Rng, cols: number, rows: number, battery: number, plus: number, len: [number, number]): number[] | null {
  const xy = (i: number) => [i % cols, Math.floor(i / cols)];
  const step = (i: number, d: number) => {
    const [x, y] = xy(i);
    const nx = x + DIR_DELTA[d][0];
    const ny = y + DIR_DELTA[d][1];
    return nx < 0 || ny < 0 || nx >= cols || ny >= rows ? -1 : ny * cols + nx;
  };
  const start = step(battery, plus);
  const end = step(battery, opposite(plus));
  if (start < 0 || end < 0) return null;
  const want = rng.int(len[0], len[1]);
  const path = [start];
  const used = new Set([battery, start]);
  let budget = 4000;
  const dfs = (at: number): boolean => {
    if (--budget < 0) return false;
    if (at === end) return path.length >= len[0] && path.length <= len[1] && Math.abs(path.length - want) <= 2;
    if (path.length >= len[1]) return false;
    for (const d of rng.shuffle([0, 1, 2, 3])) {
      const n = step(at, d);
      if (n < 0 || used.has(n)) continue;
      used.add(n);
      path.push(n);
      if (dfs(n)) return true;
      path.pop();
      used.delete(n);
    }
    return false;
  };
  return dfs(start) ? path : null;
}

function wiresSpec(level: 1 | 2 | 3 | 4 | 5, rng: Rng): WiresSpec {
  const p = DRATE_PLAN[level];
  const n = p.cols * p.rows;
  for (let attempt = 0; attempt < 300; attempt++) {
    const battery = rng.int(0, n - 1);
    const batteryRot = rng.int(0, 3);
    const plus = batteryRot % 4;
    const loop = randomLoop(rng, p.cols, p.rows, battery, plus, p.len);
    if (!loop) continue;
    // Směry kruhu: odkud proud do políčka přišel a kam odchází.
    const cycle = [battery, ...loop, battery];
    const dirTo = (a: number, b: number) => {
      const dx = (b % p.cols) - (a % p.cols);
      const dy = Math.floor(b / p.cols) - Math.floor(a / p.cols);
      return DIR_DELTA.findIndex(([x, y]) => x === dx && y === dy);
    };
    const solved: WireTile[] = Array.from({ length: n }, () => ({ k: 'empty', rot: 0 }));
    solved[battery] = { k: 'battery', rot: batteryRot, fixed: true };
    loop.forEach((cell, i) => {
      const from = opposite(dirTo(cycle[i], cell));
      const to = dirTo(cell, cycle[i + 2]);
      solved[cell] = tileFor(from, to);
    });
    // Žárovky na rovné úseky, ne hned vedle sebe.
    const straight = loop.filter((c, i) => solved[c].k === 'straight' && i > 0 && i < loop.length - 1);
    if (straight.length < p.bulbs) continue;
    const bulbs = rng.shuffle(straight).slice(0, p.bulbs);
    if (bulbs.length === 2 && Math.abs(loop.indexOf(bulbs[0]) - loop.indexOf(bulbs[1])) < 2) continue;
    for (const b of bulbs) solved[b] = { k: 'bulb', rot: solved[b].rot, fixed: true };
    // Zamíchat: dílky na cestě otočit, volná políčka zaplnit rušivými dílky.
    const tiles: WireTile[] = solved.map((t) => ({ ...t }));
    const turnable = loop.filter((c) => !tiles[c].fixed);
    if (turnable.length < p.wrong) continue;
    const toTurn = new Set(rng.shuffle(turnable).slice(0, Math.max(p.wrong, Math.round(turnable.length * (level >= 3 ? 0.8 : 0.5)))));
    for (const c of toTurn) {
      const k = rotations(tiles[c]);
      tiles[c] = { ...tiles[c], rot: (solved[c].rot + rng.int(1, k - 1)) % 4 };
    }
    for (let c = 0; c < n; c++) {
      if (solved[c].k !== 'empty' || !rng.chance(p.decoys)) continue;
      tiles[c] = { k: rng.chance(0.5) ? 'corner' : 'straight', rot: rng.int(0, 3) };
    }
    const visual = { cols: p.cols, rows: p.rows, tiles };
    const solution = tiles.map((t, i) => (solved[i].k === 'empty' ? t.rot : solved[i].rot));
    if (traceWires({ type: 'wires', ...visual }).end === 'ok') continue;
    if (traceWires({ type: 'wires', ...visual }, solution).end !== 'ok') continue;
    const wrong = loop.filter((c) => tileLinks(tiles[c]).sort().join() !== tileLinks(solved[c]).sort().join()).length;
    const key = tiles.map((t) => (t.k === 'empty' ? '0' : `${t.k[0]}${t.rot % 4}`)).join('');
    return {
      kind: 'wires',
      key: `${p.cols}x${p.rows}-${key}`,
      prompt:
        p.bulbs > 1
          ? 'Otáčej dílky drátu, aby proud oběhl z baterky přes obě žárovky a zpátky. Pak pusť proud.'
          : 'Otáčej dílky drátu, aby proud oběhl z baterky přes žárovku a zpátky. Pak pusť proud.',
      speak: 'Klepnutím dílek otočíš. Spoj dráty tak, aby proud oběhl z baterky přes žárovky a zpátky do baterky. Pak pusť proud.',
      wires: visual,
      solution,
      hints: [
        'Začni u plusu baterky a sleduj drát prstem.',
        p.bulbs > 1 ? 'Kruh musí vést přes obě žárovky, jinak jedna zůstane zhasnutá.' : 'Kruh musí vést přes žárovku – drát kolem ní by byl zkrat.',
        wrongText(wrong),
      ],
      explain: `Proud teče z plusu baterky dráty přes ${p.bulbs > 1 ? 'obě žárovky' : 'žárovku'} a vrací se do minusu. Kruh má ${count(loop.length, DILEK)} a stačilo otočit ${count(wrong, DILEK)}.`,
      difficulty: Math.max(-0.5, Math.min(0.5, (wrong - p.wrong) * 0.1 - 0.1)),
    };
  }
  throw new Error(`blesky.drate L${level}: skládačka se nepovedla`);
}

const gen = (level: 1 | 2 | 3 | 4 | 5) => (rng: Rng) => wiresSpec(level, rng);

export const drateSkill = bankSkill({
  id: 'blesky.drate',
  island: 'blesky',
  name: 'Spoj dráty',
  description: 'Otáčí dílky drátu tak, aby proud oběhl z baterky přes žárovky a zpátky: sleduje cestu, pozná přerušený kruh a zkrat. Prostorová představivost jako u elektro stavebnice.',
  rvp: {
    1: ['ČSP-3-2-01'],
    2: ['ČSP-3-2-01'],
    3: ['ČSP-3-2-01', 'ČJS-3-4-03'],
    4: ['ČSP-5-2-02', 'ČJS-5-4-06'],
    5: ['ČSP-5-2-02', 'ČJS-5-4-06'],
  },
  ability: 'prostorove',
  gen: { 1: gen(1), 2: gen(2), 3: gen(3), 4: gen(4), 5: gen(5) },
});
