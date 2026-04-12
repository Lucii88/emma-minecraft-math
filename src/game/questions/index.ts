import { Question } from '../../data/types';
import { genAddition } from './addition';
import { genSubtraction } from './subtraction';
import { genWordProblem } from './wordProblems';
import { genPuzzle } from './puzzles';
import { genPattern } from './patterns';
import { genMemory } from './memory';
import { genLogic } from './logic';
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
    case 'mixed':
      return generateQuestion(
        pick(['addition', 'subtraction', 'word_problems', 'puzzles', 'patterns', 'logic']),
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
