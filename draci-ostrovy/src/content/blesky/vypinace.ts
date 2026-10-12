// Vypínače: hráčka přepíná vypínače a pak zapne proud. Má svítit přesně to,
// co chce drak. Za sebou musí být zapnuté všechny vypínače, vedle sebe stačí
// jeden; vypínač vedle žárovky ji zhasne (proud jde raději přes vypínač).

import { bankSkill, type SwitchesSpec } from '../../core/bank';
import { BULB_NAME, allSwitchStates, bulbsOf, litBulbs, solveSwitches, switchesOf } from '../../core/circuit';
import { count } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { BulbColor, CircuitPart, Level } from '../../core/types';
import { bulb, everySwitchMatters, explainNet, neverShorts, netKey, randomNet, ser, sw, type NetOptions } from './common';

const VYPINAC = ['vypínač', 'vypínače', 'vypínačů'] as const;

interface Plan {
  opts: NetOptions;
  /** Výchozí stav: všechno vypnuté, nebo náhodně. */
  allOff: boolean;
  /** Nejméně přepnutí k cíli. */
  minFlips: number;
  /** Musí v obvodu být vypínač, který žárovku zhasne. */
  needBypass?: boolean;
}

const PLAN: Record<1 | 2 | 3 | 4 | 5, Plan> = {
  1: { opts: { bulbs: [1, 1], switches: [2, 2], depth: 1 }, allOff: true, minFlips: 1 },
  2: { opts: { bulbs: [2, 2], switches: [2, 3], depth: 1 }, allOff: true, minFlips: 1 },
  3: { opts: { bulbs: [2, 3], switches: [3, 3], depth: 2 }, allOff: false, minFlips: 2 },
  4: { opts: { bulbs: [2, 3], switches: [3, 4], depth: 2, bypass: true }, allOff: false, minFlips: 2, needBypass: true },
  5: { opts: { bulbs: [3, 3], switches: [4, 4], depth: 2, bypass: true }, allOff: false, minFlips: 3 },
};

/** Vypínač, jehož zapnutí někdy zhasne žárovku (přemostění). */
function hasBypass(net: CircuitPart): boolean {
  return allSwitchStates(net).some((st) =>
    switchesOf(net).some((s) => !st[s.id] && litBulbs(net, st).some((b) => !litBulbs(net, { ...st, [s.id]: true }).includes(b))),
  );
}

const setAll = (net: CircuitPart, on: (id: string) => boolean): CircuitPart => {
  const walk = (p: CircuitPart): CircuitPart =>
    p.t === 'switch' ? { ...p, on: on(p.id) } : p.t === 'series' || p.t === 'parallel' ? { ...p, parts: p.parts.map(walk) } : p;
  return walk(net);
};

function flipsTo(net: CircuitPart, target: BulbColor[]): number | null {
  const st = solveSwitches(net, target);
  return st ? switchesOf(net).filter((s) => st[s.id] !== s.on).length : null;
}

/** Cíl slovy: „Rozsviť jen modrou žárovku.“ */
function goalText(net: CircuitPart, target: BulbColor[]): string {
  const all = bulbsOf(net);
  if (all.length === 1) return 'Rozsviť žárovku.';
  if (target.length === all.length) return 'Rozsviť všechny žárovky.';
  const names = target.map((b) => BULB_NAME[b].acc);
  const off = all.filter((b) => !target.includes(b)).map((b) => BULB_NAME[b].nom);
  if (target.length === 1) return `Rozsviť jen ${names[0]} žárovku.`;
  return `Rozsviť ${names.slice(0, -1).join(', ')} a ${names[names.length - 1]} žárovku, ${off.join(' a ')} ať nesvítí.`;
}

export const FALLBACK: Record<1 | 2 | 3 | 4 | 5, { net: CircuitPart; target: BulbColor[] }> = {
  1: { net: ser(bulb('y'), sw('A', false), sw('B', false)), target: ['y'] },
  2: { net: ser(sw('A', false), { t: 'parallel', parts: [ser(bulb('r'), sw('B', false)), bulb('b')] }), target: ['r', 'b'] },
  3: { net: ser(sw('A', true), { t: 'parallel', parts: [ser(bulb('r'), sw('B', true)), ser(bulb('b'), sw('C', false))] }), target: ['b'] },
  4: { net: ser(bulb('r'), sw('A', false), { t: 'parallel', parts: [bulb('b'), sw('B', true)] }, sw('C', true)), target: ['r', 'b'] },
  5: {
    net: ser(sw('A', false), { t: 'parallel', parts: [ser(bulb('r'), sw('B', true)), ser(bulb('g'), sw('C', false))] }, { t: 'parallel', parts: [bulb('b'), sw('D', true)] }),
    target: ['g', 'b'],
  },
};

