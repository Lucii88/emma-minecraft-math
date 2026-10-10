// Elektrické obvody pro Ostrov blesků: která žárovka svítí a proč, vypínače
// a skládačka drátů.
//
// Obvod je strom částí za sebou (series) a vedle sebe (parallel), celý
// připojený k baterce. Každá část se proudu jeví jako jedna ze tří věcí:
//   open  – proud neprojde (mezera, vypnutý vypínač, prasklá žárovka, izolant),
//   short – projde bez odporu (drát, zapnutý vypínač),
//   load  – projde přes žárovku.
// Žárovka svítí, když jí teče proud a je na ní napětí: celý obvod je „load“
// a cestou k žárovce ji nic nepřemostí drátem (zkrat) ani nepřeruší.

import type { BulbColor, CircuitPart, Visual, WireTile } from './types';

export const BULB_NAME: Record<BulbColor, { nom: string; acc: string }> = {
  r: { nom: 'červená', acc: 'červenou' },
  b: { nom: 'modrá', acc: 'modrou' },
  g: { nom: 'zelená', acc: 'zelenou' },
  y: { nom: 'žlutá', acc: 'žlutou' },
};

export const BULB_FILL: Record<BulbColor, string> = { r: '#ff6b6b', b: '#4dabf7', g: '#69db7c', y: '#ffd43b' };

/** Předměty do mezery v obvodu. Jen jednoznačné: kovy vedou, plast, guma,
 *  dřevo, papír, látka a vosk ne (tuha, voda, ovoce ani tělo tu nejsou). */
export const THINGS: Record<string, { name: string; acc: string; emoji: string; conducts: boolean; stuff: string }> = {
  lzicka: { name: 'kovová lžička', acc: 'kovovou lžičku', emoji: '🥄', conducts: true, stuff: 'kov' },
  klic: { name: 'klíč', acc: 'klíč', emoji: '🔑', conducts: true, stuff: 'kov' },
  mince: { name: 'mince', acc: 'minci', emoji: '🪙', conducts: true, stuff: 'kov' },
  sponka: { name: 'kancelářská sponka', acc: 'kancelářskou sponku', emoji: '📎', conducts: true, stuff: 'kov' },
  sroubek: { name: 'šroubek', acc: 'šroubek', emoji: '🔩', conducts: true, stuff: 'kov' },
  vidlicka: { name: 'kovová vidlička', acc: 'kovovou vidličku', emoji: '🍴', conducts: true, stuff: 'kov' },
  spendlik: { name: 'zavírací špendlík', acc: 'zavírací špendlík', emoji: '🧷', conducts: true, stuff: 'kov' },
  zvonecek: { name: 'kovový zvoneček', acc: 'kovový zvoneček', emoji: '🔔', conducts: true, stuff: 'kov' },
  drevo: { name: 'kousek dřeva', acc: 'kousek dřeva', emoji: '🪵', conducts: false, stuff: 'dřevo' },
  papir: { name: 'papír', acc: 'papír', emoji: '📄', conducts: false, stuff: 'papír' },
  ponozka: { name: 'ponožka', acc: 'ponožku', emoji: '🧦', conducts: false, stuff: 'látka' },
  balonek: { name: 'balónek', acc: 'balónek', emoji: '🎈', conducts: false, stuff: 'guma' },
  voskovka: { name: 'voskovka', acc: 'voskovku', emoji: '🖍️', conducts: false, stuff: 'vosk' },
  brcko: { name: 'plastové brčko', acc: 'plastové brčko', emoji: '🥤', conducts: false, stuff: 'plast' },
  kartacek: { name: 'zubní kartáček', acc: 'zubní kartáček', emoji: '🪥', conducts: false, stuff: 'plast' },
  puzzle: { name: 'dílek puzzle', acc: 'dílek puzzle', emoji: '🧩', conducts: false, stuff: 'karton' },
};

type Flow = 'open' | 'short' | 'load';

/** Stav vypínačů: přepsané hodnoty podle id (jinak platí `on` z obvodu). */
export type SwitchState = Record<string, boolean>;

const switchOn = (p: { id: string; on: boolean }, sw?: SwitchState) => sw?.[p.id] ?? p.on;

/** Jak se část jeví proudu. */
export function flowOf(p: CircuitPart, sw?: SwitchState): Flow {
  switch (p.t) {
    case 'bulb':
      return p.broken ? 'open' : 'load';
    case 'switch':
      return switchOn(p, sw) ? 'short' : 'open';
    case 'wire':
      return 'short';
    case 'gap':
      return 'open';
    case 'thing':
      return THINGS[p.thing]?.conducts ? 'short' : 'open';
    case 'series': {
      const f = p.parts.map((c) => flowOf(c, sw));
      return f.includes('open') ? 'open' : f.includes('load') ? 'load' : 'short';
    }
    case 'parallel': {
      const f = p.parts.map((c) => flowOf(c, sw));
      return f.includes('short') ? 'short' : f.includes('load') ? 'load' : 'open';
    }
  }
}

