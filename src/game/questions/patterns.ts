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
  if (Math.random() < 0.3) return genHundredBoard(d);

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

function genHundredBoard(d: number): Question {
  const grid: (number | null)[] = Array.from({ length: 100 }, (_, i) => i + 1);
  const blankCount = d <= 1 ? 1 : d <= 2 ? 2 : 3;

  const blanks: number[] = [];
  for (let i = 0; i < blankCount; i++) {
    let idx: number;
    do { idx = randInt(0, 99); } while (blanks.includes(idx));
    blanks.push(idx);
  }

  const targetIdx = blanks[0];
  const answer = targetIdx + 1;

  for (const idx of blanks) {
    grid[idx] = null;
  }

  return {
    type: 'patterns',
    category: '📊 Stovková tabulka',
    text: `Které číslo chybí na pozici označené "?"?`,
    answer,
    options: generateOptions(answer, d),
    hint: `Řádky jdou po desítkách: 1-10, 11-20, 21-30...`,
    inputMode: 'options',
    montessori: { type: 'hundred_board', grid },
  };
}
