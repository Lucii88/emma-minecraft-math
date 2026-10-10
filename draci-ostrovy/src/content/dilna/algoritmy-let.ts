// Naprogramuj let draka: hráčka skládá šipky a drak podle nich letí po
// mřížce do hnízda. Úlohy jsou jen generované – každý svět se ověří hledáním
// nejkratší cesty, neřešitelné a triviální se zahodí. Klíč úlohy je odvozený
// z obsahu světa (velikost, drak, hnízdo, skály, vajíčka).

import { bankSkill, type ProgramSpec } from '../../core/bank';
import { count } from '../../core/czech';
import { MAX_LOOP_STEPS, MOVE_WORD, arrows, fewestBlocks, fly, repeatPattern, runsOf, sameCell } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { Cell, KnowledgeCard, Move } from '../../core/types';
import {
  KROK,
  describeFlight,
  describeRuns,
  distance,
  gridOf,
  lengthDifficulty,
  manhattan,
  orderLengths,
  randomWorld,
  rocksHint,
  shortestCount,
  solve,
  whereIsGoal,
  worldKey,
  type World,
} from './algoritmy-mrizka';

const ID = 'dilna.let';

type LetLevel = 1 | 2 | 3 | 4 | 5 | 6;

const PRIKAZ = ['příkaz', 'příkazy', 'příkazů'] as const;
const SIPKA = ['šipku', 'šipky', 'šipek'] as const;

interface Found {
  w: World;
  best: Move[];
}

/** Nejkratší let v mezích [lo, hi] (včetně). */
const within = (best: Move[], lo: number, hi: number) => best.length >= lo && best.length <= hi;

/** Aspoň jedna skála leží v obdélníku mezi drakem a hnízdem. */
function rockInBox(w: World): boolean {
  const [x0, x1] = [Math.min(w.dragon.x, w.goal.x), Math.max(w.dragon.x, w.goal.x)];
  const [y0, y1] = [Math.min(w.dragon.y, w.goal.y), Math.max(w.dragon.y, w.goal.y)];
  return w.rocks.some((r) => r.x >= x0 && r.x <= x1 && r.y >= y0 && r.y <= y1);
}

/** Program „nejdřív vodorovně, pak svisle“ (nebo naopak) bez ohledu na skály. */
function straightPath(w: World, horizontalFirst: boolean): Move[] {
  const dx = w.goal.x - w.dragon.x;
  const dy = w.goal.y - w.dragon.y;
  const h: Move[] = Array(Math.abs(dx)).fill(dx > 0 ? 'R' : 'L');
  const v: Move[] = Array(Math.abs(dy)).fill(dy > 0 ? 'D' : 'U');
  return horizontalFirst ? [...h, ...v] : [...v, ...h];
}

/** Vajíčko je potřeba: buď nutí k objížďce, nebo ho jde nejkratší cestou minout. */
function eggMatters(w: World, best: Move[]): boolean {
  const plain = distance(w, w.dragon, w.goal);
  if (plain === null) return false;
  if (best.length > plain) return true;
  const avoid = distance({ ...w, rocks: [...w.rocks, ...w.eggs] }, w.dragon, w.goal);
  return avoid === plain;
}

/** Náhodný svět pro úroveň (zatím bez kontroly). */
const MAKE: Record<LetLevel, (rng: Rng) => World> = {
  1: (rng) => randomWorld(rng, rng.pick([3, 4]), 3, 0, 0),
  2: (rng) => randomWorld(rng, 4, 4, rng.int(1, 3), 0),
  3: (rng) => randomWorld(rng, 5, 5, rng.int(2, 4), 1),
  4: (rng) => {
    const [cols, rows] = rng.pick([[5, 5], [6, 5], [5, 6], [6, 6]] as const);
    return randomWorld(rng, cols, rows, rng.int(3, 6), 2);
  },
  5: (rng) => randomWorld(rng, 6, 6, rng.int(10, 14), 0),
  6: (rng) => randomWorld(rng, 7, 7, rng.int(12, 17), rng.chance(0.7) ? 3 : 2),
};

