// Pomůcky pro úlohy s mřížkou ve Vynálezecké dílně (let draka, chyby
// v programu): klíč odvozený z obsahu světa, náhodné světy, náhodná
// nejkratší cesta a popis programu slovy („2× doprava, pak 1× dolů“).

import { ARROW, DELTA, MOVES, MOVE_WORD, cellKey, fly, insideGrid, sameCell, shortestProgram } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { Cell, Move, Visual } from '../../core/types';

export const KROK = ['krok', 'kroky', 'kroků'] as const;

/** „dvakrát“, „třikrát“… pro předčítání zápisu „3×“. */
export const TIMES_WORD: Record<number, string> = {
  1: 'jednou', 2: 'dvakrát', 3: 'třikrát', 4: 'čtyřikrát', 5: 'pětkrát', 6: 'šestkrát',
  7: 'sedmkrát', 8: 'osmkrát', 9: 'devětkrát', 10: 'desetkrát', 11: 'jedenáctkrát', 12: 'dvanáctkrát',
};

/** Zápis „3×“ v textu k předčítání nahradí slovem „třikrát“. */
export const speakTimes = (text: string) => text.replace(/(\d+)×/g, (_, n: string) => TIMES_WORD[Number(n)] ?? `${n}krát`);

/** Svět úlohy: mřížka s drakem, hnízdem (cílem), skálami a vajíčky. */
export interface World {
  cols: number;
  rows: number;
  dragon: Cell;
  goal: Cell;
  rocks: Cell[];
  eggs: Cell[];
}

type GridVisual = Extract<Visual, { type: 'grid' }>;

/** Políčka seřazená po řádcích – stejný svět má vždy stejný klíč i vizuál. */
export const sortCells = (cells: readonly Cell[]): Cell[] => [...cells].sort((a, b) => a.y - b.y || a.x - b.x);

const code = (c: Cell) => `${c.x}${c.y}`;

/** Klíč světa podle obsahu, např. „5x5-d00-g44-r1223-e31“ (x a y políčka). */
export function worldKey(w: World): string {
  let key = `${w.cols}x${w.rows}-d${code(w.dragon)}-g${code(w.goal)}`;
  if (w.rocks.length) key += `-r${sortCells(w.rocks).map(code).join('')}`;
  if (w.eggs.length) key += `-e${sortCells(w.eggs).map(code).join('')}`;
  return key;
}

/** Program do klíče: „rrdl“. */
export const programKey = (p: readonly Move[]) => p.join('').toLowerCase();

/** Mřížka pro vizuál nebo zadání programu (bez prázdných polí). */
export function gridOf(w: World, path?: Move[]): Omit<GridVisual, 'type'> & { dragon: Cell; goal: Cell } {
  return {
    cols: w.cols,
    rows: w.rows,
    dragon: w.dragon,
    goal: w.goal,
    ...(w.rocks.length ? { rocks: sortCells(w.rocks) } : {}),
    ...(w.eggs.length ? { eggs: sortCells(w.eggs) } : {}),
    ...(path ? { path } : {}),
  };
}

