// Mapy a světové strany: plán a mapa, vlevo × vpravo × nahoře × dole na plánu,
// světové strany na mapě (sever je nahoře), lety draka po mřížce, barvy
// a značky na mapě, měřítko, kompas a Slunce.
//
// Otázky nad mapou se počítají z pevně nakreslených map, takže každá je
// jednoznačná. Co znamená „přímo na východ od X“, říká nápověda: ve stejném
// řádku napravo. Chybné možnosti jsou vždy místa, která na východ neleží vůbec
// (ani šikmo), takže správná je jen jedna, ať to hráč chápe přísně, nebo
// volněji. U „Kterým směrem je A od B?“ leží obě místa ve stejném řádku nebo
// sloupci, šikmé směry (L4) jen přesně po úhlopříčce.
//
// Bez zajímavosti po správné odpovědi (showFact): vysvětlení tu je postup
// („2 políčka na sever…“) a po správném letu by jen zdržovalo.

import { bankSkill, type Spec } from '../../core/bank';
import { capitalize, count } from '../../core/czech';
import { COMPASS_WORD, cellKey, fly, shortestProgram } from '../../core/grid';
import type { Rng } from '../../core/rng';
import type { Cell, KnowledgeCard, Move, Visual } from '../../core/types';
import { fixed, num, q, type Extra } from './common';

const ID = 'svet.mapa';

// ---------------------------------------------------------------------------
// Místa a mapy

interface PlaceWords {
  emoji: string;
  /** 1. pád, malým písmenem. */
  name: string;
  /** 2. pád: „od hradu“. */
  gen: string;
  /** 3. pád i s předložkou: „ke hradu“. */
  dat: string;
  /** 7. pád: „nad hradem“. */
  ins: string;
}

const w = (emoji: string, name: string, gen: string, dat: string, ins: string): PlaceWords => ({ emoji, name, gen, dat, ins });

/** Slovník míst. Emoji jen z Unicode ≤ 12. */
export const MISTA: Record<string, PlaceWords> = {
  hrad: w('🏰', 'hrad', 'hradu', 'ke hradu', 'hradem'),
  les: w('🌲', 'les', 'lesa', 'k lesu', 'lesem'),
  pristav: w('⛵', 'přístav', 'přístavu', 'k přístavu', 'přístavem'),
  dum: w('🏠', 'dům', 'domu', 'k domu', 'domem'),
  kasna: w('⛲', 'kašna', 'kašny', 'ke kašně', 'kašnou'),
  ovcin: w('🐑', 'ovčín', 'ovčína', 'k ovčínu', 'ovčínem'),
  pole: w('🌾', 'pole', 'pole', 'k poli', 'polem'),
  kotviste: w('⚓', 'kotviště', 'kotviště', 'ke kotvišti', 'kotvištěm'),
  kostel: w('⛪', 'kostel', 'kostela', 'ke kostelu', 'kostelem'),
  skola: w('🏫', 'škola', 'školy', 'ke škole', 'školou'),
  most: w('🌉', 'most', 'mostu', 'k mostu', 'mostem'),
  hora: w('⛰️', 'hora', 'hory', 'k hoře', 'horou'),
  rybnik: w('🎣', 'rybník', 'rybníka', 'k rybníku', 'rybníkem'),
  vcelin: w('🐝', 'včelín', 'včelína', 'ke včelínu', 'včelínem'),
  tabor: w('⛺', 'tábor', 'tábora', 'k táboru', 'táborem'),
  sad: w('🍎', 'sad', 'sadu', 'k sadu', 'sadem'),
  studanka: w('💧', 'studánka', 'studánky', 'ke studánce', 'studánkou'),
  kovarna: w('⚒️', 'kovárna', 'kovárny', 'ke kovárně', 'kovárnou'),
  obchod: w('🏪', 'obchod', 'obchodu', 'k obchodu', 'obchodem'),
  louka: w('🌼', 'louka', 'louky', 'k louce', 'loukou'),
  // plán dvorku a pokoje (L1)
  bouda: w('🐕', 'psí bouda', 'psí boudy', 'k psí boudě', 'psí boudou'),
  kurnik: w('🐔', 'kurník', 'kurníku', 'ke kurníku', 'kurníkem'),
  zahon: w('🌷', 'záhon', 'záhonu', 'k záhonu', 'záhonem'),
  schranka: w('📫', 'schránka', 'schránky', 'ke schránce', 'schránkou'),
  kolo: w('🚲', 'kolo', 'kola', 'ke kolu', 'kolem'),
  jablon: w('🍎', 'jabloň', 'jabloně', 'k jabloni', 'jabloní'),
  strom: w('🌳', 'strom', 'stromu', 'ke stromu', 'stromem'),
  postel: w('🛏️', 'postel', 'postele', 'k posteli', 'postelí'),
  knihovna: w('📚', 'knihovna', 'knihovny', 'ke knihovně', 'knihovnou'),
  medvidek: w('🧸', 'medvídek', 'medvídka', 'k medvídkovi', 'medvídkem'),
  zidle: w('🪑', 'židle', 'židle', 'k židli', 'židlí'),
  piano: w('🎹', 'piano', 'piana', 'k pianu', 'pianem'),
  kaktus: w('🌵', 'kaktus', 'kaktusu', 'ke kaktusu', 'kaktusem'),
  mic: w('⚽', 'míč', 'míče', 'k míči', 'míčem'),
  televize: w('📺', 'televize', 'televize', 'k televizi', 'televizí'),
  kytara: w('🎸', 'kytara', 'kytary', 'ke kytaře', 'kytarou'),
};

export interface Place extends Cell {
  id: string;
  words: PlaceWords;
}

export interface MapDef {
  id: string;
  cols: number;
  rows: number;
  places: Place[];
  rocks: Cell[];
  /** Prázdná políčka, kam se dají položit vajíčka k sebrání. */
  eggSpots: Cell[];
  /** Plán (L1, bez světových stran), nebo mapa se světovými stranami. */
  plan: boolean;
}

/** Mapa z řádků: `.` prázdno, `#` skála, `*` místo pro vajíčko, písmeno = místo. */
function parseMap(id: string, plan: boolean, layout: string[], legend: Record<string, string>): MapDef {
  const places: Place[] = [];
  const rocks: Cell[] = [];
  const eggSpots: Cell[] = [];
  layout.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') rocks.push({ x, y });
      else if (ch === '*') eggSpots.push({ x, y });
      else if (ch !== '.') {
        const pid = legend[ch];
        if (!pid || !MISTA[pid]) throw new Error(`${id}: neznámé místo ${ch}`);
        places.push({ id: pid, x, y, words: MISTA[pid] });
      }
    });
  });
  const cols = layout[0].length;
  if (layout.some((r) => r.length !== cols)) throw new Error(`${id}: řádky mapy nemají stejnou délku`);
  if (new Set(places.map((p) => p.id)).size !== places.length) throw new Error(`${id}: místo je na mapě dvakrát`);
  return { id, cols, rows: layout.length, places, rocks, eggSpots, plan };
}

