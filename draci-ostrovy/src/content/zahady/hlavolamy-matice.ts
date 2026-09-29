// Dračí matice: tabulka obrázků (2 × 2 na L1, jinak 3 × 3) s jedním prázdným
// políčkem. Každá vlastnost (předmět nebo tvar, barva, počet) se řídí jedním
// pravidlem: stejná v řádku, stejná ve sloupci, nebo „latinský čtverec“ (v
// každém řádku i sloupci každá hodnota jednou). Chybné možnosti se od správné
// liší právě v jedné vlastnosti, aby bylo nutné sledovat všechna pravidla.

import type { ChoiceSpec, Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, Level } from '../../core/types';
import { ORDINAL, countWords, hardAdj, rep, type Noun } from './hlavolamy-spolecne';

interface Obj {
  e: string;
  noun: Noun;
}

/** Předměty, které se dobře počítají (jedno emoji = jeden kus). */
const OBJECTS: Obj[] = [
  { e: '🍎', noun: { g: 'n', one: 'jablko', few: 'jablka' } },
  { e: '🍐', noun: { g: 'f', one: 'hruška', few: 'hrušky' } },
  { e: '🍋', noun: { g: 'm', one: 'citron', few: 'citrony' } },
  { e: '🍓', noun: { g: 'f', one: 'jahoda', few: 'jahody' } },
  { e: '⭐', noun: { g: 'f', one: 'hvězda', few: 'hvězdy' } },
  { e: '🐟', noun: { g: 'f', one: 'ryba', few: 'ryby' } },
  { e: '🌸', noun: { g: 'm', one: 'kvítek', few: 'kvítky' } },
  { e: '🍄', noun: { g: 'f', one: 'houba', few: 'houby' } },
  { e: '🐞', noun: { g: 'f', one: 'beruška', few: 'berušky' } },
  { e: '🔔', noun: { g: 'm', one: 'zvonek', few: 'zvonky' } },
  { e: '🐚', noun: { g: 'f', one: 'mušle', few: 'mušle' } },
  { e: '🥕', noun: { g: 'f', one: 'mrkev', few: 'mrkve' } },
];

const SHAPES: { key: string; noun: Noun; word: string }[] = [
  { key: 'k', noun: { g: 'n', one: 'kolečko', few: 'kolečka' }, word: 'tvar' },
  { key: 'c', noun: { g: 'm', one: 'čtvereček', few: 'čtverečky' }, word: 'tvar' },
  { key: 's', noun: { g: 'n', one: 'srdíčko', few: 'srdíčka' }, word: 'tvar' },
];

const COLORS: { key: string; stem: string }[] = [
  { key: 'r', stem: 'červen' },
  { key: 'y', stem: 'žlut' },
  { key: 'b', stem: 'modr' },
  { key: 'g', stem: 'zelen' },
];

/** Emoji pro [tvar][barva]. */
const SHAPE_EMOJI: string[][] = [
  ['🔴', '🟡', '🔵', '🟢'],
  ['🟥', '🟨', '🟦', '🟩'],
  ['❤️', '💛', '💙', '💚'],
];

type Attr = 'obj' | 'shape' | 'color' | 'count';
type RuleKind = 'row' | 'col' | 'latin' | 'const';

interface CellVal {
  obj: number; // index do OBJECTS nebo SHAPES
  color: number; // −1 u předmětů
  count: number; // 1–3
}

type Family = 'obj' | 'shape';

const label = (f: Family, c: CellVal) => rep(f === 'obj' ? OBJECTS[c.obj].e : SHAPE_EMOJI[c.obj][c.color], c.count);

/** Název pro předčítání. Když se počet v tabulce nemění (vždy 1), číslovka
 *  „jeden/jedna/jedno“ se vynechá: „modré kolečko“. */
function words(f: Family, c: CellVal, counted = true): string {
  const w =
    f === 'obj' ? countWords(c.count, OBJECTS[c.obj].noun) : countWords(c.count, SHAPES[c.obj].noun, hardAdj(COLORS[c.color].stem));
  return !counted && c.count === 1 ? w.replace(/^jed(en|na|no) /, '') : w;
}

const option = (f: Family, c: CellVal, counted: boolean): ChoiceOption => ({ label: label(f, c), speak: words(f, c, counted) });

/** Latinský čtverec 3 × 3: vzor (a·r + b·c) mod 3, zamíchané řádky a sloupce. */
function latin(pattern: 0 | 1, rows: number[], cols: number[], symbols: number[]): number[][] {
  return rows.map((r) => cols.map((c) => symbols[(r + (pattern === 0 ? 1 : 2) * c) % 3]));
}

