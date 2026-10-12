// Let draka po mřížce (Vynálezecká dílna, mapy): simulace programu a hledání
// nejkratší cesty. Úlohy, validace i obrazovka počítají stejně, takže co hra
// uzná za správné, to drak na obrazovce opravdu doletí.

import type { Cell, Move } from './types';

export interface GridWorld {
  cols: number;
  rows: number;
  dragon: Cell;
  goal: Cell;
  rocks?: Cell[];
  /** Klíč a brána: branou drak proletí, až když má klíč. */
  key?: Cell;
  gate?: Cell;
}

/** Nejdelší program po krocích, který jde na obrazovce poskládat. */
export const MAX_PROGRAM_STEPS = 12;
/** Nejdelší let u programů z příkazů s opakováním (→ ×3, Opakuj 4×). */
export const MAX_LOOP_STEPS = 40;

export const MOVES: readonly Move[] = ['U', 'R', 'D', 'L'];

export const DELTA: Record<Move, Cell> = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};

export const ARROW: Record<Move, string> = { U: '↑', R: '→', D: '↓', L: '←' };

/** Jak se krok řekne na obyčejné mřížce a na mapě se světovými stranami. */
export const MOVE_WORD: Record<Move, string> = { U: 'nahoru', R: 'doprava', D: 'dolů', L: 'doleva' };
export const COMPASS_WORD: Record<Move, string> = { U: 'na sever', R: 'na východ', D: 'na jih', L: 'na západ' };

