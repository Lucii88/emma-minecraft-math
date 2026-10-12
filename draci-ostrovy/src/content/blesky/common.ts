// Ostrov blesků: stavění obvodů, jejich klíče a popis slovy. Výpočet, co
// svítí, je v core/circuit.ts.

import {
  BULB_NAME,
  THINGS,
  allSwitchStates,
  batteryShorted,
  bulbsOf,
  causeText,
  litBulbs,
  netSize,
  switchesOf,
  whyBulb,
} from '../../core/circuit';
import type { Rng } from '../../core/rng';
import type { BulbColor, CircuitPart } from '../../core/types';

export const bulb = (id: BulbColor, broken = false): CircuitPart => (broken ? { t: 'bulb', id, broken: true } : { t: 'bulb', id });
export const sw = (id: string, on: boolean): CircuitPart => ({ t: 'switch', id, on });
export const wire: CircuitPart = { t: 'wire' };
export const gap: CircuitPart = { t: 'gap' };
export const thing = (k: keyof typeof THINGS): CircuitPart => ({ t: 'thing', thing: k });
/** Části za sebou / vedle sebe (jediná část zůstane sama sebou). */
export const ser = (...parts: CircuitPart[]): CircuitPart => (parts.length === 1 ? parts[0] : { t: 'series', parts });
export const par = (...parts: CircuitPart[]): CircuitPart => (parts.length === 1 ? parts[0] : { t: 'parallel', parts });

const THING_KEYS = Object.keys(THINGS);

/** Klíč obvodu do id úlohy: zápis stromu písmeny (s = za sebou, p = vedle
 *  sebe, e = konec skupiny), žárovka barvou (x = prasklá), vypínač písmenem
 *  a stavem, w = drát, m = mezera, t = předmět. */
export function netKey(p: CircuitPart): string {
  switch (p.t) {
    case 'bulb':
      return p.broken ? `${p.id}x` : p.id;
    case 'switch':
      return `${p.id.toLowerCase()}${p.on ? 1 : 0}`;
    case 'wire':
      return 'w';
    case 'gap':
      return 'm';
    case 'thing':
      return `t${THING_KEYS.indexOf(p.thing)}`;
    case 'series':
    case 'parallel':
      return [p.t === 'series' ? 's' : 'p', ...p.parts.map(netKey), 'e'].join('-');
  }
}

