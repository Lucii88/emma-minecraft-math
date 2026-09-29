// Slovní druhy. L2: děj / věc / vlastnost. L3: podstatné jméno, přídavné
// jméno, sloveso, číslovka. L4: všech deset slovních druhů – slovo vždy
// ukazujeme ve větě, aby bylo jednoznačné.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.druhy';

// ---------------------------------------------------------------------------
// L2 – děj, věc, vlastnost

type Kind2 = 'děj' | 'věc' | 'vlastnost';

const Q2: Record<Kind2, string> = { děj: 'Co dělá?', věc: 'Co je to?', vlastnost: 'Jaký je?' };
const EXPL2: Record<Kind2, string> = {
  děj: 'vyjadřuje děj – odpovídá na otázku „Co dělá?“',
  věc: 'je název věci – odpovídá na otázku „Co je to?“',
  vlastnost: 'vyjadřuje vlastnost – odpovídá na otázku „Jaký je?“',
};

const WORDS2: Record<Kind2, string[]> = {
  děj: ['běhá', 'spí', 'zpívá', 'letí', 'maluje', 'čte', 'skáče', 'plave', 'staví', 'uklízí', 'šeptá', 'mává'],
  věc: ['stůl', 'kolo', 'loď', 'hrnek', 'kniha', 'míč', 'židle', 'tužka', 'deštník', 'postel', 'klobouk', 'lampa'],
  vlastnost: ['modrý', 'veselý', 'rychlý', 'malý', 'sladký', 'měkký', 'velký', 'studený', 'chytrý', 'kulatý', 'zelený', 'tichý'],
};

const HINT2 = 'Zeptej se: Co dělá? (děj) Co je to? (věc) Jaký je? (vlastnost)';

function classify2(word: string, kind: Kind2): Entry {
  return {
    key: `druh-${slug(word)}`,
    build: (rng) => ({
      prompt: `Co vyjadřuje slovo „${word}“?`,
      answer: choice(rng, kind, (['děj', 'věc', 'vlastnost'] as Kind2[]).filter((k) => k !== kind)),
      hints: [HINT2, 'Zkus slovo použít v krátké větě.'],
      explanation: `Slovo „${word}“ ${EXPL2[kind]}`,
    }),
  };
}

/** Které slovo vyjadřuje …? [hledaný druh, správné slovo, dvě slova jiných druhů]. */
const FIND2: [Kind2, string, string, string][] = [
  ['děj', 'zpívá', 'hrnek', 'veselý'], ['děj', 'plave', 'loď', 'mokrý'], ['děj', 'kreslí', 'tužka', 'barevný'],
  ['děj', 'vaří', 'hrnec', 'horký'], ['věc', 'kolo', 'jede', 'rychlý'], ['věc', 'deštník', 'prší', 'mokrý'],
  ['věc', 'polštář', 'spí', 'měkký'], ['věc', 'lžíce', 'míchá', 'kovová'], ['vlastnost', 'sladký', 'dort', 'peče'],
  ['vlastnost', 'studený', 'led', 'mrzne'], ['vlastnost', 'hlasitý', 'buben', 'bubnuje'], ['vlastnost', 'kulatý', 'míč', 'skáče'],
];

const FIND2_Q: Record<Kind2, string> = {
  děj: 'Které slovo vyjadřuje děj?',
  věc: 'Které slovo je název věci?',
  vlastnost: 'Které slovo vyjadřuje vlastnost?',
};

function find2([kind, word, a, b]: [Kind2, string, string, string]): Entry {
  return {
    key: `najdi-${slug(kind)}-${slug(word)}`,
    build: (rng) => ({
      prompt: FIND2_Q[kind],
      answer: choice(rng, word, [a, b]),
      hints: [`Ke každému slovu si polož otázku „${Q2[kind]}“`],
      explanation: `Slovo „${word}“ ${EXPL2[kind]}`,
    }),
  };
}

const L2: Entry[] = [
  ...(Object.keys(WORDS2) as Kind2[]).flatMap((k) => WORDS2[k].map((w) => classify2(w, k))),
  ...FIND2.map(find2),
];

