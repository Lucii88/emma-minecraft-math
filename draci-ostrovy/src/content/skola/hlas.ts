// Nahraný hlas Miss Ember: seznam všech anglických vět, slov a písmen, které
// může hra na Školním ostrově říct. Nahrávky (public/hlas) se z něj vyrábějí
// skriptem scripts/hlas – po změně obsahu je potřeba je doplnit (hlídá to
// test tests/skola.test.ts).

import { createRng } from '../../core/rng';
import { speechParts } from '../../core/speech';
import type { Item, Level, SkillDef } from '../../core/types';

/** Co Miss Ember říká po odpovědi nahlas (rozpoznávání řeči). */
export const EN_UNDERSTOOD = ['Great! I understood you.', 'Well done! I understood every word.', 'Yes! I understood you.', 'Perfect! I understood you.'];
export const EN_SORRY = ["Sorry, I didn't understand. Try again!", "Hmm, I didn't catch that. Try again, please!"];
/** Ukázka hlasu v nastavení pro rodiče (pak písmena a, e, i, g, j, r). */
export const EN_VOICE_TEST = "Hello! Let's spell.";

/** Anglický text úlohy, který zazní nahlas. */
export function itemSpeech(item: Item): string[] {
  const texts: string[] = [];
  const v = item.visual;
  if (v?.type === 'english') texts.push(v.say);
  if (v?.type === 'place' && v.ask) texts.push(v.ask);
  if (item.sayAfter) texts.push(item.sayAfter);
  return texts.flatMap(speechParts);
}

/** Všechny promluvy: písmena, pevné věty a co dovednosti vygenerují.
 *  `seeds` = kolik úloh se vygeneruje na každou úroveň dovednosti. */
export function allSpeech(skills: SkillDef[], seeds = 4000): string[] {
  const out = new Set<string>('abcdefghijklmnopqrstuvwxyz');
  for (const t of [...EN_UNDERSTOOD, ...EN_SORRY, EN_VOICE_TEST]) out.add(t);
  for (const s of skills) {
    for (const level of s.levels) {
      for (let seed = 1; seed <= seeds; seed++) {
        for (const t of itemSpeech(s.generate(level as Level, createRng(seed)))) out.add(t);
      }
    }
  }
  return [...out].sort();
}
