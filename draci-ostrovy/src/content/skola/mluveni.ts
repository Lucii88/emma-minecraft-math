// Mluvení s Miss Ember: dítě odpovídá nahlas a hra pozná, jestli mu
// „rozuměla“ (převod řeči na text v Azure, viz server.mjs). Hraje se jen se
// zapnutým mluvením; jinak ji v rozehrané misi nahradí Otázky a odpovědi.
//
// Vzory odpovědí viz core/saymatch.ts: `*` = cokoli, `#` = číslo. Odpověď
// stačí najít kdekoli v přepisu („It's a pencil.“ projde i na „pencil“).

import { bankSkill, type SaySpec, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { SayTip } from '../../core/types';
import { NUMBER_WORDS, capital, key, pickWord } from './common';
import { WORDS, article, byEn, pluralOf, type Word } from './ucivo';

const ASK = 'Odpověz nahlas anglicky.';
const ask = (q: string, pic?: string) => ({ type: 'english' as const, text: q, say: q, auto: true, ...(pic ? { pic } : {}) });

/** Nejčastější záměna: „Me seven.“ místo „I'm seven.“ */
const ME_TIP: SayTip = { when: 'me *', tip: '{Řekla|Řekl} jsi „me“. O sobě na začátku věty říkáme I: I’m … (I am).' };

function question(k: string, q: string, model: string, expect: string[], tips: SayTip[], hints: string[], explain: string, pic?: string): SaySpec {
  return { kind: 'say', key: k, prompt: ASK, visual: ask(q, pic), model, expect, tips, hints, explain, sayAfter: model };
}

/** Zopakuj větu: tady se hodnotí i výslovnost (ref). */
function repeat(sentence: string, cs: string): SaySpec {
  return {
    kind: 'say',
    key: `repeat-${key(sentence)}`,
    prompt: 'Poslechni si větu a zopakuj ji nahlas.',
    visual: { type: 'english', say: sentence, text: sentence, auto: true },
    model: sentence,
    expect: [sentence],
    ref: sentence,
    hints: ['Klepni na reproduktor a poslechni si větu ještě jednou.', `Česky: ${cs}`],
    explain: `${sentence} = ${cs}`,
    sayAfter: sentence,
  };
}

const REPEAT_1: Spec[] = [
  repeat("I'm seven.", 'Je mi sedm.'),
  repeat('I am happy.', 'Jsem {šťastná|šťastný}.'),
  repeat('Look at me!', 'Podívej se na mě!'),
  repeat('Give me the pen, please.', 'Podej mi prosím pero.'),
  repeat('Can you help me?', 'Pomůžeš mi?'),
  repeat('This is my bag.', 'To je moje taška.'),
  repeat('I like blue.', 'Mám {ráda|rád} modrou.'),
  repeat('I have a pencil.', 'Mám tužku.'),
];

const REPEAT_2: Spec[] = [
  repeat('My name is Anna and I am seven.', 'Jmenuji se Anna a je mi sedm.'),
  repeat('I am in the classroom.', 'Jsem ve třídě.'),
  repeat('The book is on the desk.', 'Kniha je na lavici.'),
  repeat('Can you give me a crayon, please?', 'Můžeš mi dát pastelku, prosím?'),
  repeat("It's my pencil case.", 'To je můj penál.'),
  repeat('I can see a window and a door.', 'Vidím okno a dveře.'),
];

const PERSONAL_1: Spec[] = [
  question('name', "What's your name?", 'My name is …', ['my name is *', 'i am *'],
    [ME_TIP, { when: 'me name *', tip: 'Jméno je „my name“ (moje jméno): My name is …' }],
    ['Name = jméno.', 'Začni: My name is …'], "What's your name? = Jak se jmenuješ? Odpověď: My name is … nebo I'm …"),
  question('age', 'How old are you?', "I'm seven.", ['i am #'],
    [ME_TIP, { when: '#', tip: 'Číslo je správně! Teď celou větou: I’m seven.' }],
    ['Ptá se, kolik ti je let.', 'Začni: I’m … (I am)'], 'How old are you? = Kolik ti je let? Odpověď: I’m seven. (I am seven.)'),
  question('how-are-you', 'Hello! How are you?', "I'm fine, thank you.", ['i am fine', 'i am good', 'i am ok', 'i am okay', 'i am great', 'i am very well'],
    [ME_TIP, { when: 'fine', tip: 'Skoro! Celou větou: I’m fine, thank you.' }],
    ['Ptá se, jak se máš.', 'Začni: I’m … (I am)'], 'How are you? = Jak se máš? Odpověď: I’m fine, thank you.'),
];

const PERSONAL_2: Spec[] = [
  question('like-apples', 'Do you like apples?', 'Yes, I do.', ['yes i do', 'no i do not'],
    [{ when: 'yes i am', tip: 'Na „Do you…?“ se odpovídá „Yes, I do.“ (ne I am).' }, { when: 'yes', tip: 'Ještě celou krátkou odpovědí: Yes, I do. / No, I don’t.' }, { when: 'no', tip: 'Ještě celou krátkou odpovědí: No, I don’t. / Yes, I do.' }],
    ['Otázka začíná Do.', 'Odpověď: Yes, I do. / No, I don’t.'], 'Do you like…? = Máš rád/ráda…? Odpověď: Yes, I do. / No, I don’t.', '🍎'),
  question('can-swim', 'Can you swim?', 'Yes, I can.', ['yes i can', 'no i can not'],
    [{ when: 'yes i do', tip: 'Na „Can you…?“ se odpovídá „Yes, I can.“' }, { when: 'yes', tip: 'Ještě celou krátkou odpovědí: Yes, I can. / No, I can’t.' }, { when: 'no', tip: 'Ještě celou krátkou odpovědí: No, I can’t. / Yes, I can.' }],
    ['Otázka začíná Can.', 'Odpověď: Yes, I can. / No, I can’t.'], 'Can you swim? = Umíš plavat? Odpověď: Yes, I can. / No, I can’t.'),
  question('from', 'Where are you from?', "I'm from the Czech Republic.", ['i am from *', 'from *'],
    [ME_TIP], ['Where = kde, odkud.', 'Začni: I’m from …'], 'Where are you from? = Odkud jsi? Odpověď: I’m from the Czech Republic. (Jsem z Česka.)'),
  question('pet', 'Do you have a pet?', 'Yes, I do.', ['yes i do', 'no i do not', 'i have *'],
    [{ when: 'yes i am', tip: 'Na „Do you…?“ se odpovídá „Yes, I do.“' }, { when: 'yes', tip: 'Ještě celou krátkou odpovědí: Yes, I do. / No, I don’t.' }, { when: 'no', tip: 'Ještě celou krátkou odpovědí: No, I don’t. / Yes, I do.' }],
    ['Pet = zvířátko.', 'Odpověď: Yes, I do. / No, I don’t.'], 'Do you have a pet? = Máš zvířátko? Odpověď: Yes, I do. / No, I don’t.'),
];

const COLOR_PIC: Record<string, string> = { red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', orange: '🟠', purple: '🟣', black: '⚫', white: '⚪', brown: '🟤' };

function color(rng: Rng): SaySpec {
  const c = rng.pick(Object.keys(COLOR_PIC));
  return question(`color-${c}`, 'What color is it?', `It's ${c}.`, [c], [],
    ['Color = barva.', `Začíná na ${c.charAt(0)}.`], `What color is it? = Jakou to má barvu? It's ${c}. (${byEn(c).cs})`, COLOR_PIC[c]);
}

const accepts = (w: Word) => [w.en, ...(w.accept ?? [])];

/** Slova, ke kterým se nehodí „It's a …“. */
const NO_ARTICLE: Record<string, string> = { paper: "It's paper.", bread: "It's bread.", milk: "It's milk.", chocolate: "It's chocolate.", cake: "It's cake.", sun: "It's the sun." };

function whatsThis(rng: Rng, level: number): SaySpec {
  const ok = (x: Word) => !!x.pic && x.topic !== 'cisla' && x.topic !== 'barvy' && x.en !== 'glasses' && (level >= 3 || x.level <= 2 || x.topic === 'hracky');
  const w = pickWord(rng, level, ok);
  const model = NO_ARTICLE[w.en] ?? `It's ${article(w)} ${w.en}.`;
  return question(`this-${key(w.en)}`, "What's this?", model, accepts(w), [],
    ['Podívej se na obrázek.', `Začíná na ${w.en.charAt(0)}.`], `What's this? = Co je to? ${model} (${w.cs})`, w.pic);
}

function howMany(rng: Rng): SaySpec {
  const w = rng.pick(WORDS.filter((x) => x.pic && !x.plural && ['trida', 'hracky', 'jidlo', 'zvirata'].includes(x.topic) && !['paper', 'bread', 'milk', 'chocolate', 'teacher', 'cake', 'ice cream'].includes(x.en)));
  const n = rng.int(2, 6);
  const model = `${capital(NUMBER_WORDS[n])} ${pluralOf(w)}.`;
  return question(`how-many-${key(w.en)}-${n}`, `How many ${pluralOf(w)}?`, model, [NUMBER_WORDS[n]], [],
    ['Spočítej obrázky.', 'Odpověz anglicky číslem.'], `How many…? = Kolik…? ${model} (${n})`, w.pic!.repeat(n));
}

type Where = 'in' | 'on' | 'under' | 'next';
const PLACES: { ref: 'box' | 'desk'; where: Where }[] = [
  { ref: 'box', where: 'in' }, { ref: 'box', where: 'on' }, { ref: 'box', where: 'next' },
  { ref: 'desk', where: 'on' }, { ref: 'desk', where: 'under' }, { ref: 'desk', where: 'next' },
];
const PREP: Record<Where, string> = { in: 'in', on: 'on', under: 'under', next: 'next to' };

function whereIs(rng: Rng): SaySpec {
  const thing = byEn(rng.pick(['cat', 'dog', 'ball', 'book', 'pencil', 'apple', 'robot']));
  const { ref, where } = rng.pick(PLACES);
  const model = `It's ${PREP[where]} the ${ref}.`;
  const wrong = (Object.keys(PREP) as Where[]).filter((w) => w !== where).map((w) => ({ when: `${PREP[w]} the ${ref}`, tip: `Podívej se pořádně: in = v, on = na, under = pod, next to = vedle.` }));
  return {
    kind: 'say',
    key: `where-${thing.en}-${ref}-${where}`,
    prompt: ASK,
    visual: { type: 'place', thing: thing.pic!, ref, where, ask: `Where's the ${thing.en}?` },
    model,
    expect: [`${PREP[where]} the ${ref}`, `${PREP[where]} a ${ref}`],
    tips: wrong,
    hints: ['in = v, on = na, under = pod, next to = vedle.', `Začni: It’s … the ${ref}.`],
    explain: `Where's the ${thing.en}? ${model}`,
    sayAfter: model,
  };
}

export const mluveniSkill = bankSkill({
  id: 'skola.mluveni',
  island: 'skola',
  name: 'Mluvení s Miss Ember',
  description: 'Odpovídá nahlas anglicky celou větou (I’m seven., My name is…, It’s on the desk.) a opakuje věty. Hra pozná, jestli jí bylo rozumět.',
  rvp: { 1: ['CJ-3-1-01', 'CJ-3-1-02'], 2: ['CJ-5-2-01', 'CJ-5-2-03'] },
  ability: 'slovni',
  priority: 2,
  needs: 'speech',
  fallback: 'skola.rozhovor',
  banks: { 1: [...PERSONAL_1, ...REPEAT_1], 2: [...PERSONAL_2, ...REPEAT_2] },
  gen: {
    1: (rng) => (rng.chance(0.4) ? color(rng) : whatsThis(rng, 1)),
    2: (rng) => (rng.chance(0.4) ? whereIs(rng) : rng.chance(0.5) ? howMany(rng) : whatsThis(rng, 3)),
  },
  genShare: 0.5,
});