const RULE_TEXT: Record<Attr, Partial<Record<RuleKind, string>>> = {
  obj: {
    row: 'V každém řádku je stejný obrázek.',
    col: 'V každém sloupci je stejný obrázek.',
    latin: 'V každém řádku i sloupci je každý obrázek jen jednou.',
  },
  shape: {
    row: 'V každém řádku je stejný tvar.',
    col: 'V každém sloupci je stejný tvar.',
    latin: 'V každém řádku i sloupci je každý tvar jen jednou.',
  },
  color: {
    row: 'V každém řádku je stejná barva.',
    col: 'V každém sloupci je stejná barva.',
    latin: 'V každém řádku i sloupci je každá barva jen jednou.',
  },
  count: {
    row: 'V každém řádku je stejný počet.',
    col: 'V každém sloupci je stejný počet.',
    latin: 'V každém řádku i sloupci je jednou jeden kus, jednou dva a jednou tři.',
  },
};

interface Design {
  family: Family;
  size: 2 | 3;
  rules: Partial<Record<Attr, RuleKind>>;
}

/** Návrhy pravidel podle úrovně. U předmětů je vlastnost „obj“, u tvarů
 *  „shape“ a „color“. Chybějící vlastnost je v celé tabulce stejná. */
const DESIGNS: Record<Level, Design[]> = {
  1: [
    { family: 'obj', size: 2, rules: { obj: 'row', count: 'col' } },
    { family: 'obj', size: 2, rules: { obj: 'col', count: 'row' } },
    { family: 'shape', size: 2, rules: { color: 'row', shape: 'col' } },
    { family: 'shape', size: 2, rules: { shape: 'row', color: 'col' } },
  ],
  2: [
    { family: 'obj', size: 3, rules: { obj: 'row', count: 'col' } },
    { family: 'obj', size: 3, rules: { obj: 'col', count: 'row' } },
    { family: 'shape', size: 3, rules: { color: 'row', shape: 'col' } },
    { family: 'shape', size: 3, rules: { shape: 'row', color: 'col' } },
  ],
  3: [
    { family: 'obj', size: 3, rules: { obj: 'latin' } },
    { family: 'shape', size: 3, rules: { shape: 'latin', color: 'row' } },
    { family: 'shape', size: 3, rules: { color: 'latin', shape: 'col' } },
    { family: 'obj', size: 3, rules: { obj: 'row', count: 'latin' } },
  ],
  4: [
    { family: 'obj', size: 3, rules: { obj: 'latin', count: 'latin' } },
    { family: 'shape', size: 3, rules: { shape: 'latin', color: 'latin' } },
    { family: 'obj', size: 3, rules: { obj: 'latin', count: 'col' } },
    { family: 'shape', size: 3, rules: { color: 'latin', count: 'row' } },
  ],
  5: [
    { family: 'shape', size: 3, rules: { shape: 'latin', color: 'latin', count: 'row' } },
    { family: 'shape', size: 3, rules: { shape: 'latin', color: 'col', count: 'latin' } },
    { family: 'shape', size: 3, rules: { shape: 'row', color: 'latin', count: 'latin' } },
    { family: 'obj', size: 3, rules: { obj: 'latin', count: 'latin' } },
  ],
  6: [{ family: 'shape', size: 3, rules: { shape: 'latin', color: 'latin', count: 'latin' } }],
};

const ATTRS_OF: Record<Family, Attr[]> = { obj: ['obj', 'count'], shape: ['shape', 'color', 'count'] };

function domain(f: Family, a: Attr): number[] {
  if (a === 'count') return [1, 2, 3];
  if (a === 'obj') return OBJECTS.map((_, i) => i);
  if (a === 'shape') return SHAPES.map((_, i) => i);
  return f === 'shape' ? COLORS.map((_, i) => i) : [-1];
}

function makeGrid(level: Level, rng: Rng): { d: Design; grid: CellVal[] } {
  const d = rng.pick(DESIGNS[level]);
  const n = d.size;
  const rows = rng.shuffle([0, 1, 2]).slice(0, n);
  const cols = rng.shuffle([0, 1, 2]).slice(0, n);
  // Dva latinské čtverce v jedné tabulce jsou „ortogonální“ (každá dvojice hodnot jednou).
  let nextPattern: 0 | 1 = rng.chance(0.5) ? 0 : 1;
  const values: Partial<Record<Attr, number[][]>> = {};
  for (const a of ATTRS_OF[d.family]) {
    const rule = d.rules[a] ?? 'const';
    const dom = domain(d.family, a);
    let pickVals: number[];
    if (a === 'count') pickVals = level <= 2 && rule !== 'const' ? (n === 2 ? rng.pick([[1, 2], [2, 3], [1, 3]]) : [1, 2, 3]) : rng.shuffle([1, 2, 3]);
    else pickVals = rng.shuffle(dom).slice(0, 3);
    if (rule === 'const') {
      const v = a === 'count' ? 1 : pickVals[0];
      values[a] = Array.from({ length: n }, () => Array.from({ length: n }, () => v));
    } else if (rule === 'row') {
      values[a] = Array.from({ length: n }, (_, r) => Array.from({ length: n }, () => pickVals[r]));
    } else if (rule === 'col') {
      values[a] = Array.from({ length: n }, () => Array.from({ length: n }, (_, c) => pickVals[c]));
    } else {
      values[a] = latin(nextPattern, rows, cols, pickVals);
      nextPattern = nextPattern === 0 ? 1 : 0;
    }
  }
  const grid: CellVal[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid.push({
        obj: (values.obj ?? values.shape)![r][c],
        color: d.family === 'shape' ? values.color![r][c] : -1,
        count: values.count![r][c],
      });
    }
  }
  return { d, grid };
}

