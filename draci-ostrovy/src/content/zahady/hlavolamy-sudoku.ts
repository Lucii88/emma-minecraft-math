// Dračí sudoku: 4 × 4 s obrázky (L1–L3), 4 × 4 s čísly (L4), 6 × 6 s čísly
// (L5–L6). Hráčka doplňuje jedno políčko s otazníkem.
//
// Každá úloha vznikne z náhodně vyplněné mřížky. Hodnotu na otazníku musí jít
// odvodit postupným doplňováním políček, kde zbývá jediná možnost, a navíc to
// ověří prohledávání (backtracking): jiná hodnota na otazníku nejde doplnit
// do platné mřížky.

import type { ChoiceSpec, Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, Level } from '../../core/types';
import { ORDINAL_LOC, listCz, picOption, type Pic } from './hlavolamy-spolecne';

export interface Geometry {
  size: number;
  /** Šířka a výška bloku (4 × 4: 2 × 2, 6 × 6: 3 sloupce × 2 řádky). */
  bw: number;
  bh: number;
}

export const G4: Geometry = { size: 4, bw: 2, bh: 2 };
export const G6: Geometry = { size: 6, bw: 3, bh: 2 };

const rowOf = (g: Geometry, i: number) => Math.floor(i / g.size);
const colOf = (g: Geometry, i: number) => i % g.size;
const blockOf = (g: Geometry, i: number) => Math.floor(rowOf(g, i) / g.bh) * (g.size / g.bw) + Math.floor(colOf(g, i) / g.bw);

type Unit = 'row' | 'col' | 'block';

function unitCells(g: Geometry, unit: Unit, i: number): number[] {
  const all = Array.from({ length: g.size * g.size }, (_, j) => j);
  if (unit === 'row') return all.filter((j) => rowOf(g, j) === rowOf(g, i));
  if (unit === 'col') return all.filter((j) => colOf(g, j) === colOf(g, i));
  return all.filter((j) => blockOf(g, j) === blockOf(g, i));
}

const PEERS = new Map<number, number[][]>();

/** Sousedé políčka: stejný řádek, sloupec nebo blok (bez políčka samého). */
export function peers(g: Geometry): number[][] {
  let p = PEERS.get(g.size);
  if (!p) {
    p = Array.from({ length: g.size * g.size }, (_, i) => {
      const set = new Set([...unitCells(g, 'row', i), ...unitCells(g, 'col', i), ...unitCells(g, 'block', i)]);
      set.delete(i);
      return [...set];
    });
    PEERS.set(g.size, p);
  }
  return p;
}

function candidates(g: Geometry, grid: number[], i: number): number[] {
  const used = new Set(peers(g)[i].map((j) => grid[j]));
  return Array.from({ length: g.size }, (_, k) => k + 1).filter((v) => !used.has(v));
}

/** Náhodně vyplněná platná mřížka (0 = nic, jinak 1 … size). */
function randomSolution(g: Geometry, rng: Rng): number[] {
  const cells = g.size * g.size;
  const grid = new Array<number>(cells).fill(0);
  const values = Array.from({ length: g.size }, (_, k) => k + 1);
  const fill = (i: number): boolean => {
    if (i === cells) return true;
    const used = new Set(peers(g)[i].map((j) => grid[j]));
    for (const v of rng.shuffle(values)) {
      if (used.has(v)) continue;
      grid[i] = v;
      if (fill(i + 1)) return true;
      grid[i] = 0;
    }
    return false;
  };
  if (!fill(0)) throw new Error('sudoku: mřížka nejde vyplnit');
  return grid;
}

/** Existuje doplnění mřížky? (prohledávání s nejméně možnostmi napřed) */
function solvable(g: Geometry, grid: number[]): boolean {
  let best = -1;
  let bestC: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 0) continue;
    const c = candidates(g, grid, i);
    if (c.length === 0) return false;
    if (best < 0 || c.length < bestC.length) {
      best = i;
      bestC = c;
      if (c.length === 1) break;
    }
  }
  if (best < 0) return true;
  for (const v of bestC) {
    grid[best] = v;
    const ok = solvable(g, grid);
    grid[best] = 0;
    if (ok) return true;
  }
  return false;
}

/** Všechny hodnoty, které může mít políčko `ask` v nějakém platném doplnění. */
export function askValues(g: Geometry, givens: readonly number[], ask: number): number[] {
  const out: number[] = [];
  for (const v of candidates(g, givens as number[], ask)) {
    const grid = givens.slice();
    grid[ask] = v;
    if (solvable(g, grid)) out.push(v);
  }
  return out;
}

