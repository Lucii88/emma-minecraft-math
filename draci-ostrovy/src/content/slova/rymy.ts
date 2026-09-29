// Rýmy. L1–L2: „Co se rýmuje se slovem …?“ – mezi možnostmi je právě jeden
// pravý rým (stejně zní konec slova včetně délky samohlásky). Distraktory se
// liší samohláskou nebo souhláskou na konci, ne jen délkou či znělostí.
// L3: doplnit poslední slovo básničky – musí se rýmovat a dávat smysl.

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.rymy';

export interface RhymeItem {
  word: string;
  rhyme: string;
  distractors: [string, string, string];
  /** Společný konec, jak ho uvidí dítě v nápovědě (bez pomlčky). */
  end: string;
  /** Vlastní druhá nápověda, když se konec píše v obou slovech jinak. */
  hint?: string;
}

const r = (word: string, rhyme: string, end: string, distractors: [string, string, string], hint?: string): RhymeItem =>
  ({ word, rhyme, end, distractors, hint });

export const RHYMES_L1: RhymeItem[] = [
  r('pes', 'les', 'es', ['pas', 'pec', 'nos']),
  r('kos', 'nos', 'os', ['kus', 'koš', 'kost']),
  r('drak', 'mrak', 'ak', ['drát', 'kluk', 'dráp']),
  r('myš', 'plyš', 'yš', ['miska', 'mech', 'moře']),
  r('sýr', 'výr', 'ýr', ['sůl', 'syn', 'sval']),
  r('hrad', 'sad', 'ad', ['hrách', 'hráč', 'hrom']),
  r('had', 'hrad', 'ad', ['hák', 'hod', 'hůl']),
  r('led', 'med', 'ed', ['les', 'lev', 'lep']),
  r('vlak', 'rak', 'ak', ['vlk', 'vlas', 'věk']),
  r('míč', 'klíč', 'íč', ['mech', 'mísa', 'mrak']),
  r('les', 'ves', 'es', ['lis', 'list', 'lev']),
  r('dort', 'sport', 'ort', ['drát', 'dar', 'dům']),
  r('koláč', 'hráč', 'áč', ['kolo', 'klíč', 'kočka']),
  r('ryba', 'chyba', 'yba', ['rýže', 'ruka', 'koza']),
  r('sova', 'slova', 'ova', ['sůl', 'slon', 'síto']),
  r('tráva', 'kráva', 'áva', ['trám', 'tvář', 'kraj']),
  r('strom', 'hrom', 'om', ['stůl', 'stroj', 'strop']),
  r('kluk', 'luk', 'uk', ['klec', 'kolo', 'klíč']),
  r('lev', 'řev', 'ev', ['les', 'led', 'lék']),
  r('pták', 'zobák', 'ák', ['plot', 'pás', 'pátek']),
  r('hora', 'nora', 'ora', ['hůl', 'hřib', 'noha']),
  r('mák', 'zpěvák', 'ák', ['mech', 'máma', 'míč']),
  r('zub', 'dub', 'ub', ['zima', 'buk', 'sob']),
  r('sůl', 'stůl', 'ůl', ['sýr', 'syn', 'sova']),
  r('máma', 'jáma', 'áma', ['maso', 'mák', 'jablko']),
  r('voda', 'škoda', 'oda', ['vosa', 'vana', 'vlna']),
  r('noc', 'pomoc', 'oc', ['nos', 'noha', 'nit']),
  r('den', 'sen', 'en', ['dům', 'dub', 'led']),
  r('vrána', 'brána', 'ána', ['vrata', 'vlna', 'brada']),
  r('pec', 'otec', 'ec', ['pes', 'pero', 'pěna']),
  r('kraj', 'čaj', 'aj', ['král', 'krok', 'kmen']),
  r('kost', 'most', 'ost', ['kos', 'kaše', 'mák']),
];