const get = (c: CellVal, a: Attr) => (a === 'obj' || a === 'shape' ? c.obj : a === 'color' ? c.color : c.count);
const withAttr = (c: CellVal, a: Attr, v: number): CellVal =>
  a === 'obj' || a === 'shape' ? { ...c, obj: v } : a === 'color' ? { ...c, color: v } : { ...c, count: v };

function attempt(level: Level, rng: Rng): Spec | null {
  const { d, grid } = makeGrid(level, rng);
  const n = d.size;
  const ask = n === 2 && rng.chance(0.5) ? 3 : rng.int(0, n * n - 1);
  const ans = grid[ask];
  const inPlay = ATTRS_OF[d.family].filter((a) => d.rules[a] && d.rules[a] !== 'const');
  const counted = inPlay.includes('count');

  // Chybné možnosti: každá se liší v jedné vlastnosti.
  const altsOf = (a: Attr): number[] => {
    const inGrid = [...new Set(grid.map((c) => get(c, a)))].filter((v) => v !== get(ans, a));
    const extra = domain(d.family, a).filter((v) => v !== get(ans, a) && !inGrid.includes(v));
    return [...rng.shuffle(inGrid), ...rng.shuffle(extra)];
  };
  const wrong: CellVal[] = [];
  const quota: Partial<Record<Attr, number>> = {};
  if (inPlay.length >= 3) inPlay.forEach((a) => (quota[a] = 1));
  else if (inPlay.length === 2) {
    const [a, b] = rng.shuffle(inPlay);
    quota[a] = 2;
    quota[b] = 1;
  } else {
    quota[inPlay[0]] = 2;
    quota.count = (quota.count ?? 0) + 1;
  }
  for (const a of Object.keys(quota) as Attr[]) {
    for (const v of altsOf(a).slice(0, quota[a])) wrong.push(withAttr(ans, a, v));
  }
  if (wrong.length !== 3) return null;

  const cells = grid.map((c, i) => (i === ask ? null : label(d.family, c)));
  const rowName = (r: number) => (n === 2 ? (r === 0 ? 'Horní řádek' : 'Dolní řádek') : `${ORDINAL[r].replace(/^./, (m) => m.toUpperCase())} řádek`);
  const speakRows = Array.from({ length: n }, (_, r) =>
    `${rowName(r)}: ${Array.from({ length: n }, (_, c) => (r * n + c === ask ? 'otazník' : words(d.family, grid[r * n + c], counted))).join(', ')}.`,
  );
  const prompt = 'Každý řádek i sloupec má své pravidlo. Co patří na otazník?';
  const speak = `${prompt} ${speakRows.join(' ')}`;

  const watch = d.family === 'obj' ? ', jaký je to obrázek a kolik ho je' : counted ? ' tvar, barvu i počet' : ' tvar i barvu';
  const hints = ['Porovnej obrázky v řádku: co mají stejné a co se mění?', `Sleduj zvlášť${watch}.`];
  const hardest = inPlay.find((a) => d.rules[a] === 'latin');
  if (hardest) hints.push(RULE_TEXT[hardest].latin!);
  const rules = inPlay.map((a) => RULE_TEXT[a][d.rules[a]!]!);
  const explain = `${rules.join(' ')} Na otazník proto patří ${words(d.family, ans, counted)}.`;

  const code = (c: CellVal) =>
    d.family === 'obj' ? `${String.fromCharCode(97 + c.obj)}${c.count}` : `${SHAPES[c.obj].key}${COLORS[c.color].key}${c.count}`;
  const key = `${d.family === 'obj' ? 'o' : 't'}${n}-${grid.map(code).join('')}-${ask}`;
  const spec: ChoiceSpec = {
    key,
    prompt,
    speak,
    visual: { type: 'table', cols: n, cells, ask },
    correct: option(d.family, ans, counted),
    wrong: wrong.map((c) => option(d.family, c, counted || c.count !== 1)),
    hints,
    explain,
    difficulty: Math.max(-0.5, Math.min(0.5, (inPlay.length - 2) * 0.2 + (hardest ? 0.1 : -0.1))),
  };
  return spec;
}

export const MATICE_GEN: Partial<Record<Level, (rng: Rng) => Spec>> = Object.fromEntries(
  ([1, 2, 3, 4, 5, 6] as Level[]).map((level) => [
    level,
    (rng: Rng): Spec => {
      for (let i = 0; i < 100; i++) {
        const s = attempt(level, rng);
        if (s) return s;
      }
      throw new Error(`zahady.matice: úloha úrovně ${level} se nepovedla`);
    },
  ]),
);
