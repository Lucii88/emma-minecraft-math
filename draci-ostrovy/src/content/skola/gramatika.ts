// Gramatika ze školy: I / me / my / I am, kde to je (in, on, under, next to),
// this / these, There is / There are a a / an.

import { bankSkill, type ChoiceSpec, type OrderSpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { Visual } from '../../core/types';
import { NUMBER_WORDS, key } from './common';
import { WORDS, article, byEn, pluralOf } from './ucivo';

// ---------------------------------------------------------------------------
// I, me, my, I am

/** Věta s mezerou: text ukazuje „___“, hlas místo mezery udělá pauzu. */
const gapVisual = (text: string): Visual => ({ type: 'english', text, say: text.replace(/_+/g, '…') });
/** Otázka, která se přečte sama. */
const question = (text: string): Visual => ({ type: 'english', text, say: text, auto: true });

const I_ME_HINTS = ['Kdo něco dělá nebo něco je? To je I (já).', 'Me je „mě, mně, mi“ – stojí až za slovesem: look at me, help me.'];
const AM_HINTS = ['Ke slovu I patří vždycky stejné sloveso.', 'I am – já jsem. Is je pro he, she, it.'];

function fill(k: string, text: string, correct: string, wrong: string[], explain: string, sayAfter: string, hints = I_ME_HINTS): ChoiceSpec {
  return { key: k, prompt: 'Doplň správné slovo.', visual: gapVisual(text), correct, wrong, hints, explain, sayAfter };
}

function answer(k: string, q: string, correct: string, wrong: string[], explain: string, hints: string[]): ChoiceSpec {
  return { key: k, prompt: 'Poslechni si otázku a vyber správnou odpověď.', visual: question(q), correct, wrong, hints, explain, sayAfter: correct };
}

function order(k: string, czech: string, words: string[], note: string): OrderSpec {
  return {
    kind: 'order',
    key: k,
    prompt: `Poskládej anglickou větu: „${czech}“`,
    correct: words,
    hints: ['Anglická věta začíná tím, kdo něco dělá nebo je (I, my name, it…).', `První slovo je ${words[0]}.`],
    explain: `${words.join(' ')}. = ${czech} ${note}`,
    sayAfter: `${words.join(' ')}.`,
  };
}

const JA_ME_1: Spec[] = [
  fill('i-am-seven', '___ am seven.', 'I', ['Me', 'My'], 'Já jsem = I am. Kdo něco je nebo dělá, je I – a píše se vždycky velkým písmenem.', 'I am seven.'),
  fill('i-am-a-child', '___ am a {girl|boy}.', 'I', ['Me', 'My'], 'Já jsem {holka|kluk} = I am a {girl|boy}. Na začátku věty je I, nikdy me.', 'I am a {girl|boy}.'),
  fill('i-m-happy', "___'m happy.", 'I', ['Me', 'My'], "I'm je zkrácené I am (já jsem): I'm happy = Mám radost.", "I'm happy."),
  fill('i-like-cats', '___ like cats.', 'I', ['Me', 'My'], '{Mám ráda|Mám rád} kočky = I like cats. Kdo má rád? Já = I.', 'I like cats.'),
  fill('i-have-a-bag', '___ have a red bag.', 'I', ['Me', 'My'], 'Mám červenou tašku = I have a red bag. Kdo má? Já = I.', 'I have a red bag.'),
  fill('look-at-me', 'Look at ___!', 'me', ['I', 'my'], 'Podívej se na mě = Look at me. „Mě, mně, mi“ je me – stojí za slovesem.', 'Look at me!'),
  fill('help-me', 'Can you help ___?', 'me', ['I', 'my'], 'Pomůžeš mi? = Can you help me? „Mi“ je me.', 'Can you help me?'),
  fill('give-me', 'Give ___ the ball, please.', 'me', ['I', 'my'], 'Dej mi míč, prosím = Give me the ball, please.', 'Give me the ball, please.'),
  fill('play-with-me', 'Play with ___!', 'me', ['I', 'my'], 'Hraj si se mnou = Play with me. „Se mnou“ je with me.', 'Play with me!'),
  fill('i-am-am', 'I ___ seven.', 'am', ['is', 'are'], 'K I patří vždycky am: I am seven (zkráceně I’m seven).', 'I am seven.', AM_HINTS),
  fill('i-am-happy', 'I ___ happy.', 'am', ['is', 'are'], 'Já jsem = I am. Is patří k he, she, it (on, ona, ono).', 'I am happy.', AM_HINTS),
  fill('it-is-a-pen', 'It ___ a pen.', 'is', ['am', 'are'], 'It is = to je: It is a pen. Am patří jen k I.', 'It is a pen.', ['Am patří jen k I.', 'It is – to je.']),
  fill('you-are', 'You ___ my friend.', 'are', ['am', 'is'], 'You are = ty jsi: You are my friend.', 'You are my friend.', ['Am patří jen k I.', 'You are – ty jsi.']),
];

const JA_ME_2: Spec[] = [
  fill('my-name-is', '___ name is Anna.', 'My', ['I', 'Me'], 'My = můj, moje. My name is Anna = Jmenuju se Anna (moje jméno je Anna).', 'My name is Anna.', ['Čí je to jméno? Moje.', 'Moje = my.']),
  fill('whats-your-name', "What's ___ name?", 'your', ['you', "you're"], "Your = tvoje. What's your name? = Jak se jmenuješ? (Jaké je tvoje jméno?)", "What's your name?", ['Čí jméno? Tvoje.', 'Tvoje = your.']),
  fill('its-me', "Who is it? It's ___!", 'me', ['I', 'my'], "Když ukazuješ na sebe, řekneš It's me! = To jsem já!", "It's me!", ['Tohle je výjimka: „To jsem já“ se řekne It’s me.', 'Ukazuješ na sebe: It’s me.']),
  fill('this-is-me', 'This is ___ with my dog.', 'me', ['I', 'my'], 'Na fotce: This is me = Tohle jsem já. Když ukazuješ na sebe, je to me.', 'This is me with my dog.', ['Ukazuješ na sebe na fotce.', 'This is me – tohle jsem já.']),
  answer('how-old', 'How old are you?', "I'm seven.", ['Me seven.', 'I seven.'], "Odpověď na věk: I'm seven. (I am seven.) Bez am to nejde a me se na začátek nedává.", AM_HINTS),
  answer('name', "What's your name?", "I'm Anna.", ['Me Anna.', 'Is Anna.'], "Odpověď: I'm Anna. (nebo My name is Anna.) Me Anna se neříká.", AM_HINTS),
  answer('are-you-seven', 'Are you seven?', 'Yes, I am.', ["Yes, I'm.", 'Yes, me am.'], "Na konci krátké odpovědi se nezkracuje: Yes, I am. (ne Yes, I'm.)", ['Krátká odpověď: Yes, I …', "Na konci věty se I am nezkracuje na I'm."]),
  answer('are-you-happy', 'Are you happy?', 'Yes, I am.', ['Yes, me am.', 'Yes, I is.'], 'Já jsem = I am, i v krátké odpovědi: Yes, I am.', AM_HINTS),
  order('order-i-am-seven', 'Je mi sedm.', ['I', 'am', 'seven'], 'Anglicky se věk říká „já jsem sedm“.'),
  order('order-my-name', 'Jmenuju se Anna.', ['My', 'name', 'is', 'Anna'], 'Anglicky doslova „moje jméno je Anna“.'),
  order('order-look-at-me', 'Podívej se na mě!', ['Look', 'at', 'me'], 'Na mě = at me.'),
  order('order-help-me', 'Pomůžeš mi?', ['Can', 'you', 'help', 'me'], 'Otázka začíná slovem Can.'),
  order('order-i-like', 'Mám rád{a|} červená jablka.', ['I', 'like', 'red', 'apples'], 'Barva je před slovem: red apples.'),
];

export const jaMeSkill = bankSkill({
  id: 'skola.ja-me',
  island: 'skola',
  name: 'I, me, my a I am',
  description: 'Kdy říct I (já), me (mě, mi), my (můj) a že k I patří am – v doplňování, odpovědích na otázky i skládání vět.',
  rvp: { 1: ['CJ-3-1-02'], 2: ['CJ-3-1-02', 'CJ-3-1-01'] },
  ability: 'slovni',
  priority: 2,
  banks: { 1: JA_ME_1, 2: JA_ME_2 },
});

// ---------------------------------------------------------------------------
// Kde to je? in, on, under, next to

type Where = 'in' | 'on' | 'under' | 'next';
type Ref = 'box' | 'desk';

const THINGS = ['cat', 'dog', 'ball', 'book', 'pencil', 'apple', 'bag', 'robot'];

const PREP: Record<Where, string> = { in: 'in', on: 'on', under: 'under', next: 'next to' };
const CZ: Record<Ref, Record<string, string>> = {
  box: { in: 'v krabici', on: 'na krabici', next: 'vedle krabice' },
  desk: { on: 'na lavici', under: 'pod lavicí', next: 'vedle lavice' },
};
const WHERE_FOR: Record<Ref, Where[]> = { box: ['in', 'on', 'next'], desk: ['on', 'under', 'next'] };

function kde(level: number) {
  return (rng: Rng): ChoiceSpec => {
    const ref = rng.pick(['box', 'desk'] as Ref[]);
    const where = rng.pick(WHERE_FOR[ref]);
    const thing = byEn(rng.pick(THINGS));
    const many = level >= 2 && rng.chance(0.5);
    const pic = many ? `${thing.pic}${thing.pic}` : thing.pic!;
    const ask = many ? `Where are the ${pluralOf(thing)}?` : `Where's the ${thing.en}?`;
    const sentence = (w: Where) => `${many ? "They're" : "It's"} ${PREP[w]} the ${ref}.`;
    const correct = sentence(where);
    return {
      key: `${thing.en}-${ref}-${where}${many ? '-pl' : ''}`,
      prompt: 'Kde to je? Vyber správnou odpověď.',
      visual: { type: 'place', thing: pic, ref, where, ask },
      correct,
      wrong: WHERE_FOR[ref].filter((w) => w !== where).map(sentence),
      hints: ['in = v, on = na, under = pod, next to = vedle.', many ? 'Víc věcí: They’re … (jsou).' : 'Jedna věc: It’s … (je).'],
      explain: `${correct} = ${many ? 'Jsou' : 'Je'} ${CZ[ref][where]}. (in = v, on = na, under = pod, next to = vedle)`,
      sayAfter: correct,
    };
  };
}

export const kdeSkill = bankSkill({
  id: 'skola.kde',
  island: 'skola',
  name: 'Where is it?',
  description: 'Rozumí otázce Where’s the…? a odpoví podle obrázku: in, on, under, next to.',
  rvp: { 1: ['CJ-3-1-04'], 2: ['CJ-3-1-04', 'CJ-3-1-03'] },
  ability: 'slovni',
  gen: { 1: kde(1), 2: kde(2) },
});

// ---------------------------------------------------------------------------
// This / these, There is / There are, a / an

/** Počitatelné věci s obrázkem, které se dají snadno ukázat po jedné i po více. */
const COUNTABLE = WORDS.filter((w) => w.pic && ['trida', 'hracky', 'jidlo', 'zvirata'].includes(w.topic) && !['paper', 'bread', 'milk', 'chocolate', 'cake', 'teacher', 'ice cream'].includes(w.en));

function thisThese(level: number) {
  return (rng: Rng): ChoiceSpec => {
    const pool = level >= 3 ? COUNTABLE.filter((w) => w.plural) : COUNTABLE.filter((w) => !w.plural && (level >= 2 || w.level <= 2 || w.topic === 'hracky'));
    const w = rng.pick(pool);
    const n = rng.chance(0.5) ? 1 : rng.int(2, 3);
    const one = `It's ${article(w)} ${w.en}.`;
    const many = `They're ${pluralOf(w)}.`;
    // Dětská chyba v množném čísle: mouses, tomatos, ale „bus“ (ne buss).
    const naive = /(s|x|sh|ch)$/.test(w.en) ? w.en : `${w.en}s`;
    const pic = w.pic!.repeat(n);
    if (n === 1) {
      return {
        key: `this-${key(w.en)}`,
        prompt: 'Poslechni si otázku a vyber správnou odpověď.',
        visual: { type: 'english', text: "What's this?", say: "What's this?", pic, auto: true },
        correct: one,
        wrong: [many, `It's ${pluralOf(w)}.`],
        hints: ['Kolik věcí je na obrázku?', "Jedna věc: What's this? – It's a …"],
        explain: `Jedna věc: What's this? – ${one} (Co je to? To je ${w.cs}.)`,
        sayAfter: one,
      };
    }
    return {
      key: `these-${key(w.en)}`,
      prompt: 'Poslechni si otázku a vyber správnou odpověď.',
      visual: { type: 'english', text: 'What are these?', say: 'What are these?', pic, auto: true },
      correct: many,
      wrong: [one, w.plural ? `They're ${naive}.` : `They're ${w.en}.`].filter((x) => x !== many),
      hints: ['Kolik věcí je na obrázku?', 'Víc věcí: What are these? – They’re …s.'],
      explain: w.plural
        ? `Víc věcí: ${many} Pozor, ${w.en} má nepravidelné množné číslo: ${pluralOf(w)}.`
        : `Víc věcí: What are these? – ${many} Množné číslo má na konci -s.`,
      sayAfter: many,
    };
  };
}

function thereIs(rng: Rng): ChoiceSpec {
  const w = rng.pick(COUNTABLE.filter((x) => !x.plural && x.level <= 2));
  const n = rng.int(1, 4);
  const what = n === 1 ? `${article(w)} ${w.en}` : `${NUMBER_WORDS[n]} ${pluralOf(w)}`;
  const correct = n === 1 ? 'is' : 'are';
  return {
    key: `there-${key(w.en)}-${n}`,
    prompt: 'Doplň správné slovo.',
    visual: { type: 'english', text: `There ___ ${what}.`, say: `There … ${what}.`, pic: w.pic!.repeat(n) },
    correct,
    wrong: [n === 1 ? 'are' : 'is', 'am'],
    hints: ['Kolik věcí je na obrázku?', 'There is = je tam jedna věc. There are = je tam víc věcí.'],
    explain: `There is = je tam (jedna věc), There are = je tam víc věcí: There ${correct} ${what}.`,
    sayAfter: `There ${correct} ${what}.`,
  };
}

function aAn(rng: Rng): ChoiceSpec {
  const w = rng.pick(COUNTABLE.filter((x) => x.an || rng.chance(0.25)));
  const correct = article(w);
  return {
    key: `a-an-${key(w.en)}`,
    prompt: 'Doplň a, nebo an.',
    visual: { type: 'english', text: `It's ___ ${w.en}.`, say: `It's … ${w.en}.`, pic: w.pic },
    correct,
    wrong: [correct === 'an' ? 'a' : 'an'],
    hints: ['Na jaké písmeno začíná slovo za mezerou?', 'Před a, e, i, o, u se píše an.'],
    explain: `An se píše před slovem, které začíná samohláskou (a, e, i, o, u): an apple, an egg. Jinak a: a ${COUNTABLE.find((x) => !x.an)!.en}. Tady: It's ${correct} ${w.en}.`,
    sayAfter: `It's ${correct} ${w.en}.`,
  };
}

export const tohleSkill = bankSkill({
  id: 'skola.tohle',
  island: 'skola',
  name: 'This, these, There is',
  description: 'Odpoví na What’s this? a What are these?, rozliší jednotné a množné číslo, There is / There are a a / an.',
  rvp: { 1: ['CJ-3-1-04'], 2: ['CJ-3-1-02', 'CJ-3-1-03'], 3: ['CJ-5-1-02'] },
  ability: 'slovni',
  gen: {
    1: thisThese(1),
    2: (rng) => (rng.chance(0.4) ? thisThese(2)(rng) : rng.chance(0.5) ? thereIs(rng) : aAn(rng)),
    3: thisThese(3),
  },
});