export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const cellKey = (c: Cell) => `${c.x},${c.y}`;
export const insideGrid = (w: { cols: number; rows: number }, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < w.cols && c.y < w.rows;

/** Šipky programu za sebou: „→ → ↑“. */
export const arrows = (program: readonly Move[]) => program.map((m) => ARROW[m]).join(' ');

export interface Flight {
  /** Políčka, kterými drak proletěl, od startu. Při nárazu končí posledním
   *  políčkem před překážkou. */
  path: Cell[];
  /** Jak let skončil: v cíli, nárazem do skály nebo do zavřené brány,
   *  vyletěním z mapy, nebo jinde. */
  end: 'goal' | 'rock' | 'gate' | 'edge' | 'elsewhere';
  /** Index kroku, na kterém drak narazil (jinak délka programu). */
  stoppedAt: number;
  /** Sebraná vajíčka (indexy do `collect`) v pořadí sebrání. */
  collected: number[];
  /** Doletěl do cíle a sebral všechno. */
  ok: boolean;
  /** Krok, po kterém drak sebral klíč (0 = stál na něm od startu). */
  keyAt?: number;
}

/** Provede program. Drak letí krok po kroku; skála nebo okraj mapy let
 *  ukončí. Uspěje, jen když poslední krok skončí v cíli a cestou sebral
 *  všechna vajíčka – cílem se smí i proletět a vrátit se. */
export function fly(world: GridWorld, program: readonly Move[], collect: readonly Cell[] = []): Flight {
  const rocks = new Set((world.rocks ?? []).map(cellKey));
  const collected: number[] = [];
  const pickUp = (c: Cell) => {
    collect.forEach((e, i) => {
      if (sameCell(e, c) && !collected.includes(i)) collected.push(i);
    });
  };
  let pos = world.dragon;
  const path = [pos];
  let keyAt: number | undefined = world.key && sameCell(world.key, pos) ? 0 : undefined;
  const withKey = () => (keyAt !== undefined ? { keyAt } : {});
  pickUp(pos);
  for (let i = 0; i < program.length; i++) {
    const d = DELTA[program[i]];
    const next = { x: pos.x + d.x, y: pos.y + d.y };
    if (!insideGrid(world, next)) return { path, end: 'edge', stoppedAt: i, collected, ok: false, ...withKey() };
    if (rocks.has(cellKey(next))) return { path, end: 'rock', stoppedAt: i, collected, ok: false, ...withKey() };
    if (world.gate && sameCell(world.gate, next) && keyAt === undefined) return { path, end: 'gate', stoppedAt: i, collected, ok: false };
    pos = next;
    path.push(pos);
    pickUp(pos);
    if (world.key && keyAt === undefined && sameCell(world.key, pos)) keyAt = i + 1;
  }
  const atGoal = sameCell(pos, world.goal);
  return {
    path,
    end: atGoal ? 'goal' : 'elsewhere',
    stoppedAt: program.length,
    collected,
    ok: atGoal && collected.length === collect.length,
    ...withKey(),
  };
}

/** Program z bloků „krok × počet“ (→ ×3): stejné kroky za sebou. */
export function runsOf(program: readonly Move[]): { move: Move; times: number }[] {
  const runs: { move: Move; times: number }[] = [];
  for (const m of program) {
    const last = runs[runs.length - 1];
    if (last && last.move === m) last.times++;
    else runs.push({ move: m, times: 1 });
  }
  return runs;
}

/** Vzor zopakovaný n-krát: Opakuj 3× (→ ↓) = → ↓ → ↓ → ↓. */
export const repeatPattern = (pattern: readonly Move[], times: number): Move[] => Array.from({ length: times }, () => pattern).flat();

/** Je program správnou odpovědí? (neprázdný, nejvýš maxSteps kroků, doletí) */
export function programSolves(world: GridWorld, program: readonly Move[], maxSteps: number, collect: readonly Cell[] = []): boolean {
  return program.length > 0 && program.length <= maxSteps && fly(world, program, collect).ok;
}

/** Nejkratší program, který doletí do cíle a sebere všechna vajíčka
 *  (prohledávání do šířky přes stavy „políčko + sebraná vajíčka“).
 *  Vrací null, pokud cesta neexistuje. Při více nejkratších cestách vrací
 *  vždy tutéž (pořadí kroků U, R, D, L). */
export function shortestProgram(world: GridWorld, collect: readonly Cell[] = []): Move[] | null {
  if (!insideGrid(world, world.dragon) || !insideGrid(world, world.goal)) return null;
  const rocks = new Set((world.rocks ?? []).map(cellKey));
  if (rocks.has(cellKey(world.dragon)) || rocks.has(cellKey(world.goal))) return null;
  // Klíč je v masce navíc jako bit k: branou jen s ním, v cíli ho není třeba mít.
  const k = collect.length;
  const full = (1 << k) - 1;
  const keyBit = world.key && world.gate ? 1 << k : 0;
  const maskAt = (c: Cell) =>
    collect.reduce((m, e, i) => (sameCell(e, c) ? m | (1 << i) : m), 0) | (keyBit && sameCell(world.key!, c) ? keyBit : 0);
  const states = (full | keyBit) + 1;
  const idx = (c: Cell, mask: number) => (c.y * world.cols + c.x) * states + mask;

  const size = world.cols * world.rows * states;
  const prev = new Int32Array(size).fill(-2);
  const prevMove = new Int8Array(size).fill(-1);
  const start = idx(world.dragon, maskAt(world.dragon));
  prev[start] = -1;
  const queue: [Cell, number][] = [[world.dragon, maskAt(world.dragon)]];

  for (let head = 0; head < queue.length; head++) {
    const [pos, mask] = queue[head];
    const here = idx(pos, mask);
    if ((mask & full) === full && sameCell(pos, world.goal)) {
      const moves: Move[] = [];
      for (let s = here; prev[s] !== -1; s = prev[s]) moves.push(MOVES[prevMove[s]]);
      return moves.reverse();
    }
    MOVES.forEach((m, mi) => {
      const next = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
      if (!insideGrid(world, next) || rocks.has(cellKey(next))) return;
      if (keyBit && sameCell(world.gate!, next) && !(mask & keyBit)) return;
      const nextMask = mask | maskAt(next);
      const s = idx(next, nextMask);
      if (prev[s] !== -2) return;
      prev[s] = here;
      prevMove[s] = mi;
      queue.push([next, nextMask]);
    });
  }
  return null;
}

/** Let s nejmenším počtem příkazů „krok × počet“ (zatáčka = nový příkaz),
 *  při shodě ten kratší. Hledání přes stavy „políčko + sebrané + směr“,
 *  kde rovně je zdarma a zatáčka stojí příkaz. null = nedá se doletět. */
export function fewestBlocks(world: GridWorld, collect: readonly Cell[] = []): Move[] | null {
  if (!insideGrid(world, world.dragon) || !insideGrid(world, world.goal)) return null;
  const rocks = new Set((world.rocks ?? []).map(cellKey));
  const k = collect.length;
  const full = (1 << k) - 1;
  const keyBit = world.key && world.gate ? 1 << k : 0;
  const maskAt = (c: Cell) =>
    collect.reduce((m, e, i) => (sameCell(e, c) ? m | (1 << i) : m), 0) | (keyBit && sameCell(world.key!, c) ? keyBit : 0);
  const states = (full | keyBit) + 1;
  // stav = (políčko, maska, směr 0–3 nebo 4 = ještě bez kroku)
  const id = (c: Cell, mask: number, dir: number) => ((c.y * world.cols + c.x) * states + mask) * 5 + dir;
  const size = world.cols * world.rows * states * 5;
  const cost = new Float64Array(size).fill(Infinity);
  const prev = new Int32Array(size).fill(-1);
  const startMask = maskAt(world.dragon);
  const start = id(world.dragon, startMask, 4);
  // Cena = příkazy * 1000 + kroky (nejdřív méně příkazů, pak kratší let).
  cost[start] = 0;
  // Halda podle ceny (Dijkstra).
  const heap: [number, number][] = [[0, start]];
  const push = (c: number, st: number) => {
    heap.push([c, st]);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const cellOf = (st: number) => {
    const c = Math.floor(st / 5 / states);
    return { x: c % world.cols, y: Math.floor(c / world.cols) };
  };
  while (heap.length) {
    const [c0, s] = pop();
    if (c0 > cost[s]) continue;
    const pos = cellOf(s);
    const mask = Math.floor(s / 5) % states;
    const dir = s % 5;
    if ((mask & full) === full && sameCell(pos, world.goal)) {
      const moves: Move[] = [];
      for (let t = s; t !== start; t = prev[t]) moves.push(MOVES[t % 5]);
      return moves.reverse();
    }
    MOVES.forEach((m, mi) => {
      const next = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
      if (!insideGrid(world, next) || rocks.has(cellKey(next))) return;
      if (keyBit && sameCell(world.gate!, next) && !(mask & keyBit)) return;
      const t = id(next, mask | maskAt(next), mi);
      const c = cost[s] + (mi === dir ? 0 : 1000) + 1;
      if (c < cost[t]) {
        cost[t] = c;
        prev[t] = s;
        push(c, t);
      }
    });
  }
  return null;
}