/** Je svět pro úroveň vhodný? Vrací nejkratší let, jinak null. */
export const LET_CHECK: Record<LetLevel, (w: World) => Move[] | null> = {
  // 3 × 3 nebo 4 × 3 bez skal, 2–3 kroky.
  1: (w) => {
    if (w.rows !== 3 || (w.cols !== 3 && w.cols !== 4) || w.rocks.length || w.eggs.length) return null;
    const best = solve(w);
    return best && within(best, 2, 3) ? best : null;
  },
  // 4 × 4, 1–3 skály, nutná zatáčka a skála v cestě aspoň jedné rovné trase.
  2: (w) => {
    if (w.cols !== 4 || w.rows !== 4 || w.rocks.length < 1 || w.rocks.length > 3 || w.eggs.length) return null;
    if (w.dragon.x === w.goal.x || w.dragon.y === w.goal.y || !rockInBox(w)) return null;
    if (fly(w, straightPath(w, true)).ok && fly(w, straightPath(w, false)).ok) return null;
    const best = solve(w);
    return best && within(best, 3, 6) ? best : null;
  },
  // 5 × 5, skály a jedno vajíčko, které je potřeba vzít v úvahu.
  3: (w) => {
    if (w.cols !== 5 || w.rows !== 5 || !w.rocks.length || w.eggs.length !== 1) return null;
    const best = solve(w);
    return best && within(best, 5, 9) && eggMatters(w, best) ? best : null;
  },
  // 5 × 5 až 6 × 6, dvě vajíčka, na pořadí sbírání záleží.
  4: (w) => {
    if (w.cols < 5 || w.cols > 6 || w.rows < 5 || w.rows > 6 || w.eggs.length !== 2) return null;
    const best = solve(w);
    if (!best || !within(best, 6, 11)) return null;
    const [a, b] = orderLengths(w);
    return a !== b ? best : null;
  },
  // 6 × 6 bludiště, nejkratší let je aspoň o 2 kroky delší než přímá vzdálenost.
  5: (w) => {
    if (w.cols !== 6 || w.rows !== 6 || w.rocks.length < 10 || w.eggs.length) return null;
    const best = solve(w);
    if (!best || !within(best, 8, 12)) return null;
    return best.length >= manhattan(w.dragon, w.goal) + 2 ? best : null;
  },
  // 7 × 7 bludiště, 2–3 vajíčka nedaleko draka i hnízda, nejlepší pořadí sbírání je jediné.
  6: (w) => {
    if (w.cols !== 7 || w.rows !== 7 || w.rocks.length < 12 || w.eggs.length < 2 || w.eggs.length > 3) return null;
    if (w.eggs.some((e) => manhattan(e, w.dragon) > 5 || manhattan(e, w.goal) > 5)) return null;
    const best = solve(w);
    if (!best || !within(best, 9, 12)) return null;
    return orderLengths(w).filter((l) => l === best.length).length === 1 ? best : null;
  },
};

/** Ověřené světy pro případ, že by náhodné pokusy nic nenašly (test je kontroluje). */
export const LET_FALLBACK: Record<LetLevel, World> = {
  1: { cols: 3, rows: 3, dragon: { x: 0, y: 0 }, goal: { x: 2, y: 1 }, rocks: [], eggs: [] },
  2: { cols: 4, rows: 4, dragon: { x: 0, y: 0 }, goal: { x: 2, y: 2 }, rocks: [{ x: 1, y: 0 }], eggs: [] },
  3: { cols: 5, rows: 5, dragon: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, rocks: [{ x: 2, y: 2 }, { x: 3, y: 1 }], eggs: [{ x: 4, y: 0 }] },
  4: {
    cols: 5, rows: 5, dragon: { x: 0, y: 2 }, goal: { x: 4, y: 2 },
    rocks: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }], eggs: [{ x: 1, y: 0 }, { x: 3, y: 1 }],
  },
  5: {
    cols: 6, rows: 6, dragon: { x: 0, y: 3 }, goal: { x: 2, y: 5 },
    rocks: [
      { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 1, y: 3 },
      { x: 5, y: 3 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 0, y: 5 }, { x: 5, y: 5 },
    ],
    eggs: [],
  },
  6: {
    cols: 7, rows: 7, dragon: { x: 4, y: 1 }, goal: { x: 4, y: 2 },
    rocks: [
      { x: 3, y: 0 }, { x: 6, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 3 },
      { x: 1, y: 4 }, { x: 6, y: 4 }, { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 },
    ],
    eggs: [{ x: 6, y: 1 }, { x: 6, y: 3 }],
  },
};

function findWorld(level: LetLevel, rng: Rng): Found {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const w = MAKE[level](rng);
    const best = LET_CHECK[level](w);
    if (best) return { w, best };
  }
  const w = LET_FALLBACK[level];
  return { w, best: solve(w)! };
}

