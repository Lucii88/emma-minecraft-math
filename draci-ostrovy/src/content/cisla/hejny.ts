// Prostředí inspirovaná Hejného metodou: Dračí autobus, Hadi a Součtové
// trojúhelníky. Úlohy mají nízký práh a vysoký strop – stejné prostředí
// se na vyšší úrovni řeší pozpátku.

import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { count, formatNumber as f } from '../../core/czech';
import { mk, N, num, type ItemParts } from './common';

// ---------------------------------------------------------------------------
// Dračí autobus

const BUS = 'cisla.autobus';

function busAttempt(level: Level, rng: Rng): ItemParts | null {
  const stopsN = level <= 1 ? 2 : level === 2 ? 3 : level <= 4 ? 4 : 5;
  const maxMove = level <= 1 ? 3 : level === 2 ? 5 : level === 3 ? 8 : 12;
  const start = rng.int(level <= 1 ? 1 : 3, level <= 1 ? 5 : level <= 3 ? 12 : 20);
  const stops: { on: number; off: number }[] = [];
  let cur = start;
  for (let i = 0; i < stopsN; i++) {
    const off = rng.int(0, Math.min(maxMove, cur));
    const on = rng.int(off === 0 ? 1 : 0, maxMove);
    cur = cur - off + on;
    stops.push({ on, off });
  }
  if (cur > 40) return null;
  const askStart = level >= 3 && rng.chance(0.6);
  const route = stops.map((s, i) => `${i + 1}. ostrov: vystoupí ${s.off}, nastoupí ${s.on}`).join('; ');
  if (!askStart) {
    return {
      key: `f${start}-${stops.map((s) => `${s.off}.${s.on}`).join('-')}`,
      prompt: `Drak veze na hřbetě ${count(start, N.viking.acc)}. Na ostrovech Vikingové vystupují a nastupují. Kolik Vikingů sedí na drakovi na konci cesty?`,
      speak: `Drak veze na hřbetě ${count(start, N.viking.acc)}. Na ostrovech Vikingové vystupují a nastupují. ${route}. Kolik Vikingů sedí na drakovi na konci cesty?`,
      visual: { type: 'bus', start, stops, end: null },
      answer: num(cur),
      hints: ['Jdi ostrov po ostrově a vždy si zapamatuj, kolik jich sedí na drakovi.', `Po prvním ostrově: ${start} − ${stops[0].off} + ${stops[0].on} = ${start - stops[0].off + stops[0].on}.`],
      explanation: busExplain(start, stops),
      difficulty: level >= 3 ? -0.3 : 0,
    };
  }
  const atEnd = cur === 0 ? 'Na konci cesty už na drakovi nesedí nikdo.' : `Na konci cesty sedí na drakovi ${count(cur, N.viking.nom)}.`;
  return {
    key: `s${cur}-${stops.map((s) => `${s.off}.${s.on}`).join('-')}`,
    prompt: `${atEnd} Kolik Vikingů sedělo na drakovi na začátku?`,
    speak: `${atEnd} ${route}. Kolik Vikingů sedělo na drakovi na začátku?`,
    visual: { type: 'bus', start: null, stops, end: cur },
    answer: num(start),
    hints: ['Jdi pozpátku od konce: kdo nastoupil, ten „vystoupí“, a kdo vystoupil, ten se „vrátí“.', `Před posledním ostrovem: ${cur} − ${stops[stopsN - 1].on} + ${stops[stopsN - 1].off}.`],
    explanation: `Pozpátku: ${busBack(cur, stops)}. Na začátku jich sedělo ${start}.`,
    difficulty: 0.4,
  };
}

function busExplain(start: number, stops: { on: number; off: number }[]): string {
  let cur = start;
  const parts = stops.map((s) => {
    const next = cur - s.off + s.on;
    const t = `${cur} − ${s.off} + ${s.on} = ${next}`;
    cur = next;
    return t;
  });
  return `${parts.join(', ')}. ${cur === 0 ? 'Na konci už na drakovi nesedí nikdo' : `Na konci sedí na drakovi ${cur}`}.`;
}

function busBack(end: number, stops: { on: number; off: number }[]): string {
  let cur = end;
  const parts: string[] = [];
  for (let i = stops.length - 1; i >= 0; i--) {
    const prev = cur - stops[i].on + stops[i].off;
    parts.push(`${cur} − ${stops[i].on} + ${stops[i].off} = ${prev}`);
    cur = prev;
  }
  return parts.join(', ');
}