export const RHYMES_L2: RhymeItem[] = [
  r('myška', 'šiška', 'iška', ['miska', 'muška', 'myš'], 'Poslouchej konec: -ška. A jak zní samohláska před ním?'),
  r('mouka', 'louka', 'ouka', ['moucha', 'mýdlo', 'mák']),
  r('houba', 'trouba', 'ouba', ['houska', 'holub', 'hůl']),
  r('kytka', 'nitka', 'itka', ['kytara', 'klika', 'kost'], 'Poslouchej konec: -tka. A jak zní samohláska před ním?'),
  r('zmrzlina', 'malina', 'lina', ['zima', 'zmatek', 'máma']),
  r('květina', 'rodina', 'ina', ['kvítek', 'kytka', 'rodiče']),
  r('hruška', 'muška', 'uška', ['hrouda', 'hrnek', 'hrách']),
  r('beruška', 'hruška', 'uška', ['bedna', 'beran', 'mráček']),
  r('vločka', 'kočka', 'očka', ['vlaštovka', 'tečka', 'vlak']),
  r('tečka', 'ovečka', 'ečka', ['tužka', 'taška', 'tulák']),
  r('dráček', 'ptáček', 'áček', ['drátek', 'dárek', 'domek']),
  r('kapka', 'tlapka', 'apka', ['kapsa', 'kopec', 'lopata']),
  r('lopata', 'chata', 'ata', ['lopatka', 'lodička', 'lampa']),
  r('čepice', 'ulice', 'ice', ['čepička', 'celer', 'kapsa']),
  r('rohlík', 'knedlík', 'lík', ['rohy', 'robot', 'koláč']),
  r('pohádka', 'zahrádka', 'ádka', ['pohár', 'pohled', 'zahrada']),
  r('sluníčko', 'jablíčko', 'íčko', ['slunce', 'sluchátko', 'slanina']),
  r('kočička', 'lžička', 'ička', ['kočka', 'kolíček', 'kotě']),
  r('zajíček', 'míček', 'íček', ['zajíc', 'zámek', 'zobáček']),
  r('korálek', 'válek', 'álek', ['koláč', 'králík', 'kotel']),
  r('babička', 'slepička', 'ička', ['bábovka', 'balíček', 'bačkora']),
  r('dědeček', 'hrneček', 'eček', ['děda', 'dědina', 'dýně']),
  r('večeře', 'dveře', 'eře', ['večer', 'věnec', 'večerníček']),
  r('dárek', 'párek', 'árek', ['dort', 'dáma', 'domek']),
  r('sněhulák', 'pták', 'ák', ['sněženka', 'snídaně', 'sníh']),
  r('autobus', 'cirkus', 'us', ['auto', 'obraz', 'autíčko']),
  r('banán', 'tulipán', 'án', ['balón', 'baterka', 'bonbon']),
  r('pavouk', 'brouk', 'ouk', ['páv', 'pavučina', 'potok']),
  r('papír', 'tapír', 'apír', ['papoušek', 'paprika', 'pastelka']),
  r('klobouk', 'pavouk', 'ouk', ['klobása', 'kolébka', 'kobliha']),
  r('jahoda', 'voda', 'oda', ['jablko', 'jaro', 'jehla']),
  r('raketa', 'planeta', 'eta', ['rámeček', 'radost', 'ráno']),
  r('koťátko', 'zvířátko', 'átko', ['kotě', 'kotel', 'koláček']),
];

export interface Poem {
  key: string;
  /** Řádky básničky; poslední slovo posledního řádku chybí (…). */
  lines: string;
  /** Správné slovo: rýmuje se a dává smysl. */
  answer: string;
  /** Slovo, které by smysl dávalo, ale nerýmuje se. */
  sense: string;
  /** Další distraktory (rýmuje se, ale nedává smysl, nebo ani jedno). */
  others: string[];
  /** Slovo z předchozího řádku, se kterým se odpověď rýmuje. */
  pair: string;
}