const PROMPT: Record<LetLevel, (n: number, eggs: number) => string> = {
  1: () => 'Poskládej šipky tak, aby drak doletěl do hnízda.',
  2: () => 'Poskládej šipky tak, aby drak doletěl do hnízda.',
  3: () => 'Cestou seber vajíčko a doleť do hnízda.',
  4: () => 'Cestou seber obě vajíčka a doleť do hnízda.',
  5: (n) => `Doleť bludištěm do hnízda. Máš jen ${count(n, KROK)}.`,
  6: (n, eggs) => `Seber ${eggs === 2 ? 'obě vajíčka' : 'všechna tři vajíčka'} a doleť do hnízda. Máš jen ${count(n, KROK)}.`,
};

const RANGE: Record<LetLevel, [number, number]> = { 1: [2, 3], 2: [3, 6], 3: [5, 9], 4: [6, 11], 5: [8, 12], 6: [9, 12] };

function hintsFor(level: LetLevel, w: World): string[] {
  switch (level) {
    case 1:
      return ['Spočítej políčka k hnízdu.', whereIsGoal(w.dragon, w.goal)];
    case 2:
      return ['Spočítej políčka k hnízdu.', rocksHint(w), whereIsGoal(w.dragon, w.goal)];
    case 3:
      return ['Nejdřív leť k vajíčku, pak do hnízda.', rocksHint(w), 'Spočítej políčka k vajíčku a od něj k hnízdu.'];
    case 4:
      return ['Rozmysli si, které vajíčko sebereš dřív.', 'Zkus spočítat kroky pro obě pořadí vajíček.', rocksHint(w)];
    case 5:
      return ['Než začneš skládat šipky, projeď cestu prstem.', 'Slepé uličky ti kroky jen spotřebují.', 'Zkus hledat cestu pozpátku – od hnízda k drakovi.'];
    case 6:
      return ['Rozmysli si, v jakém pořadí vajíčka sebereš.', 'Zkus porovnat, kolik kroků stojí různá pořadí.', 'Každé zbytečné vracení stojí kroky.'];
  }
}

function letSpec(level: LetLevel, rng: Rng): ProgramSpec {
  const { w, best } = findWorld(level, rng);
  const n = best.length;
  const exact = level >= 5;
  return {
    kind: 'program',
    key: worldKey(w),
    prompt: PROMPT[level](n, w.eggs.length),
    grid: gridOf(w),
    ...(exact ? { maxSteps: n } : {}),
    hints: hintsFor(level, w),
    // „třeba“ jen tehdy, když je nejkratších letů víc.
    explain: `Nejkratší let má ${count(n, KROK)}${shortestCount(w) > 1 ? ', třeba' : ''}: ${describeFlight(w, best)}.`,
    difficulty: lengthDifficulty(n, ...RANGE[level]),
  };
}

const gen = (level: LetLevel) => (rng: Rng) => letSpec(level, rng);

// ---------------------------------------------------------------------------
// Nejvyšší úroveň: příkazy „krok × počet“ (→ ×3) – stejné šipky za sebou se spojí
// do jednoho příkazu a příkazů je málo. Napůl s klíčem a branou.

/** Svět pro příkazy: velká mapa s chodbami, nejméně příkazů 4–7, aspoň dva
 *  dlouhé rovné úseky; s branou jen tehdy, když klíč opravdu musí sebrat. */
export function checkBlocks(w: World): Move[] | null {
  if (w.cols < 7 || w.rows < 7 || w.eggs.length > 2) return null;
  const best = fewestBlocks(w, w.eggs);
  if (!best || best.length < 10 || best.length > 30) return null;
  const runs = runsOf(best);
  if (runs.length < 4 || runs.length > 7 || runs.filter((r) => r.times >= 3).length < 2) return null;
  if (!w.key !== !w.gate) return null;
  if (w.key && w.gate) {
    // Klíč i brána na volném políčku (cestou může drak přeletět i start nebo hnízdo).
    const taken = [w.dragon, w.goal, ...w.rocks, ...w.eggs];
    if (sameCell(w.key, w.gate) || taken.some((c) => sameCell(c, w.key!) || sameCell(c, w.gate!))) return null;
    // Brána musí být na cestě a bez ní by stačilo méně (nebo kratší let).
    let pos = w.dragon;
    const cells = [pos];
    for (const m of best) cells.push((pos = { x: pos.x + (m === 'R' ? 1 : m === 'L' ? -1 : 0), y: pos.y + (m === 'D' ? 1 : m === 'U' ? -1 : 0) }));
    if (!cells.some((c) => sameCell(c, w.gate!))) return null;
    const open = fewestBlocks({ ...w, key: undefined, gate: undefined }, w.eggs);
    if (!open || (runsOf(open).length === runs.length && open.length === best.length)) return null;
    if (sameCell(w.key, w.dragon)) return null;
  }
  return best;
}

