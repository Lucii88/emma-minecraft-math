// Naprogramuj let draka: hráčka skládá šipky a drak podle nich letí po
// mřížce do hnízda. Úlohy jsou jen generované – každý svět se ověří hledáním
// nejkratší cesty, neřešitelné a triviální se zahodí. Klíč úlohy je odvozený
// z obsahu světa (velikost, drak, hnízdo, skály, vajíčka).

import { bankSkill, type ProgramSpec } from '../../core/bank';
import { count } from '../../core/czech';
import { fly } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard, Move } from '../../core/types';
import {
  KROK,
  describeFlight,
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

export const letSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Naprogramuj let draka',
  description: 'Skládá z šipek program pro let po mřížce, obletí skály, sbírá vajíčka a hledá nejkratší cestu.',
  rvp: {
    1: ['I-5-2-01'],
    2: ['I-5-2-01'],
    3: ['I-5-2-01'],
    4: ['I-5-2-01', 'I-5-2-03'],
    5: ['I-5-2-01', 'I-5-2-03'],
  },
  ability: 'prostorove',
  gen: { 1: gen(1), 2: gen(2), 3: gen(3), 4: gen(4), 5: gen(5), 6: gen(6) },
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
