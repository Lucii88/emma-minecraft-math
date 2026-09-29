import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { formatNumber as f } from '../../core/czech';
import { mk, notRound, num, speakMath, type ItemParts } from './common';

const ID = 'cisla.scitani';

function plus(a: number, b: number, hints: string[], explanation: string, difficulty = 0): ItemParts {
  const prompt = `${f(a)} + ${f(b)} = ?`;
  return { key: `p${a}+${b}`, prompt, speak: speakMath(prompt), answer: num(a + b), hints, explanation, difficulty };
}

function minus(a: number, b: number, hints: string[], explanation: string, difficulty = 0): ItemParts {
  const prompt = `${f(a)} − ${f(b)} = ?`;
  return { key: `m${a}-${b}`, prompt, speak: speakMath(prompt), answer: num(a - b), hints, explanation, difficulty };
}

function missing(a: number, c: number, hints: string[], difficulty = 0.2): ItemParts {
  return {
    key: `d${a}-${c}`,
    prompt: `${f(a)} + _ = ${f(c)}`,
    speak: `${f(a)} plus kolik se rovná ${f(c)}`,
    answer: num(c - a),
    hints,
    explanation: `${f(a)} + ${f(c - a)} = ${f(c)}.`,
    difficulty,
  };
}

/** 8 + 7: doplň do desítky a přičti zbytek. */
function plusCross(a: number, b: number): [string[], string] {
  const toTen = 10 - (a % 10);
  const rest = b - toTen;
  const ten = a + toTen;
  return [
    [`Doplň nejdřív ${f(a)} do ${f(ten)}. Kolik k tomu potřebuješ?`, `${f(a)} + ${toTen} = ${f(ten)}. Zbývá přičíst ${rest}.`],
    `${f(a)} + ${toTen} = ${f(ten)} a ${f(ten)} + ${rest} = ${f(a + b)}.`,
  ];
}

/** 52 − 7: odečti na desítku a pak zbytek. */
function minusCross(a: number, b: number): [string[], string] {
  const toTen = a % 10;
  const rest = b - toTen;
  const ten = a - toTen;
  return [
    [`Odečti nejdřív tolik, abys byla na ${f(ten)}.`, `${f(a)} − ${toTen} = ${f(ten)}. Zbývá odečíst ${rest}.`],
    `${f(a)} − ${toTen} = ${f(ten)} a ${f(ten)} − ${rest} = ${f(a - b)}.`,
  ];
}

/** Rozklad druhého čísla na větší část (desítky/stovky) a zbytek. */
function split(a: number, b: number, op: '+' | '−', unit: 10 | 100): [string[], string] {
  const big = Math.floor(b / unit) * unit;
  const small = b - big;
  const res = op === '+' ? a + b : a - b;
  const verb = op === '+' ? 'přičti' : 'odečti';
  if (big === 0 || small === 0) {
    const name = unit === 10 ? 'desítkami' : 'stovkami';
    return [[`Počítej s ${name}: ${verb} je najednou.`], `${f(a)} ${op} ${f(b)} = ${f(res)}.`];
  }
  const mid = op === '+' ? a + big : a - big;
  return [
    [`Rozlož si ${f(b)} na ${f(big)} a ${f(small)}.`, `Nejdřív ${f(a)} ${op} ${f(big)} = ${f(mid)}, potom ${verb} ${f(small)}.`],
    `${f(a)} ${op} ${f(big)} = ${f(mid)} a ${f(mid)} ${op} ${f(small)} = ${f(res)}.`,
  ];
}

