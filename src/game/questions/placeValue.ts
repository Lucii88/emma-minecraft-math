import { Question } from '../../data/types';
import { randInt, pick, generateOptions } from './helpers';

type PVGen = (d: number) => Question;

const generators: PVGen[] = [
  // "Kolik je X stovek, Y desítek, Z jednotek?"
  (d) => {
    const h = d <= 1 ? 0 : randInt(1, 4);
    const t = randInt(1, 9);
    const u = randInt(0, 9);
    const answer = h * 100 + t * 10 + u;
    const parts = h > 0 ? `${h} stovek, ${t} desítek a ${u} jednotek` : `${t} desítek a ${u} jednotek`;

    return {
      type: 'place_value',
      category: '🔢 Zlaté korálky',
      text: `Kolik je ${parts}?`,
      answer,
      options: generateOptions(answer, d),
      hint: h > 0
        ? `${h}×100 + ${t}×10 + ${u} = ?`
        : `${t}×10 + ${u} = ?`,
      inputMode: d >= 2 ? 'input' : 'options',
      montessori: { type: 'golden_beads', values: [h, t, u] },
    };
  },

  // "Rozlož číslo X na stovky, desítky a jednotky" -- kolik desítek?
  (d) => {
    const h = d <= 1 ? 0 : randInt(1, 4);
    const t = randInt(1, 9);
    const u = randInt(0, 9);
    const num = h * 100 + t * 10 + u;
    const askFor = pick(['stovek', 'desítek', 'jednotek'] as const);
    const answer = askFor === 'stovek' ? h : askFor === 'desítek' ? t : u;

    return {
      type: 'place_value',
      category: '🔢 Rozlož číslo',
      text: `Kolik ${askFor} má číslo ${num}?`,
      answer,
      options: generateOptions(answer, d),
      hint: `${num} = ${h > 0 ? `${h}×100 + ` : ''}${t}×10 + ${u}`,
      inputMode: 'options',
      montessori: { type: 'golden_beads', values: [h, t, u] },
    };
  },

  // "Přeměň korálky" -- 13 desítek = kolik?
  (d) => {
    if (d <= 1) {
      const t = randInt(10, 19);
      const answer = t * 10;
      return {
        type: 'place_value',
        category: '🔢 Přeměň korálky',
        text: `${t} desítkových tyček = kolik?`,
        answer,
        options: generateOptions(answer, d),
        hint: `${t} × 10 = ?`,
        inputMode: 'options',
        montessori: { type: 'golden_beads', values: [Math.floor(t / 10), t % 10, 0] },
      };
    }
    const h = randInt(1, 3);
    const extraT = randInt(10, 15);
    const u = randInt(0, 9);
    const answer = h * 100 + extraT * 10 + u;
    return {
      type: 'place_value',
      category: '🔢 Přeměň korálky',
      text: `${h} stovek, ${extraT} desítek a ${u} jednotek = ?`,
      answer,
      options: generateOptions(answer, d),
      hint: `${extraT} desítek = ${Math.floor(extraT / 10)} stovka + ${extraT % 10} desítek`,
      inputMode: d >= 2 ? 'input' : 'options',
      montessori: { type: 'golden_beads', values: [h + Math.floor(extraT / 10), extraT % 10, u] },
    };
  },
];

export function genPlaceValue(d: number): Question {
  return pick(generators)(d);
}
