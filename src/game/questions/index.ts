import { Question } from '../../data/types';
import { genAddition } from './addition';
import { genSubtraction } from './subtraction';
import { genWordProblem } from './wordProblems';
import { genPuzzle } from './puzzles';
import { genPattern } from './patterns';
import { genMemory } from './memory';
import { genLogic } from './logic';
import { genPlaceValue } from './placeValue';
import { genDecomposition } from './decomposition';
import { genSnake } from './snake';
import { pick } from './helpers';

export function generateQuestion(type: string, difficulty: number): Question {
  switch (type) {
    case 'addition': return genAddition(difficulty);
    case 'subtraction': return genSubtraction(difficulty);
    case 'word_problems': return genWordProblem(difficulty);
    case 'puzzles': return genPuzzle(difficulty);
    case 'patterns': return genPattern(difficulty);
    case 'memory': return genMemory(difficulty);
    case 'logic': return genLogic(difficulty);
    case 'place_value': return genPlaceValue(difficulty);
    case 'decomposition': return genDecomposition(difficulty);
    case 'snake': return genSnake(difficulty);
    case 'beads_mixed':
      return generateQuestion(pick(['place_value', 'decomposition']), difficulty);
    case 'mixed':
      return generateQuestion(
        pick(['addition', 'subtraction', 'word_problems', 'puzzles', 'patterns', 'logic', 'place_value', 'decomposition']),
        difficulty
      );
    default: return genAddition(difficulty);
  }
}

export function generateQuestQuestions(type: string, difficulty: number, count: number): Question[] {
  if (type === 'memory') return [genMemory(difficulty)];
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(type, difficulty));
  }
  return questions;
}