// ---------------------------------------------------------------------------
// L3 – podstatné jméno, přídavné jméno, sloveso, číslovka

type Kind3 = 'podstatné jméno' | 'přídavné jméno' | 'sloveso' | 'číslovka';
const KINDS3: Kind3[] = ['podstatné jméno', 'přídavné jméno', 'sloveso', 'číslovka'];

const Q3: Record<Kind3, string> = {
  'podstatné jméno': 'Kdo? Co?',
  'přídavné jméno': 'Jaký? Jaká? Jaké?',
  sloveso: 'Co dělá? Co se s ním děje?',
  číslovka: 'Kolik? Kolikátý?',
};

const WORDS3: Record<Kind3, string[]> = {
  'podstatné jméno': ['pes', 'škola', 'drak', 'město', 'jablko', 'kamarád', 'řeka', 'hvězda', 'radost', 'koleno'],
  'přídavné jméno': ['zelený', 'veselá', 'chytrý', 'dřevěné', 'rychlý', 'vysoký', 'sladká', 'dračí', 'kamenný', 'zlatá'],
  sloveso: ['skáče', 'létat', 'zpívala', 'čteme', 'poběží', 'maluješ', 'spát', 'nosí', 'psali', 'plave'],
  číslovka: ['pět', 'tři', 'deset', 'sto', 'sedm', 'jedenáct', 'dvacet', 'osm', 'dva', 'čtyři'],
};

function classify3(word: string, kind: Kind3): Entry {
  return {
    key: `druh-${slug(word)}`,
    build: (rng) => ({
      prompt: `Jaký slovní druh je slovo „${word}“?`,
      answer: choice(rng, kind, KINDS3.filter((k) => k !== kind)),
      hints: [
        'Zkus se na slovo zeptat: Kdo? Co? – Jaký? – Co dělá? – Kolik?',
        'Podstatná jména jsou názvy, přídavná jména vlastnosti, slovesa děje a číslovky počty.',
      ],
      explanation: `Slovo „${word}“ je ${kind} – odpovídá na otázku „${Q3[kind]}“`,
    }),
  };
}

/** Které slovo je …? [druh, správné slovo, tři slova jiných druhů]. */
const FIND3: [Kind3, string, string, string, string][] = [
  ['sloveso', 'běží', 'běh', 'rychlý', 'pět'],
  ['sloveso', 'maluje', 'malíř', 'malý', 'sedm'],
  ['podstatné jméno', 'zpěv', 'zpívá', 'hlasitý', 'tři'],
  ['podstatné jméno', 'radost', 'radostný', 'raduje se', 'deset'],
  ['přídavné jméno', 'modrý', 'moře', 'maluje', 'dva'],
  ['přídavné jméno', 'ledový', 'led', 'leží', 'pět'],
  ['číslovka', 'šest', 'šestka', 'šije', 'šedý'],
  ['číslovka', 'devět', 'děvče', 'dívá se', 'divný'],
];

function find3([kind, word, a, b, c]: [Kind3, string, string, string, string]): Entry {
  return {
    key: `najdi-${slug(kind)}-${slug(word)}`,
    build: (rng) => ({
      prompt: `Které slovo je ${kind}?`,
      answer: choice(rng, word, [a, b, c]),
      hints: [`Ke každému slovu si polož otázku „${Q3[kind]}“`, 'Pozor na slova, která si jsou podobná, ale znamenají něco jiného.'],
      explanation: `Slovo „${word}“ je ${kind} – odpovídá na otázku „${Q3[kind]}“`,
    }),
  };
}

const L3: Entry[] = [
  ...KINDS3.flatMap((k) => WORDS3[k].map((w) => classify3(w, k))),
  ...FIND3.map(find3),
];

// ---------------------------------------------------------------------------
// L4 – deset slovních druhů ve větě

type Kind4 =
  | 'podstatné jméno' | 'přídavné jméno' | 'zájmeno' | 'číslovka' | 'sloveso'
  | 'příslovce' | 'předložka' | 'spojka' | 'částice' | 'citoslovce';

