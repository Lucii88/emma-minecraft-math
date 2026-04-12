import { Question } from '../../data/types';
import { randInt, pick, generateOptions } from './helpers';

type PatternGen = () => { seq: (number | string)[]; answer: number; hint: string };

const PATTERN_TYPES: PatternGen[] = [
  () => {
    const start = randInt(2, 10), step = randInt(2, 5);
    const seq = Array.from({ length: 6 }, (_, i) => start + step * i);
    const blankIdx = randInt(3, 5);
    const answer = seq[blankIdx];
    seq[blankIdx] = '?' as any;
    return { seq, answer, hint: `Pokaždé přičti ${step}.` };
  },
  () => {
    const start = randInt(50, 90), step = randInt(2, 7);
    const seq = Array.from({ length: 6 }, (_, i) => start - step * i);
    const blankIdx = randInt(3, 5);
    const answer = seq[blankIdx];
    seq[blankIdx] = '?' as any;
    return { seq, answer, hint: `Pokaždé odečti ${step}.` };
  },
  () => {
    const a = randInt(1, 5), b = a + randInt(2, 4);
    const seq: (number | string)[] = [];
    for (let i = 0; i < 8; i++) seq.push(i % 2 === 0 ? a : b);
    const blankIdx = randInt(4, 7);
    const answer = seq[blankIdx] as number;
    seq[blankIdx] = '?';
    return { seq, answer, hint: `Střídají se ${a} a ${b}.` };
  },
  () => {
    const start = randInt(1, 5), step = randInt(1, 3);
    const seq = Array.from({ length: 7 }, (_, i) => start + step * i * (i + 1) / 2);
    const blankIdx = randInt(4, 6);
    const answer = seq[blankIdx];
    seq[blankIdx] = '?' as any;
    return { seq, answer, hint: `Přírůstky se zvětšují! Sleduj rozdíly mezi čísly.` };
  },
];

export function genPattern(d: number): Question {
  const p = pick(PATTERN_TYPES)();
  return {
    type: 'patterns',
    category: 'Najdi vzorec 🔍',
    text: 'Doplň chybějící číslo v řadě:',
    answer: p.answer,
    options: generateOptions(p.answer, d),
    hint: p.hint,
    inputMode: 'options',
    patternSeq: p.seq,
  };
}