const p = (key: string, lines: string, pair: string, answer: string, sense: string, others: string[]): Poem =>
  ({ key, lines, pair, answer, sense, others });

export const POEMS: Poem[] = [
  p('plaminek', 'Malý dráček Plamínek\nnašel v trávě …', 'Plamínek', 'kamínek', 'kámen', ['komínek', 'jablko']),
  p('drak-mrak', 'Na obloze letí drak,\nschoval se za bílý …', 'drak', 'mrak', 'strom', ['vlak']),
  p('jiskra-hop', 'Jiskra ráda skáče hop,\naž se hlavou ťukne o …', 'hop', 'strop', 'zeď', ['cop']),
  p('knutuv-pes', 'Kde je Knutův bílý pes?\nŠel si hrát až za …', 'pes', 'les', 'dům', ['plot', 'dnes']),
  p('kyticka', 'Na louce roste kytička,\nna ní sedí …', 'kytička', 'včelička', 'motýl', ['lžička']),
  p('olaf-syr', 'Olaf nesl domů sýr,\nna komíně seděl …', 'sýr', 'výr', 'pták', ['vír', 'sova']),
  p('sigrun-zpiva', 'Sigrun ráda zpívá,\nkočka hlavou …', 'zpívá', 'kývá', 'točí', ['skrývá']),
  p('ingrid-boty', 'Ingrid má nové boty,\nnosí je od pondělí do …', 'boty', 'soboty', 'neděle', ['noty']),
  p('slunicko', 'Svítí, svítí sluníčko,\nzralé je už …', 'sluníčko', 'jablíčko', 'rajče', ['víčko']),
  p('sven-cepice', 'Na hlavě má Sven čepici,\nsedí v zimě na …', 'čepici', 'lavici', 'židli', ['slepici']),
  p('zvonec', 'Zazvonil zvonec\na pohádky je …', 'zvonec', 'konec', 'začátek', ['tanec']),
  p('potok', 'Za vesnicí teče potok,\nFrída přes něj udělá …', 'potok', 'skok', 'most', ['rok']),
  p('snih', 'Padá, padá bílý sníh,\nděti jezdí na …', 'sníh', 'saních', 'sáňkách', ['smích']),
  p('pet', 'Jedna, dvě, tři, čtyři, pět,\ndrak Hromík už letí …', 'pět', 'zpět', 'domů', ['květ']),
  p('kvak', 'Kvák, kvák, kvák,\nzpívá žába, zpívá …', 'kvák', 'pták', 'kos', ['mák']),
  p('plot-kote', 'Sedí dráček na plotě,\nvedle něho malé …', 'plotě', 'kotě', 'štěně', ['sobotě']),
  p('sova-slova', 'Na stromě sedí sova,\nnemluví, nezná …', 'sova', 'slova', 'písně', ['hlava']),
  p('kniha-stul', 'Ležela kniha na stole,\nKnut ji čte až ve …', 'stole', 'škole', 'třídě', ['pole']),
  p('narozeniny', 'Jiskra má dnes narozeniny,\ndostane dort a …', 'narozeniny', 'maliny', 'jahody', ['bažiny']),
  p('zajicek', 'Skáče, skáče zajíček,\nskáče jako …', 'zajíček', 'míček', 'klokan', ['rohlíček']),
  p('slepicka', 'Na dvorku je slepička,\nkape na ni …', 'slepička', 'kapička', 'déšť', ['lžička']),
  p('liska-tabor', 'Běží liška k Táboru,\nnese pytel …', 'Táboru', 'zázvoru', 'jablek', ['prostoru']),
  p('sala', 'Ve skříni je šála,\nLiv si s ní hned …', 'šála', 'hrála', 'tancovala', ['stála']),
  p('med', 'Kdo má nejradši med?\nMedvídek to ví …', 'med', 'hned', 'určitě', ['led']),
  p('sova-houka', 'Kdo to v noci houká?\nSova do tmy …', 'houká', 'kouká', 'hledí', ['fouká']),
  p('lodicka', 'Lodička pluje po vodě,\nKnut v ní sedí v …', 'vodě', 'pohodě', 'klidu', ['schodě']),
  p('kuzlatko', 'Hopsá, hopsá kůzlátko,\nje to malé …', 'kůzlátko', 'zvířátko', 'zvíře', ['sluchátko']),
  p('rybicka', 'Ve vodě plave rybička,\nzlatá jako …', 'rybička', 'hvězdička', 'zlato', ['lavička']),
  p('duha', 'Pršelo a teď je duha,\nbarevná jak nová …', 'duha', 'stuha', 'sukně', ['kytka']),
  p('lopata', 'Bjorn má v ruce lopatu,\nstaví sněhovou …', 'lopatu', 'chatu', 'horu', ['kouli']),
  p('tlapka', 'Kočka Micka, bílá tlapka,\nna čumáček padá …', 'tlapka', 'kapka', 'vločka', ['sníh']),
  p('psat', 'Malý drak se učí psát,\nkaždý den to zkouší …', 'psát', 'rád', 'znovu', ['drát']),
  p('pernik', 'Olaf peče perník,\npřiběhl k němu …', 'perník', 'koník', 'pejsek', ['rybník']),
  p('myska-siska', 'Na louce je myška,\nnad ní visí …', 'myška', 'šiška', 'jablko', ['tužka']),
];

