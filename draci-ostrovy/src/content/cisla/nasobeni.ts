import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { count, formatNumber as f } from '../../core/czech';
import { mk, N, num, speakMath, type ItemParts } from './common';

const ID = 'cisla.nasobeni';

function times(a: number, b: number, hints: string[], explanation: string, difficulty = 0): ItemParts {
  const prompt = `${f(a)} × ${f(b)} = ?`;
  return { key: `x${a}*${b}`, prompt, speak: speakMath(prompt), answer: num(a * b), hints, explanation, difficulty };
}

function divide(a: number, b: number, hints: string[], explanation: string, difficulty = 0): ItemParts {
  const prompt = `${f(a)} : ${f(b)} = ?`;
  return { key: `d${a}:${b}`, prompt, speak: speakMath(prompt), answer: num(a / b), hints, explanation, difficulty };
}

/** Nápověda k násobilce podle strategie (zdvojení, o jednu skupinu víc…). */
function tableHints(a: number, b: number): string[] {
  if (b === 1 || a === 1) return ['Jedna skupina – kolik v ní je?'];
  if (a === 10 || b === 10) return ['Násobit deseti je snadné: připiš k číslu nulu.'];
  if (a === 5 || b === 5) {
    const other = a === 5 ? b : a;
    return [`Pět je polovina z deseti. Kolik je ${other} × 10?`, `${other} × 10 = ${other * 10}. Polovina z toho je…`];
  }
  if (b === 2 || a === 2) {
    const other = a === 2 ? b : a;
    return [`Dvakrát ${other} je ${other} + ${other}.`];
  }
  const [x, y] = a >= b ? [a, b] : [b, a];
  if (y % 2 === 0 && y >= 4) {
    return [`Znáš ${x} × ${y / 2}? Stačí to zdvojnásobit.`, `${x} × ${y / 2} = ${x * (y / 2)}. A dvakrát tolik je…`];
  }
  return [`Znáš ${x} × ${y - 1}? Pak přidej ještě jednou ${x}.`, `${x} × ${y - 1} = ${x * (y - 1)}. Plus ${x} je…`];
}

/** Chytrý rozklad součinu: 25 × 12 = 20 × 12 + 5 × 12, 50 × 6 = 5 × 6 a nula. */
function smartProduct(a: number, b: number): [string[], string] {
  const round = a % 10 === 0 ? a : b % 10 === 0 ? b : 0;
  if (round) {
    const other = round === a ? b : a;
    return [[`Spočítej ${round / 10} × ${other} a přidej nulu.`], `${round / 10} × ${other} = ${(round / 10) * other}, takže ${a} × ${b} = ${f(a * b)}.`];
  }
  // Větší číslo se rozloží na stovky (desítky) a zbytek.
  const big = Math.max(a, b);
  const unit = big >= 100 ? 100 : 10;
  const part = Math.floor(big / unit) * unit;
  const rest = big - part;
  const other = big === a ? b : a;
  const [p1, p2] = big === a ? [`${part} × ${other}`, `${rest} × ${other}`] : [`${other} × ${part}`, `${other} × ${rest}`];
  return [
    ['Hledej chytrou cestu: rozlož větší číslo na části.', `Třeba ${a} × ${b} = ${p1} + ${p2}.`],
    `${a} × ${b} = ${p1} + ${p2} = ${f(part * other)} + ${f(rest * other)} = ${f(a * b)}.`,
  ];
}

