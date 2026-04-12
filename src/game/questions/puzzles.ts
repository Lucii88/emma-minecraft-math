import { Question } from '../../data/types';
import { randInt, pick, shuffle, generateOptions } from './helpers';

type PuzzleGen = () => { text: string; answer: number; hint: string; options?: number[] };

const PUZZLES: PuzzleGen[] = [
  () => {
    const x = randInt(5, 30), b = randInt(3, 20), sum = x + b;
    return { text: `? + ${b} = ${sum}`, answer: x, hint: `Odečti: ${sum} − ${b}` };
  },
  () => {
    const x = randInt(5, 30), a = randInt(x + 3, 60);
    return { text: `${a} − ? = ${a - x}`, answer: x, hint: `Co odečteme od ${a}, aby zbylo ${a - x}?` };
  },
  () => {
    const a = randInt(10, 40), b = randInt(10, 40), c = randInt(10, 40);
    const sorted = [a, b, c].sort((x, y) => x - y);
    return { text: `Které číslo je největší?\n${a}, ${b}, ${c}`, answer: sorted[2], options: shuffle([a, b, c]), hint: `Porovnej desítky!` };
  },
  () => {
    const a = randInt(2, 15);
    return { text: `Kolik je dvojnásobek čísla ${a}?`, answer: a * 2, hint: `Dvojnásobek = ${a} + ${a}` };
  },
  () => {
    const a = randInt(10, 50), b = randInt(10, 50);
    return { text: `Dvě čísla dávají dohromady ${a + b}.\nJedno je ${a}. Jaké je druhé?`, answer: b, hint: `${a + b} − ${a}` };
  },
  () => {
    const a = randInt(10, 40), b = randInt(10, 40), c = randInt(10, 40);
    const sorted = [a, b, c].sort((x, y) => x - y);
    return { text: `Které číslo je nejmenší?\n${a}, ${b}, ${c}`, answer: sorted[0], options: shuffle([a, b, c]), hint: `Najdi to nejmenší.` };
  },
  () => {
    const a = randInt(4, 20);
    return { text: `Polovina z ${a * 2} je...?`, answer: a, hint: `Rozděl ${a * 2} na dvě stejné části.` };
  },
];

export function genPuzzle(d: number): Question {
  const p = pick(PUZZLES)();
  return {
    type: 'puzzles',
    category: 'Hádanka 🔮',
    text: p.text,
    answer: p.answer,
    options: p.options || generateOptions(p.answer, d),
    hint: p.hint,
    inputMode: 'options',
  };
}
