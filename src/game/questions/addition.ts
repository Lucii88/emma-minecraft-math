import { Question } from '../../data/types';
import { randInt, generateOptions } from './helpers';

export function genAddition(d: number): Question {
  let a: number, b: number;
  if (d <= 1) { a = randInt(1, 18); b = randInt(1, 18 - a); }
  else if (d <= 2) { a = randInt(10, 50); b = randInt(10, 50); }
  else { a = randInt(20, 60); b = randInt(20, 40); }

  const answer = a + b;
  const blockA = Math.min(a, 10);
  const blockB = Math.min(b, 10);
  const visual = '🧱'.repeat(blockA) + ' + ' + '🪨'.repeat(blockB);

  return {
    type: 'addition',
    category: `Sčítání`,
    text: `${a} + ${b} = ?`,
    answer,
    options: generateOptions(answer, d),
    visual,
    hint: `Rozlož si to: ${a} = ${Math.floor(a / 10) * 10} + ${a % 10}, pak přičti ${b}`,
    inputMode: d >= 2 ? 'input' : 'options',
    montessori: { type: 'strip_add', a, b },
  };
}