/** Žárovky obvodu v pořadí, jak jsou nakreslené. */
export function bulbsOf(p: CircuitPart): BulbColor[] {
  if (p.t === 'bulb') return [p.id];
  if (p.t === 'series' || p.t === 'parallel') return p.parts.flatMap(bulbsOf);
  return [];
}

/** Vypínače obvodu v pořadí, jak jsou nakreslené. */
export function switchesOf(p: CircuitPart): { id: string; on: boolean }[] {
  if (p.t === 'switch') return [{ id: p.id, on: p.on }];
  if (p.t === 'series' || p.t === 'parallel') return p.parts.flatMap(switchesOf);
  return [];
}

/** Rozměr kresby v políčkách: za sebou se šířky sčítají, vedle sebe výšky. */
export function netSize(p: CircuitPart): { w: number; h: number } {
  if (p.t === 'series') {
    const s = p.parts.map(netSize);
    return { w: s.reduce((a, b) => a + b.w, 0), h: Math.max(...s.map((x) => x.h)) };
  }
  if (p.t === 'parallel') {
    const s = p.parts.map(netSize);
    return { w: Math.max(...s.map((x) => x.w)), h: s.reduce((a, b) => a + b.h, 0) };
  }
  return { w: 1, h: 1 };
}

/** Svítící žárovky (v pořadí obvodu). */
export function litBulbs(net: CircuitPart, sw?: SwitchState): BulbColor[] {
  const lit: BulbColor[] = [];
  const walk = (p: CircuitPart, powered: boolean) => {
    if (p.t === 'bulb') {
      if (powered && !p.broken) lit.push(p.id);
    } else if (p.t === 'series' || p.t === 'parallel') {
      // Za sebou i vedle sebe: napětí dostane jen část, přes kterou jde proud
      // žárovkou. Přemostěná (short) ani přerušená (open) část ho nemá.
      for (const c of p.parts) walk(c, powered && flowOf(c, sw) === 'load');
    }
  };
  walk(net, flowOf(net, sw) === 'load');
  return lit;
}

/** Zkrat baterky: proud oběhne celý kruh jen dráty, bez žárovky. */
export const batteryShorted = (net: CircuitPart, sw?: SwitchState) => flowOf(net, sw) === 'short';

/** Proč žárovka (ne)svítí. `cause` = co kruh přerušilo, `bypass` = drát nebo
 *  zapnutý vypínač vedle ní (proud jde raději tudy). */
export type Why =
  | { lit: true }
  | { lit: false; why: 'broken' }
  | { lit: false; why: 'open'; cause: CircuitPart }
  | { lit: false; why: 'bypass'; by: CircuitPart }
  | { lit: false; why: 'short' };

const contains = (p: CircuitPart, bulb: BulbColor): boolean => bulbsOf(p).includes(bulb);

/** První součástka, která v části přerušuje kruh (u otevřené části). */
export function openCause(p: CircuitPart, sw?: SwitchState): CircuitPart {
  if (p.t === 'series') return openCause(p.parts.find((c) => flowOf(c, sw) === 'open')!, sw);
  if (p.t === 'parallel') return openCause(p.parts[0], sw);
  return p;
}

export function whyBulb(net: CircuitPart, bulb: BulbColor, sw?: SwitchState): Why {
  if (batteryShorted(net, sw)) return { lit: false, why: 'short' };
  const go = (p: CircuitPart): Why => {
    if (p.t === 'bulb') return p.broken ? { lit: false, why: 'broken' } : { lit: true };
    if (p.t !== 'series' && p.t !== 'parallel') return { lit: true };
    const mine = p.parts.find((c) => contains(c, bulb))!;
    const others = p.parts.filter((c) => c !== mine);
    if (p.t === 'series') {
      // Mezera jinde v téže cestě přeruší i tuhle žárovku.
      const open = others.find((c) => flowOf(c, sw) === 'open');
      if (open) return { lit: false, why: 'open', cause: openCause(open, sw) };
      return go(mine);
    }
    // Vedle sebe: drát vedle žárovky ji přemostí.
    const short = others.find((c) => flowOf(c, sw) === 'short');
    if (short && flowOf(mine, sw) !== 'short') return { lit: false, why: 'bypass', by: short };
    return go(mine);
  };
  const w = go(net);
  // Svítí jen tehdy, když jí opravdu teče proud (kontrola proti litBulbs).
  if (w.lit && !litBulbs(net, sw).includes(bulb)) return { lit: false, why: 'open', cause: openCause(net, sw) };
  return w;
}