export const MAPY: MapDef[] = [
  parseMap('dvorek', true, [
    'J.S.Z',
    'DK.BT',
    '.CM*.',
    'R*...',
  ], { J: 'jablon', S: 'bouda', Z: 'zahon', D: 'dum', K: 'kurnik', B: 'schranka', T: 'strom', C: 'kolo', M: 'mic', R: 'kaktus' }),
  parseMap('pokoj', true, [
    'PK.TG',
    '.MZ*.',
    'A*.RC',
    '.....',
  ], { P: 'postel', K: 'knihovna', T: 'televize', G: 'kytara', M: 'medvidek', Z: 'zidle', A: 'piano', R: 'kaktus', C: 'mic' }),
  parseMap('zahrada', true, [
    'T.JB.',
    'SZ*K.',
    '.CD.M',
    '.*...',
  ], { T: 'strom', J: 'jablon', B: 'schranka', S: 'bouda', Z: 'zahon', K: 'kurnik', C: 'kolo', D: 'dum', M: 'mic' }),
  parseMap('ostrov', false, [
    'H*.L..',
    '..#.*O',
    'P..K..',
    '.#*.#.',
    'D..AS.',
  ], { H: 'hrad', L: 'les', O: 'ovcin', P: 'pristav', K: 'kasna', D: 'dum', A: 'kotviste', S: 'pole' }),
  parseMap('vesnice', false, [
    'C..V..T',
    '.#.*.#.',
    'K..M*.B',
    '..#.#..',
    'D*.S..R',
  ], { C: 'kostel', V: 'skola', T: 'obchod', K: 'kasna', M: 'most', B: 'rybnik', D: 'dum', S: 'sad', R: 'louka' }),
  parseMap('hory', false, [
    '.H....',
    '...*B.',
    'T.#.K.',
    '.#*...',
    '..L..S',
    'V....O',
  ], { H: 'hora', B: 'rybnik', T: 'tabor', K: 'kovarna', L: 'les', S: 'studanka', V: 'vcelin', O: 'ovcin' }),
  parseMap('pobrezi', false, [
    'A......',
    '..#.*.P',
    '.M..H..',
    '.*..#..',
    'L..K..D',
    '..S..O.',
  ], { A: 'kotviste', P: 'pristav', M: 'most', H: 'hrad', L: 'les', K: 'kasna', D: 'dum', S: 'pole', O: 'ovcin' }),
  parseMap('statek', false, [
    'S.D.V',
    '.#*..',
    'O.K.#',
    '.*.#.',
    'F.L.B',
  ], { S: 'sad', D: 'dum', V: 'vcelin', O: 'ovcin', K: 'kasna', F: 'pole', L: 'louka', B: 'rybnik' }),
  parseMap('skaly', false, [
    'H...#...',
    '.#*.#.#T',
    '...C..*.',
    'L.#..#.P',
    '.*...#..',
    'D..A...O',
  ], { H: 'hrad', T: 'tabor', C: 'kostel', L: 'les', P: 'pristav', D: 'dum', A: 'kotviste', O: 'ovcin' }),
];

const PLANY = MAPY.filter((m) => m.plan);
const MAPY_SS = MAPY.filter((m) => !m.plan);

// ---------------------------------------------------------------------------
// Směry

export const DIRS: readonly Move[] = ['U', 'R', 'D', 'L'];
const DELTA: Record<Move, Cell> = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 } };

/** Světové strany: tlačítko, „na sever“, klíč. */
const SMER: Record<Move, { label: string; na: string; key: string; mapa: string }> = {
  U: { label: 'Na sever', na: COMPASS_WORD.U, key: 'sever', mapa: 'nahoře' },
  R: { label: 'Na východ', na: COMPASS_WORD.R, key: 'vychod', mapa: 'vpravo' },
  D: { label: 'Na jih', na: COMPASS_WORD.D, key: 'jih', mapa: 'dole' },
  L: { label: 'Na západ', na: COMPASS_WORD.L, key: 'zapad', mapa: 'vlevo' },
};
export const SMER_OPTIONS = DIRS.map((d) => SMER[d].label);

/** Šikmé směry (L4): [dx, dy] → popis. */
const SIKMO: { dx: number; dy: number; label: string; key: string; mapa: string }[] = [
  { dx: 1, dy: -1, label: 'Na severovýchod', key: 'sv', mapa: 'vpravo nahoře' },
  { dx: 1, dy: 1, label: 'Na jihovýchod', key: 'jv', mapa: 'vpravo dole' },
  { dx: -1, dy: 1, label: 'Na jihozápad', key: 'jz', mapa: 'vlevo dole' },
  { dx: -1, dy: -1, label: 'Na severozápad', key: 'sz', mapa: 'vlevo nahoře' },
];
export const SIKMO_OPTIONS = SIKMO.map((s) => s.label);

/** Plán bez světových stran (L1): „hned vpravo od“, „hned nad“… */
const PLAN_SMER: Record<Move, { prompt: (p: PlaceWords) => string; key: string; word: string }> = {
  U: { prompt: (p) => `hned nad ${p.ins}`, key: 'nad', word: 'nad' },
  D: { prompt: (p) => `hned pod ${p.ins}`, key: 'pod', word: 'pod' },
  L: { prompt: (p) => `hned vlevo od ${p.gen}`, key: 'vlevo', word: 'vlevo' },
  R: { prompt: (p) => `hned vpravo od ${p.gen}`, key: 'vpravo', word: 'vpravo' },
};

/** Leží místo `p` od `from` ve směru `d` aspoň trochu (i šikmo)? */
export function looselyIn(from: Cell, p: Cell, d: Move): boolean {
  if (d === 'R') return p.x > from.x;
  if (d === 'L') return p.x < from.x;
  if (d === 'U') return p.y < from.y;
  return p.y > from.y;
}

/** Místa ve stejném řádku/sloupci ve směru `d`, seřazená od nejbližšího. */
export function rayPlaces(m: MapDef, from: Cell, d: Move): Place[] {
  const { x: dx, y: dy } = DELTA[d];
  return m.places
    .filter((p) => (dx !== 0 ? p.y === from.y && Math.sign(p.x - from.x) === dx : p.x === from.x && Math.sign(p.y - from.y) === dy))
    .sort((a, b) => Math.abs(a.x - from.x) + Math.abs(a.y - from.y) - (Math.abs(b.x - from.x) + Math.abs(b.y - from.y)));
}

const rockSet = (m: MapDef) => new Set(m.rocks.map(cellKey));

/** Políčka rovné cesty z `from` o `n` kroků ve směru `d` (bez startu). */
function segment(from: Cell, d: Move, n: number): Cell[] {
  const out: Cell[] = [];
  for (let i = 1; i <= n; i++) out.push({ x: from.x + DELTA[d].x * i, y: from.y + DELTA[d].y * i });
  return out;
}

