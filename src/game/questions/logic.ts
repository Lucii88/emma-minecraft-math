import { Question } from '../../data/types';
import { randInt, pick, shuffle } from './helpers';

type LogicGen = () => { text: string; answer: number | string; options: (number | string)[]; hint: string; correctIdx?: number };

const LOGIC_TYPES: LogicGen[] = [
  () => {
    const a = randInt(5, 50), b = randInt(5, 50);
    const op = a > b ? '>' : a < b ? '<' : '=';
    return { text: `Co platí?\n${a} ___ ${b}`, answer: op, options: ['>', '<', '='], hint: `Je ${a} větší, menší nebo rovno ${b}?` };
  },
  () => {
    const a = randInt(1, 20), b = randInt(1, 20);
    const c = randInt(1, 20), d = randInt(1, 20);
    const s1 = a + b, s2 = c + d;
    const correctIdx = s1 > s2 ? 0 : s1 < s2 ? 1 : 2;
    return {
      text: `Co je víc?\n${a} + ${b}  nebo  ${c} + ${d}?`,
      answer: correctIdx, options: [`${a}+${b} (=${s1})`, `${c}+${d} (=${s2})`, 'Jsou stejné'],
      correctIdx, hint: `Spočítej: ${s1} vs ${s2}`,
    };
  },
  () => {
    const nums = [randInt(3, 30), randInt(3, 30), randInt(3, 30), randInt(3, 30)];
    const isOdd = Math.random() > 0.5;
    if (!nums.some(n => isOdd ? n % 2 === 1 : n % 2 === 0)) {
      nums[0] = isOdd ? nums[0] | 1 : nums[0] & ~1;
    }
    const answer = nums.find(n => isOdd ? n % 2 === 1 : n % 2 === 0)!;
    return {
      text: `Které číslo je ${isOdd ? 'liché' : 'sudé'}?\n${nums.join(', ')}`,
      answer, options: shuffle(nums),
      hint: isOdd ? 'Liché číslo nekončí 0, 2, 4, 6, 8.' : 'Sudé číslo končí 0, 2, 4, 6, 8.',
    };
  },
  () => {
    const a = randInt(10, 50), b = randInt(10, 50);
    const diff = Math.abs(a - b);
    return {
      text: `Jaký je rozdíl mezi ${Math.max(a, b)} a ${Math.min(a, b)}?`,
      answer: diff, options: shuffle([diff, diff + randInt(1, 5), diff - randInt(1, Math.max(1, diff - 1)), diff + randInt(6, 10)].map(x => Math.max(0, x))),
      hint: `Odečti menší od většího: ${Math.max(a, b)} − ${Math.min(a, b)}`,
    };
  },
];

export function genLogic(d: number): Question {
  const p = pick(LOGIC_TYPES)();
  return {
    type: 'logic',
    category: 'Redstone logika ⚡',
    text: p.text,
    answer: p.answer,
    options: p.options,
    hint: p.hint,
    inputMode: 'options',
    correctIdx: p.correctIdx,
  };
}