function attempt(level: Level, rng: Rng): ItemParts | null {
  const pick = rng.int(0, 99);

  if (level === 2) {
    const a = rng.pick([2, 3, 4, 5, 10]);
    const b = rng.int(2, 10);
    if (pick < 35) {
      // obrázková úloha s vejci v hnízdech
      const prompt = `Dračice má ${count(b, N.hnizdo.acc)}. V každém hnízdě leží ${count(a, N.vejce.nom)}. Kolik vajec je ve všech hnízdech dohromady?`;
      return {
        key: `e${b}*${a}`,
        prompt,
        visual: { type: 'eggs', groups: b, perGroup: a },
        answer: num(a * b),
        // Výčet 3, 6, 9… by u dvou nebo tří hnízd prozradil výsledek.
        hints: [`Kolik je hnízd a kolik vajec je v jednom?`, b >= 4 ? `Sčítej po ${a}: ${a}, ${a * 2}, ${a * 3}…` : `Sčítej po ${a} – za každé hnízdo jednou.`],
        explanation: `${b} × ${a} = ${a * b}.`,
        difficulty: -0.2,
      };
    }
    return times(b, a, tableHints(b, a), `${b} × ${a} = ${a * b}.`);
  }

  if (level === 3) {
    const a = rng.int(2, 10);
    const b = rng.int(2, 10);
    if (pick < 55) return times(a, b, tableHints(a, b), `${a} × ${b} = ${a * b}.`, a >= 6 && b >= 6 ? 0.3 : 0);
    return divide(a * b, b, [`Kolikrát se ${b} vejde do ${a * b}?`, `Hledej v násobilce čísla ${b}: ${b} × ? = ${a * b}.`], `${b} × ${a} = ${a * b}, proto ${a * b} : ${b} = ${a}.`, 0.2);
  }

  if (level === 4) {
    if (pick < 35) {
      const a = rng.int(11, 25);
      const b = rng.int(3, 9);
      const tens = Math.floor(a / 10) * 10;
      const ones = a - tens;
      // 20 × b se nerozkládá na „20 a 0“ – stačí násobit bez nuly.
      if (ones === 0) return times(a, b, [`Spočítej ${tens / 10} × ${b} a přidej nulu.`], `${tens / 10} × ${b} = ${(tens / 10) * b}, takže ${a} × ${b} = ${a * b}.`);
      return times(a, b, [`Rozlož ${a} na ${tens} a ${ones}.`, `${tens} × ${b} = ${tens * b} a ${ones} × ${b} = ${ones * b}. Sečti to.`], `${tens} × ${b} + ${ones} × ${b} = ${tens * b} + ${ones * b} = ${a * b}.`);
    }
    if (pick < 55) {
      const a = rng.int(2, 9) * 10;
      const b = rng.int(2, 9);
      return times(a, b, [`Spočítej ${a / 10} × ${b} a přidej nulu.`], `${a / 10} × ${b} = ${(a / 10) * b}, takže ${a} × ${b} = ${a * b}.`, -0.2);
    }
    if (pick < 75) {
      const b = rng.int(3, 9);
      const q = rng.int(11, 25);
      const a = b * q;
      return divide(a, b, [`Rozděl ${a} na dvě části, které jdou dělit ${b}.`, `Zkus ${b * 10} a ${a - b * 10}.`], `${a} : ${b} = ${q}, protože ${b} × ${q} = ${a}.`, 0.3);
    }
    // dělení se zbytkem – ptáme se na zbytek
    const b = rng.int(3, 9);
    const q = rng.int(2, 9);
    const r = rng.int(1, b - 1);
    const a = b * q + r;
    return {
      key: `z${a}:${b}`,
      prompt: `${a} : ${b} = ${q}, zbytek ?`,
      speak: `${a} děleno ${b} je ${q} a kolik je zbytek`,
      answer: num(r),
      hints: [`Kolik je ${q} × ${b}?`, `${q} × ${b} = ${q * b}. Kolik zbývá do ${a}?`],
      explanation: `${q} × ${b} = ${q * b} a ${a} − ${q * b} = ${r}. Zbytek je ${r}.`,
      difficulty: 0.4,
    };
  }

  // L5–L6
  if (pick < 30) {
    const a = rng.int(2, 9) * 10;
    const b = rng.int(2, 9) * (level === 6 ? 100 : 10);
    return times(a, b, [`Vynásob bez nul a pak nuly přidej.`], `${a / 10} × ${b / (level === 6 ? 100 : 10)} = ${(a / 10) * (b / (level === 6 ? 100 : 10))}, přidáme nuly: ${f(a * b)}.`);
  }
  if (pick < 55) {
    const pair = rng.pick([[25, 4], [25, 8], [125, 8], [50, 6], [15, 12], [12, 12], [25, 12], [11, 13], [14, 15], [16, 25]] as const);
    const [a, b] = rng.chance(0.5) ? pair : [pair[1], pair[0]];
    const [hints, explanation] = smartProduct(a, b);
    return times(a, b, hints, explanation, 0.3);
  }
  if (pick < 80) {
    const b = rng.pick([12, 15, 20, 25, 40, 50]);
    const q = rng.int(3, level === 6 ? 40 : 15);
    return divide(b * q, b, [`Kolikrát se ${b} vejde do ${f(b * q)}?`, `Zkus odhad: ${b} × 10 = ${b * 10}.`], `${f(b * q)} : ${b} = ${q}, protože ${b} × ${q} = ${f(b * q)}.`, 0.3);
  }
  const x = rng.int(3, 12);
  const y = rng.int(3, 12);
  const z = rng.int(2, 5);
  const prompt = `${x} × ${y} + ${x} × ${z} = ?`;
  return {
    key: `s${x}*${y}+${x}*${z}`,
    prompt,
    speak: speakMath(prompt),
    answer: num(x * y + x * z),
    hints: [`Obě části mají společné číslo ${x}.`, `Je to totéž jako ${x} × (${y} + ${z}).`],
    explanation: `${x} × ${y} + ${x} × ${z} = ${x} × ${y + z} = ${x * (y + z)}.`,
    difficulty: 0.5,
  };
}

function generate(level: Level, rng: Rng) {
  for (let i = 0; i < 50; i++) {
    const p = attempt(level, rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const nasobeni: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Násobení a dělení',
  description: 'Od skupin vajec v hnízdech přes celou násobilku až po násobení a dělení velkých čísel a zbytek po dělení.',
  levels: [2, 3, 4, 5, 6],
  rvp: { 2: ['M-3-1-04'], 3: ['M-3-1-04', 'M-3-1-05'], 4: ['M-5-1-01', 'M-5-1-02'], 5: ['M-5-1-01'], 6: ['M-5-1-01'] },
  ability: 'pocetni',
  generate,
};