/** „a, b a c“ */
export function joinA(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} a ${items[items.length - 1]}`;
}

export const capital = (s: string) => s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);

/** Jméno žárovky v 1. pádě („červená žárovka“, u jediné jen „žárovka“). */
export function bulbNom(net: CircuitPart, b: BulbColor): string {
  return bulbsOf(net).length === 1 ? 'žárovka' : `${BULB_NAME[b].nom} žárovka`;
}

/** Proč každá žárovka svítí nebo nesvítí – věty do vysvětlení. U jediné
 *  žárovky „Žárovka svítí: kruh je celý.“, u více barvami. */
export function explainNet(net: CircuitPart): string {
  if (batteryShorted(net)) return 'Drát vede od baterky rovnou zpátky do baterky. To je zkrat: proud jde jen drátem, žádná žárovka nesvítí a baterka se zahřívá.';
  const bulbs = bulbsOf(net);
  const one = bulbs.length === 1;
  const lit = litBulbs(net);
  const why = (b: BulbColor): string => {
    const w = whyBulb(net, b);
    if (w.lit) return '';
    if (w.why === 'broken') return 'je prasklá';
    if (w.why === 'open') return w.cause.t === 'bulb' ? `${causeText(w.cause)} a přerušila kruh` : causeText(w.cause);
    if (w.why === 'bypass') return `vedle ní vede ${w.by.t === 'switch' ? `zapnutý vypínač ${w.by.id}` : 'drát'} a proud jde raději tudy`;
    return 'kruh je přerušený';
  };
  if (one) return lit.length ? 'Žárovka svítí: kruh je celý, proud oběhne z baterky přes žárovku zpátky do baterky.' : `Žárovka nesvítí: ${why(bulbs[0]).replace(/^je prasklá$/, 'je prasklá a kruh je přerušený')}.`;
  const parts = [lit.length ? `Svítí ${bulbList(lit)}.` : 'Nesvítí žádná.'];
  for (const b of bulbs.filter((x) => !lit.includes(x))) {
    const r = why(b);
    parts.push(r.startsWith('je ') ? `${capital(BULB_NAME[b].nom)} nesvítí, ${r}.` : `${capital(BULB_NAME[b].nom)} nesvítí: ${r}.`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Náhodné obvody

export interface NetOptions {
  bulbs: [number, number];
  switches: [number, number];
  /** Nejvyšší počet vnoření „vedle sebe“ (0 = jen za sebou). */
  depth: number;
  /** Drát nebo vypínač vedle žárovky (přemostění). */
  bypass?: boolean;
  /** Prasklé žárovky a přerušené dráty. */
  broken?: boolean;
  gaps?: boolean;
  maxW?: number;
  maxH?: number;
}

const COLORS: BulbColor[] = ['r', 'b', 'g', 'y'];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function leafOf(rng: Rng, o: NetOptions): CircuitPart {
  const r = rng.next();
  if (o.gaps && r < 0.08) return gap;
  if (r < 0.55) return bulb('r', !!o.broken && rng.chance(0.15));
  return sw('A', rng.chance(0.5));
}

function branchOf(rng: Rng, depth: number, o: NetOptions, top: boolean): CircuitPart {
  const n = rng.int(1, top ? 3 : 2);
  const parts: CircuitPart[] = Array.from({ length: n }, () => (depth < o.depth && rng.chance(top ? 0.55 : 0.3) ? parallelOf(rng, depth + 1, o) : leafOf(rng, o)));
  return parts.length === 1 ? parts[0] : ser(...parts);
}

function parallelOf(rng: Rng, depth: number, o: NetOptions): CircuitPart {
  const parts = Array.from({ length: rng.int(2, depth === 1 ? 3 : 2) }, () => branchOf(rng, depth, o, false));
  if (o.bypass && rng.chance(0.35)) parts[rng.int(0, parts.length - 1)] = rng.chance(0.5) ? wire : sw('A', rng.chance(0.5));
  return par(...parts);
}

/** Přejmenuje žárovky (barvy) a vypínače (A, B, C… v pořadí kresby). */
function rename(net: CircuitPart, colors: BulbColor[]): CircuitPart {
  let b = 0;
  let s = 0;
  const walk = (p: CircuitPart): CircuitPart => {
    if (p.t === 'bulb') return { ...p, id: colors[b++ % colors.length] };
    if (p.t === 'switch') return { ...p, id: LETTERS[s++] };
    if (p.t === 'series' || p.t === 'parallel') return { ...p, parts: p.parts.map(walk) };
    return p;
  };
  return walk(net);
}

/** Obvod je „hezký“: každá větev vedle sebe něco dělá a žádné dvě nejsou
 *  stejné, nikde není samotný drát vedle samotného drátu. */
function tidy(p: CircuitPart): boolean {
  if (p.t !== 'series' && p.t !== 'parallel') return true;
  if (!p.parts.every(tidy)) return false;
  if (p.t === 'parallel') {
    const keys = p.parts.map(netKey);
    if (new Set(keys).size !== keys.length) return false;
    // Vedle samotného drátu musí být žárovka (přemostění), jinak je to zbytečné.
    if (p.parts.some((c) => c.t === 'wire') && !p.parts.some((c) => c.t !== 'wire' && bulbsOf(c).length > 0)) return false;
    if (p.parts.filter((c) => c.t === 'wire').length > 1) return false;
  }
  return true;
}

/** Náhodný obvod podle voleb (null = nepovedlo se, zkus znovu). */
export function randomNet(rng: Rng, o: NetOptions): CircuitPart | null {
  const raw = branchOf(rng, 0, o, true);
  const net = rename(raw.t === 'series' || raw.t === 'parallel' ? raw : ser(raw, wire), rng.shuffle(COLORS));
  const nb = bulbsOf(net).length;
  const ns = switchesOf(net).length;
  if (nb < o.bulbs[0] || nb > o.bulbs[1] || ns < o.switches[0] || ns > o.switches[1]) return null;
  if (new Set(bulbsOf(net)).size !== nb) return null;
  const { w, h } = netSize(net);
  if (w > (o.maxW ?? 5) || h > (o.maxH ?? 3)) return null;
  if (!tidy(net)) return null;
  return net;
}

/** Žádné nastavení vypínačů nesmí udělat zkrat baterky. */
export const neverShorts = (net: CircuitPart) => allSwitchStates(net).every((s) => !batteryShorted(net, s));

/** Každý vypínač něco mění: aspoň jednou jeho přepnutí změní, co svítí. */
export function everySwitchMatters(net: CircuitPart): boolean {
  const states = allSwitchStates(net);
  return switchesOf(net).every((s) =>
    states.some((st) => litBulbs(net, st).join() !== litBulbs(net, { ...st, [s.id]: !st[s.id] }).join()),
  );
}

/** Svítící žárovky jako text: „červená a modrá“. */
export const bulbList = (bs: BulbColor[]) => joinA(bs.map((b) => BULB_NAME[b].nom));
