import { Question } from '../../data/types';
import { randInt, generateOptions } from './helpers';

export function genSubtraction(d: number): Question {
  let a: number, b: number;
  if (d <= 1) { a = randInt(5, 18); b = randInt(1, a - 1); }
  else if (d <= 2) { a = randInt(30, 70); b = randInt(10, a - 5); }
  else { a = randInt(50, 100); b = randInt(20, a - 5); }

  const answer = a - b;
  const blockA = Math.min(a, 10);
  const blockB = Math.min(b, 6);
  const visual = '💎'.repeat(blockA) + ' − ' + '💎'.repeat(blockB);

  return {
    type: 'subtraction',
    category: `Odčítání`,
    text: `${a} − ${b} = ?`,
    answer,
    options: generateOptions(answer, d),
    visual,
    hint: `Představ si ${a} bloků a ${b} odebeř.`,
    inputMode: d >= 2 ? 'input' : 'options',
    montessori: { type: 'strip_sub', a, b },
  };
}