export const autobus: SkillDef = {
  id: BUS,
  island: 'cisla',
  name: 'Dračí autobus',
  description: 'Hejného prostředí Autobus: sledovat změny počtu a na vyšší úrovni počítat pozpátku (od konce k začátku).',
  levels: [1, 2, 3, 4, 5],
  rvp: { 1: ['M-3-1-05'], 2: ['M-3-1-05'], 3: ['M-3-1-05', 'M-3-2-02'], 4: ['M-5-4-01'], 5: ['M-5-4-01'] },
  ability: 'usuzovani',
  generate: (level, rng) => {
    for (let i = 0; i < 80; i++) {
      const p = busAttempt(level, rng);
      if (p) return mk(BUS, level, p);
    }
    throw new Error(`${BUS}: úloha úrovně ${level} se nepovedla`);
  },
};

// ---------------------------------------------------------------------------
// Hadi

const SNAKE = 'cisla.hadi';

function snakeAttempt(level: Level, rng: Rng): ItemParts | null {
  const len = level <= 1 ? 2 : level === 2 ? 3 : level <= 4 ? 4 : 5;
  const maxN = level <= 1 ? 5 : level === 2 ? 10 : level === 3 ? 30 : level === 4 ? 90 : 250;
  const start = rng.int(level <= 1 ? 2 : 5, level <= 2 ? 20 : level === 3 ? 100 : 500);
  const values = [start];
  const ops: { op: '+' | '−'; n: number }[] = [];
  for (let i = 0; i < len; i++) {
    const n = rng.int(1, maxN);
    const op = rng.chance(0.5) ? '+' : '−';
    const nextV = op === '+' ? values[i] + n : values[i] - n;
    if (nextV < 0) return null;
    values.push(nextV);
    ops.push({ op, n });
  }
  const max = level <= 1 ? 20 : level === 2 ? 60 : level === 3 ? 200 : 1000;
  if (values.some((x) => x > max)) return null;

  const mode = level <= 1 ? 'end' : level === 2 ? rng.pick(['end', 'middle'] as const) : rng.pick(['end', 'start', 'start', 'middle'] as const);
  const ask = mode === 'end' ? len : mode === 'start' ? 0 : rng.int(1, len - 1);
  const shown: (number | null)[] = values.map((x, i) => {
    if (i === ask) return null;
    if (mode === 'end') return i === 0 ? x : null;
    if (mode === 'start') return i === len ? x : null;
    return x;
  });
  const chain = ops.map((o) => `${o.op} ${o.n}`).join(', ');
  return {
    key: `${mode}-${values.join('.')}-${ops.map((o) => o.op + o.n).join('')}`,
    prompt: mode === 'end' ? 'Projdi hada od hlavy k ocasu. Jaké číslo je na konci?' : mode === 'start' ? 'Had má na ocase číslo. Jaké číslo má na hlavě?' : 'Které číslo chybí v hadovi?',
    speak: `${mode === 'end' ? `Začni na čísle ${values[0]}` : mode === 'start' ? `Na konci je ${values[len]}` : 'Doplň chybějící číslo'}. Operace v hadovi: ${chain.replace(/−/g, 'mínus').replace(/\+/g, 'plus')}.`,
    visual: { type: 'snake', values: shown, ops, ask },
    answer: num(values[ask]),
    // U chybějícího čísla uprostřed by „první krok“ mohl být rovnou výsledek.
    hints:
      mode === 'start'
        ? ['Jdi pozpátku od ocasu k hlavě a dělej opačné operace: místo plus mínus a naopak.', `Před posledním krokem: ${values[len]} ${ops[len - 1].op === '+' ? '−' : '+'} ${ops[len - 1].n} = ${values[len - 1]}.`]
        : mode === 'middle'
          ? ['Podívej se na číslo těsně před otazníkem.', `Z čísla ${values[ask - 1]} udělej krok ${ops[ask - 1].op} ${ops[ask - 1].n}.`]
          : ['Jdi krok za krokem a průběžná čísla si piš.', `První krok: ${values[0]} ${ops[0].op} ${ops[0].n} = ${values[1]}.`],
    explanation: `Celý had: ${values.map((x, i) => (i < len ? `${f(x)} ${ops[i].op} ${ops[i].n} → ` : f(x))).join('')}.`,
    difficulty: mode === 'start' ? 0.4 : mode === 'middle' ? 0.2 : 0,
  };
}

export const hadi: SkillDef = {
  id: SNAKE,
  island: 'cisla',
  name: 'Početní hadi',
  description: 'Hejného prostředí Hadi: řetězení operací, počítání pozpátku a hledání chybějícího článku.',
  levels: [1, 2, 3, 4, 5],
  rvp: { 1: ['M-3-1-04'], 2: ['M-3-1-04'], 3: ['M-3-2-03'], 4: ['M-5-4-01'], 5: ['M-5-4-01'] },
  ability: 'usuzovani',
  generate: (level, rng) => {
    for (let i = 0; i < 200; i++) {
      const p = snakeAttempt(level, rng);
      if (p) return mk(SNAKE, level, p);
    }
    throw new Error(`${SNAKE}: úloha úrovně ${level} se nepovedla`);
  },
};