function makeSpec(net: CircuitPart, target: BulbColor[]): SwitchesSpec {
  const solved = solveSwitches(net, target)!;
  const sws = switchesOf(net);
  const flips = sws.filter((s) => solved[s.id] !== s.on);
  const done = setAll(net, (id) => solved[id]);
  const onIds = sws.filter((s) => solved[s.id]).map((s) => s.id);
  const offIds = sws.filter((s) => !solved[s.id]).map((s) => s.id);
  return {
    kind: 'switches',
    key: `${netKey(net)}--${[...target].sort().join('')}`,
    prompt: `${goalText(net, target)} Klepnutím vypínač zapneš nebo vypneš, pak pusť proud.`,
    net,
    target,
    hints: [
      'Proud musí oběhnout celý kruh: z baterky přes žárovku zpátky do baterky.',
      bulbsOf(net).length > 1 ? 'Za sebou musí být zapnuté všechny vypínače. Vedle sebe stačí jedna cesta.' : 'Které vypínače leží v cestě proudu?',
      `Stačí přepnout ${count(flips.length, VYPINAC)}.`,
    ],
    // Začátek vysvětlení = nastavení vypínačů (Play ho ukáže jako řešení, viz switchesText).
    explain: `${onIds.length ? `Zapnuté: ${onIds.join(', ')}${offIds.length ? `, vypnuté: ${offIds.join(', ')}` : ''}` : 'Všechno vypnuté'}. ${explainNet(done)}`,
    difficulty: Math.min(0.5, (flips.length - 1) * 0.2 - 0.2),
  };
}

function switchesSpec(level: 1 | 2 | 3 | 4 | 5, rng: Rng): SwitchesSpec {
  const plan = PLAN[level];
  for (let attempt = 0; attempt < 400; attempt++) {
    const raw = randomNet(rng, plan.opts);
    if (!raw || !neverShorts(raw) || !everySwitchMatters(raw)) continue;
    if (plan.needBypass && !hasBypass(raw)) continue;
    const net = plan.allOff ? setAll(raw, () => false) : raw;
    const bulbs = bulbsOf(net);
    // Každá žárovka jde rozsvítit i zhasnout.
    if (!bulbs.every((b) => allSwitchStates(net).some((st) => litBulbs(net, st).includes(b)))) continue;
    const now = litBulbs(net).sort().join();
    const targets = new Map<string, BulbColor[]>();
    for (const st of allSwitchStates(net)) {
      const lit = litBulbs(net, st);
      if (lit.length && [...lit].sort().join() !== now) targets.set([...lit].sort().join(), lit);
    }
    const ok = [...targets.values()].filter((t) => (flipsTo(net, t) ?? 0) >= plan.minFlips);
    if (!ok.length) continue;
    // Od třetí úrovně častěji „jen některé“ než „všechny“.
    const some = ok.filter((t) => t.length < bulbs.length);
    return makeSpec(net, rng.pick(level >= 3 && some.length && rng.chance(0.75) ? some : ok));
  }
  const f = FALLBACK[level];
  return makeSpec(f.net, f.target);
}

const gen = (level: 1 | 2 | 3 | 4 | 5) => (rng: Rng) => switchesSpec(level, rng);

export const vypinaceSkill = bankSkill({
  id: 'blesky.vypinace',
  island: 'blesky',
  name: 'Vypínače',
  description: 'Přepíná vypínače tak, aby svítily jen správné žárovky: vypínače za sebou (musí být zapnuté všechny), vedle sebe (stačí jeden) a vypínač, který žárovku přemostí. Nejdřív plánuje, pak zkouší proud.',
  rvp: {
    1: ['ČJS-3-4-03'],
    2: ['ČJS-3-4-03'],
    3: ['ČJS-3-4-03', 'I-5-2-04'],
    4: ['ČJS-5-4-06', 'I-5-2-04'],
    5: ['ČJS-5-4-06', 'I-5-2-04'],
  } satisfies Partial<Record<Level, string[]>>,
  ability: 'usuzovani',
  gen: { 1: gen(1), 2: gen(2), 3: gen(3), 4: gen(4), 5: gen(5) },
});