function blocksWorld(rng: Rng): World {
  const size = rng.pick([7, 8]);
  const w = randomWorld(rng, size, size, rng.int(10, 18), rng.pick([0, 1, 1, 2]));
  if (!rng.chance(0.55)) return w;
  // Brána na úzkém místě cesty (bez ní se do hnízda nedá), klíč stranou od cesty.
  const best = fewestBlocks(w, w.eggs);
  if (!best) return w;
  let pos = w.dragon;
  const path = [pos];
  for (const m of best) path.push((pos = { x: pos.x + (m === 'R' ? 1 : m === 'L' ? -1 : 0), y: pos.y + (m === 'D' ? 1 : m === 'U' ? -1 : 0) }));
  const onPath = new Set(path.map((c) => `${c.x},${c.y}`));
  const free = (c: Cell) => ![w.dragon, w.goal, ...w.eggs].some((t) => sameCell(t, c));
  const chokes = path.slice(2, -2).filter((c) => free(c) && !fewestBlocks({ ...w, rocks: [...w.rocks, c] }, w.eggs));
  if (!chokes.length) return w;
  const gate = rng.pick(chokes);
  const taken = new Set([w.dragon, w.goal, ...w.rocks, ...w.eggs].map((c) => `${c.x},${c.y}`));
  const keys: Cell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = { x, y };
      if (taken.has(`${x},${y}`) || onPath.has(`${x},${y}`)) continue;
      // Klíč musí jít sebrat, aniž by drak proletěl branou.
      if (fewestBlocks({ ...w, goal: c, rocks: [...w.rocks, gate] })) keys.push(c);
    }
  }
  if (!keys.length) return w;
  return { ...w, key: rng.pick(keys), gate };
}