function rhymeEntry(it: RhymeItem): Entry {
  return {
    key: slug(it.word),
    build: (rng) => ({
      prompt: `Co se rýmuje se slovem „${it.word}“?`,
      answer: choice(rng, it.rhyme, [...it.distractors]),
      hints: [
        'Vyslov každé slovo nahlas a poslouchej, jak zní na konci.',
        it.hint ?? `Hledej slovo, které končí stejně: -${it.end}.`,
      ],
      explanation: `Slova „${it.word}“ a „${it.rhyme}“ se rýmují – na konci znějí stejně.`,
    }),
  };
}

function poemEntry(po: Poem): Entry {
  const full = po.lines.replace('…', po.answer);
  return {
    key: po.key,
    build: (rng) => ({
      prompt: 'Doplň slovo, které se rýmuje a dává smysl.',
      speak: `Doplň slovo, které se rýmuje a dává smysl. ${po.lines.replace(/\n/g, ' ')}`,
      visual: { type: 'reading', title: 'Básnička', text: po.lines },
      answer: choice(rng, po.answer, [po.sense, ...po.others]),
      hints: [
        `Slovo se musí rýmovat se slovem „${po.pair}“.`,
        'Zkus každé slovo dosadit a přečíst básničku celou. Dává smysl?',
      ],
      explanation: `Správně je „${po.answer}“: rýmuje se se slovem „${po.pair}“ a dává smysl. Slovo „${po.sense}“ by smysl dávalo, ale nerýmuje se. Celá básnička: ${full.replace(/\n/g, ' / ')}${/[.!?]$/.test(full) ? '' : '.'}`,
    }),
  };
}

const levels: Level[] = [1, 2, 3];

export const pools: Pools = {
  1: RHYMES_L1.map(rhymeEntry),
  2: RHYMES_L2.map(rhymeEntry),
  3: POEMS.map(poemEntry),
};
assertUniqueKeys(ID, pools);

export const rymy: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Rýmy',
  description: 'Rozpoznává slova, která se rýmují, a doplňuje rýmy do básniček; rozvíjí sluchové rozlišování hlásek a cit pro jazyk.',
  levels,
  rvp: {
    1: ['ČJL-3-2-01', 'ČJL-3-3-03'],
    2: ['ČJL-3-2-01', 'ČJL-3-3-03'],
    3: ['ČJL-3-2-01', 'ČJL-3-3-03'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
