import { Question } from '../../data/types';
import { randInt, shuffle, generateOptions } from './helpers';

const SNAKE_COLORS = ['#f44336', '#4CAF50', '#E91E63', '#2196F3', '#9C27B0', '#FF9800', '#795548', '#00BCD4'];

export function genSnake(d: number): Question {
  const barCount = d <= 1 ? 3 : d <= 2 ? 4 : 5;
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    bars.push(randInt(2, 9));
  }

  const total = bars.reduce((s, v) => s + v, 0);
  const goldBars = Math.floor(total / 10);
  const remainder = total % 10;

  const snakeVisual = [...bars];

  if (d <= 1) {
    return {
      type: 'snake',
      category: '🐍 Hadí hra',
      text: `Sečti korálky v hadovi:\n${bars.join(' + ')} = ?`,
      answer: total,
      options: generateOptions(total, d),
      hint: `Sčítej postupně: ${bars[0]} + ${bars[1]} = ${bars[0] + bars[1]}, pak přičti další...`,
      inputMode: 'options',
      montessori: { type: 'snake', values: snakeVisual },
    };
  }

  if (d <= 2) {
    return {
      type: 'snake',
      category: '🐍 Hadí výměna',
      text: `Had má ${bars.join(' + ')} korálků.\nKolik zlatých desítek vyměníš?`,
      answer: goldBars,
      options: generateOptions(goldBars, d),
      hint: `Celkem ${total} korálků. Kolikrát se vejde 10?`,
      inputMode: 'options',
      montessori: { type: 'snake', values: snakeVisual },
    };
  }

  return {
    type: 'snake',
    category: '🐍 Hadí výměna',
    text: `Had: ${bars.join(' + ')} korálků.\n${goldBars} zlatých desítek + kolik zbude?`,
    answer: remainder,
    options: generateOptions(remainder, d),
    hint: `Celkem ${total}. ${goldBars}×10 = ${goldBars * 10}. Zbytek = ${total} − ${goldBars * 10}.`,
    inputMode: 'options',
    montessori: { type: 'snake', values: snakeVisual },
  };
}
