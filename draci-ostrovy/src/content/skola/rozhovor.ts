// Otázky a odpovědi: příprava na mluvení (ve zkoušce se zkoušející ptá na
// jméno, věk, barvy, věci na obrázku). Dítě uslyší otázku a vybere odpověď.

import { bankSkill, type ChoiceSpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import { NUMBER_WORDS, capital, key, pickWord, sameTopic } from './common';
import { WORDS, article, pluralOf } from './ucivo';

const ask = (q: string, pic?: string) => ({ type: 'english' as const, text: q, say: q, auto: true, ...(pic ? { pic } : {}) });

function qa(k: string, q: string, correct: string, wrong: string[], explain: string, hints: string[], pic?: string): ChoiceSpec {
  return { key: k, prompt: 'Poslechni si otázku a vyber správnou odpověď.', visual: ask(q, pic), correct, wrong, hints, explain, sayAfter: correct };
}

const BANK_1: Spec[] = [
  qa('name', "What's your name?", "I'm Anna.", ["I'm seven.", "It's red."], "What's your name? = Jak se jmenuješ? Odpověď: I'm Anna.", ['Name = jméno.', 'Odpověď začíná I’m …']),
  qa('age', 'How old are you?', "I'm seven.", ["I'm Anna.", "It's a pen."], 'How old are you? = Kolik je ti let? Odpověď: I’m seven.', ['Old = starý. Ptá se na věk.', 'Odpověď je číslo.']),
  qa('how-are-you', 'Hello! How are you?', "I'm fine, thank you.", ["I'm seven.", "It's blue."], 'How are you? = Jak se máš? Odpověď: I’m fine, thank you. (Mám se dobře, děkuji.)', ['Ptá se, jak se máš.', 'Fine = dobře.']),
  qa('goodbye', 'Goodbye!', 'Bye!', ['Hello!', 'Thank you!'], 'Goodbye = na shledanou. Odpovíš Bye! (Ahoj, pa!)', ['Někdo odchází.', 'Hello je pozdrav na přivítanou.']),
  qa('thank-you', 'Here you are.', 'Thank you!', ['Bye!', "I'm seven."], 'Here you are = tady máš (když ti někdo něco podává). Odpovíš Thank you! (Děkuji!)', ['Někdo ti něco podává.', 'Poděkuješ.']),
];

const BANK_2: Spec[] = [
  qa('like-apples', 'Do you like apples?', 'Yes, I do.', ['Yes, I am.', 'Yes, it is.'], 'Do you like…? = Máš rád/ráda…? Krátká odpověď: Yes, I do. / No, I don’t.', ['Otázka začíná Do.', 'Na Do you…? se odpovídá Yes, I do.'], '🍎'),
  qa('can-swim', 'Can you swim?', 'Yes, I can.', ['Yes, I do.', 'Yes, I am.'], 'Can you swim? = Umíš plavat? Odpověď: Yes, I can. / No, I can’t.', ['Otázka začíná Can.', 'Na Can you…? se odpovídá Yes, I can.']),
  qa('pet', 'Have you got a pet?', 'Yes, I have.', ['Yes, I do.', 'Yes, I am.'], 'Have you got a pet? = Máš nějaké zvířátko? Odpověď: Yes, I have. / No, I haven’t.', ['Otázka začíná Have you got.', 'Na Have you got…? se odpovídá Yes, I have.']),
  qa('is-it-red', 'Is it red?', 'Yes, it is.', ['Yes, I am.', 'Yes, I do.'], 'Is it…? = Je to…? Odpověď: Yes, it is. / No, it isn’t.', ['Otázka začíná Is it.', 'Na Is it…? se odpovídá Yes, it is / No, it isn’t.'], '🔴'),
  qa('is-it-blue', 'Is it blue?', "No, it isn't.", ['Yes, it is.', "No, I'm not."], "Na obrázku je zelená, ne modrá: No, it isn't. (Ne, není.)", ['Podívej se na barvu.', 'Blue = modrá. Je to modrá?'], '🟢'),
  qa('where-from', 'Where are you from?', "I'm from the Czech Republic.", ["I'm seven.", "It's on the desk."], 'Where are you from? = Odkud jsi? Odpověď: I’m from the Czech Republic. (Jsem z Česka.)', ['Where = kde, odkud.', 'From = z (odkud).']),
];

const COLOR_PIC: Record<string, string> = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', black: '⚫', white: '⚪', brown: '🟤' };

function colour(rng: Rng): ChoiceSpec {
  const colors = Object.keys(COLOR_PIC);
  const c = rng.pick(colors);
  const wrong = rng.shuffle(colors.filter((x) => x !== c)).slice(0, 2);
  return qa(`colour-${c}`, 'What colour is it?', `It's ${c}.`, wrong.map((x) => `It's ${x}.`), `What colour is it? = Jakou to má barvu? Odpověď: It's ${c}.`, ['Colour = barva.', 'Odpověď: It’s + barva.'], COLOR_PIC[c]);
}

/** Slova, ke kterým se nehodí „It's a …“ (nepočitatelná, sun = the sun, brýle). */
const NOT_A = ['paper', 'bread', 'milk', 'chocolate', 'teacher', 'glasses', 'sun', 'cake'];

function whatsThis(rng: Rng, level: number): ChoiceSpec {
  const ok = (x: typeof WORDS[number]) => !!x.pic && x.topic !== 'cisla' && !NOT_A.includes(x.en) && (level >= 3 || x.level <= 2 || x.topic === 'hracky');
  const w = pickWord(rng, level, ok);
  const wrong = sameTopic(rng, w, 2, ok);
  const say = (x: typeof w) => `It's ${article(x)} ${x.en}.`;
  return qa(`this-${key(w.en)}`, "What's this?", say(w), wrong.map(say), `What's this? = Co je to? ${say(w)} (${w.cs})`, ['Podívej se na obrázek.', `Začíná na ${w.en.charAt(0)}.`], w.pic);
}

function howMany(rng: Rng): ChoiceSpec {
  const w = rng.pick(WORDS.filter((x) => x.pic && !x.plural && ['trida', 'hracky', 'jidlo', 'zvirata'].includes(x.topic) && !['paper', 'bread', 'milk', 'chocolate', 'teacher', 'cake', 'ice cream'].includes(x.en)));
  const n = rng.int(2, 6);
  const nums = [n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= 10 && x !== n).slice(0, 2);
  return qa(
    `how-many-${key(w.en)}-${n}`,
    `How many ${pluralOf(w)}?`,
    `${capital(NUMBER_WORDS[n])}.`,
    nums.map((x) => `${capital(NUMBER_WORDS[x])}.`),
    `How many…? = Kolik…? ${capital(NUMBER_WORDS[n])} = ${n}: ${NUMBER_WORDS[n]} ${pluralOf(w)}.`,
    ['Spočítej obrázky.', 'Odpověz anglicky číslem.'],
    w.pic!.repeat(n),
  );
}

export const rozhovorSkill = bankSkill({
  id: 'skola.rozhovor',
  island: 'skola',
  name: 'Otázky a odpovědi',
  description: 'Rozumí běžným otázkám (What’s your name? How old are you? What colour…? How many…? Do you like…?) a vybere správnou odpověď – příprava na mluvení.',
  rvp: { 1: ['CJ-3-1-01', 'CJ-3-1-04'], 2: ['CJ-5-2-03'] },
  ability: 'slovni',
  banks: { 1: BANK_1, 2: BANK_2 },
  gen: {
    1: (rng) => (rng.chance(0.4) ? colour(rng) : rng.chance(0.5) ? whatsThis(rng, 1) : howMany(rng)),
    2: (rng) => (rng.chance(0.5) ? whatsThis(rng, 3) : howMany(rng)),
  },
  genShare: 0.6,
});