/** Postupné doplňování „jediné možnosti“ po kolech. Vrací kolo, ve kterém se
 *  doplní otazník, a pro každé doplněné políčko jeho kolo a hodnotu. */
function singles(g: Geometry, givens: readonly number[], ask: number, maxRounds = 8): { depth: number; round: Map<number, number>; known: number[] } | null {
  const known = givens.slice();
  const round = new Map<number, number>();
  for (let r = 1; r <= maxRounds; r++) {
    const found: [number, number][] = [];
    for (let i = 0; i < known.length; i++) {
      if (known[i] !== 0) continue;
      const c = candidates(g, known, i);
      if (c.length === 1) found.push([i, c[0]]);
    }
    if (!found.length) return null;
    for (const [i, v] of found) {
      known[i] = v;
      round.set(i, r);
    }
    if (known[ask] !== 0) return { depth: r, round, known };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Obrázky a texty

const SETS: { key: string; pics: Pic[] }[] = [
  { key: 'a', pics: [{ e: '🐉', name: 'drak' }, { e: '🔥', name: 'oheň' }, { e: '💧', name: 'kapka' }, { e: '🌿', name: 'lístek' }] },
  { key: 'b', pics: [{ e: '⭐', name: 'hvězda' }, { e: '🌙', name: 'měsíc' }, { e: '☀️', name: 'slunce' }, { e: '☁️', name: 'mrak' }] },
  { key: 'c', pics: [{ e: '🍎', name: 'jablko' }, { e: '🍐', name: 'hruška' }, { e: '🍋', name: 'citron' }, { e: '🍇', name: 'hrozen' }] },
  { key: 'd', pics: [{ e: '🐟', name: 'ryba' }, { e: '🐸', name: 'žába' }, { e: '🐢', name: 'želva' }, { e: '🐌', name: 'šnek' }] },
  { key: 'e', pics: [{ e: '🐞', name: 'beruška' }, { e: '🐝', name: 'včela' }, { e: '🦋', name: 'motýl' }, { e: '🐛', name: 'housenka' }] },
  { key: 'f', pics: [{ e: '🌸', name: 'kvítek' }, { e: '🍄', name: 'houba' }, { e: '🌵', name: 'kaktus' }, { e: '🌻', name: 'slunečnice' }] },
];

/** Jak se hodnoty ukazují a čtou: obrázky, nebo čísla. */
interface Look {
  key: string;
  pics?: Pic[];
}

const cellOf = (look: Look, v: number): string | number | null => (v === 0 ? null : look.pics ? look.pics[v - 1].e : v);
const nameOf = (look: Look, v: number): string => (look.pics ? look.pics[v - 1].name : String(v));
const optionOf = (look: Look, v: number): ChoiceOption => (look.pics ? picOption(look.pics[v - 1]) : { label: String(v) });

/** „ve druhém řádku a třetím sloupci“ */
function where(g: Geometry, i: number): string {
  const r = rowOf(g, i);
  const v = r === 1 || r === 2 || r === 3 ? 've' : 'v';
  return `${v} ${ORDINAL_LOC[r]} řádku a ${ORDINAL_LOC[colOf(g, i)]} sloupci`;
}

function describeLine(look: Look, grid: readonly number[], cells: number[], ask: number): string {
  return cells.map((j) => (j === ask ? 'otazník' : grid[j] === 0 ? 'prázdné' : nameOf(look, grid[j]))).join(', ');
}

/** Hodnoty v seznamu: „drak, oheň a kapka“ nebo „čísla 1, 3 a 4“. */
function valueList(look: Look, values: number[]): string {
  const sorted = [...values].sort((a, b) => a - b);
  const words = sorted.map((v) => nameOf(look, v));
  if (look.pics) return listCz(words);
  return `${sorted.length === 1 ? 'číslo' : 'čísla'} ${listCz(words)}`;
}

/** „je drak“ / „jsou drak a oheň“ / „jsou čísla 1 a 3“. */
const presence = (look: Look, values: number[]) => `${values.length === 1 ? 'je' : 'jsou'} ${valueList(look, values)}`;

// ---------------------------------------------------------------------------
// Úrovně

interface Puzzle {
  g: Geometry;
  sol: number[];
  givens: number[];
  ask: number;
  /** Čím je otazník určený (kvůli nápovědě a vysvětlení). */
  how: 'row' | 'col' | 'block' | 'rowcol' | 'union' | 'chain';
}

const givenIn = (givens: readonly number[], cells: number[], ask: number) => cells.filter((j) => j !== ask && givens[j] !== 0);

function addRandomGivens(rng: Rng, givens: number[], sol: number[], pool: number[], k: number) {
  for (const j of rng.shuffle(pool).slice(0, k)) givens[j] = sol[j];
}

/** L1: celý řádek kromě otazníku. */
function levelRow(rng: Rng): Puzzle | null {
  const g = G4;
  const sol = randomSolution(g, rng);
  const ask = rng.int(0, 15);
  const givens = new Array<number>(16).fill(0);
  for (const j of unitCells(g, 'row', ask)) if (j !== ask) givens[j] = sol[j];
  const rest = Array.from({ length: 16 }, (_, j) => j).filter((j) => givens[j] === 0 && j !== ask);
  addRandomGivens(rng, givens, sol, rest, rng.int(3, 6));
  return { g, sol, givens, ask, how: 'row' };
}

/** L2: celý sloupec nebo blok, ale řádek neúplný. */
function levelColOrBlock(rng: Rng): Puzzle | null {
  const g = G4;
  const sol = randomSolution(g, rng);
  const ask = rng.int(0, 15);
  const unit: Unit = rng.chance(0.5) ? 'col' : 'block';
  const givens = new Array<number>(16).fill(0);
  for (const j of unitCells(g, unit, ask)) if (j !== ask) givens[j] = sol[j];
  const row = unitCells(g, 'row', ask);
  const rest = Array.from({ length: 16 }, (_, j) => j).filter((j) => givens[j] === 0 && j !== ask && !row.includes(j));
  addRandomGivens(rng, givens, sol, rest, rng.int(2, 5));
  if (givenIn(givens, row, ask).length === 0 && rng.chance(0.5)) {
    const j = rng.pick(row.filter((k) => k !== ask && givens[k] === 0));
    givens[j] = sol[j];
  }
  if (givenIn(givens, row, ask).length >= 3) return null;
  return { g, sol, givens, ask, how: unit };
}

/** L3: dvě políčka v řádku a chybějící obrázek ve sloupci. */
function levelRowCol(rng: Rng): Puzzle | null {
  const g = G4;
  const sol = randomSolution(g, rng);
  const ask = rng.int(0, 15);
  const givens = new Array<number>(16).fill(0);
  const row = unitCells(g, 'row', ask).filter((j) => j !== ask);
  const col = unitCells(g, 'col', ask).filter((j) => j !== ask);
  const block = unitCells(g, 'block', ask).filter((j) => j !== ask);
  const [r1, r2, r3] = rng.shuffle(row);
  givens[r1] = sol[r1];
  givens[r2] = sol[r2];
  const x = sol[r3]; // tuhle hodnotu musí prozradit sloupec
  const cx = col.find((j) => sol[j] === x)!;
  givens[cx] = sol[cx];
  if (rng.chance(0.5)) {
    const extra = col.find((j) => j !== cx);
    if (extra !== undefined) givens[extra] = sol[extra];
  }
  const peersSet = new Set([...row, ...col, ...block, ask]);
  const rest = Array.from({ length: 16 }, (_, j) => j).filter((j) => !peersSet.has(j));
  addRandomGivens(rng, givens, sol, rest, rng.int(2, 4));
  if (givenIn(givens, row, ask).length !== 2) return null;
  if (givenIn(givens, col, ask).length > 2 || givenIn(givens, block, ask).length > 2) return null;
  const seen = new Set([...row, ...col].filter((j) => givens[j] !== 0).map((j) => givens[j]));
  if (seen.size !== 3) return null;
  return { g, sol, givens, ask, how: 'rowcol' };
}

/** Odebírá zadaná políčka, dokud otazník jde odvodit nejvýš za `maxDepth` kol. */
function carve(rng: Rng, g: Geometry, target: number, maxDepth: number): { sol: number[]; givens: number[]; ask: number; depth: number } | null {
  const cells = g.size * g.size;
  const sol = randomSolution(g, rng);
  const ask = rng.int(0, cells - 1);
  let givens = sol.slice();
  givens[ask] = 0;
  let count = cells - 1;
  for (const j of rng.shuffle(Array.from({ length: cells }, (_, k) => k))) {
    if (count <= target) break;
    if (j === ask) continue;
    const next = givens.slice();
    next[j] = 0;
    const s = singles(g, next, ask);
    if (s && s.depth <= maxDepth) {
      givens = next;
      count--;
    }
  }
  const s = singles(g, givens, ask);
  if (!s) return null;
  return { sol, givens, ask, depth: s.depth };
}

/** Nejvýš tolik pomocných políček smí vysvětlení vyjmenovat. Delší řetěz by
 *  se musel zkrátit a věta „na otazník zbude jen X“ by pak neplatila. */
const MAX_CHAIN_STEPS = 3;

function levelChain(rng: Rng, g: Geometry, target: number, minDepth: number, maxDepth: number): Puzzle | null {
  const c = carve(rng, g, target, maxDepth);
  if (!c || c.depth < minDepth) return null;
  const steps = chainSteps(g, c.givens, c.ask);
  if (!steps.length || steps.length > MAX_CHAIN_STEPS) return null;
  return { g, sol: c.sol, givens: c.givens, ask: c.ask, how: 'chain' };
}

function levelUnion(rng: Rng): Puzzle | null {
  const c = carve(rng, G6, rng.int(14, 20), 1);
  if (!c || c.depth !== 1) return null;
  const row = unitCells(G6, 'row', c.ask);
  const how = new Set(givenIn(c.givens, row, c.ask).map((j) => c.givens[j])).size === 5 ? 'row' : 'union';
  return { g: G6, sol: c.sol, givens: c.givens, ask: c.ask, how };
}

// ---------------------------------------------------------------------------
// Sestavení úlohy

/** Pomocná políčka, která je třeba doplnit před otazníkem (v pořadí). */
function chainSteps(g: Geometry, givens: readonly number[], ask: number): number[] {
  const s = singles(g, givens, ask);
  if (!s) return [];
  const order: number[] = [];
  const explainCell = (i: number) => {
    const r = s.round.get(i) ?? 0;
    const blocked = new Set(peers(g)[i].filter((j) => givens[j] !== 0).map((j) => givens[j]));
    const need = Array.from({ length: g.size }, (_, k) => k + 1).filter((v) => v !== s.known[i] && !blocked.has(v));
    for (const v of need) {
      const helper = peers(g)[i]
        .filter((j) => givens[j] === 0 && s.known[j] === v && (s.round.get(j) ?? 99) < r)
        .sort((a, b) => (s.round.get(a) ?? 0) - (s.round.get(b) ?? 0))[0];
      if (helper !== undefined) {
        if (!order.includes(helper)) explainCell(helper);
        if (!order.includes(helper)) order.push(helper);
        // stačí jedno pomocné políčko pro každou chybějící hodnotu
        blocked.add(v);
      }
    }
  };
  explainCell(ask);
  return order;
}

function buildSpec(p: Puzzle, look: Look): Spec {
  const { g, givens, ask } = p;
  const n = g.size;
  const ans = p.sol[ask];
  const cells = givens.map((v) => cellOf(look, v));
  const kind = look.pics ? 'každý obrázek' : `každé číslo 1 až ${n}`;
  const piece = g.size === 4 ? 'malém čtverci' : 'malém obdélníku';
  const pieceIn = g.size === 4 ? 'v malém čtverci' : 'v malém obdélníku';
  const question = look.pics ? 'Co patří na otazník?' : 'Které číslo patří na otazník?';
  const prompt = `V každém řádku, sloupci i ${piece} je ${kind} jen jednou. ${question}`;
  const row = unitCells(g, 'row', ask);
  const col = unitCells(g, 'col', ask);
  const block = unitCells(g, 'block', ask);
  const speak = `${prompt} Řádek s otazníkem: ${describeLine(look, givens, row, ask)}. Sloupec s otazníkem shora: ${describeLine(look, givens, col, ask)}.`;

  const valuesIn = (unit: number[]) => [...new Set(givenIn(givens, unit, ask).map((j) => givens[j]))];
  const ansName = nameOf(look, ans);
  const hints: string[] = [];
  let explain: string;
  let difficulty = 0;
  switch (p.how) {
    case 'row':
      hints.push(`V každém řádku je ${kind} jen jednou.`, `Podívej se na řádek s otazníkem. ${look.pics ? 'Který obrázek' : 'Které číslo'} v něm chybí?`);
      explain = `V řádku s otazníkem už ${presence(look, valuesIn(row))}. Chybí jen ${ansName}.`;
      difficulty = g.size === 4 ? -0.3 : -0.1;
      break;
    case 'col':
    case 'block': {
      const unit = p.how === 'col' ? col : block;
      hints.push('Řádek ti tentokrát nestačí. Zkus sloupec a malý čtverec s otazníkem.', `Podívej se na ${p.how === 'col' ? 'sloupec' : 'malý čtverec'} s otazníkem.`);
      explain = `${p.how === 'col' ? 'Ve sloupci' : 'V malém čtverci'} s otazníkem už ${presence(look, valuesIn(unit))}. Chybí jen ${ansName}.`;
      difficulty = 0;
      break;
    }
    case 'rowcol': {
      const inRow = valuesIn(row);
      const inCol = valuesIn(col).filter((v) => !inRow.includes(v));
      hints.push('Podívej se na řádek i sloupec s otazníkem zároveň.', 'Co už je v řádku nebo ve sloupci, na otazník patřit nemůže.');
      explain = `V řádku s otazníkem ${presence(look, inRow)}, ve sloupci ${valueList(look, inCol)}. Na otazník zbývá jen ${ansName}.`;
      difficulty = 0.2;
      break;
    }
    case 'union': {
      const all = [...new Set([...valuesIn(row), ...valuesIn(col), ...valuesIn(block)])];
      hints.push(`V každém řádku, sloupci i ${piece} je ${kind} jen jednou.`, `Vypiš si, co už je v řádku, ve sloupci a ${pieceIn} s otazníkem.`);
      explain = `V řádku, ve sloupci a ${pieceIn} s otazníkem jsou dohromady ${valueList(look, all)}. Chybí jen ${ansName}.`;
      difficulty = 0.1;
      break;
    }
    case 'chain': {
      const steps = chainSteps(g, givens, ask);
      const s = singles(g, givens, ask)!;
      hints.push(
        'Otazník hned nevyřešíš. Najdi políčko, kam patří jen jedna možnost, a začni tam.',
        steps.length ? `Začni políčkem ${where(g, steps[0])}.` : 'Doplňuj jedno políčko po druhém.',
      );
      const parts = steps.map((j, k) => `${k === 0 ? 'Nejdřív doplň' : 'Pak'} políčko ${where(g, j)}: patří tam ${nameOf(look, s.known[j])}.`);
      explain = steps.length
        ? `${parts.join(' ')} Potom na otazník zbude jen ${ansName}.`
        : `Postupně doplňuj políčka s jedinou možností. Na otazník nakonec zbude jen ${ansName}.`;
      difficulty = Math.min(0.5, 0.1 + 0.15 * (s.depth - 1));
      break;
    }
  }

  const wrongValues: number[] = [];
  const pushWrong = (v: number) => {
    if (v !== ans && !wrongValues.includes(v)) wrongValues.push(v);
  };
  const missingRow = Array.from({ length: n }, (_, k) => k + 1).filter((v) => !valuesIn(row).includes(v));
  const missingCol = Array.from({ length: n }, (_, k) => k + 1).filter((v) => !valuesIn(col).includes(v));
  missingRow.forEach(pushWrong);
  missingCol.forEach(pushWrong);
  for (let v = 1; v <= n; v++) pushWrong(v);

  const key = `${look.key}${n}-${givens.join('')}-${ask}`;
  const spec: ChoiceSpec = {
    key,
    prompt,
    speak,
    visual: { type: 'table', cols: n, cells, ask, boxes: [g.bw, g.bh] },
    correct: optionOf(look, ans),
    wrong: wrongValues.slice(0, 3).map((v) => optionOf(look, v)),
    hints,
    explain,
    difficulty: Math.max(-0.5, Math.min(0.5, Math.round(difficulty * 100) / 100)),
  };
  return spec;
}

type Maker = (rng: Rng) => Puzzle | null;

const MAKERS: Record<Level, Maker> = {
  1: levelRow,
  2: levelColOrBlock,
  3: levelRowCol,
  4: (rng) => levelChain(rng, G4, rng.int(5, 7), 2, 2),
  5: levelUnion,
  6: (rng) => levelChain(rng, G6, rng.int(11, 15), 2, 3),
};

function generator(level: Level) {
  return (rng: Rng): Spec => {
    for (let i = 0; i < 200; i++) {
      const p = MAKERS[level](rng);
      if (!p) continue;
      // Pojistka: otazník musí mít v každém platném doplnění stejnou hodnotu.
      const values = askValues(p.g, p.givens, p.ask);
      if (values.length !== 1 || values[0] !== p.sol[p.ask]) continue;
      const look: Look = level <= 3 ? rng.pick(SETS) : { key: 'n' };
      return buildSpec(p, look);
    }
    throw new Error(`zahady.sudoku: úloha úrovně ${level} se nepovedla`);
  };
}

export const SUDOKU_GEN: Partial<Record<Level, (rng: Rng) => Spec>> = {
  1: generator(1),
  2: generator(2),
  3: generator(3),
  4: generator(4),
  5: generator(5),
  6: generator(6),
};