function attempt(level: Level, rng: Rng): ItemParts | null {
  const pick = rng.int(0, 99);

  if (level === 1) {
    if (pick < 40) {
      const a = rng.int(2, 9);
      const b = rng.int(11 - a, 9); // přes desítku
      const [h, e] = plusCross(a, b);
      return plus(a, b, h, e, 0.2);
    }
    if (pick < 75) {
      const a = rng.int(11, 18);
      const b = rng.int((a % 10) + 1, 9); // přes desítku
      const [h, e] = minusCross(a, b);
      return minus(a, b, h, e, 0.3);
    }
    const a = rng.int(3, 15);
    const c = rng.int(Math.max(a + 2, 10), 20);
    return missing(a, c, [`Kolik ti chybí od ${a} do ${c}?`, `Počítej dál od ${a}: ${a + 1}, ${a + 2}…`]);
  }

  if (level === 2) {
    if (pick < 25) {
      const a = notRound(rng, 21, 89);
      if (a % 10 < 2) return null;
      const b = rng.int(11 - (a % 10), 9);
      const [h, e] = plusCross(a, b);
      return plus(a, b, h, e);
    }
    if (pick < 50) {
      const a = notRound(rng, 21, 99);
      if (a % 10 === 9) return null;
      const b = rng.int((a % 10) + 1, 9);
      const [h, e] = minusCross(a, b);
      return minus(a, b, h, e);
    }
    if (pick < 75) {
      const a = rng.int(12, 58);
      const b = rng.int(12, 99 - a);
      const [h, e] = split(a, b, '+', 10);
      return plus(a, b, h, e, 0.3);
    }
    if (pick < 88) {
      const a = rng.int(40, 99);
      const b = rng.int(11, a - 10);
      const [h, e] = split(a, b, '−', 10);
      return minus(a, b, h, e, 0.4);
    }
    const a = notRound(rng, 11, 89);
    const nextTen = Math.ceil(a / 10) * 10;
    const c = rng.pick([nextTen, nextTen + 10, 100].filter((x) => x <= 100 && x > a));
    return missing(a, c, [`Doplň nejdřív ${a} do ${nextTen}.`, `${a} + ${nextTen - a} = ${nextTen}. Kolik ještě chybí do ${c}?`], 0.3);
  }

  if (level === 3) {
    if (pick < 30) {
      const a = rng.int(12, 68) * 10;
      const b = rng.int(11, (1000 - a) / 10 - 1) * 10;
      const [h, e] = split(a, b, '+', 100);
      return plus(a, b, h, e);
    }
    if (pick < 55) {
      const a = rng.int(30, 99) * 10;
      const b = rng.int(11, a / 10 - 5) * 10;
      const [h, e] = split(a, b, '−', 100);
      return minus(a, b, h, e, 0.2);
    }
    if (pick < 70) {
      const a = rng.int(101, 899);
      const b = rng.pick([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300]);
      if (a + b >= 1000) return null;
      const what = b >= 100 ? 'stovky' : 'desítky';
      return plus(a, b, [`Přičítáš jen ${what}. Které místo v čísle ${a} se změní?`, `Jednotky zůstanou stejné: ${a % 10}.`], `${a} + ${b} = ${a + b}.`, -0.2);
    }
    if (pick < 85) {
      const c = rng.pick([100, 200, 500, 1000]);
      const a = rng.int(Math.floor(c / 20), Math.floor(c / 10) - 1) * 10 - rng.int(0, 1) * 5;
      if (a <= 0 || a >= c || a % 100 === 0) return null;
      const nextHundred = Math.ceil(a / 100) * 100;
      return missing(a, c, [`Doplň nejdřív do ${nextHundred}.`, `${a} + ${nextHundred - a} = ${nextHundred}. Kolik ještě chybí do ${c}?`]);
    }
    const a = rng.int(20, 99) * 10;
    const b = rng.int(1, 9) + rng.int(1, 9) * 10;
    const [h, e] = split(a, b, '−', 10);
    return minus(a, b, h, e, 0.4);
  }

  if (level === 4) {
    if (pick < 50) {
      const a = rng.int(11, 79) * 100;
      const b = rng.int(11, (10000 - a) / 100 - 1) * 100;
      return plus(a, b, [`Počítej se stovkami: ${a / 100} stovek + ${b / 100} stovek.`], `${a / 100} + ${b / 100} = ${(a + b) / 100} stovek, tedy ${f(a + b)}.`);
    }
    if (pick < 85) {
      const a = rng.pick([2000, 3000, 5000, 8000, 10000]);
      const b = rng.int(3, a / 50 - 1) * 50;
      const [h, e] = split(a, b, '−', 100);
      return minus(a, b, h, e, 0.3);
    }
    const a = rng.int(1001, 8999);
    const c = Math.ceil(a / 1000) * 1000;
    if (c === a) return null;
    return missing(a, c, [`Doplň nejdřív jednotky do celé desítky, pak desítky do celé stovky.`, `Nakonec doplň stovky do ${f(c)}.`], 0.3);
  }

  // L5–L6: velká čísla
  const scale = level === 5 ? 500 : 250;
  const a = rng.int(20, 180) * scale;
  const b = rng.int(10, 120) * scale;
  if (a === b) return null;
  if (rng.chance(0.5)) {
    return plus(a, b, [`Počítej s tisíci a zvlášť se zbytkem.`], `${f(a)} + ${f(b)} = ${f(a + b)}.`);
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return minus(big, small, [`Počítej s tisíci a zvlášť se zbytkem.`, `Kolik chybí od ${f(small)} do ${f(big)}?`], `${f(big)} − ${f(small)} = ${f(big - small)}.`, 0.2);
}

function generate(level: Level, rng: Rng) {
  for (let i = 0; i < 50; i++) {
    const p = attempt(level, rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const scitani: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Sčítání a odčítání',
  description: 'Počítání zpaměti od příkladů do 20 až po velká čísla, s rozkladem na desítky a stovky.',
  levels: [1, 2, 3, 4, 5, 6],
  rvp: { 1: ['M-3-1-04'], 2: ['M-3-1-04'], 3: ['M-3-1-02', 'M-3-1-04'], 4: ['M-5-1-01'], 5: ['M-5-1-01'], 6: ['M-5-1-01'] },
  ability: 'pocetni',
  generate,
};
