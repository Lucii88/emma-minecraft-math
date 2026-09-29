// Čtení s porozuměním: krátký text (vizuál „reading“) a otázka s výběrem.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';
import { TEXTS_L1, TEXTS_L2, type QuestionKind, type ReadingText } from './cteni-texty-1';
import { TEXTS_L3 } from './cteni-texty-2';
import { TEXTS_L4 } from './cteni-texty-3';

const ID = 'slova.cteni';

const GENERIC_HINT: Record<QuestionKind, string> = {
  detail: 'Vrať se do textu a najdi místo, kde se o tom píše.',
  proc: 'Otázka se ptá na důvod. Hledej, co se stalo předtím, nebo slova protože a aby.',
  hlavni: 'Zkus říct jednou větou, o čem je celý text – ne jen jedna jeho část.',
  poradi: 'Zkus si příběh v duchu převyprávět od začátku do konce.',
  nazor: 'Fakt se dá ověřit. Názor je to, co si někdo myslí nebo co se mu líbí.',
};

const KIND_DIFFICULTY: Record<QuestionKind, number> = {
  detail: -0.2,
  proc: 0.1,
  poradi: 0.1,
  hlavni: 0.2,
  nazor: 0.3,
};

export const READING_TEXTS: Record<1 | 2 | 3 | 4, ReadingText[]> = {
  1: TEXTS_L1,
  2: TEXTS_L2,
  3: TEXTS_L3,
  4: TEXTS_L4,
};

function entries(texts: ReadingText[]): Entry[] {
  return texts.flatMap((t) =>
    t.questions.map((q, i) => ({
      key: `${slug(t.id)}-${i + 1}`,
      build: (rng) => ({
        prompt: q.q,
        visual: { type: 'reading' as const, title: t.title, text: t.text },
        answer: choice(rng, q.a, q.d),
        hints: [GENERIC_HINT[q.kind], q.hint],
        explanation: q.why,
        difficulty: KIND_DIFFICULTY[q.kind],
      }),
    })),
  );
}

export const pools: Pools = {
  1: entries(TEXTS_L1),
  2: entries(TEXTS_L2),
  3: entries(TEXTS_L3),
  4: entries(TEXTS_L4),
};
assertUniqueKeys(ID, pools);

const levels: Level[] = [1, 2, 3, 4];

export const cteni: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Čtení s porozuměním',
  description: 'Čte krátké příběhy a naučné texty a odpovídá na otázky: najde informaci, vysvětlí proč, určí hlavní myšlenku, pořadí dějů a rozliší fakt od názoru.',
  levels,
  rvp: {
    1: ['ČJL-3-1-01', 'ČJL-3-1-02'],
    2: ['ČJL-3-1-01', 'ČJL-3-1-02'],
    3: ['ČJL-3-1-01', 'ČJL-3-1-02'],
    4: ['ČJL-5-1-01', 'ČJL-5-1-02'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