const inside = (m: MapDef, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < m.cols && c.y < m.rows;
const placeAt = (m: MapDef, c: Cell) => m.places.find((p) => p.x === c.x && p.y === c.y);

function visualOf(m: MapDef, extra: Partial<Extract<Visual, { type: 'grid' }>> = {}): Visual {
  return {
    type: 'grid',
    cols: m.cols,
    rows: m.rows,
    rocks: m.rocks,
    places: m.places.map((p) => ({ x: p.x, y: p.y, emoji: p.words.emoji, name: p.words.name })),
    ...(m.plan ? {} : { compass: true }),
    ...extra,
  };
}

const cap = (s: string) => capitalize(s);
/** Kam se to na mapě posune: „doprava“, „nahoru“… */
const KAM: Record<Move, string> = { U: 'nahoru', D: 'dolů', L: 'doleva', R: 'doprava' };
/** Vztah na mapě: „nad hradem“, „vpravo od hradu“. */
const vztah = (d: Move, p: PlaceWords) => (d === 'U' ? `nad ${p.ins}` : d === 'D' ? `pod ${p.ins}` : d === 'R' ? `vpravo od ${p.gen}` : `vlevo od ${p.gen}`);
/** Světová strana v 1. pádě: „Sever“. */
const strana = (d: Move) => ({ U: 'Sever', D: 'Jih', L: 'Západ', R: 'Východ' })[d];
const policka = (n: number) => count(n, ['políčko', 'políčka', 'políček']);

// ---------------------------------------------------------------------------
// Instance otázek (spočítané předem, každá s klíčem podle obsahu)

type Maker = (rng: Rng) => Spec;
interface Pools {
  vedle: Maker[]; // L1: hned vpravo/vlevo/nad/pod
  planLet: Maker[]; // L1: program na plánu
  primo: Maker[]; // L2: přímo na východ od…
  smer: Maker[]; // L2+: kterým směrem je A od B
  nej: Maker[]; // L2: nejsevernější…
  let: Maker[]; // L2: program se světovými stranami
  trasa: Maker[]; // L3: dva úseky letu
  kroky: Maker[]; // L3: kolik kroků
  prvni: Maker[]; // L3: nad kterým místem proletí jako první
  vejce: Maker[]; // L3+: program s vajíčkem
  sikmo: Maker[]; // L4: osm směrů
  oprava: Maker[]; // L4: oprav program (spletený východ a západ)
  trasa3: Maker[]; // L4: tři úseky letu
  km: Maker[]; // L5: nejkratší let v km
}

const POOLS: Pools = { vedle: [], planLet: [], primo: [], smer: [], nej: [], let: [], trasa: [], kroky: [], prvni: [], vejce: [], sikmo: [], oprava: [], trasa3: [], km: [] };

const MIN_DISTRACTORS = 2;

for (const m of PLANY) {
  // Hned vpravo / vlevo / nad / pod: sousední políčko. Chybné možnosti leží
  // na opačné straně nebo ve stejném řádku/sloupci, nikdy ve směru otázky.
  for (const from of m.places) {
    for (const d of DIRS) {
      const target = placeAt(m, { x: from.x + DELTA[d].x, y: from.y + DELTA[d].y });
      if (!target) continue;
      const wrong = m.places.filter((p) => p !== from && !looselyIn(from, p, d));
      if (wrong.length < MIN_DISTRACTORS) continue;
      const ps = PLAN_SMER[d];
      POOLS.vedle.push((rng) =>
        q(`vedle-${m.id}-${from.id}-${ps.key}`, `Co je na plánu ${ps.prompt(from.words)}?`, cap(target.words.name), rng.shuffle(wrong).slice(0, 3).map((p) => cap(p.words.name)),
          ['Najdi na plánu nejdřív to, od čeho se ptáme.', 'Hledej jen na sousedním políčku.'],
          `${cap(ps.prompt(from.words))} je ${target.words.name}.`,
          { visual: visualOf(m) }));
    }
  }
  // Program na plánu: doleť od jednoho místa k druhému (šipky ↑ → ↓ ←).
  for (const a of m.places) {
    for (const b of m.places) {
      if (a === b) continue;
      const world = { cols: m.cols, rows: m.rows, dragon: a, goal: b, rocks: m.rocks };
      const best = shortestProgram(world);
      if (!best || best.length < 2 || best.length > 6) continue;
      POOLS.planLet.push(() => ({
        kind: 'program',
        key: `plan-let-${m.id}-${a.id}-${b.id}`,
        prompt: `Doveď draka od ${a.words.gen} ${b.words.dat}.`,
        grid: { cols: m.cols, rows: m.rows, dragon: { x: a.x, y: a.y }, goal: { x: b.x, y: b.y }, rocks: m.rocks, places: visualPlaces(m) },
        hints: ['Kolik políček musí drak letět doprava nebo doleva?', 'A kolik nahoru nebo dolů?'],
        explain: `Drak může letět třeba takhle: ${describeProgram(niceProgram(m, a, b) ?? best, KAM)}.`,
      }));
    }
  }
}

function visualPlaces(m: MapDef) {
  return m.places.map((p) => ({ x: p.x, y: p.y, emoji: p.words.emoji, name: p.words.name }));
}

const MOVE_NA: Record<Move, string> = { U: 'na sever', D: 'na jih', L: 'na západ', R: 'na východ' };

/** „na sever, na sever, na východ“ → „2 políčka na sever, 1 políčko na východ“. */
function describeProgram(p: Move[], words: Record<Move, string> = MOVE_NA): string {
  const parts: string[] = [];
  let i = 0;
  while (i < p.length) {
    let j = i;
    while (j < p.length && p[j] === p[i]) j++;
    parts.push(`${policka(j - i)} ${words[p[i]]}`);
    i = j;
  }
  return parts.join(', ');
}

for (const m of MAPY_SS) {
  const rocks = rockSet(m);
  const places = m.places;

  // Přímo na východ (sever, jih, západ) od X: ve stejném řádku/sloupci je
  // právě jedno místo; chybné možnosti v tom směru neleží vůbec.
  for (const from of places) {
    for (const d of DIRS) {
      const ray = rayPlaces(m, from, d);
      if (ray.length !== 1) continue;
      const wrong = places.filter((p) => p !== from && !looselyIn(from, p, d));
      if (wrong.length < MIN_DISTRACTORS) continue;
      const s = SMER[d];
      const line = d === 'L' || d === 'R' ? 'řádku' : 'sloupci';
      POOLS.primo.push((rng) =>
        q(`primo-${s.key}-${m.id}-${from.id}`, `Co leží přímo ${s.na} od ${from.words.gen}?`, cap(ray[0].words.name), rng.shuffle(wrong).slice(0, 3).map((p) => cap(p.words.name)),
          [`${strana(d)} je na mapě ${s.mapa}.`, `Hledej ve stejném ${line} jako ${from.words.name}.`],
          `${strana(d)} je na mapě ${s.mapa}. Ve stejném ${line} ${vztah(d, from.words)} leží jen ${ray[0].words.name}.`,
          { visual: visualOf(m) }));
    }
  }

  // Kterým směrem je A od B (stejný řádek nebo sloupec).
  for (const a of places) {
    for (const b of places) {
      if (a === b || (a.x !== b.x && a.y !== b.y)) continue;
      const d: Move = a.x === b.x ? (a.y < b.y ? 'U' : 'D') : a.x > b.x ? 'R' : 'L';
      POOLS.smer.push(() =>
        fixed(`smer-${m.id}-${a.id}-${b.id}`, `Kterým směrem je ${a.words.name} od ${b.words.gen}?`, SMER_OPTIONS, DIRS.indexOf(d),
          ['Najdi nejdřív to, od čeho se ptáme.', 'Sever je nahoře, jih dole, východ vpravo a západ vlevo.'],
          `${cap(a.words.name)} leží na mapě ${vztah(d, b.words)}, tedy ${SMER[d].na}.`,
          { visual: visualOf(m) }));
    }
  }

  // Nejsevernější, nejjižnější… místo (jen když je jediné).
  const NEJ: Record<Move, [string, (p: Place) => number]> = {
    U: ['nejvíc na sever', (p) => -p.y],
    D: ['nejvíc na jih', (p) => p.y],
    R: ['nejvíc na východ', (p) => p.x],
    L: ['nejvíc na západ', (p) => -p.x],
  };
  for (const d of DIRS) {
    const [text, score] = NEJ[d];
    const best = Math.max(...places.map(score));
    const top = places.filter((p) => score(p) === best);
    if (top.length !== 1) continue;
    POOLS.nej.push((rng) =>
      q(`nej-${SMER[d].key}-${m.id}`, `Které místo leží na mapě ${text}?`, cap(top[0].words.name), rng.shuffle(places.filter((p) => p !== top[0])).slice(0, 3).map((p) => cap(p.words.name)),
        [`${strana(d)} je na mapě ${SMER[d].mapa}.`],
        `${cap(top[0].words.name)} je na mapě ze všech míst nejvíc ${SMER[d].mapa}, tedy ${text}.`,
        { visual: visualOf(m) }));
  }

  // Programy: doleť od A k B (se světovými stranami), s vajíčkem a opravy.
  for (const a of places) {
    for (const b of places) {
      if (a === b) continue;
      const world = { cols: m.cols, rows: m.rows, dragon: { x: a.x, y: a.y }, goal: { x: b.x, y: b.y }, rocks: m.rocks };
      const best = shortestProgram(world);
      if (!best) continue;
      const grid = { cols: m.cols, rows: m.rows, dragon: world.dragon, goal: world.goal, rocks: m.rocks, places: visualPlaces(m), compass: true };
      if (best.length >= 3 && best.length <= 8) {
        POOLS.let.push(() => ({
          kind: 'program',
          key: `let-${m.id}-${a.id}-${b.id}`,
          prompt: `Doleť od ${a.words.gen} ${b.words.dat}.`,
          grid,
          hints: ['Sever je nahoře, jih dole, východ vpravo a západ vlevo.', 'Skály musíš obletět.'],
          explain: `Mapovec může letět třeba takhle: ${describeProgram(niceProgram(m, a, b) ?? best)}.`,
        }));
        // Oprava: nakreslený program se spleteným východem a západem.
        const swapped = best.map((mv): Move => (mv === 'R' ? 'L' : mv === 'L' ? 'R' : mv));
        if (swapped.some((mv, i) => mv !== best[i]) && !fly(world, swapped).ok) {
          POOLS.oprava.push(() => ({
            kind: 'program',
            key: `oprava-${m.id}-${a.id}-${b.id}`,
            prompt: `Mapovec chtěl doletět od ${a.words.gen} ${b.words.dat}, ale spletl si východ a západ. Poskládej správný program.`,
            grid: { ...grid, path: swapped },
            hints: ['Podívej se, kam nakreslený program vede.', 'Východ je vpravo, západ vlevo.'],
            explain: `Správně to jde třeba takhle: ${describeProgram(niceProgram(m, a, b) ?? best)}.`,
          }));
        }
      }
      for (const egg of m.eggSpots) {
        const withEgg = shortestProgram(world, [egg]);
        if (!withEgg || withEgg.length > 10 || withEgg.length <= best.length) continue;
        POOLS.vejce.push(() => ({
          kind: 'program',
          key: `vejce-${m.id}-${a.id}-${b.id}-${egg.x}${egg.y}`,
          prompt: `Doleť od ${a.words.gen} ${b.words.dat} a cestou seber vajíčko.`,
          grid: { ...grid, eggs: [egg] },
          hints: ['Nejdřív leť k vajíčku, pak k cíli.', 'Skály musíš obletět.'],
          explain: `Mapovec může letět třeba takhle: ${describeProgram(niceProgram(m, a, b, [egg]) ?? withEgg)}.`,
        }));
      }
    }
  }

  // Dva úseky letu: od X nejdřív vodorovně, pak svisle (nebo naopak).
  for (const from of places) {
    for (const t of places) {
      const dx = t.x - from.x;
      const dy = t.y - from.y;
      if (dx === 0 || dy === 0) continue;
      const h: Move = dx > 0 ? 'R' : 'L';
      const v: Move = dy > 0 ? 'D' : 'U';
      for (const [d1, n1, d2, n2] of [[h, Math.abs(dx), v, Math.abs(dy)], [v, Math.abs(dy), h, Math.abs(dx)]] as [Move, number, Move, number][]) {
        const path = [...segment(from, d1, n1)];
        path.push(...segment(path[path.length - 1], d2, n2));
        if (path.some((c) => rocks.has(cellKey(c)))) continue;
        // Věrohodné chyby: spletený východ se západem nebo sever s jihem.
        const mirrors = [
          { x: from.x - dx, y: from.y + dy },
          { x: from.x + dx, y: from.y - dy },
        ].map((c) => placeAt(m, c)).filter((p): p is Place => !!p && p !== t && p !== from);
        const rest = places.filter((p) => p !== t && p !== from && !mirrors.includes(p));
        const k1 = `${SMER[d1].key[0]}${n1}`;
        const k2 = `${SMER[d2].key[0]}${n2}`;
        POOLS.trasa.push((rng) =>
          q(`trasa-${m.id}-${from.id}-${k1}-${k2}`,
            `Mapovec vyletí od ${from.words.gen}. Letí ${policka(n1)} ${SMER[d1].na} a pak ${policka(n2)} ${SMER[d2].na}. Co tam najde?`,
            cap(t.words.name), [...mirrors, ...rng.shuffle(rest)].slice(0, 3).map((p) => cap(p.words.name)),
            ['Posouvej prst po mapě políčko po políčku.', 'Sever je nahoře, jih dole, východ vpravo a západ vlevo.'],
            `Od ${from.words.gen} ${policka(n1)} ${KAM[d1]} a ${policka(n2)} ${KAM[d2]} – tam je ${t.words.name}.`,
            { visual: visualOf(m, { dragon: { x: from.x, y: from.y } }) }));
        break; // stačí jedno pořadí úseků pro každou dvojici
      }
    }
  }

  // Kolik kroků přímo od A k B (stejný řádek/sloupec, bez skal mezi nimi).
  for (const a of places) {
    for (const b of places) {
      if (a === b || (a.x !== b.x && a.y !== b.y)) continue;
      const d: Move = a.x === b.x ? (b.y < a.y ? 'U' : 'D') : b.x > a.x ? 'R' : 'L';
      const n = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      if (n < 2) continue;
      if (segment(a, d, n).some((c) => rocks.has(cellKey(c)))) continue;
      POOLS.kroky.push(() =>
        num(`kroky-${m.id}-${a.id}-${b.id}`, `Mapovec letí od ${a.words.gen} přímo ${b.words.dat}. Kolik kroků udělá?`, n,
          ['Jeden krok je přelet na sousední políčko.', 'Počítej políčka od startu k cíli.'],
          `${cap(b.words.name)} leží ${SMER[d].na} od ${a.words.gen}, ${policka(n)} daleko. Mapovec udělá ${count(n, ['krok', 'kroky', 'kroků'])}.`,
          { visual: visualOf(m, { dragon: { x: a.x, y: a.y } }) }));
    }
  }

  // Nad kterým místem proletí jako první (rovně jedním směrem, bez skal).
  for (const from of places) {
    for (const d of DIRS) {
      const ray = rayPlaces(m, from, d);
      if (!ray.length) continue;
      const first = ray[0];
      const n = Math.abs(first.x - from.x) + Math.abs(first.y - from.y);
      if (segment(from, d, n).some((c) => rocks.has(cellKey(c)))) continue;
      const wrong = [...ray.slice(1), ...places.filter((p) => p !== from && !looselyIn(from, p, d))];
      if (wrong.length < MIN_DISTRACTORS) continue;
      POOLS.prvni.push((rng) =>
        q(`prvni-${SMER[d].key}-${m.id}-${from.id}`, `Mapovec letí od ${from.words.gen} pořád ${SMER[d].na}. Nad kterým místem proletí jako první?`,
          cap(first.words.name), [...ray.slice(1, 2), ...rng.shuffle(wrong.filter((p) => !ray.includes(p)))].slice(0, 3).map((p) => cap(p.words.name)),
          [`${strana(d)} je na mapě ${SMER[d].mapa}.`, 'Posouvej prst po mapě políčko po políčku.'],
          `Když letí ${SMER[d].na}, tedy na mapě ${KAM[d]}, jako první potká ${first.words.name}.`,
          { visual: visualOf(m, { dragon: { x: from.x, y: from.y } }) }));
    }
  }

  // Osm směrů (L4): stejný řádek/sloupec, nebo přesně po úhlopříčce.
  for (const a of places) {
    for (const b of places) {
      if (a === b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx !== 0 && dy !== 0 && Math.abs(dx) === Math.abs(dy)) {
        const s = SIKMO.findIndex((x) => x.dx === Math.sign(dx) && x.dy === Math.sign(dy));
        POOLS.sikmo.push(() =>
          fixed(`sikmo-${m.id}-${a.id}-${b.id}`, `Kterým směrem je ${a.words.name} od ${b.words.gen}?`, SIKMO_OPTIONS, s,
            ['Najdi nejdřív to, od čeho se ptáme.', 'Leží to šikmo po úhlopříčce. Je to nahoru, nebo dolů? Vpravo, nebo vlevo?'],
            `${cap(a.words.name)} je od ${b.words.gen} ${SIKMO[s].mapa}, přesně po úhlopříčce. To je ${SIKMO[s].label.toLocaleLowerCase('cs')}.`,
            { visual: visualOf(m) }));
      }
    }
  }

  // Tři úseky letu (L4): třeba na východ, na jih a zpátky na západ.
  for (const from of places) {
    for (const d1 of DIRS) {
      for (const d2 of DIRS) {
        if (d2 === d1 || DELTA[d2].x === -DELTA[d1].x && DELTA[d2].y === -DELTA[d1].y) continue;
        for (const d3 of [d1, ({ U: 'D', D: 'U', L: 'R', R: 'L' } as Record<Move, Move>)[d1]]) {
          for (let n1 = 1; n1 <= 3; n1++) {
            for (let n2 = 1; n2 <= 3; n2++) {
              for (let n3 = 1; n3 <= 2; n3++) {
                const s1 = segment(from, d1, n1);
                const s2 = segment(s1[s1.length - 1], d2, n2);
                const s3 = segment(s2[s2.length - 1], d3, n3);
                const path = [...s1, ...s2, ...s3];
                if (path.some((c) => !inside(m, c) || rocks.has(cellKey(c)))) continue;
                const end = path[path.length - 1];
                const t = placeAt(m, end);
                if (!t || t === from) continue;
                if (d3 !== d1 && n3 >= n1) continue; // nevracet se za start
                const others = places.filter((p) => p !== t && p !== from);
                const k = `${SMER[d1].key[0]}${n1}-${SMER[d2].key[0]}${n2}-${SMER[d3].key[0]}${n3}`;
                POOLS.trasa3.push((rng) =>
                  q(`trasa3-${m.id}-${from.id}-${k}`,
                    `Mapovec vyletí od ${from.words.gen}. Letí ${policka(n1)} ${SMER[d1].na}, ${policka(n2)} ${SMER[d2].na} a ${policka(n3)} ${SMER[d3].na}. Co tam najde?`,
                    cap(t.words.name), rng.shuffle(others).slice(0, 3).map((p) => cap(p.words.name)),
                    ['Posouvej prst po mapě políčko po políčku.', 'Sever je nahoře, jih dole, východ vpravo a západ vlevo.'],
                    `Mapovec letí ${describeProgram([...Array<Move>(n1).fill(d1), ...Array<Move>(n2).fill(d2), ...Array<Move>(n3).fill(d3)])}. Tam je ${t.words.name}.`,
                    { visual: visualOf(m, { dragon: { x: from.x, y: from.y } }) }));
              }
            }
          }
        }
      }
    }
  }

  // Nejkratší let v kilometrech (L5): 1 políčko = 1 km, nebo 2 km.
  for (const a of places) {
    for (const b of places) {
      if (a === b) continue;
      const best = shortestProgram({ cols: m.cols, rows: m.rows, dragon: a, goal: b, rocks: m.rocks });
      if (!best || best.length < 3) continue;
      const straight = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      for (const perCell of [1, 2]) {
        const km = best.length * perCell;
        const unit = perCell === 1 ? '1 km' : '2 km';
        POOLS.km.push(() =>
          num(`km${perCell}-${m.id}-${a.id}-${b.id}`,
            `Jedno políčko mapy je ${unit}. Mapovec letí jen na sever, jih, východ a západ a skály obletí. Kolik kilometrů je nejkratší let od ${a.words.gen} ${b.words.dat}?`,
            km,
            ['Najdi nejkratší cestu a spočítej její políčka.', perCell === 1 ? 'Každé políčko je jeden kilometr.' : 'Každé políčko znamená dva kilometry, takže počet políček vynásob dvěma.'],
            `Nejkratší let má ${policka(best.length)}${best.length > straight ? ', protože musí obletět skály' : ''}. ${perCell === 1 ? `To je ${km} km.` : `${best.length} · 2 = ${km} km.`}`,
            { visual: visualOf(m, { dragon: { x: a.x, y: a.y }, goal: { x: b.x, y: b.y } }), unit: 'km',
              speak: `Jedno políčko mapy je ${perCell === 1 ? 'jeden kilometr' : 'dva kilometry'}. Mapovec letí jen na sever, jih, východ a západ a skály obletí. Kolik kilometrů je nejkratší let od ${a.words.gen} ${b.words.dat}?` }));
      }
    }
  }
}

/** Nejkratší program s co nejméně zatáčkami (kvůli srozumitelnému vysvětlení).
 *  Délka je vždy stejná jako u `shortestProgram`. */
export function niceProgram(m: MapDef, a: Cell, b: Cell, eggs: Cell[] = []): Move[] | null {
  const best = shortestProgram({ cols: m.cols, rows: m.rows, dragon: a, goal: b, rocks: m.rocks }, eggs);
  if (!best) return null;
  const rocks = rockSet(m);
  const full = (1 << eggs.length) - 1;
  const maskAt = (c: Cell) => eggs.reduce((mask, e, i) => (e.x === c.x && e.y === c.y ? mask | (1 << i) : mask), 0);
  // Stav: políčko, sebraná vajíčka, poslední směr. Cena: kroky * 100 + zatáčky
  // + 50 za průlet cílem, dokud vajíčka nejsou sebraná (nápověda radí „nejdřív
  // k vajíčku“). Přirážka je menší než jeden krok, cesta se tím neprodlouží.
  type St = { c: Cell; mask: number; last: number; cost: number; path: Move[] };
  const start: St = { c: a, mask: maskAt(a), last: -1, cost: 0, path: [] };
  const seen = new Map<string, number>();
  const open: St[] = [start];
  while (open.length) {
    open.sort((x, y) => x.cost - y.cost);
    const cur = open.shift()!;
    if (cur.mask === full && cur.c.x === b.x && cur.c.y === b.y) return cur.path.length === best.length ? cur.path : best;
    const k = `${cur.c.x},${cur.c.y},${cur.mask},${cur.last}`;
    if ((seen.get(k) ?? Infinity) <= cur.cost) continue;
    seen.set(k, cur.cost);
    if (cur.path.length >= best.length) continue;
    DIRS.forEach((d, di) => {
      const n = { x: cur.c.x + DELTA[d].x, y: cur.c.y + DELTA[d].y };
      if (!inside(m, n) || rocks.has(cellKey(n))) return;
      const turn = cur.last !== -1 && cur.last !== di ? 1 : 0;
      const mask = cur.mask | maskAt(n);
      const early = mask !== full && n.x === b.x && n.y === b.y ? 50 : 0;
      open.push({ c: n, mask, last: di, cost: cur.cost + 100 + turn + early, path: [...cur.path, d] });
    });
  }
  return best;
}

/** Počty instancí (pro testy a ladění). */
export const POOL_SIZES = Object.fromEntries(Object.entries(POOLS).map(([k, v]) => [k, v.length])) as Record<keyof Pools, number>;

/** Všechny předem spočítané úlohy nad mapami (testy je projdou všechny). */
export const MAP_POOLS: Readonly<Record<keyof Pools, readonly Maker[]>> = POOLS;

function pickFrom(pool: Maker[]) {
  return (rng: Rng): Spec => rng.pick(pool)(rng);
}

/** Vybere typ otázky podle vah a z něj jednu instanci. */
function mix(parts: [number, Maker[]][]) {
  const total = parts.reduce((s, [wgt]) => s + wgt, 0);
  return (rng: Rng): Spec => {
    let r = rng.next() * total;
    for (const [wgt, pool] of parts) {
      if (r < wgt) return pickFrom(pool)(rng);
      r -= wgt;
    }
    return pickFrom(parts[parts.length - 1][1])(rng);
  };
}

// ---------------------------------------------------------------------------
// Měřítko (L5): 1 cm na mapě = 1 km (nebo 2 km) ve skutečnosti

function meritko(rng: Rng): Spec {
  const per = rng.pick([1, 1, 2, 5]);
  const cm = rng.int(2, 9);
  const km = cm * per;
  const perText = per === 1 ? '1 km' : `${per} km`;
  const perSpeak = per === 1 ? 'jeden kilometr' : per === 2 ? 'dva kilometry' : 'pět kilometrů';
  // Předčítání se správným tvarem: „2 centimetry“, „5 centimetrů“, „4 kilometry“.
  const cmSpeak = count(cm, ['centimetr', 'centimetry', 'centimetrů']);
  const kmSpeak = count(km, ['kilometr', 'kilometry', 'kilometrů']);
  if (rng.chance(0.5) || per === 1) {
    return num(`meritko-${per}-cm-${cm}`, `Na mapě je 1 cm jako ${perText} ve skutečnosti. Cesta měří na mapě ${cm} cm. Kolik kilometrů je doopravdy?`, km,
      [per === 1 ? 'Každý centimetr na mapě je jeden kilometr.' : `Každý centimetr na mapě je ${perSpeak}.`],
      per === 1 ? `${cm} cm na mapě je ${km} km ve skutečnosti.` : `${cm} · ${per} = ${km}. Cesta je dlouhá ${km} km.`,
      { unit: 'km', speak: `Na mapě je jeden centimetr jako ${perSpeak} ve skutečnosti. Cesta měří na mapě ${cmSpeak}. Kolik kilometrů je doopravdy?` });
  }
  return num(`meritko-${per}-km-${km}`, `Na mapě je 1 cm jako ${perText} ve skutečnosti. Cesta je doopravdy dlouhá ${km} km. Kolik centimetrů měří na mapě?`, cm,
    [`Kolikrát se ${perText} vejde do ${km} km?`],
    `${km} : ${per} = ${cm}. Na mapě měří cesta ${cm} cm.`,
    { unit: 'cm', speak: `Na mapě je jeden centimetr jako ${perSpeak} ve skutečnosti. Cesta je doopravdy dlouhá ${kmSpeak}. Kolik centimetrů měří na mapě?` });
}

// ---------------------------------------------------------------------------
// Banky: plán × mapa, světové strany, Slunce, kompas, barvy, měřítko

const ss = (key: string, prompt: string, correct: number, hints: string[], explain: string, extra: Extra = {}) =>
  fixed(key, prompt, ['Sever', 'Východ', 'Jih', 'Západ'], correct, hints, explain, extra);
/** Totéž pro otázky „Kam…?“ – odpověď „Na sever“. */
const kam = (key: string, prompt: string, correct: number, hints: string[], explain: string, extra: Extra = {}) =>
  fixed(key, prompt, SMER_OPTIONS, correct, hints, explain, extra);

const L1: Spec[] = [
  q('plan-co', 'Jak se jmenuje nákres místa, jako by ses na něj {dívala|díval} shora?', 'Plán',
    ['Portrét', 'Fotka zboku', 'Pohlednice'],
    ['Tak vidí krajinu pták nebo drak.'],
    'Plán ukazuje místo shora, třeba třídu, byt nebo zahradu. Věci jsou na něm zmenšené a nakreslené značkami.'),
  q('shora-stul', 'Jak vypadá kulatý stůl, když se na něj díváš shora?', 'Jako kruh',
    ['Jako trojúhelník', 'Jako čtverec', 'Jako hvězda'],
    ['Představ si, že se díváš ze stropu.'],
    'Shora vidíme jen desku stolu a ta je kulatá. Na plánu se proto kreslí jako kruh.'),
  q('shora-kniha', 'Jak vypadá zavřená kniha na stole, když se díváš shora?', 'Jako obdélník',
    ['Jako kruh', 'Jako trojúhelník', 'Jako srdce'],
    ['Podívej se na knihu z výšky.'],
    'Kniha má obdélníkové desky, a tak ji shora vidíme jako obdélník.'),
  q('mapovec', 'Proč Mapovec vidí zemi jako mapu?', 'Létá vysoko a dívá se shora',
    ['Má dalekohled v oku', 'Chodí po zemi', 'Dívá se jen zboku'],
    ['Odkud se kreslí mapy a plány?'],
    'Z výšky vypadá krajina jako mapa: domy, lesy a řeky vidíme shora a zmenšené.'),
  q('plan-k-cemu', 'Na co se hodí plán cesty do školy?', 'Abych {věděla|věděl}, kudy jít',
    ['Abych {věděla|věděl}, kolik je hodin', 'Aby mi nebyla zima', 'Abych {uměla|uměl} plavat'],
    ['Co na plánu uvidíš?'],
    'Plán ukáže ulice, domy a přechody. Podle něj najdeš cestu a víš, kde dát pozor.'),
  q('vpravo-ruka', 'Stojíš u dveří a postel je po tvé pravé ruce. Kde je od tebe postel?', 'Vpravo',
    ['Vlevo', 'Nahoře', 'Za zády'],
    ['Která ruka je tvoje pravá? Natáhni ji do strany.'],
    'Co je po pravé ruce, je vpravo. Co je po levé ruce, je vlevo.'),
  q('plan-znacky', 'Proč jsou na plánu jen malé obrázky a značky?', 'Plán je zmenšený',
    ['Plán je větší než skutečnost', 'Na plánu nesmí být barvy', 'Značky jsou hezčí než věci'],
    ['Vešla by se celá zahrada na papír ve skutečné velikosti?'],
    'Plán je zmenšený obrázek místa. Skutečné věci by se na papír nevešly, a tak je kreslíme malé.'),
];

const L2: Spec[] = [
  q('jih', 'Na mapě je sever nahoře. Kde je jih?', 'Dole',
    ['Nahoře', 'Vlevo', 'Vpravo'],
    ['Jih je naproti severu.'],
    'Sever je na mapě nahoře a jih naproti němu – dole.'),
  q('vychod', 'Na mapě je sever nahoře. Kde je východ?', 'Vpravo',
    ['Vlevo', 'Nahoře', 'Dole'],
    ['Na růžici jdou strany ve směru hodinových ručiček: sever, východ, jih, západ.'],
    'Když je sever nahoře, východ je vpravo a západ vlevo.'),
  q('zapad', 'Na mapě je sever nahoře. Kde je západ?', 'Vlevo',
    ['Vpravo', 'Nahoře', 'Dole'],
    ['Západ je naproti východu.'],
    'Když je sever nahoře, západ je vlevo a východ vpravo.'),
  q('vychazi', 'Na které straně vychází Slunce?', 'Na východě',
    ['Na západě', 'Na severu', 'Na jihu'],
    ['Kde je ráno světlo nejdřív?'],
    'Slunce vychází ráno na východní straně oblohy – v létě spíš na severovýchodě, v zimě spíš na jihovýchodě. Ráno proto svítí do oken, která míří na východ.'),
  q('zapada', 'Na které straně zapadá Slunce?', 'Na západě',
    ['Na východě', 'Na severu', 'Na jihu'],
    ['Zapadá na opačné straně, než vychází.'],
    'Slunce zapadá večer na západě, na opačné straně, než ráno vychází.'),
  num('pocet-stran', 'Kolik je hlavních světových stran?', 4,
    ['Sever je jedna z nich.'],
    'Hlavní světové strany jsou čtyři: sever, jih, východ a západ.'),
  q('kompas', 'Kam ukazuje střelka kompasu?', 'K severu',
    ['K východu', 'K západu', 'Ke Slunci'],
    ['Kompas ukazuje stále stejný směr, ať se otočíš kamkoli.'],
    'Střelka kompasu je malý magnet a ukazuje k severu. Podle ní najdeš i ostatní strany.'),
  ss('naproti-severu', 'Která světová strana je naproti severu?', 2,
    ['Když stojíš čelem k severu, co máš za zády?'],
    'Naproti severu je jih a naproti východu je západ.'),
  ss('naproti-vychodu', 'Která světová strana je naproti východu?', 3,
    ['Kde Slunce vychází a kde zapadá?'],
    'Naproti východu je západ. Slunce vychází na východě a zapadá na západě.'),
  q('pismeno-v', 'Co znamená písmeno V na růžici světových stran?', 'Východ',
    ['Vlevo', 'Vítr', 'Voda'],
    ['Na růžici jsou jen světové strany.'],
    'Na růžici jsou písmena S, V, J, Z: sever, východ, jih a západ.'),
  q('pismeno-z', 'Co znamená písmeno Z na růžici světových stran?', 'Západ',
    ['Zima', 'Zem', 'Zpátky'],
    ['Na růžici jsou jen světové strany.'],
    'Z znamená západ. Na mapě je vlevo, když je sever nahoře.'),
  q('pismeno-j', 'Co znamená písmeno J na růžici světových stran?', 'Jih',
    ['Jaro', 'Jezero', 'Jinam'],
    ['Na růžici jsou jen světové strany.'],
    'J znamená jih. Na mapě je dole, naproti severu.'),
  q('poledne', 'Kde je u nás Slunce v poledne?', 'Na jihu',
    ['Na severu', 'Na východě', 'Na západě'],
    ['Ráno vychází na východě a večer zapadá na západě. Kudy putuje mezitím?'],
    'Ráno je Slunce na východě, v poledne na jihu a večer zapadá na západě. Přímo na severu u nás Slunce nikdy nebývá.'),
  q('voda-modra', 'Jakou barvou se na mapě kreslí řeky a moře?', 'Modrou',
    ['Zelenou', 'Hnědou', 'Červenou'],
    ['Jakou barvu má voda na obrázcích?'],
    'Voda se na mapách kreslí modře: řeky, rybníky, jezera i moře.'),
  q('plan-pokoj', 'Co nakreslíš jako plán, a ne jako mapu?', 'Svůj pokoj',
    ['Celou Evropu', 'Celé Česko', 'Celou Zemi'],
    ['Plán je pro malé místo, mapa pro velké území.'],
    'Plán kreslíme pro malé místo, třeba pokoj, byt nebo zahradu. Velká území jako Česko nebo Evropa ukazují mapy.'),
];

const L3: Spec[] = [
  q('zelena', 'Na zeměpisné mapě ukazují barvy, jak vysoko je krajina. Co znamená zelená?', 'Nížiny',
    ['Hory', 'Moře', 'Ledovce'],
    ['Hory jsou hnědé. Co je naopak nejníž?'],
    'Na zeměpisné mapě jsou nížiny zelené, vyšší krajina žlutá a světle hnědá a hory tmavě hnědé. Voda je modrá.'),
  q('hneda', 'Na zeměpisné mapě ukazují barvy, jak vysoko je krajina. Co znamená tmavě hnědá?', 'Vysoké hory',
    ['Nížiny', 'Řeky', 'Města'],
    ['Zelená je nejníž. Co je nejvýš?'],
    'Tmavě hnědé jsou na zeměpisné mapě vysoké hory. Čím tmavší hnědá, tím výš.'),
  q('legenda', 'Kde na mapě zjistíš, co znamenají značky?', 'V legendě',
    ['V měřítku', 'V růžici', 'Na zadní straně obalu'],
    ['Je to vysvětlivka, obvykle v rohu mapy.'],
    'Legenda je vysvětlivka značek na mapě. Najdeš ji většinou v rohu nebo na okraji mapy.'),
  q('meritko-co', 'Co ukazuje měřítko mapy?', 'Kolikrát je mapa zmenšená',
    ['Kde je sever', 'Co znamenají značky', 'Jak je krajina vysoko'],
    ['Jak zjistíš, jak daleko je to doopravdy?'],
    'Měřítko říká, kolikrát je mapa menší než skutečnost. Podle něj spočítáš skutečnou vzdálenost.'),
  q('mech', 'Podle čeho se nedá spolehlivě poznat sever?', 'Podle mechu na stromech',
    ['Podle kompasu', 'Podle Polárky', 'Podle Slunce v poledne'],
    ['Která z možností se často plete?'],
    'Mech roste tam, kde je vlhko a stín – někdy na severní straně kmene, jindy jinde. Spolehlivý je kompas, Polárka nebo Slunce v poledne.'),
  kam('zady-slunci', 'V poledne stojíš zády ke Slunci. Kam se díváš?', 0,
    ['Kde je Slunce v poledne?'],
    'V poledne je u nás Slunce na jihu. Když k němu stojíš zády, díváš se na sever – tam ukazuje i tvůj stín.'),
  kam('stin-poledne', 'Kam u nás ukazuje v poledne tvůj stín?', 0,
    ['Stín je vždy na opačné straně než Slunce.'],
    'V poledne je Slunce na jihu, a tak stín ukazuje na sever.'),
  q('polarka', 'Jak najdeš v noci sever?', 'Podle Polárky',
    ['Podle Měsíce', 'Podle mraků', 'Podle větru'],
    ['Je to hvězda, která se skoro nehýbe.'],
    'Polárka stojí skoro přesně nad severem. Najdeš ji podle Velkého vozu.'),
  q('mobil', 'Co ti v mobilu ukáže, kde je sever?', 'Kompas',
    ['Kalkulačka', 'Budík', 'Fotoaparát'],
    ['Stejný přístroj používají turisté a námořníci.'],
    'Mobil umí fungovat jako kompas. Ukáže sever a podle něj najdeš i ostatní strany.'),
  ss('rano-prava', 'Ráno stojíš čelem k vycházejícímu Slunci. Která strana je po tvé pravé ruce?', 2,
    ['Kde Slunce vychází?', 'Když se díváš na východ, sever máš vlevo.'],
    'Díváš se na východ. Po pravé ruce máš jih, po levé sever a za zády západ.'),
  ss('rano-leva', 'Ráno stojíš čelem k vycházejícímu Slunci. Která strana je po tvé levé ruce?', 0,
    ['Kde Slunce vychází?'],
    'Díváš se na východ. Po levé ruce máš sever, po pravé jih a za zády západ.'),
  kam('otocka-pul', 'Díváš se na sever a otočíš se o půl otáčky. Kam se díváš teď?', 2,
    ['Půl otáčky znamená, že máš to, co bylo před tebou, za zády.'],
    'Po půl otáčce se díváš opačně než předtím. Naproti severu je jih.'),
  kam('otocka-ctvrt', 'Díváš se na sever a otočíš se o čtvrt otáčky doprava. Kam se díváš teď?', 1,
    ['Na růžici jdou strany dokola ve směru hodinových ručiček.'],
    'Čtvrt otáčky doprava od severu je východ – na růžici je hned vpravo od severu.'),
  q('turisticke', 'Jaké barvy mají turistické značky v Česku?', 'Červená, modrá, zelená, žlutá',
    ['Jen černá a bílá', 'Fialová a oranžová', 'Duhové barvy'],
    ['Vzpomeň si na značky na stromech u lesní cesty.'],
    'Turistické značky v Česku jsou červené, modré, zelené a žluté, vždy mezi dvěma bílými proužky. Podle nich se v přírodě neztratíš.'),
];

const L4: Spec[] = [
  q('sv', 'Která světová strana leží mezi severem a východem?', 'Severovýchod',
    ['Jihozápad', 'Severozápad', 'Jihovýchod'],
    ['Jméno se skládá ze dvou stran.'],
    'Mezi severem a východem je severovýchod. Na mapě je vpravo nahoře.'),
  q('jz', 'Která světová strana leží mezi jihem a západem?', 'Jihozápad',
    ['Severovýchod', 'Severozápad', 'Jihovýchod'],
    ['Jméno se skládá ze dvou stran.'],
    'Mezi jihem a západem je jihozápad. Na mapě je vlevo dole.'),
  q('naproti-sv', 'Která strana je přesně naproti severovýchodu?', 'Jihozápad',
    ['Severozápad', 'Jihovýchod', 'Severovýchod'],
    ['Naproti severu je jih a naproti východu západ.'],
    'Naproti severu je jih a naproti východu západ, takže naproti severovýchodu je jihozápad.'),
  q('nacrt', 'Jak se říká rychlému nákresu cesty bez přesného měření?', 'Náčrt',
    ['Mapa', 'Plán', 'Glóbus'],
    ['Kreslí se od ruky a rychle.'],
    'Náčrt je rychlý nákres od ruky, bez přesného měření. Plán a mapa se kreslí přesně a zmenšeně.'),
  q('globus', 'Co je glóbus?', 'Zmenšený model Země',
    ['Plán města', 'Kompas', 'Mapa hvězd'],
    ['Má tvar koule a dá se otáčet.'],
    'Glóbus je zmenšený model Země ve tvaru koule. Na rozdíl od mapy ukazuje Zemi bez zkreslení.'),
  q('turisticka-mapa', 'Na jaké mapě najdeš turistické cesty a značky?', 'Na turistické mapě',
    ['Na mapě světa', 'Na mapě hvězd', 'Na plánu bytu'],
    ['Takovou mapu si berou turisté na výlet.'],
    'Turistická mapa ukazuje cesty, turistické značky, rozhledny i studánky. Hodí se na výlety.'),
  q('natoceni', 'Jak správně natočíš mapu v přírodě?', 'Aby její sever mířil k severu',
    ['Aby text byl vzhůru nohama', 'Aby mířila ke Slunci', 'Na natočení nezáleží'],
    ['Kam na mapě ukazuje růžice a kam kompas?'],
    'Mapu natočíme tak, aby její sever mířil ke skutečnému severu. Pak leží to, co je na mapě vpravo, i v krajině vpravo.'),
  q('kompas-proc', 'Proč střelka kompasu ukazuje k severu?', 'Střelka je magnet a Země také',
    ['Na severu je víc železa', 'Fouká tam vítr', 'Sever je nahoře'],
    ['Z čeho je střelka kompasu?'],
    'Střelka kompasu je malý magnet. Země se chová jako obrovský magnet, a tak se střelka natočí k severu.'),
  q('slunce-poledne-cas', 'V kolik hodin je Slunce u nás přibližně na jihu?', 'Kolem poledne',
    ['Ráno v šest', 'Večer v osm', 'O půlnoci'],
    ['Kdy je Slunce na obloze nejvýš?'],
    'Kolem poledne je Slunce na jihu a nejvýš na obloze. V letním čase je to spíš kolem jedné hodiny odpoledne.'),
  q('vecer-stin', 'Večer ti zapadající Slunce svítí do zad. Kam ukazuje tvůj stín?', 'Na východ',
    ['Na západ', 'Na sever', 'Na jih'],
    ['Kde Slunce zapadá?'],
    'Slunce zapadá zhruba na západě. Stín je vždy na opačné straně než Slunce, tedy zhruba na východě.'),
];

const L5: Spec[] = [
  q('meritko-100000', 'Co znamená měřítko 1 : 100 000?', { label: '1 cm na mapě je 1 km', speak: 'Jeden centimetr na mapě je jeden kilometr' },
    [{ label: '1 cm na mapě je 1 m', speak: 'Jeden centimetr na mapě je jeden metr' },
      { label: '1 km na mapě je 1 cm', speak: 'Jeden kilometr na mapě je jeden centimetr' },
      { label: '1 m na mapě je 1 km', speak: 'Jeden metr na mapě je jeden kilometr' }],
    ['100 000 centimetrů je 1 000 metrů.'],
    '1 cm na mapě odpovídá 100 000 cm ve skutečnosti. To je 1 000 metrů, tedy 1 kilometr.',
    { speak: 'Co znamená měřítko jedna ku sto tisícům?' }),
  q('podrobnejsi', 'Která mapa ukáže víc podrobností?', { label: 'V měřítku 1 : 10 000', speak: 'V měřítku jedna ku deseti tisícům' },
    [{ label: 'V měřítku 1 : 1 000 000', speak: 'V měřítku jedna ku milionu' },
      { label: 'V měřítku 1 : 500 000', speak: 'V měřítku jedna ku pěti stům tisícům' },
      { label: 'V měřítku 1 : 100 000', speak: 'V měřítku jedna ku sto tisícům' }],
    ['Čím méně je mapa zmenšená, tím víc se na ni vejde podrobností.'],
    'Mapa v měřítku 1 : 10 000 je zmenšená nejméně, a tak na ní uvidíš i jednotlivé domy a cesty.'),
  q('vrstevnice', 'Co spojují vrstevnice na mapě?', 'Místa se stejnou výškou',
    ['Města se stejným jménem', 'Řeky a potoky', 'Stejně staré lesy'],
    ['Vrstevnice najdeš hlavně v horách.'],
    'Vrstevnice je čára, která spojuje místa ve stejné nadmořské výšce. Podle nich poznáš kopce a údolí.'),
  q('vrstevnice-huste', 'Kde jsou vrstevnice na mapě hodně blízko sebe?', 'Kde je svah prudký',
    ['Kde je rovina', 'Kde teče řeka', 'Kde je město'],
    ['Na prudkém svahu stoupáš na krátké cestě hodně vysoko.'],
    'Když jsou vrstevnice blízko sebe, výška se na krátké vzdálenosti rychle mění – svah je prudký.'),
  q('nadmorska', 'Od čeho se měří nadmořská výška?', 'Od hladiny moře',
    ['Od středu Země', 'Od nejbližší řeky', 'Od Prahy'],
    ['Napoví ti samotné slovo nad-mořská.'],
    'Nadmořská výška říká, jak vysoko je místo nad hladinou moře. U nás se měří od hladiny Baltského moře.'),
];

export const mapa = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Mapy a světové strany',
  description: 'Orientace na plánu a mapě: vlevo a vpravo, světové strany, lety draka po mapě, značky a barvy mapy a měřítko.',
  rvp: {
    1: ['ČJS-3-1-01'],
    2: ['ČJS-3-1-01'],
    3: ['ČJS-3-1-01'],
    4: ['ČJS-5-1-02', 'ČJS-5-1-03'],
    5: ['ČJS-5-1-02', 'ČJS-5-1-03'],
  },
  ability: 'prostorove',
  banks: { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: {
    1: mix([[3, POOLS.vedle], [2, POOLS.planLet]]),
    2: mix([[2, POOLS.primo], [2, POOLS.smer], [1, POOLS.nej], [2, POOLS.let]]),
    3: mix([[2, POOLS.trasa], [1, POOLS.kroky], [1, POOLS.prvni], [2, POOLS.vejce]]),
    4: mix([[2, POOLS.sikmo], [2, POOLS.oprava], [2, POOLS.trasa3], [1, POOLS.vejce]]),
    5: mix([[3, POOLS.km], [2, [meritko]], [1, POOLS.vejce]]),
  },
  genShare: 0.7,
});

