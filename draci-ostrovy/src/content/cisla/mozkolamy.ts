// Mozkolamy: číselné řady, váhy a magické čtverce. Řady a váhy mají formát
// podobný subtestům inteligence – hra je podle rozhodnutí rodiče trénuje,
// ale každé procvičení zapisuje (testLike), aby šlo psycholožce přesně říct,
// co dítě dělalo.

import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { count, form, type Forms } from '../../core/czech';
import { mk, num, type ItemParts } from './common';

// ---------------------------------------------------------------------------
// Číselné řady

const SERIES = 'cisla.rady';

interface Rule {
  key: string;
  make: (rng: Rng) => number[] | null;
  hint: string;
  explain: (xs: number[]) => string;
}

const arith = (start: number, d: number, n: number) => Array.from({ length: n }, (_, i) => start + i * d);

const RULES: Record<Level, Rule[]> = {
  1: [
    { key: 'plus', make: (r) => arith(r.int(1, 8), r.int(1, 2), 6), hint: 'O kolik se zvětšuje každé další číslo?', explain: (x) => `Každé číslo je o ${x[1] - x[0]} větší.` },
    { key: 'minus', make: (r) => arith(r.int(12, 20), -r.int(1, 2), 6), hint: 'Čísla se zmenšují. O kolik?', explain: (x) => `Každé číslo je o ${x[0] - x[1]} menší.` },
  ],
  2: [
    { key: 'plus', make: (r) => arith(r.int(0, 20), r.int(2, 10), 6), hint: 'O kolik se liší sousední čísla?', explain: (x) => `Pokaždé přičítáme ${x[1] - x[0]}.` },
    { key: 'minus', make: (r) => arith(r.int(60, 100), -r.int(3, 10), 6), hint: 'O kolik se čísla zmenšují?', explain: (x) => `Pokaždé odečítáme ${x[0] - x[1]}.` },
    { key: 'double', make: (r) => { const s = r.int(1, 3); return [s, s * 2, s * 4, s * 8, s * 16]; }, hint: 'Zkus, jestli se čísla nezdvojnásobují.', explain: () => 'Každé číslo je dvakrát větší než předchozí.' },
  ],
  3: [
    { key: 'plus', make: (r) => arith(r.int(10, 200), r.int(11, 50), 6), hint: 'Spočítej rozdíl dvou sousedních čísel.', explain: (x) => `Pokaždé přičítáme ${x[1] - x[0]}.` },
    { key: 'alt', make: (r) => { const a = r.int(2, 5); const b = r.int(1, 4); if (a === b) return null; const s = r.int(1, 20); const xs = [s]; for (let i = 1; i < 7; i++) xs.push(xs[i - 1] + (i % 2 ? a : b)); return xs; }, hint: 'Rozdíly se střídají. Podívej se na každý druhý krok.', explain: (x) => `Střídavě přičítáme ${x[1] - x[0]} a ${x[2] - x[1]}.` },
    { key: 'grow', make: (r) => { const s = r.int(1, 10); const xs = [s]; for (let i = 1; i < 6; i++) xs.push(xs[i - 1] + i); return xs; }, hint: 'Rozdíly nejsou stejné. Rostou?', explain: () => 'Přičítáme 1, pak 2, pak 3, pak 4…' },
  ],
  4: [
    { key: 'triple', make: (r) => { const s = r.int(1, 3); return [s, s * 3, s * 9, s * 27, s * 81]; }, hint: 'Rozdíly rostou moc rychle. Nenásobí se to?', explain: () => 'Každé číslo je třikrát větší.' },
    { key: 'grow2', make: (r) => { const s = r.int(1, 5); const step = r.int(2, 3); const xs = [s]; for (let i = 1; i < 6; i++) xs.push(xs[i - 1] + i * step); return xs; }, hint: 'Napiš si rozdíly sousedních čísel. Co s nimi děje?', explain: (x) => `Rozdíly rostou o ${x[2] - x[1] - (x[1] - x[0])}: ${x.slice(1).map((v, i) => v - x[i]).join(', ')}.` },
    { key: 'halve', make: (r) => { const e = r.int(1, 5); return [e * 32, e * 16, e * 8, e * 4, e * 2, e]; }, hint: 'Čísla se zmenšují stále pomaleji.', explain: () => 'Každé číslo je polovina předchozího.' },
  ],
  5: [
    { key: 'fib', make: (r) => { const a = r.int(1, 4); const b = r.int(1, 5); const xs = [a, b]; for (let i = 2; i < 8; i++) xs.push(xs[i - 1] + xs[i - 2]); return xs; }, hint: 'Podívej se na dvě čísla za sebou a na to, které následuje.', explain: () => 'Každé číslo je součtem dvou předchozích.' },
    { key: 'squares', make: (r) => { const s = r.int(1, 4); return Array.from({ length: 6 }, (_, i) => (s + i) * (s + i)); }, hint: 'Zkus na čísla použít násobilku: 3 × 3, 4 × 4…', explain: () => 'Jsou to čísla vynásobená sama sebou: 1 × 1, 2 × 2, 3 × 3…' },
    { key: 'x2p1', make: (r) => { const s = r.int(1, 4); const xs = [s]; for (let i = 1; i < 6; i++) xs.push(xs[i - 1] * 2 + 1); return xs; }, hint: 'Zkus nejdřív násobit a pak přičíst.', explain: () => 'Každé číslo je dvakrát předchozí a ještě jedna navíc.' },
  ],
  6: [
    { key: 'interleave', make: (r) => { const a = r.int(1, 5); const b = r.int(20, 40); const da = r.int(2, 5); const db = r.int(1, 4); const xs: number[] = []; for (let i = 0; i < 4; i++) { xs.push(a + i * da, b - i * db); } return xs; }, hint: 'Nejsou to dvě řady zamíchané do sebe? Podívej se na každé druhé číslo.', explain: () => 'Na lichých místech jedna řada nahoru, na sudých druhá dolů.' },
    { key: 'x2m1', make: (r) => { const s = r.int(2, 5); const xs = [s]; for (let i = 1; i < 6; i++) xs.push(xs[i - 1] * 2 - 1); return xs; }, hint: 'Zkus násobit a pak jedničku odečíst.', explain: () => 'Každé číslo je dvakrát předchozí mínus jedna.' },
    { key: 'grow3', make: (r) => { const s = r.int(1, 5); const xs = [s]; for (let i = 1; i < 6; i++) xs.push(xs[i - 1] + i * i); return xs; }, hint: 'Rozdíly jsou 1, 4, 9… znáš ta čísla?', explain: () => 'Přičítáme 1 × 1, 2 × 2, 3 × 3, 4 × 4…' },
  ],
};