/** Had: tři chodby tam a zpět, šest příkazů. */
export const BLOCKS_FALLBACK: World = {
  cols: 7, rows: 7, dragon: { x: 0, y: 0 }, goal: { x: 6, y: 6 },
  rocks: [
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
    { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
    { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
  ],
  eggs: [{ x: 3, y: 2 }],
};

function blocksSpec(rng: Rng): ProgramSpec {
  let found: { w: World; best: Move[] } | null = null;
  for (let attempt = 0; attempt < 3000 && !found; attempt++) {
    const w = blocksWorld(rng);
    const best = checkBlocks(w);
    if (best) found = { w, best };
  }
  const { w, best } = found ?? { w: BLOCKS_FALLBACK, best: checkBlocks(BLOCKS_FALLBACK)! };
  const n = runsOf(best).length;
  const eggs = w.eggs.length === 0 ? '' : w.eggs.length === 1 ? ', cestou seber vajíčko' : ', cestou seber obě vajíčka';
  const key = w.key ? ' Nejdřív seber klíč – zavřená brána drak bez klíče nepustí.' : '';
  return {
    kind: 'program',
    key: `prikazy-${worldKey(w)}`,
    prompt: `Doleť do hnízda${eggs}. Máš jen ${count(n, PRIKAZ)}: stejné šipky za sebou se spojí do jednoho příkazu, třeba → ×3.${key}`,
    speak: `Doleť do hnízda${eggs}. Máš jen ${count(n, PRIKAZ)}. Stejné šipky za sebou se spojí do jednoho příkazu, třeba doprava třikrát.${key}`,
    grid: gridOf(w),
    maxSteps: MAX_LOOP_STEPS,
    maxBlocks: n,
    solution: best,
    hints: [
      'Hledej dlouhé rovné chodby – jeden příkaz může letět přes víc políček.',
      'Každá zatáčka je nový příkaz. Čím méně zatáček, tím lépe.',
      w.key ? 'Brána je zavřená, dokud drak nesebere klíč.' : 'Zkus cestu projet prstem a počítej zatáčky.',
    ],
    explain: `Stačí ${count(n, PRIKAZ)}${w.key ? ', nejdřív pro klíč' : ''}: ${describeRuns(best)}.`,
    difficulty: lengthDifficulty(n, 4, 7),
  };
}

// ---------------------------------------------------------------------------
// Nejvyšší úroveň: Opakuj vzor – cesta je schody nebo vlnka, program je jeden blok
// „Opakuj n× (vzor)“. Dítě musí najít, co se opakuje.

/** Vzory, které dávají hezké schody a vlnky (bez otočky zpět). */
const PATTERNS: Move[][] = [
  ['R', 'D'], ['D', 'R'], ['R', 'U'], ['U', 'R'], ['L', 'D'], ['D', 'L'],
  ['R', 'R', 'D'], ['R', 'D', 'D'], ['D', 'R', 'R'], ['D', 'D', 'R'], ['R', 'R', 'U'], ['U', 'U', 'R'], ['L', 'L', 'D'],
  ['R', 'D', 'R', 'U'], ['R', 'U', 'R', 'D'], ['D', 'R', 'U', 'R'], ['D', 'L', 'D', 'R'], ['R', 'R', 'D', 'D'], ['D', 'D', 'R', 'R'],
];
export const LOOP = { maxPattern: 4, maxRepeat: 6 };

/** Nejkratší vzor (a počet opakování), kterým se dá doletět – pro kontrolu. */
export function findLoop(w: World): { pattern: Move[]; times: number } | null {
  const moves: Move[] = ['U', 'R', 'D', 'L'];
  const all: Move[][] = [[]];
  for (let len = 1; len <= LOOP.maxPattern; len++) {
    const next: Move[][] = [];
    for (const p of all.filter((x) => x.length === len - 1)) for (const m of moves) next.push([...p, m]);
    all.push(...next);
  }
  for (const pattern of all.filter((p) => p.length)) {
    for (let times = 2; times <= LOOP.maxRepeat; times++) {
      if (fly(w, repeatPattern(pattern, times), w.eggs).ok) return { pattern, times };
    }
  }
  return null;
}

function loopWorld(rng: Rng): { w: World; pattern: Move[]; times: number } | null {
  const size = rng.pick([7, 8]);
  const pattern = rng.pick(PATTERNS);
  const times = rng.int(3, 5);
  const program = repeatPattern(pattern, times);
  if (program.length < 8 || program.length > 24) return null;
  // Start tak, aby se celá cesta vešla do mapy.
  let x = 0;
  let y = 0;
  const rel = [{ x, y }];
  for (const m of program) {
    x += m === 'R' ? 1 : m === 'L' ? -1 : 0;
    y += m === 'D' ? 1 : m === 'U' ? -1 : 0;
    rel.push({ x, y });
  }
  const [minX, maxX] = [Math.min(...rel.map((c) => c.x)), Math.max(...rel.map((c) => c.x))];
  const [minY, maxY] = [Math.min(...rel.map((c) => c.y)), Math.max(...rel.map((c) => c.y))];
  if (maxX - minX >= size || maxY - minY >= size) return null;
  const ox = rng.int(-minX, size - 1 - maxX);
  const oy = rng.int(-minY, size - 1 - maxY);
  const path = rel.map((c) => ({ x: c.x + ox, y: c.y + oy }));
  const onPath = new Set(path.map((c) => `${c.x},${c.y}`));
  if (onPath.size !== path.length) return null;
  // Skály kolem cesty, aby byly vidět schody, a pár dalších.
  const rocks: Cell[] = [];
  for (let yy = 0; yy < size; yy++) {
    for (let xx = 0; xx < size; xx++) {
      if (onPath.has(`${xx},${yy}`)) continue;
      const near = path.some((c) => Math.abs(c.x - xx) + Math.abs(c.y - yy) === 1);
      if (rng.chance(near ? 0.45 : 0.08)) rocks.push({ x: xx, y: yy });
    }
  }
  const inner = path.slice(2, -2);
  const eggs = rng.shuffle(inner).slice(0, rng.pick([1, 2]));
  const w: World = { cols: size, rows: size, dragon: path[0], goal: path[path.length - 1], rocks, eggs };
  return fly(w, program, eggs).ok ? { w, pattern, times } : null;
}

export const LOOP_FALLBACK: { w: World; pattern: Move[]; times: number } = {
  w: { cols: 7, rows: 7, dragon: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, rocks: [{ x: 0, y: 1 }, { x: 2, y: 0 }, { x: 1, y: 2 }, { x: 3, y: 1 }, { x: 2, y: 3 }, { x: 4, y: 2 }, { x: 3, y: 4 }], eggs: [{ x: 2, y: 2 }] },
  pattern: ['R', 'D'],
  times: 4,
};

function loopSpec(rng: Rng): ProgramSpec {
  let found: { w: World; pattern: Move[]; times: number } | null = null;
  for (let attempt = 0; attempt < 500 && !found; attempt++) found = loopWorld(rng);
  const { w, pattern, times } = found ?? LOOP_FALLBACK;
  const words = pattern.map((m) => MOVE_WORD[m]).join(', ');
  return {
    kind: 'program',
    key: `opakuj-${worldKey(w)}`,
    prompt: 'Najdi, co se na cestě opakuje. Poskládej vzor do bloku Opakuj a nastav, kolikrát se má opakovat.',
    grid: gridOf(w),
    maxSteps: LOOP.maxPattern * LOOP.maxRepeat,
    loop: LOOP,
    solution: repeatPattern(pattern, times),
    hints: [
      'Podívej se na tvar cesty – jsou to schody, nebo vlnka?',
      `Vzor má ${count(pattern.length, SIPKA)}.`,
      `Vzor začíná ${MOVE_WORD[pattern[0]]}.`,
    ],
    explain: `Vzor ${arrows(pattern)} se opakuje ${times}×: Opakuj ${times}× (${words}).`,
    difficulty: lengthDifficulty(pattern.length * times, 8, 20),
  };
}


export const letSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Naprogramuj let draka',
  description: 'Skládá z šipek program pro let po mřížce, obletí skály, sbírá vajíčka, hledá nejkratší cestu, šetří příkazy (→ ×3), sbírá klíč k bráně a hledá opakující se vzor (Opakuj 4×).',
  rvp: {
    1: ['I-5-2-01'],
    2: ['I-5-2-01'],
    3: ['I-5-2-01'],
    4: ['I-5-2-01', 'I-5-2-03'],
    5: ['I-5-2-01', 'I-5-2-03'],
    6: ['I-5-2-03'],
  },
  ability: 'prostorove',
  // Úroveň 5 = bludiště a vajíčka s přesným počtem kroků (dřívější 5 a 6),
  // úroveň 6 = příkazy „→ ×3“ s klíčem a branou, nebo blok Opakuj.
  gen: {
    1: gen(1),
    2: gen(2),
    3: gen(3),
    4: gen(4),
    5: (rng) => (rng.chance(0.5) ? letSpec(5, rng) : letSpec(6, rng)),
    6: (rng) => (rng.chance(0.5) ? blocksSpec(rng) : loopSpec(rng)),
  },
});