/** Součástka, která přerušila kruh, slovy: „vypínač A je vypnutý“. */
export function causeText(p: CircuitPart): string {
  switch (p.t) {
    case 'switch':
      return `vypínač ${p.id} je vypnutý`;
    case 'gap':
      return 'drát je přerušený';
    case 'bulb':
      return `${BULB_NAME[p.id].nom} žárovka je prasklá`;
    case 'thing': {
      const t = THINGS[p.thing];
      return `${t.name} (${t.stuff}) proud nevede`;
    }
    default:
      return 'kruh je přerušený';
  }
}

/** Nastavení vypínačů, při kterém svítí právě `target` – s nejméně
 *  přepnutími od výchozího stavu. null = nejde to. */
export function solveSwitches(net: CircuitPart, target: readonly BulbColor[]): SwitchState | null {
  const sws = switchesOf(net);
  const want = [...target].sort().join();
  let best: { state: SwitchState; flips: number } | null = null;
  for (let m = 0; m < 1 << sws.length; m++) {
    const state: SwitchState = Object.fromEntries(sws.map((s, i) => [s.id, !!(m & (1 << i))]));
    if (batteryShorted(net, state)) continue;
    if ([...litBulbs(net, state)].sort().join() !== want) continue;
    const flips = sws.filter((s) => state[s.id] !== s.on).length;
    if (!best || flips < best.flips) best = { state, flips };
  }
  return best?.state ?? null;
}

/** Všechna nastavení vypínačů (pro kontrolu obvodů). */
export function allSwitchStates(net: CircuitPart): SwitchState[] {
  const sws = switchesOf(net);
  return Array.from({ length: 1 << sws.length }, (_, m) => Object.fromEntries(sws.map((s, i) => [s.id, !!(m & (1 << i))])));
}

// ---------------------------------------------------------------------------
// Skládačka drátů

type WiresVisual = Extract<Visual, { type: 'wires' }>;

/** Směry: 0 = nahoru, 1 = doprava, 2 = dolů, 3 = doleva. */
export const DIR_DELTA: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/** Kam dlaždice vede (směry výstupů po otočení). U baterky [plus, minus]. */
export function tileLinks(t: WireTile): number[] {
  const r = ((t.rot % 4) + 4) % 4;
  switch (t.k) {
    case 'straight':
    case 'bulb':
    case 'battery':
      return [r % 4, (r + 2) % 4];
    case 'corner':
      return [r % 4, (r + 1) % 4];
    default:
      return [];
  }
}

/** Kolik různých otočení dlaždice má (rovný drát 2, roh 4). */
export const rotations = (t: WireTile) => (t.fixed || t.k === 'empty' ? 1 : t.k === 'corner' ? 4 : 2);

export interface WireTrace {
  /** ok = kruh přes všechny žárovky, partial = jen přes některé,
   *  short = kruh bez žárovky (zkrat), open = kruh přerušený. */
  end: 'ok' | 'partial' | 'short' | 'open';
  /** Políčka, kudy proud prošel (indexy), od baterky. */
  path: number[];
  /** Rozsvícené žárovky (indexy políček). */
  lit: number[];
  /** Kde se kruh přerušil (index políčka, za kterým proud nepokračuje). */
  breakAt?: number;
}

/** Projde proud od plusu baterky po drátech. `rots` = otočení dlaždic
 *  (jinak platí otočení z vizuálu). */
export function traceWires(v: WiresVisual, rots?: readonly number[]): WireTrace {
  const tile = (i: number): WireTile => ({ ...v.tiles[i], rot: rots?.[i] ?? v.tiles[i].rot });
  const battery = v.tiles.findIndex((t) => t.k === 'battery');
  const bulbs = v.tiles.flatMap((t, i) => (t.k === 'bulb' ? [i] : []));
  if (battery < 0) return { end: 'open', path: [], lit: [] };
  const [plus, minus] = tileLinks(tile(battery));
  const path = [battery];
  const visited: number[] = [];
  let at = battery;
  let dir = plus;
  for (let guard = 0; guard <= v.tiles.length; guard++) {
    const x = (at % v.cols) + DIR_DELTA[dir][0];
    const y = Math.floor(at / v.cols) + DIR_DELTA[dir][1];
    if (x < 0 || y < 0 || x >= v.cols || y >= v.rows) return { end: 'open', path, lit: [], breakAt: at };
    const next = y * v.cols + x;
    const back = (dir + 2) % 4;
    const links = tileLinks(tile(next));
    if (!links.includes(back)) return { end: 'open', path, lit: [], breakAt: at };
    if (next === battery) {
      if (back !== minus) return { end: 'open', path, lit: [], breakAt: at };
      const lit = bulbs.filter((b) => visited.includes(b));
      return { end: lit.length === 0 ? 'short' : lit.length === bulbs.length ? 'ok' : 'partial', path, lit };
    }
    visited.push(next);
    path.push(next);
    at = next;
    dir = links[0] === back ? links[1] : links[0];
  }
  return { end: 'open', path, lit: [], breakAt: at };
}