function seriesAttempt(level: Level, rng: Rng): ItemParts | null {
  const rule = rng.pick(RULES[level]);
  const xs = rule.make(rng);
  if (!xs || xs.some((x) => x < 0 || x > 5000)) return null;
  const missingAt = level <= 2 ? xs.length - 1 : rng.chance(0.7) ? xs.length - 1 : rng.int(3, xs.length - 2);
  const items: (number | null)[] = xs.map((x, i) => (i === missingAt ? null : x));
  return {
    key: `${rule.key}-${xs.join('.')}-${missingAt}`,
    prompt: 'Které číslo patří na místo otazníku?',
    speak: `Řada čísel: ${items.map((x) => (x === null ? 'otazník' : x)).join(', ')}. Které číslo patří na místo otazníku?`,
    visual: { type: 'series', items },
    answer: num(xs[missingAt]),
    hints: [rule.hint, `Vyzkoušej své pravidlo na všech číslech, která znáš.`],
    explanation: `${rule.explain(xs)} Na místo otazníku patří ${xs[missingAt]}.`,
    difficulty: rule.key === 'plus' || rule.key === 'minus' ? -0.2 : 0.2,
  };
}

export const rady: SkillDef = {
  id: SERIES,
  island: 'cisla',
  name: 'Číselné řady',
  description: 'Hledání pravidla v řadě čísel (přičítání, střídání, násobení, součet předchozích).',
  levels: [1, 2, 3, 4, 5, 6],
  rvp: { 1: ['M-3-2-03'], 2: ['M-3-2-03'], 3: ['M-3-2-03'], 4: ['M-5-4-01'], 5: ['M-5-4-01'], 6: ['M-5-4-01'] },
  ability: 'usuzovani',
  testLike: 'ciselne-rady',
  generate: (level, rng) => {
    for (let i = 0; i < 80; i++) {
      const p = seriesAttempt(level, rng);
      if (p) return mk(SERIES, level, p);
    }
    throw new Error(`${SERIES}: úloha úrovně ${level} se nepovedla`);
  },
};

// ---------------------------------------------------------------------------
// Váhy

const SCALES = 'cisla.vahy';

const THING: Record<string, { nom: Forms; name: string; gen: string }> = {
  vejce: { nom: ['vejce', 'vejce', 'vajec'], name: 'vejce', gen: 'vejce' },
  sud: { nom: ['sud', 'sudy', 'sudů'], name: 'sud', gen: 'sudu' },
  stit: { nom: ['štít', 'štíty', 'štítů'], name: 'štít', gen: 'štítu' },
  kamen: { nom: ['kámen', 'kameny', 'kamenů'], name: 'kámen', gen: 'kamene' },
};