export const mapaCards: KnowledgeCard[] = [
  {
    id: `${ID}.orient`,
    skillId: ID,
    level: 2,
    emoji: '🧭',
    title: 'Proč se říká orientace',
    text: 'Slovo orientovat se pochází od slova orient, které znamená východ. Na mnoha starých mapách býval nahoře právě východ.',
  },
  {
    id: `${ID}.mech`,
    skillId: ID,
    level: 3,
    emoji: '🌳',
    title: 'Mech není kompas',
    text: 'Mech roste tam, kde je vlhko a stín – někdy na severní straně kmene, jindy úplně jinde. Sever spolehlivě ukáže kompas, Polárka nebo Slunce v poledne.',
    fix: {
      before: 'Traduje se, že mech roste vždycky na severní straně stromů.',
      evidence: 'Když lidé porovnali mech na mnoha stromech s kompasem, zjistili, že na severní straně ho bývá jen o málo víc. V lese často roste kolem dokola nebo i na jiné straně.',
    },
  },
  {
    id: `${ID}.meritko`,
    skillId: ID,
    level: 5,
    emoji: '🗺️',
    title: 'Mapa je zmenšenina',
    text: 'Měřítko 1 : 100 000 znamená, že 1 cm na mapě je ve skutečnosti 100 000 cm, tedy 1 km. Díky měřítku změříš délku cesty na mapě obyčejným pravítkem.',
  },
];
