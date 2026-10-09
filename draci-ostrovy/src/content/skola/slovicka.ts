// Slovíčka: poslech (uslyší slovo a pozná význam) a „jak se to řekne“
// (vidí obrázek nebo české slovo a vybere anglické).

import { bankSkill, type ChoiceSpec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import { letters, optionOf, pickWord, sameTopic, type Mode, key } from './common';
import type { Word } from './ucivo';

/** Na úrovni 1–2 jen chybné možnosti ze školního učiva (ne „čísla navíc“). */
const inLevel = (level: number) => (x: Word) => level >= 3 || x.level <= 2;

/** Režim možností: barvy jako vzorky, s obrázkem obrázky (občas i česky),
 *  jinak český význam. */
function modeFor(rng: Rng, w: Word, level: number): Mode {
  if (w.color) return 'color';
  const pics = sameTopic(rng, w, 3, (x) => !!x.pic && inLevel(level)(x));
  if (w.pic && pics.length >= 2 && rng.chance(0.75)) return 'pic';
  return 'cs';
}

function poslech(level: number) {
  return (rng: Rng): ChoiceSpec => {
    const target = pickWord(rng, level);
    const mode = modeFor(rng, target, level);
    const wrong = sameTopic(rng, target, 3, (x) => inLevel(level)(x) && (mode === 'pic' ? !!x.pic : mode === 'color' ? !!x.color : true));
    return {
      key: `${key(target.en)}-${mode}`,
      prompt: mode === 'color' ? 'Poslechni si anglické slovo. Která je to barva?' : 'Poslechni si anglické slovo. Co znamená?',
      visual: { type: 'english', say: target.en, auto: true },
      correct: optionOf(target, mode),
      wrong: wrong.map((x) => optionOf(x, mode)),
      hints: ['Klepni na reproduktor a poslechni si slovo ještě jednou.', `Píše se ${target.en.charAt(0)}… a má ${letters(target.en.replace(/ /g, '').length)}.`],
      explain: `${target.en} = ${target.cs}.`,
      sayAfter: target.en,
      difficulty: mode === 'cs' ? 0.1 : -0.1,
    };
  };
}

function rekniTo(level: number) {
  return (rng: Rng): ChoiceSpec => {
    const target = pickWord(rng, level);
    const wrong = sameTopic(rng, target, 3, inLevel(level));
    const visual = target.pic ? ({ type: 'big', text: target.pic } as const) : undefined;
    return {
      key: key(target.en),
      prompt: visual ? 'Jak se to řekne anglicky?' : `Jak se anglicky řekne „${target.cs}“?`,
      ...(visual ? { visual } : {}),
      correct: target.en,
      wrong: wrong.map((x) => x.en),
      hints: [`Začíná na písmeno ${target.en.charAt(0)}.`, `Má ${letters(target.en.replace(/ /g, '').length)}.`],
      explain: `${target.cs} = ${target.en}.`,
      sayAfter: target.en,
    };
  };
}

export const poslechSkill = bankSkill({
  id: 'skola.poslech',
  island: 'skola',
  name: 'Slovíčka: poslech',
  description: 'Uslyší anglické slovo a pozná, co znamená – obrázek, barvu nebo český význam.',
  rvp: { 1: ['CJ-3-1-05'], 2: ['CJ-3-1-05', 'CJ-3-1-04'], 3: ['CJ-5-1-02'] },
  ability: 'slovni',
  gen: { 1: poslech(1), 2: poslech(2), 3: poslech(3) },
});

export const rekniToSkill = bankSkill({
  id: 'skola.slovicka',
  island: 'skola',
  name: 'Slovíčka: jak se to řekne',
  description: 'Vidí obrázek nebo české slovo a vybere správné anglické slovíčko.',
  rvp: { 1: ['CJ-3-1-02', 'CJ-3-1-05'], 2: ['CJ-3-1-02', 'CJ-3-1-03'], 3: ['CJ-5-1-02'] },
  ability: 'slovni',
  gen: { 1: rekniTo(1), 2: rekniTo(2), 3: rekniTo(3) },
});