const rep = (t: string, n: number) => Array.from({ length: n }, () => t);

const one = (t: string) => (t === 'vejce' ? 'jedno vejce' : `jeden ${THING[t].name}`);
const twoThree = (k: number, t: string) => (k === 2 ? (t === 'vejce' ? 'dvě' : 'dva') : 'tři');

function scalesAttempt(level: Level, rng: Rng): ItemParts | null {
  const [t1, t2] = rng.shuffle(Object.keys(THING)).slice(0, 2);
  const T1 = THING[t1];

  if (level === 2) {
    const k = rng.int(2, 4);
    const w = rng.int(2, 9);
    return {
      key: `a${t1}-${k}-${w}`,
      prompt: `Váhy jsou v rovnováze. Kolik kilogramů váží ${one(t1)}?`,
      visual: { type: 'balance', left: rep(t1, k), right: [String(k * w)] },
      answer: num(w, 'kg'),
      hints: ['Na obou miskách je stejná váha.', `${capital(count(k, T1.nom))} váží dohromady ${k * w} kg. Kolik váží ${one(t1)}?`],
      explanation: `${k * w} : ${k} = ${w} kg.`,
    };
  }
  if (level === 3) {
    const k = rng.int(2, 3);
    const w = rng.int(2, 8);
    const extra = rng.int(1, 9);
    return {
      key: `b${t1}-${k}-${w}-${extra}`,
      prompt: `Váhy jsou v rovnováze. Kolik kilogramů váží ${one(t1)}?`,
      visual: { type: 'balance', left: [...rep(t1, k), String(extra)], right: [String(k * w + extra)] },
      answer: num(w, 'kg'),
      hints: [`Co když z obou misek sundáš ${extra} kg? Váhy zůstanou v rovnováze.`, `Pak ${count(k, T1.nom)} váží ${k * w} kg.`],
      explanation: `${k * w + extra} − ${extra} = ${k * w} a ${k * w} : ${k} = ${w} kg.`,
      difficulty: 0.2,
    };
  }
  if (level === 4) {
    const w1 = rng.int(1, 6);
    const ratio = rng.int(2, 4);
    const k = rng.int(1, 3);
    const total = w1 * ratio + k * w1;
    return {
      key: `c${t1}-${t2}-${w1}-${ratio}-${k}`,
      prompt: `${capital(one(t2))} váží stejně jako ${count(ratio, T1.nom)}. Kolik kilogramů váží ${one(t1)}?`,
      visual: { type: 'balance', left: [t2, ...rep(t1, k)], right: [String(total)] },
      answer: num(w1, 'kg'),
      hints: [`Vyměň v duchu ${THING[t2].name} za ${count(ratio, T1.nom)}.`, `Na levé misce pak leží ${count(ratio + k, T1.nom)}.`],
      explanation: `Vlevo pak leží ${count(ratio + k, T1.nom)} a váží ${total} kg. ${total} : ${ratio + k} = ${w1} kg.`,
      difficulty: 0.3,
    };
  }
  // L5–L6: dvě situace, dvě neznámé
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  if (a === b) return null;
  const k1 = rng.int(2, 3);
  const s1 = a + b;
  const s2 = k1 * a + b;
  return {
    key: `d${t1}-${t2}-${a}-${b}-${k1}`,
    prompt: `${capital(THING[t1].name)} a ${THING[t2].name} váží dohromady ${s1} kg. Na vahách leží ${twoThree(k1, t1)} ${form(k1, T1.nom)} a ${THING[t2].name} – ty váží ${s2} kg. Kolik kilogramů váží ${one(t1)}?`,
    visual: { type: 'balance', left: [...rep(t1, k1), t2], right: [String(s2)] },
    answer: num(a, 'kg'),
    hints: ['Porovnej obě situace: co leží na vahách navíc?', `Navíc leží ${count(k1 - 1, T1.nom)} a váží o ${s2 - s1} kg víc.`],
    explanation: `Navíc leží ${count(k1 - 1, T1.nom)}, ${k1 - 1 === 1 && t1 !== 'vejce' ? 'který' : 'které'} ${k1 - 1 === 1 ? 'váží' : 'váží dohromady'} ${s2} − ${s1} = ${s2 - s1} kg. ${capital(one(t1))} tedy váží ${k1 - 1 > 1 ? `${s2 - s1} : ${k1 - 1} = ` : ''}${a} kg.`,
    difficulty: 0.4,
  };
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const vahy: SkillDef = {
  id: SCALES,
  island: 'cisla',
  name: 'Kouzelné váhy',
  description: 'Rovnováha na vahách: kolik váží jedna věc, když známe součty – první krok k rovnicím.',
  levels: [2, 3, 4, 5, 6],
  rvp: { 2: ['M-3-1-04'], 3: ['M-3-1-05'], 4: ['M-5-4-01'], 5: ['M-5-4-01'], 6: ['M-5-4-01'] },
  ability: 'usuzovani',
  testLike: 'vahy',
  generate: (level, rng) => {
    for (let i = 0; i < 80; i++) {
      const p = scalesAttempt(level, rng);
      if (p) return mk(SCALES, level, p);
    }
    throw new Error(`${SCALES}: úloha úrovně ${level} se nepovedla`);
  },
};

// ---------------------------------------------------------------------------
// Magické čtverce

const MAGIC = 'cisla.ctverce';
const BASE = [2, 7, 6, 9, 5, 1, 4, 3, 8]; // součet 15

function transform(rng: Rng): number[] {
  // otočení a zrcadlení základního čtverce
  let g = BASE.slice();
  const rot = (x: number[]) => [x[6], x[3], x[0], x[7], x[4], x[1], x[8], x[5], x[2]];
  const flip = (x: number[]) => [x[2], x[1], x[0], x[5], x[4], x[3], x[8], x[7], x[6]];
  for (let i = rng.int(0, 3); i > 0; i--) g = rot(g);
  if (rng.chance(0.5)) g = flip(g);
  return g;
}

function magicAttempt(level: Level, rng: Rng): ItemParts | null {
  const add = level === 4 ? rng.int(0, 5) : level === 5 ? rng.int(0, 20) : rng.int(5, 50);
  const mul = level === 6 && rng.chance(0.5) ? rng.int(2, 3) : 1;
  const grid = transform(rng).map((x) => x * mul + add);
  const sum = grid[0] + grid[1] + grid[2];
  const hidden = level === 4 ? 1 : level === 5 ? 3 : 5;
  // skryjeme pole tak, aby šlo řešit postupně (vždy aspoň jedna řada s jedním prázdným polem)
  const order = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const blanks = new Set<number>();
  for (const i of order) {
    if (blanks.size >= hidden) break;
    blanks.add(i);
    if (!solvable(blanks)) blanks.delete(i);
  }
  if (blanks.size < hidden) return null;
  const blankList = [...blanks];
  const ask = blankList[rng.int(0, blankList.length - 1)];
  const shown = grid.map((x, i) => (blanks.has(i) ? null : x));
  const showSum = level < 6;
  return {
    key: `${grid.join('.')}-${blankList.sort().join('')}-${ask}`,
    prompt: showSum
      ? `V magickém čtverci má každý řádek, sloupec i úhlopříčka součet ${sum}. Které číslo patří na místo otazníku?`
      : 'V magickém čtverci mají všechny řádky, sloupce i úhlopříčky stejný součet. Které číslo patří na místo otazníku?',
    visual: { type: 'magic', grid: shown, ask, sum: showSum ? sum : undefined },
    answer: num(grid[ask]),
    hints: ['Najdi řádek, sloupec nebo úhlopříčku, kde chybí jen jedno číslo.', showSum ? `Kolik chybí do ${sum}?` : 'Nejdřív zjisti součet z řady, kde znáš všechna tři čísla.'],
    explanation: `Na místo otazníku patří ${grid[ask]}, protože řada pak dává součet ${sum}.`,
    difficulty: 0.1 * hidden,
  };
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** Lze prázdná pole doplnit postupně přes řady s jedním prázdným polem? */
function solvable(blanks: Set<number>): boolean {
  const open = new Set(blanks);
  let progress = true;
  while (open.size && progress) {
    progress = false;
    for (const line of LINES) {
      const missing = line.filter((i) => open.has(i));
      if (missing.length === 1) {
        open.delete(missing[0]);
        progress = true;
      }
    }
  }
  return open.size === 0;
}

export const ctverce: SkillDef = {
  id: MAGIC,
  island: 'cisla',
  name: 'Magické čtverce',
  description: 'Magické čtverce 3 × 3: doplňování podle stejného součtu v řádcích, sloupcích a úhlopříčkách.',
  levels: [4, 5, 6],
  rvp: { 4: ['M-5-4-01'], 5: ['M-5-4-01'], 6: ['M-5-4-01'] },
  ability: 'usuzovani',
  generate: (level, rng) => {
    for (let i = 0; i < 80; i++) {
      const p = magicAttempt(level, rng);
      if (p) return mk(MAGIC, level, p);
    }
    throw new Error(`${MAGIC}: úloha úrovně ${level} se nepovedla`);
  },
};
