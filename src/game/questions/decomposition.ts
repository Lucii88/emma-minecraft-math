import { Question } from '../../data/types';
import { randInt, pick, generateOptions } from './helpers';

type DecompGen = (d: number) => Question;

const generators: DecompGen[] = [
  // Rozklad na dvě části: celek = A + ?
  (d) => {
    const whole = d <= 1 ? randInt(5, 15) : d <= 2 ? randInt(10, 30) : randInt(20, 50);
    const partA = randInt(1, whole - 1);
    const answer = whole - partA;

    return {
      type: 'decomposition',
      category: '🧩 Rozklad čísel',
      text: `${whole} = ${partA} + ?`,
      answer,
      options: generateOptions(answer, d),
      hint: `Od ${whole} odečti ${partA}.`,
      inputMode: d >= 2 ? 'input' : 'options',
      montessori: { type: 'decomposition', whole, parts: [partA, -1] },
    };
  },

  // Rozklad na desítky + jednotky
  (d) => {
    const num = d <= 1 ? randInt(11, 29) : randInt(21, 99);
    const tens = Math.floor(num / 10) * 10;
    const units = num % 10;
    const askTens = Math.random() < 0.5;

    return {
      type: 'decomposition',
      category: '🧩 Rozklad na řády',
      text: askTens
        ? `${num} = ? + ${units}`
        : `${num} = ${tens} + ?`,
      answer: askTens ? tens : units,
      options: generateOptions(askTens ? tens : units, d),
      hint: `Rozlož na desítky a jednotky.`,
      inputMode: 'options',
      montessori: {
        type: 'decomposition',
        whole: num,
        parts: askTens ? [-1, units] : [tens, -1],
      },
    };
  },

  // "Kolik chybí do X?" -- doplněk
  (d) => {
    const target = pick([10, 20, 50, 100].slice(0, d <= 1 ? 2 : d <= 2 ? 3 : 4));
    const given = randInt(1, target - 1);
    const answer = target - given;

    return {
      type: 'decomposition',
      category: '🧩 Doplněk',
      text: `Kolik chybí od ${given} do ${target}?`,
      answer,
      options: generateOptions(answer, d),
      hint: `${target} − ${given} = ?`,
      inputMode: d >= 2 ? 'input' : 'options',
      montessori: { type: 'decomposition', whole: target, parts: [given, -1] },
    };
  },

  // Trojrozklad: celek = A + B + ?
  (d) => {
    if (d <= 1) {
      const whole = randInt(8, 15);
      const a = randInt(1, Math.floor(whole / 3));
      const b = randInt(1, Math.floor((whole - a) / 2));
      const answer = whole - a - b;
      return {
        type: 'decomposition',
        category: '🧩 Trojrozklad',
        text: `${whole} = ${a} + ${b} + ?`,
        answer,
        options: generateOptions(answer, d),
        hint: `Nejdřív sečti ${a} + ${b}, pak od ${whole} odečti.`,
        inputMode: 'options',
        montessori: { type: 'decomposition', whole, parts: [a, b, -1] },
      };
    }
    const whole = randInt(20, 50);
    const a = randInt(5, Math.floor(whole / 3));
    const b = randInt(5, Math.floor((whole - a) / 2));
    const answer = whole - a - b;
    return {
      type: 'decomposition',
      category: '🧩 Trojrozklad',
      text: `${whole} = ${a} + ${b} + ?`,
      answer,
      options: generateOptions(answer, d),
      hint: `${a} + ${b} = ${a + b}, pak ${whole} − ${a + b} = ?`,
      inputMode: d >= 2 ? 'input' : 'options',
      montessori: { type: 'decomposition', whole, parts: [a, b, -1] },
    };
  },
];

export function genDecomposition(d: number): Question {
  return pick(generators)(d);
}
