// Spelling: skládání slova z písmen (jako ve zkoušce Starters: obrázek
// a přeházená písmena), psaní podle hláskování nebo poslechu a anglická
// abeceda (názvy písmen: G = dží, J = džej…).

import { bankSkill, type ChoiceSpec, type LettersSpec, type SpellSpec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import { letterName, spellOut } from '../../core/speech';
import { key, letters, lettersCz, pickWord } from './common';
import { LETTER_CZ, NAMES, WORDS, type Word } from './ucivo';

const noSpace = (w: Word) => !w.en.includes(' ');

/** Slovo na spelling podle délky: úroveň 1 = tři písmena (ze školy i navíc),
 *  2 = 4–6 písmen ze školy, 3 = dlouhá slova ze školy nebo slova navíc. */
function spellingWord(rng: Rng, level: number): Word {
  if (level <= 1) {
    const school = WORDS.filter((w) => noSpace(w) && w.en.length === 3 && w.level <= 2);
    const all = WORDS.filter((w) => noSpace(w) && w.en.length === 3);
    return rng.pick(rng.chance(0.5) ? school : all);
  }
  if (level === 2) return pickWord(rng, 2, (w) => noSpace(w) && w.en.length >= 4 && w.en.length <= 6);
  const longSchool = WORDS.filter((w) => noSpace(w) && w.level <= 2 && w.en.length >= 6);
  return rng.chance(0.4) ? rng.pick(longSchool) : pickWord(rng, 3, (w) => noSpace(w) && w.en.length >= 5);
}

// ---------------------------------------------------------------------------
// Poskládej slovo

function poskladej(level: number) {
  return (rng: Rng): LettersSpec => {
    const w = spellingWord(rng, level);
    return {
      kind: 'letters',
      key: key(w.en),
      prompt: w.pic ? 'Poskládej anglické slovo z písmen.' : `Poskládej anglicky: ${w.cs}`,
      visual: w.pic ? { type: 'english', say: w.en, pic: w.pic } : { type: 'english', say: w.en },
      correct: w.en,
      hints: ['Poslechni si slovo – klepni na reproduktor.', `Začíná na ${w.en.charAt(0)}.`, `Začíná na ${w.en.slice(0, 2)}.`],
      explain: `${w.cs} = ${w.en}: ${[...w.en].join(' – ')}.`,
      sayAfter: w.en,
    };
  };
}

export const poskladejSkill = bankSkill({
  id: 'skola.poskladej',
  island: 'skola',
  name: 'Spelling: poskládej slovo',
  description: 'Z přeházených písmen složí anglické slovo k obrázku – stejný typ úlohy jako ve zkoušce Cambridge Starters.',
  rvp: { 1: ['CJ-3-1-06'], 2: ['CJ-3-1-06'], 3: ['CJ-3-1-06'] },
  ability: 'slovni',
  priority: 2,
  gen: { 1: poskladej(1), 2: poskladej(2), 3: poskladej(3) },
});

// ---------------------------------------------------------------------------
// Napiš, co slyšíš

/** Slovo vyhláskované po písmenech → napsat. */
function hlaskovane(rng: Rng, level: number): SpellSpec {
  const w = spellingWord(rng, level);
  return {
    kind: 'spell',
    key: `pismena-${key(w.en)}`,
    prompt: 'Poslechni si hláskování a napiš slovo.',
    visual: { type: 'english', say: spellOut(w.en), auto: true },
    correct: w.en,
    hints: [`Má ${letters(w.en.length)}.`, `Začíná na ${w.en.charAt(0)}.`],
    explain: `${lettersCz(w.en, LETTER_CZ)} = ${w.en} (${w.cs}).`,
    sayAfter: w.en,
  };
}

/** Jméno – jako ve zkoušce: „My name is Lucy. L-U-C-Y.“ */
function jmeno(rng: Rng): SpellSpec {
  const name = rng.pick(NAMES);
  return {
    kind: 'spell',
    key: `jmeno-${key(name)}`,
    prompt: 'Jak se jmenuje? Napiš jméno, které slyšíš hláskovat.',
    visual: { type: 'english', say: `My name is ${name}. ${spellOut(name)}.`, auto: true },
    correct: name,
    hints: [`Má ${letters(name.length)}.`, `Začíná na ${name.charAt(0)}.`],
    explain: `${lettersCz(name, LETTER_CZ)} = ${name}. Jména se v angličtině píšou s velkým písmenem.`,
    sayAfter: `My name is ${name}.`,
  };
}

/** Celé slovo (jako diktát ve škole) – vidí obrázek nebo český význam. */
function diktat(rng: Rng, level: number): SpellSpec {
  const w = pickWord(rng, level === 3 ? 3 : 2, noSpace);
  return {
    kind: 'spell',
    key: `slovo-${key(w.en)}`,
    prompt: w.pic ? 'Poslechni si slovo a napiš ho anglicky.' : `Poslechni si slovo a napiš ho anglicky. Česky: ${w.cs}`,
    visual: w.pic ? { type: 'english', say: `${w.en}. ${w.en}.`, pic: w.pic, auto: true } : { type: 'english', say: `${w.en}. ${w.en}.`, auto: true },
    correct: w.en,
    ...(w.accept ? { accept: w.accept } : {}),
    hints: [`Má ${letters(w.en.length)}.`, `Začíná na ${w.en.slice(0, w.en.length > 4 ? 2 : 1)}.`],
    explain: `${w.cs} = ${w.en}: ${[...w.en].join(' – ')}.`,
    sayAfter: w.en,
    difficulty: Math.min(0.5, (w.en.length - 5) * 0.1),
  };
}

export const napisSkill = bankSkill({
  id: 'skola.napis',
  island: 'skola',
  name: 'Spelling: napiš slovo',
  description: 'Píše anglická slova a jména podle hláskování nebo poslechu – trénink na diktát ve škole i na zkoušku Starters.',
  rvp: { 1: ['CJ-3-1-06'], 2: ['CJ-3-1-06', 'CJ-3-1-05'], 3: ['CJ-5-4-02'] },
  ability: 'slovni',
  priority: 2,
  gen: {
    1: (rng) => hlaskovane(rng, 1),
    2: (rng) => (rng.chance(0.35) ? jmeno(rng) : rng.chance(0.5) ? hlaskovane(rng, 2) : diktat(rng, 2)),
    3: (rng) => (rng.chance(0.3) ? jmeno(rng) : diktat(rng, 3)),
  },
});

// ---------------------------------------------------------------------------
// Anglická abeceda

/** Písmena, která se Čechům pletou (každé písmeno je aspoň v jedné skupině). */
const GROUPS = ['AEIR', 'EIYA', 'GJHZ', 'UWYQ', 'CSZX', 'BPVD', 'KQCA', 'HAJK', 'MNLR', 'OUWA', 'TDPB', 'FSXL', 'VWBF'];

const NOTE: Record<string, string> = {
  G: 'Pozor na dvojici G (dží) a J (džej).',
  J: 'Pozor na dvojici G (dží) a J (džej).',
  E: 'E (í) a I (aj) se pletou nejčastěji – je to „naopak“ než česky.',
  I: 'E (í) a I (aj) se pletou nejčastěji – je to „naopak“ než česky.',
  A: 'A se čte ej, R se čte á.',
  R: 'A se čte ej, R se čte á.',
  Y: 'Y se čte uaj, skoro jako anglické „why“ (proč).',
  W: 'W je „double U“ – dvojité U.',
  H: 'H se čte ejč.',
  Z: 'Z se v americké angličtině čte zí (britsky zed).',
};

function pismeno(rng: Rng): ChoiceSpec {
  const group = rng.pick(GROUPS);
  const target = rng.pick([...group]);
  return {
    key: `pismeno-${target.toLowerCase()}-${group.toLowerCase()}`,
    prompt: 'Které písmeno slyšíš?',
    visual: { type: 'english', say: letterName(target), auto: true },
    correct: target,
    wrong: [...group].filter((c) => c !== target),
    hints: ['Poslechni si ho ještě jednou.', `Česky by se zapsalo zhruba „${LETTER_CZ[target]}“.`],
    explain: `${target} se anglicky čte ${LETTER_CZ[target]}.${NOTE[target] ? ` ${NOTE[target]}` : ''}`,
  };
}

/** Podobná slova, která se liší jedním písmenem (první je to správné). */
const SIMILAR = [
  ['pen', 'pin', 'pan', 'ten'],
  ['bag', 'big', 'bug', 'beg'],
  ['red', 'rod', 'bed', 'rid'],
  ['six', 'sit', 'fix', 'mix'],
  ['cat', 'cut', 'cot', 'hat'],
  ['dog', 'dig', 'log', 'fog'],
  ['box', 'fox', 'bus', 'boy'],
  ['ten', 'tin', 'tan', 'pen'],
  ['desk', 'disk', 'dusk', 'deck'],
  ['book', 'look', 'cook', 'boot'],
  ['pink', 'sink', 'link', 'pick'],
  ['blue', 'glue', 'clue', 'blew'],
  ['wall', 'ball', 'well', 'tall'],
  ['door', 'poor', 'floor', 'dear'],
  ['chair', 'hair', 'fair', 'cheer'],
  ['green', 'greet', 'queen', 'grew'],
] as const;

function slovoPoPismenech(rng: Rng): ChoiceSpec {
  const [target, ...wrong] = rng.pick(SIMILAR);
  return {
    key: `slovo-${target}`,
    prompt: 'Poslechni si hláskování. Které slovo to je?',
    visual: { type: 'english', say: spellOut(target), auto: true },
    correct: target,
    wrong: [...wrong],
    hints: ['Poslechni si to ještě jednou a dívej se na každé písmeno.', `První písmeno se čte ${LETTER_CZ[target.charAt(0).toUpperCase()]}.`],
    explain: `${lettersCz(target, LETTER_CZ)} = ${target}.`,
    sayAfter: target,
  };
}

export const abecedaSkill = bankSkill({
  id: 'skola.abeceda',
  island: 'skola',
  name: 'Anglická abeceda',
  description: 'Pozná anglické názvy písmen podle sluchu (G = dží, J = džej, E = í, I = aj) a slovo podle hláskování – základ spellingu.',
  rvp: { 1: ['CJ-3-1-05'], 2: ['CJ-3-1-05', 'CJ-3-1-04'] },
  ability: 'slovni',
  priority: 2,
  gen: { 1: pismeno, 2: slovoPoPismenech },
});

