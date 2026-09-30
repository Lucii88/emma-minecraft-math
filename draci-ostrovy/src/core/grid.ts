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
}

/** Nejdelší program, který jde na obrazovce poskládat. */
export const MAX_PROGRAM_STEPS = 12;

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
  /** Jak let skončil: v cíli, nárazem do skály, vyletěním z mapy, nebo jinde. */
  end: 'goal' | 'rock' | 'edge' | 'elsewhere';
  /** Index kroku, na kterém drak narazil (jinak délka programu). */
  stoppedAt: number;
  /** Sebraná vajíčka (indexy do `collect`) v pořadí sebrání. */
  collected: number[];
  /** Doletěl do cíle a sebral všechno. */
  ok: boolean;
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
  pickUp(pos);
  for (let i = 0; i < program.length; i++) {
    const d = DELTA[program[i]];
    const next = { x: pos.x + d.x, y: pos.y + d.y };
    if (!insideGrid(world, next)) return { path, end: 'edge', stoppedAt: i, collected, ok: false };
    if (rocks.has(cellKey(next))) return { path, end: 'rock', stoppedAt: i, collected, ok: false };
    pos = next;
    path.push(pos);
    pickUp(pos);
  }
  const atGoal = sameCell(pos, world.goal);
  return {
    path,
    end: atGoal ? 'goal' : 'elsewhere',
    stoppedAt: program.length,
    collected,
    ok: atGoal && collected.length === collect.length,
  };
}

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
  const k = collect.length;
  const full = (1 << k) - 1;
  const maskAt = (c: Cell) => collect.reduce((m, e, i) => (sameCell(e, c) ? m | (1 << i) : m), 0);
  const idx = (c: Cell, mask: number) => (c.y * world.cols + c.x) * (full + 1) + mask;

  const size = world.cols * world.rows * (full + 1);
  const prev = new Int32Array(size).fill(-2);
  const prevMove = new Int8Array(size).fill(-1);
  const start = idx(world.dragon, maskAt(world.dragon));
  prev[start] = -1;
  const queue: [Cell, number][] = [[world.dragon, maskAt(world.dragon)]];

  for (let head = 0; head < queue.length; head++) {
    const [pos, mask] = queue[head];
    const here = idx(pos, mask);
    if (mask === full && sameCell(pos, world.goal)) {
      const moves: Move[] = [];
      for (let s = here; prev[s] !== -1; s = prev[s]) moves.push(MOVES[prevMove[s]]);
      return moves.reverse();
    }
    MOVES.forEach((m, mi) => {
      const next = { x: pos.x + DELTA[m].x, y: pos.y + DELTA[m].y };
      if (!insideGrid(world, next) || rocks.has(cellKey(next))) return;
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