const WHY4: Record<Kind4, string> = {
  'podstatné jméno': 'je název osoby, zvířete, věci nebo vlastnosti či děje (kdo? co?)',
  'přídavné jméno': 'říká, jaký je nebo čí je podstatné jméno (jaký? čí?)',
  zájmeno: 'stojí místo podstatného jména nebo na něj ukazuje (já, ty, můj, někdo…)',
  číslovka: 'vyjadřuje počet nebo pořadí (kolik? kolikátý? kolikrát?)',
  sloveso: 'vyjadřuje děj nebo stav (co dělá?)',
  příslovce: 'říká, jak, kde nebo kdy se něco děje (jak? kde? kdy?)',
  předložka: 'stojí před podstatným jménem nebo zájmenem (na, pod, mezi…)',
  spojka: 'spojuje slova nebo věty (a, ale, protože…)',
  částice: 'uvozuje větu a vyjadřuje přání, pochybnost nebo otázku (kéž, ať, prý, copak…)',
  citoslovce: 'vyjadřuje zvuk nebo pocit (haf, bum, au, hurá…)',
};

/** Slova, která mají velké písmeno i uprostřed věty (jména a tvary od nich). */
const KEEP_CASE = new Set(['Knutův', 'Jiskro', 'Frída', 'Knut', 'Ingrid', 'Liv', 'Bjorn', 'Bublinka', 'Sigrun', 'Sven', 'Olaf', 'Hromík', 'Mráček']);

/** Slovo ze začátku věty napíšeme ve vysvětlení malým písmenem. */
const low = (w: string) => (KEEP_CASE.has(w) ? w : w.charAt(0).toLocaleLowerCase('cs') + w.slice(1));

/** Druhá nápověda: popíše druh otázkou, ale nepojmenuje ho. */
const HINT4: Record<Kind4, string> = {
  'podstatné jméno': 'Dá se na slovo zeptat „kdo?“ nebo „co?“',
  'přídavné jméno': 'Říká slovo, jaké nebo čí něco je?',
  zájmeno: 'Stojí slovo místo nějakého jména?',
  číslovka: 'Říká slovo kolik, kolikátý nebo kolikrát?',
  sloveso: 'Říká slovo, co někdo dělá?',
  příslovce: 'Říká slovo, jak, kde nebo kdy se něco děje?',
  předložka: 'Stojí slovo před podstatným jménem a samo o sobě nic neznamená?',
  spojka: 'Spojuje slovo dvě slova nebo dvě věty?',
  částice: 'Uvozuje slovo větu a vyjadřuje přání, pochybnost nebo otázku?',
  citoslovce: 'Napodobuje slovo zvuk nebo vyjadřuje pocit?',
};