// ---------------------------------------------------------------------------
// Součtové trojúhelníky

const TRI = 'cisla.trojuhelniky';

function triAttempt(level: Level, rng: Rng): ItemParts | null {
  const max = level <= 2 ? 15 : level === 3 ? 40 : level === 4 ? 60 : 200;
  const [a, b, c] = [rng.int(1, max), rng.int(1, max), rng.int(1, max)];
  const edges = [a + b, b + c, c + a];
  const vertices = [a, b, c];
  const edgeName = ['mezi horním a levým', 'mezi levým a pravým', 'mezi pravým a horním'];

  if (level <= 2) {
    const e = rng.int(0, 2);
    const shownEdges: (number | null)[] = [null, null, null];
    return {
      key: `e${a}.${b}.${c}-${e}`,
      prompt: 'Na straně trojúhelníku je vždy součet dvou sousedních vrcholů. Jaké číslo patří do pole s otazníkem?',
      visual: { type: 'triangle', vertices, edges: shownEdges, ask: { part: 'edge', index: e } },
      answer: num(edges[e]),
      hints: ['Která dvě kolečka sousedí s polem s otazníkem?', `Je to pole ${edgeName[e]} vrcholem.`],
      explanation: `${vertices[e]} + ${vertices[(e + 1) % 3]} = ${edges[e]}.`,
      difficulty: -0.2,
    };
  }
  if (level === 3) {
    // Známe jeden vrchol a sousední stranu – dopočítej druhý vrchol.
    const e = rng.int(0, 2);
    const known = e;
    const unknown = (e + 1) % 3;
    const shownV: (number | null)[] = [null, null, null];
    shownV[known] = vertices[known];
    const shownE: (number | null)[] = [null, null, null];
    shownE[e] = edges[e];
    return {
      key: `v${a}.${b}.${c}-${e}`,
      prompt: 'Na straně je součet dvou vrcholů. Jaké číslo patří do vrcholu s otazníkem?',
      visual: { type: 'triangle', vertices: shownV, edges: shownE, ask: { part: 'vertex', index: unknown } },
      answer: num(vertices[unknown]),
      hints: [`${vertices[known]} + ? = ${edges[e]}.`, `Kolik chybí od ${vertices[known]} do ${edges[e]}?`],
      explanation: `${edges[e]} − ${vertices[known]} = ${vertices[unknown]}.`,
    };
  }
  // L4+: známe jen součty na stranách – najdi vrchol.
  const vi = rng.int(0, 2);
  return {
    key: `x${a}.${b}.${c}-${vi}`,
    prompt: 'Známe jen součty na stranách. Jaké číslo je ve vrcholu s otazníkem?',
    visual: { type: 'triangle', vertices: [null, null, null], edges, ask: { part: 'vertex', index: vi } },
    answer: num(vertices[vi]),
    hints: [
      'Zkus do vrcholu napsat nějaké číslo a dopočítej ostatní. Sedí to?',
      'Sečti všechny tři strany: každý vrchol je v tom součtu dvakrát.',
      `Součet stran je ${edges[0] + edges[1] + edges[2]}, takže všechny vrcholy dohromady jsou ${(edges[0] + edges[1] + edges[2]) / 2}.`,
    ],
    explanation: `Vrcholy dohromady: ${(edges[0] + edges[1] + edges[2]) / 2}. Odečteme stranu naproti: ${(edges[0] + edges[1] + edges[2]) / 2} − ${edges[(vi + 1) % 3]} = ${vertices[vi]}.`,
    difficulty: 0.3,
  };
}

export const trojuhelniky: SkillDef = {
  id: TRI,
  island: 'cisla',
  name: 'Součtové trojúhelníky',
  description: 'Hejného součtové trojúhelníky: od sčítání sousedů po úlohy, kde jsou známé jen součty – příprava na algebraické myšlení.',
  levels: [2, 3, 4, 5, 6],
  rvp: { 2: ['M-3-1-04'], 3: ['M-3-1-05'], 4: ['M-5-4-01'], 5: ['M-5-4-01'], 6: ['M-5-4-01'] },
  ability: 'usuzovani',
  generate: (level, rng) => {
    for (let i = 0; i < 50; i++) {
      const p = triAttempt(level, rng);
      if (p) return mk(TRI, level, p);
    }
    throw new Error(`${TRI}: úloha úrovně ${level} se nepovedla`);
  },
};