export const manhattan = (a: Cell, b: Cell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Náhodný svět: drak, hnízdo, vajíčka a skály na různých políčkách. */
export function randomWorld(rng: Rng, cols: number, rows: number, rocks: number, eggs: number): World {
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({ x, y });
  const s = rng.shuffle(cells);
  return {
    cols,
    rows,
    dragon: s[0],
    goal: s[1],
    eggs: s.slice(2, 2 + eggs),
    rocks: s.slice(2 + eggs, 2 + eggs + rocks),
  };
}

/** Nejkratší program, který sebere všechna vajíčka a doletí do hnízda. */
export const solve = (w: World) => shortestProgram(w, w.eggs);

/** Délka nejkratší cesty mezi dvěma políčky (skály se obletí), null = nedá se. */
export function distance(w: World, a: Cell, b: Cell): number | null {
  const p = shortestProgram({ cols: w.cols, rows: w.rows, dragon: a, goal: b, rocks: w.rocks });
  return p ? p.length : null;
}

/** Délky letu pro všechna pořadí sbírání vajíček (vajíčka nejsou překážky,
 *  takže nejkratší let = nejkratší z těchto délek). */
export function orderLengths(w: World): number[] {
  const perms = (xs: number[]): number[][] =>
    xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
  return perms(w.eggs.map((_, i) => i)).map((order) => {
    const stops = [w.dragon, ...order.map((i) => w.eggs[i]), w.goal];
    let total = 0;
    for (let i = 1; i < stops.length; i++) {
      const d = distance(w, stops[i - 1], stops[i]);
      if (d === null) return Infinity;
      total += d;
    }
    return total;
  });
}

/** Náhodně vybraná nejkratší cesta (se sbíráním vajíček). Hledání do šířky
 *  přes stavy „políčko + sebraná vajíčka“ a pak náhodná cesta zpět od cíle. */
export function randomShortestProgram(w: World, rng: Rng): Move[] | null {
  const k = w.eggs.length;
  const full = (1 << k) - 1;
  const rocks = new Set(w.rocks.map(cellKey));
  const maskAt = (c: Cell) => w.eggs.reduce((m, e, i) => (sameCell(e, c) ? m | (1 << i) : m), 0);
  const idx = (c: Cell, mask: number) => (c.y * w.cols + c.x) * (full + 1) + mask;
  const free = (c: Cell) => insideGrid(w, c) && !rocks.has(cellKey(c));
  if (!free(w.dragon) || !free(w.goal)) return null;

  const dist = new Int32Array(w.cols * w.rows * (full + 1)).fill(-1);
  const startMask = maskAt(w.dragon);
  dist[idx(w.dragon, startMask)] = 0;
  const queue: [Cell, number][] = [[w.dragon, startMask]];
  for (let head = 0; head < queue.length; head++) {
    const [pos, mask] = queue[head];
    const d = dist[idx(pos, mask)];
    for (const m of MOVES) {
      const next = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
      if (!free(next)) continue;
      const nextMask = mask | maskAt(next);
      const s = idx(next, nextMask);
      if (dist[s] !== -1) continue;
      dist[s] = d + 1;
      queue.push([next, nextMask]);
    }
  }

  let pos = w.goal;
  let mask = full;
  let d = dist[idx(pos, mask)];
  if (d < 0) return null;
  const moves: Move[] = [];
  while (d > 0) {
    const here = maskAt(pos);
    const options: { m: Move; prev: Cell; prevMask: number }[] = [];
    for (const m of MOVES) {
      const prev = { x: pos.x - DELTA[m].x, y: pos.y - DELTA[m].y };
      if (!free(prev)) continue;
      for (const prevMask of new Set([mask, mask & ~here])) {
        if ((prevMask | here) === mask && dist[idx(prev, prevMask)] === d - 1) options.push({ m, prev, prevMask });
      }
    }
    const o = rng.pick(options);
    moves.push(o.m);
    pos = o.prev;
    mask = o.prevMask;
    d--;
  }
  return moves.reverse();
}

/** Kolik různých nejkratších letů svět má (počítá se jen do `cap`, stačí
 *  vědět, jestli je nejkratší let jediný). */
export function shortestCount(w: World, cap = 2): number {
  const full = (1 << w.eggs.length) - 1;
  const rocks = new Set(w.rocks.map(cellKey));
  const maskAt = (c: Cell) => w.eggs.reduce((m, e, i) => (sameCell(e, c) ? m | (1 << i) : m), 0);
  const idx = (c: Cell, mask: number) => (c.y * w.cols + c.x) * (full + 1) + mask;
  const free = (c: Cell) => insideGrid(w, c) && !rocks.has(cellKey(c));
  const size = w.cols * w.rows * (full + 1);
  const dist = new Int32Array(size).fill(-1);
  const ways = new Float64Array(size);
  const start = idx(w.dragon, maskAt(w.dragon));
  dist[start] = 0;
  ways[start] = 1;
  const queue: [Cell, number][] = [[w.dragon, maskAt(w.dragon)]];
  for (let head = 0; head < queue.length; head++) {
    const [pos, mask] = queue[head];
    const here = idx(pos, mask);
    for (const m of MOVES) {
      const next = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
      if (!free(next)) continue;
      const nextMask = mask | maskAt(next);
      const s = idx(next, nextMask);
      if (dist[s] === -1) {
        dist[s] = dist[here] + 1;
        queue.push([next, nextMask]);
      }
      if (dist[s] === dist[here] + 1) ways[s] = Math.min(cap, ways[s] + ways[here]);
    }
  }
  return ways[idx(w.goal, full)];
}

/** Jak vypadá nakreslený program na obrazovce: čára vede i přes skálu (na ní
 *  je ✖), jen z mapy už nevede. Vrací indexy kroků, které vedou na skálu,
 *  do hnízda a ven z mapy (−1 = nevyletí). */
export function drawnPath(w: World, program: readonly Move[]): { rockSteps: number[]; goalSteps: number[]; exitStep: number } {
  const rocks = new Set(w.rocks.map(cellKey));
  const rockSteps: number[] = [];
  const goalSteps: number[] = [];
  let pos = w.dragon;
  for (let i = 0; i < program.length; i++) {
    const next = { x: pos.x + DELTA[program[i]].x, y: pos.y + DELTA[program[i]].y };
    if (!insideGrid(w, next)) return { rockSteps, goalSteps, exitStep: i };
    if (rocks.has(cellKey(next))) rockSteps.push(i);
    if (sameCell(next, w.goal)) goalSteps.push(i);
    pos = next;
  }
  return { rockSteps, goalSteps, exitStep: -1 };
}

/** Všechny záměny jednoho kroku, po kterých program uspěje. */
export function singleFixes(w: World, program: readonly Move[]): { step: number; move: Move }[] {
  const out: { step: number; move: Move }[] = [];
  program.forEach((orig, step) => {
    for (const move of MOVES) {
      if (move === orig) continue;
      const fixed = [...program];
      fixed[step] = move;
      if (fly(w, fixed, w.eggs).ok) out.push({ step, move });
    }
  });
  return out;
}

/** Běhy stejných kroků: → → ↓ = [[R, 2], [D, 1]]. */
export function runsOf(p: readonly Move[]): [Move, number][] {
  const runs: [Move, number][] = [];
  for (const m of p) {
    const last = runs[runs.length - 1];
    if (last && last[0] === m) last[1]++;
    else runs.push([m, 1]);
  }
  return runs;
}

const runText = ([m, n]: [Move, number]) => `${n}× ${MOVE_WORD[m]}`;

/** „a, b, pak c“ */
export function joinPak(parts: string[]): string {
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')}, pak ${parts[parts.length - 1]}`;
}

/** „a, b a c“ */
export function joinA(parts: string[]): string {
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} a ${parts[parts.length - 1]}`;
}

/** Program slovy se sloučenými běhy: „2× doprava, pak 1× dolů“. */
export const describeRuns = (p: readonly Move[]) => joinPak(runsOf(p).map(runText));

const EGG_TARGET = ['k prvnímu vajíčku', 'ke druhému vajíčku', 'ke třetímu vajíčku'];

/** Let slovy po úsecích mezi vajíčky: „2× doprava k vajíčku, pak 1× dolů
 *  do hnízda“. Bez vajíček jen sloučené běhy. */
export function describeFlight(w: World, p: readonly Move[]): string {
  if (!w.eggs.length) return describeRuns(p);
  const legs: string[] = [];
  const taken = new Set<string>();
  let pos = w.dragon;
  let leg: Move[] = [];
  for (const m of p) {
    pos = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
    leg.push(m);
    const egg = w.eggs.find((e) => sameCell(e, pos));
    if (egg && !taken.has(cellKey(egg))) {
      taken.add(cellKey(egg));
      const target = w.eggs.length === 1 ? 'k vajíčku' : EGG_TARGET[taken.size - 1];
      legs.push(`${joinA(runsOf(leg).map(runText))} ${target}`);
      leg = [];
    }
  }
  legs.push(`${joinA(runsOf(leg).map(runText))} do hnízda`);
  return joinPak(legs);
}

/** Šipky programu („→ → ↓“) a totéž slovy k předčítání („doprava, doprava, dolů“). */
export const arrowsText = (p: readonly Move[]) => p.map((m) => ARROW[m]).join(' ');
export const arrowsSpeak = (p: readonly Move[]) => p.map((m) => MOVE_WORD[m]).join(', ');

/** Kde je hnízdo vzhledem k drakovi: „Hnízdo je od draka vpravo dole.“ */
export function whereIsGoal(from: Cell, to: Cell): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx && dy) return `Hnízdo je od draka ${dx > 0 ? 'vpravo' : 'vlevo'} ${dy > 0 ? 'dole' : 'nahoře'}.`;
  if (dx) return `Hnízdo je ${dx > 0 ? 'napravo' : 'nalevo'} od draka.`;
  return `Hnízdo je ${dy > 0 ? 'pod drakem' : 'nad drakem'}.`;
}

/** „v 1. kroku“, „ve 2. kroku“ (ve druhém, třetím, čtvrtém, dvanáctém). */
export const inStep = (n: number) => `${(n >= 2 && n <= 4) || n === 12 ? 've' : 'v'} ${n}. kroku`;

/** Nápověda ke skalám ve správném čísle: „Skálu musíš obletět.“ / „Skály…“ */
export const rocksHint = (w: World) => (w.rocks.length === 1 ? 'Skálu musíš obletět.' : 'Skály musíš obletět.');

/** Jemné odstupňování obtížnosti v úrovni podle délky letu (−0,4 až +0,4). */
export function lengthDifficulty(n: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  const t = Math.min(1, Math.max(0, (n - lo) / (hi - lo)));
  return Math.round((t - 0.5) * 8) / 10;
}