export const letCards: KnowledgeCard[] = [
  {
    id: `${ID}.zelva-logo`,
    skillId: ID,
    level: 1,
    emoji: '🐢',
    title: 'Želva, která kreslí',
    text: 'Programovací jazyk Logo vznikl pro děti už v roce 1967. Děti v něm dávají želvě příkazy, česky třeba DOPŘEDU a VPRAVO, a želva podle nich kreslí obrázky.',
  },
  {
    id: `${ID}.slovo-robot`,
    skillId: ID,
    level: 2,
    emoji: '🤖',
    title: 'Odkud je slovo robot',
    text: 'Slovo robot vymyslel malíř Josef Čapek. Jeho bratr Karel Čapek ho použil ve hře R.U.R. z roku 1920 a odtud se slovo rozšířilo do celého světa.',
  },
  {
    id: `${ID}.vozitko-mars`,
    skillId: ID,
    level: 4,
    emoji: '🚀',
    title: 'Program pro vozítko na Marsu',
    text: 'Signál ze Země letí k Marsu 3 až 22 minut – podle toho, jak daleko od sebe planety zrovna jsou. Vozítko na Marsu proto nejde řídit jako autíčko na ovladači: lidé mu pošlou program a vozítko ho samo provede.',
  },
  {
    id: `${ID}.nejkratsi-cesta`,
    skillId: ID,
    level: 6,
    emoji: '🗺️',
    title: 'Nejkratší cesta za dvacet minut',
    text: 'Postup, jak v mapě najít nejkratší cestu, vymyslel Edsger Dijkstra v roce 1956 – prý za dvacet minut u šálku kávy. Podobné postupy dnes používají navigace v telefonech.',
  },
];