/** [klíč, věta, slovo ve větě, druh, tři matoucí druhy]. */
const CLASSIFY4: [string, string, string, Kind4, [Kind4, Kind4, Kind4]][] = [
  ['rychle', 'Drak Hromík rychle letí nad mořem.', 'rychle', 'příslovce', ['přídavné jméno', 'sloveso', 'předložka']],
  ['nad', 'Drak Hromík rychle letí nad mořem.', 'nad', 'předložka', ['příslovce', 'spojka', 'částice']],
  ['a-hrad', 'Ingrid a Liv staví hrad z písku.', 'a', 'spojka', ['předložka', 'částice', 'citoslovce']],
  ['pry', 'Prý bude zítra pršet.', 'Prý', 'částice', ['příslovce', 'spojka', 'zájmeno']],
  ['zitra', 'Prý bude zítra pršet.', 'zítra', 'příslovce', ['podstatné jméno', 'částice', 'přídavné jméno']],
  ['hura', 'Hurá, máme prázdniny!', 'Hurá', 'citoslovce', ['částice', 'příslovce', 'podstatné jméno']],
  ['my', 'My jsme dnes viděli tři draky.', 'My', 'zájmeno', ['podstatné jméno', 'částice', 'číslovka']],
  ['tri', 'My jsme dnes viděli tři draky.', 'tři', 'číslovka', ['přídavné jméno', 'zájmeno', 'příslovce']],
  ['dnes', 'My jsme dnes viděli tři draky.', 'dnes', 'příslovce', ['podstatné jméno', 'zájmeno', 'předložka']],
  ['videli', 'My jsme dnes viděli tři draky.', 'viděli', 'sloveso', ['přídavné jméno', 'podstatné jméno', 'příslovce']],
  ['kez', 'Kéž by už bylo léto!', 'Kéž', 'částice', ['citoslovce', 'spojka', 'příslovce']],
  ['haf', 'Pes udělal haf a utekl.', 'haf', 'citoslovce', ['podstatné jméno', 'sloveso', 'částice']],
  ['knutuv', 'Knutův drak spí pod stromem.', 'Knutův', 'přídavné jméno', ['podstatné jméno', 'zájmeno', 'číslovka']],
  ['pod', 'Knutův drak spí pod stromem.', 'pod', 'předložka', ['příslovce', 'spojka', 'citoslovce']],
  ['protoze', 'Sven přišel, protože měl hlad.', 'protože', 'spojka', ['příslovce', 'částice', 'předložka']],
  ['draci', 'Dračí vejce leží v teplém hnízdě.', 'Dračí', 'přídavné jméno', ['podstatné jméno', 'příslovce', 'zájmeno']],
  ['dvakrat', 'Frída přečetla knihu dvakrát.', 'dvakrát', 'číslovka', ['příslovce', 'přídavné jméno', 'podstatné jméno']],
  ['treti', 'Olaf doběhl v závodě třetí.', 'třetí', 'číslovka', ['přídavné jméno', 'příslovce', 'podstatné jméno']],
  ['nikdo', 'Nikdo nevěděl, kde je čepice.', 'Nikdo', 'zájmeno', ['příslovce', 'částice', 'podstatné jméno']],
  ['au', 'Au, píchla mě včela!', 'Au', 'citoslovce', ['částice', 'zájmeno', 'spojka']],
  ['me', 'Au, píchla mě včela!', 'mě', 'zájmeno', ['podstatné jméno', 'předložka', 'citoslovce']],
  ['copak', 'Copak nevíš, že draci umějí plavat?', 'Copak', 'částice', ['zájmeno', 'spojka', 'příslovce']],
  ['pomalu', 'Liv čte pomalu a pečlivě.', 'pomalu', 'příslovce', ['přídavné jméno', 'sloveso', 'spojka']],
  ['muj', 'Můj bratr má nové kolo.', 'Můj', 'zájmeno', ['přídavné jméno', 'podstatné jméno', 'číslovka']],
  ['nove', 'Můj bratr má nové kolo.', 'nové', 'přídavné jméno', ['příslovce', 'zájmeno', 'podstatné jméno']],
  ['at', 'Ať se ti výlet vydaří!', 'Ať', 'částice', ['spojka', 'citoslovce', 'zájmeno']],
  ['mezi', 'Mezi stromy běhá veverka.', 'Mezi', 'předložka', ['příslovce', 'spojka', 'podstatné jméno']],
  ['nahore', 'Dráček Mráček nahoře mává křídly.', 'nahoře', 'příslovce', ['předložka', 'přídavné jméno', 'podstatné jméno']],
  ['bac', 'Bác! Spadla mi lžička.', 'Bác', 'citoslovce', ['sloveso', 'částice', 'příslovce']],
  ['ale', 'Hromík chtěl letět, ale pršelo.', 'ale', 'spojka', ['částice', 'předložka', 'příslovce']],
  ['pojd', 'Jiskro, pojď si hrát!', 'pojď', 'sloveso', ['citoslovce', 'částice', 'příslovce']],
  ['jiskro', 'Jiskro, pojď si hrát!', 'Jiskro', 'podstatné jméno', ['citoslovce', 'zájmeno', 'částice']],
];

