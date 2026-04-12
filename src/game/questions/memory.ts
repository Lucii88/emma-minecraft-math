import { Question } from '../../data/types';

export function genMemory(_d: number): Question {
  return {
    type: 'memory',
    category: 'Paměťová hra 🧠',
    text: 'Najdi všechny páry!',
    answer: 0,
    isSpecial: true,
  };
}
