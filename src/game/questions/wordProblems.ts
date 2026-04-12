import { Question } from '../../data/types';
import { randInt, pick, generateOptions } from './helpers';

type ProblemGen = () => { text: string; answer: number; hint: string };

const PROBLEMS: ProblemGen[] = [
  () => {
    const a = randInt(5, 25), b = randInt(3, 20);
    return { text: `Steve má ${a} bloků dřeva. Alex mu dá ještě ${b} bloků.\nKolik bloků má Steve celkem?`, answer: a + b, hint: `Sečti: ${a} + ${b}` };
  },
  () => {
    const a = randInt(20, 50), b = randInt(5, a - 3);
    return { text: `V jeskyni bylo ${a} diamantů. Creeper jich ${b} zničil.\nKolik diamantů zbylo?`, answer: a - b, hint: `Odečti: ${a} − ${b}` };
  },
  () => {
    const a = randInt(8, 30), b = randInt(5, 25);
    return { text: `Emma postavila věž z ${a} bloků. Pak přistavěla ${b} bloků.\nJak vysoká je věž?`, answer: a + b, hint: `${a} + ${b}` };
  },
  () => {
    const a = randInt(15, 40), b = randInt(10, 30), c = randInt(5, 15);
    return { text: `Na farmě je ${a} obilí, ${b} mrkví a ${c} brambor.\nKolik je celkem plodin?`, answer: a + b + c, hint: `Sečti: ${a} + ${b} + ${c}` };
  },
  () => {
    const t = randInt(30, 60), a = randInt(10, t - 10);
    return { text: `Alex má ${t} šípů. Vystřelí ${a} na zombie.\nKolik šípů zbyde?`, answer: t - a, hint: `${t} − ${a}` };
  },
  () => {
    const a = randInt(12, 35), b = randInt(8, 25);
    return { text: `Ve vesnici bydlí ${a} vesničanů. Přistěhuje se ${b} dalších.\nKolik vesničanů teď bydlí ve vesnici?`, answer: a + b, hint: `${a} + ${b}` };
  },
  () => {
    const a = randInt(15, 45), b = randInt(10, 30);
    return { text: `Steve vyrobil ${a} pochodní ráno a ${b} večer.\nKolik pochodní vyrobil celkem za den?`, answer: a + b, hint: `${a} + ${b}` };
  },
  () => {
    const a = randInt(40, 80), b = randInt(15, 35);
    return { text: `V truhlici bylo ${a} nuggetů zlata.\nEmma vzala ${b}. Kolik zůstalo?`, answer: a - b, hint: `${a} − ${b}` };
  },
  () => {
    const a = randInt(10, 30), b = randInt(10, 30), c = randInt(5, 15);
    return { text: `Steve má ${a} bloků kamene, ${b} bloků dřeva.\nPoužije ${c} bloků kamene na stavbu.\nKolik bloků kamene mu zbyde?`, answer: a - c, hint: `Pozor — ptáme se jen na kámen: ${a} − ${c}` };
  },
  () => {
    const a = randInt(5, 20), b = randInt(5, 20), c = randInt(5, 20);
    return { text: `Emma chytila ${a} ryb ráno, ${b} odpoledne a ${c} večer.\nKolik ryb chytila celkem?`, answer: a + b + c, hint: `Sečti: ${a} + ${b} + ${c}` };
  },
];

export function genWordProblem(d: number): Question {
  const p = pick(PROBLEMS)();
  return {
    type: 'word_problems',
    category: 'Slovní úloha',
    text: p.text,
    answer: p.answer,
    options: generateOptions(p.answer, d),
    hint: p.hint,
    inputMode: d >= 2 ? 'input' : 'options',
  };
}