function classify4([key, sentence, word, kind, wrong]: [string, string, string, Kind4, [Kind4, Kind4, Kind4]]): Entry {
  if (!sentence.includes(word)) throw new Error(`druhy: slovo ${word} není ve větě`);
  return {
    key: `veta-${key}`,
    build: (rng) => ({
      prompt: `Jaký slovní druh je slovo „${low(word)}“ v této větě?`,
      visual: { type: 'big', text: sentence },
      answer: choice(rng, kind, wrong),
      hints: [
        'Zeptej se, na co slovo ve větě odpovídá: Kdo? Jaký? Kolik? Co dělá? Jak? Kde? Kdy?',
        HINT4[kind],
      ],
      explanation: `Slovo „${low(word)}“ je ve větě ${kind}: ${WHY4[kind]}.`,
    }),
  };
}

/** Najdi ve větě: [klíč, věta, druh, správné slovo, slova jiných druhů]. */
const FIND4: [string, string, Kind4, string, string[]][] = [
  ['sloveso-leti', 'Malý drak rychle letí.', 'sloveso', 'letí', ['Malý', 'drak', 'rychle']],
  ['pridavne-vesela', 'Veselá Frída zpívá písničku.', 'přídavné jméno', 'Veselá', ['Frída', 'zpívá', 'písničku']],
  ['cislovka-tri', 'Na louce skáčou tři zajíci.', 'číslovka', 'tři', ['louce', 'skáčou', 'zajíci']],
  ['prislovce-pomalu', 'Knut pomalu kreslí draka.', 'příslovce', 'pomalu', ['Knut', 'kreslí', 'draka']],
  ['predlozka-pod', 'Ingrid sedí pod stromem.', 'předložka', 'pod', ['Ingrid', 'sedí', 'stromem']],
  ['spojka-a', 'Sigrun zpívá a Liv tančí.', 'spojka', 'a', ['zpívá', 'Liv', 'tančí']],
  ['zajmeno-oni', 'Oni dnes staví loď.', 'zájmeno', 'Oni', ['dnes', 'staví', 'loď']],
  ['citoslovce-hura', 'Hurá, draci přiletěli!', 'citoslovce', 'Hurá', ['draci', 'přiletěli']],
  ['castice-kez', 'Kéž by přestalo pršet.', 'částice', 'Kéž', ['přestalo', 'pršet']],
  ['cislovka-dva', 'Bjorn má dva psy.', 'číslovka', 'dva', ['Bjorn', 'má', 'psy']],
  ['pridavne-vysoky', 'Vysoký strom roste u řeky.', 'přídavné jméno', 'Vysoký', ['strom', 'roste', 'řeky']],
  ['sloveso-plave', 'Bublinka často plave.', 'sloveso', 'plave', ['Bublinka', 'často']],
];

function find4([key, sentence, kind, word, others]: [string, string, Kind4, string, string[]]): Entry {
  for (const w of [word, ...others]) if (!sentence.includes(w)) throw new Error(`druhy: ${w} není ve větě`);
  return {
    key: `najdi-${key}`,
    build: (rng) => ({
      prompt: `Které slovo v této větě je ${kind}?`,
      visual: { type: 'big', text: sentence },
      answer: choice(rng, word, others),
      hints: ['Projdi větu slovo po slovu a u každého se zeptej, na co odpovídá.', `Připomeň si: ${kind} ${WHY4[kind].split(' (')[0]}.`],
      explanation: `Slovo „${low(word)}“ je ${kind}: ${WHY4[kind]}.`,
    }),
  };
}

const L4: Entry[] = [...CLASSIFY4.map(classify4), ...FIND4.map(find4)];

const levels: Level[] = [2, 3, 4];

export const pools: Pools = { 2: L2, 3: L3, 4: L4 };
assertUniqueKeys(ID, pools);

export const druhy: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Slovní druhy',
  description: 'Třídí slova podle toho, co vyjadřují (děj, věc, vlastnost), a postupně poznává všech deset slovních druhů ve větě.',
  levels,
  rvp: {
    2: ['ČJL-3-2-03'],
    3: ['ČJL-3-2-04'],
    4: ['ČJL-5-2-03'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
