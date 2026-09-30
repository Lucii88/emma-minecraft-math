// Protiklady a slova podobného významu. L1–L2 protiklady, L3 slova souznačná,
// L4 slova mnohoznačná („Co znamená slovo … v této větě?“).

import { choice } from '../../core/czech';
import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.protiklady';

type Triple = [string, string, string];

/** [slovo, protiklad (nebo synonymum), tři distraktory]. Distraktory nejsou
 *  protiklady (u L3 synonyma) – často jde o slova podobného významu nebo
 *  z téže oblasti, aby bylo nutné přemýšlet. */
export const ANTONYMS_L1: [string, string, Triple][] = [
  ['velký', 'malý', ['vysoký', 'obrovský', 'silný']],
  ['horký', 'studený', ['teplý', 'suchý', 'tvrdý']],
  ['den', 'noc', ['ráno', 'týden', 'slunce']],
  ['nahoře', 'dole', ['vedle', 'vpředu', 'venku']],
  ['rychlý', 'pomalý', ['hbitý', 'silný', 'veselý']],
  ['veselý', 'smutný', ['hodný', 'rychlý', 'šťastný']],
  ['starý', 'mladý', ['velký', 'moudrý', 'šedivý']],
  ['dlouhý', 'krátký', ['široký', 'tenký', 'vysoký']],
  ['plný', 'prázdný', ['velký', 'těžký', 'čistý']],
  ['otevřít', 'zavřít', ['odemknout', 'otočit', 'zvednout']],
  ['světlo', 'tma', ['lampa', 'oheň', 'barva']],
  ['mokrý', 'suchý', ['studený', 'špinavý', 'měkký']],
  ['tvrdý', 'měkký', ['těžký', 'hladký', 'pevný']],
  ['těžký', 'lehký', ['velký', 'silný', 'tvrdý']],
  ['vysoký', 'nízký', ['úzký', 'tenký', 'široký']],
  ['hlasitě', 'potichu', ['rychle', 'hezky', 'vesele']],
  ['teplo', 'zima', ['horko', 'léto', 'sníh']],
  ['přijít', 'odejít', ['přiběhnout', 'sednout si', 'vejít']],
  ['smát se', 'plakat', ['mluvit', 'zpívat', 'usmívat se']],
  ['dobrý', 'špatný', ['hodný', 'krásný', 'veliký']],
  ['čistý', 'špinavý', ['mokrý', 'nový', 'bílý']],
  ['první', 'poslední', ['druhý', 'jediný', 'nejlepší']],
  ['začátek', 'konec', ['střed', 'start', 'pohádka']],
  ['zapnout', 'vypnout', ['zmáčknout', 'rozsvítit', 'opravit']],
  ['nový', 'starý', ['čistý', 'moderní', 'velký']],
  ['bílý', 'černý', ['šedý', 'modrý', 'červený']],
  ['levý', 'pravý', ['horní', 'přední', 'rovný']],
  ['hodně', 'málo', ['často', 'rychle', 'všude']],
  ['blízko', 'daleko', ['vedle', 'nahoře', 'venku']],
  ['vpředu', 'vzadu', ['vedle', 'nahoře', 'uprostřed']],
  ['hezký', 'ošklivý', ['milý', 'velký', 'veselý']],
  ['tlustý', 'tenký', ['velký', 'silný', 'kulatý']],
];

export const ANTONYMS_L2: [string, string, Triple][] = [
  ['odvážný', 'bojácný', ['silný', 'statečný', 'rychlý']],
  ['pravda', 'lež', ['odpověď', 'otázka', 'vtip']],
  ['vítěz', 'poražený', ['závodník', 'hráč', 'šampion']],
  ['radost', 'smutek', ['smích', 'štěstí', 'hra']],
  ['ztratit', 'najít', ['hledat', 'schovat', 'zapomenout']],
  ['zvednout', 'položit', ['nést', 'hodit', 'podat']],
  ['rozsvítit', 'zhasnout', ['zapnout', 'svítit', 'blikat']],
  ['přítel', 'nepřítel', ['kamarád', 'soused', 'bratr']],
  ['štědrý', 'lakomý', ['bohatý', 'hodný', 'veselý']],
  ['hlučný', 'tichý', ['hlasitý', 'rychlý', 'velký']],
  ['líný', 'pilný', ['unavený', 'pomalý', 'ospalý']],
  ['chytrý', 'hloupý', ['moudrý', 'rychlý', 'hodný']],
  ['bohatý', 'chudý', ['štědrý', 'šťastný', 'velký']],
  ['zdravý', 'nemocný', ['silný', 'unavený', 'veselý']],
  ['široký', 'úzký', ['dlouhý', 'velký', 'nízký']],
  ['hluboký', 'mělký', ['dlouhý', 'široký', 'tmavý']],
  ['ostrý', 'tupý', ['špičatý', 'tvrdý', 'rovný']],
  ['vyhrát', 'prohrát', ['hrát', 'soutěžit', 'závodit']],
  ['koupit', 'prodat', ['zaplatit', 'vybrat', 'vzít']],
  ['vždy', 'nikdy', ['často', 'někdy', 'hned']],
  ['všechno', 'nic', ['hodně', 'něco', 'celé']],
  ['rovný', 'křivý', ['hladký', 'dlouhý', 'pevný']],
  ['hladký', 'drsný', ['měkký', 'rovný', 'mokrý']],
  ['ranní', 'večerní', ['denní', 'polední', 'časný']],
  ['sever', 'jih', ['východ', 'západ', 'střed']],
  ['pomalu', 'rychle', ['potichu', 'opatrně', 'pozdě']],
  ['brzy', 'pozdě', ['rychle', 'dříve', 'hned']],
  ['nastoupit', 'vystoupit', ['sednout si', 'zastavit', 'jet']],
  ['přední', 'zadní', ['horní', 'boční', 'střední']],
  ['horní', 'dolní', ['přední', 'zadní', 'střední']],
  ['vnitřní', 'vnější', ['horní', 'dolní', 'hlavní']],
];

export const SYNONYMS_L3: [string, string, Triple][] = [
  ['rychle', 'hbitě', ['pomalu', 'hlasitě', 'často']],
  ['velký', 'obrovský', ['malý', 'silný', 'těžký']],
  ['malý', 'drobný', ['velký', 'krátký', 'slabý']],
  ['krásný', 'nádherný', ['ošklivý', 'velký', 'veselý']],
  ['smutný', 'zarmoucený', ['veselý', 'unavený', 'zlý']],
  ['mluvit', 'hovořit', ['mlčet', 'zpívat', 'psát']],
  ['jít', 'kráčet', ['stát', 'sedět', 'ležet']],
  ['dívat se', 'hledět', ['poslouchat', 'mluvit', 'spát']],
  ['hodný', 'laskavý', ['zlobivý', 'rychlý', 'silný']],
  ['chytrý', 'bystrý', ['hloupý', 'veselý', 'velký']],
  ['statečný', 'odvážný', ['bojácný', 'rychlý', 'slabý']],
  ['unavený', 'vyčerpaný', ['odpočatý', 'veselý', 'hladový']],
  ['dům', 'stavení', ['zahrada', 'ulice', 'střecha']],
  ['auto', 'automobil', ['kolo', 'vlak', 'silnice']],
  ['kamarád', 'přítel', ['nepřítel', 'soused', 'učitel']],
  ['doktor', 'lékař', ['nemocnice', 'pacient', 'lék']],
  ['hned', 'ihned', ['potom', 'pozdě', 'někdy']],
  ['pomalu', 'zvolna', ['rychle', 'potichu', 'často']],
  ['hlasitě', 'nahlas', ['potichu', 'rychle', 'vesele']],
  ['mokrý', 'promočený', ['suchý', 'studený', 'špinavý']],
  ['začátek', 'počátek', ['konec', 'střed', 'cíl']],
  ['konec', 'závěr', ['začátek', 'střed', 'cesta']],
  ['cesta', 'stezka', ['most', 'les', 'řeka']],
  ['dárek', 'dar', ['balík', 'oslava', 'přání']],
  ['skákat', 'poskakovat', ['chodit', 'sedět', 'plavat']],
  ['tichý', 'nehlučný', ['hlasitý', 'rychlý', 'malý']],
  ['ošklivý', 'škaredý', ['krásný', 'starý', 'velký']],
  ['ptát se', 'tázat se', ['odpovídat', 'smát se', 'spát']],
  ['vidět', 'spatřit', ['slyšet', 'čichat', 'zapomenout']],
  ['radost', 'potěšení', ['smutek', 'únava', 'zlost']],
  ['pěkný', 'hezký', ['ošklivý', 'starý', 'drahý']],
  ['obrovský', 'ohromný', ['malinký', 'dlouhý', 'těžký']],
  ['uklidit', 'poklidit', ['zašpinit', 'nakreslit', 'uvařit']],
  ['běžet', 'utíkat', ['stát', 'sedět', 'ležet']],
];

function antonym([word, ant, ds]: [string, string, Triple]): Entry {
  return {
    key: slug(word),
    build: (rng) => ({
      prompt: `Jaký je opak slova „${word}“?`,
      answer: choice(rng, ant, ds),
      hints: [
        'Opak je slovo s úplně obráceným významem – jako den a noc.',
        'Pozor: slovo s podobným významem opak není.',
      ],
      explanation: `Opakem slova ${word} je ${ant}.`,
    }),
  };
}

function synonym([word, syn, ds]: [string, string, Triple]): Entry {
  return {
    key: slug(word),
    build: (rng) => ({
      prompt: `Které slovo znamená skoro totéž jako „${word}“?`,
      answer: choice(rng, syn, ds),
      hints: [
        `Hledej slovo, které můžeš ve větě dát místo slova ${word}, aniž by se změnil význam.`,
        'Pozor, opak to není.',
      ],
      explanation: `Slova ${word} a ${syn} znamenají skoro totéž.`,
    }),
  };
}

/** Mnohoznačná slova: slovo, jeho významy s ukázkovou větou a případný
 *  nesmyslný význam navíc, aby byly aspoň tři možnosti. */
interface Poly {
  word: string;
  senses: { key: string; gloss: string; sentence: string }[];
  extra?: string;
}

export const POLYSEMY: Poly[] = [
  {
    word: 'koruna',
    senses: [
      { key: 'kral', gloss: 'ozdoba na hlavě krále nebo královny', sentence: 'Královna měla na hlavě zlatou korunu.' },
      { key: 'strom', gloss: 'horní část stromu', sentence: 'V koruně stromu sedí veverka.' },
      { key: 'penize', gloss: 'peníze', sentence: 'Rohlík stojí tři koruny.' },
    ],
  },
  {
    word: 'list',
    senses: [
      { key: 'strom', gloss: 'část rostliny', sentence: 'Ze stromu spadl žlutý list.' },
      { key: 'papir', gloss: 'kus papíru', sentence: 'Napiš to na čistý list papíru.' },
    ],
    extra: 'druh ryby',
  },
  {
    word: 'oko',
    senses: [
      { key: 'zrak', gloss: 'část těla, kterou vidíme', sentence: 'Knut na nás zamrkal jedním okem.' },
      { key: 'polevka', gloss: 'kapka tuku na polévce', sentence: 'Na polévce plave mastné oko.' },
      { key: 'sit', gloss: 'díra mezi provázky sítě', sentence: 'Síť má tak velká oka, že malé rybky proplavou.' },
    ],
  },
  {
    word: 'jazyk',
    senses: [
      { key: 'pusa', gloss: 'část těla v puse', sentence: 'Pes vyplázl jazyk.' },
      { key: 'rec', gloss: 'řeč, kterou lidé mluví', sentence: 'Sigrun umí mluvit dvěma jazyky.' },
      { key: 'bota', gloss: 'část boty pod tkaničkami', sentence: 'Jazyk boty se mi pod tkaničkami zkroutil.' },
    ],
  },
  {
    word: 'klíč',
    senses: [
      { key: 'dvere', gloss: 'věc na odemykání', sentence: 'Olaf ztratil klíč od domu.' },
      { key: 'noty', gloss: 'znak na začátku notové osnovy', sentence: 'Na začátku not je nakreslený houslový klíč.' },
      { key: 'sifra', gloss: 'návod, jak něco vyřešit', sentence: 'Frída našla klíč k tajné šifře.' },
    ],
  },
  {
    word: 'kohoutek',
    senses: [
      { key: 'voda', gloss: 'ventil, ze kterého teče voda', sentence: 'Zavři kohoutek, ať neteče voda.' },
      { key: 'ptak', gloss: 'malý kohout', sentence: 'Na dvorku kokrhá malý kohoutek.' },
    ],
    extra: 'kus nábytku',
  },
  {
    word: 'pero',
    senses: [
      { key: 'ptaci', gloss: 'ptačí pírko', sentence: 'Z polštáře vyletělo husí pero.' },
      { key: 'psaci', gloss: 'věc na psaní', sentence: 'Podepiš se perem.' },
    ],
    extra: 'kus papíru',
  },
  {
    word: 'zámek',
    senses: [
      { key: 'budova', gloss: 'velká stará budova, kde bydleli šlechtici', sentence: 'Na kopci stojí starý zámek.' },
      { key: 'dvere', gloss: 'věc na zamykání dveří', sentence: 'Klíč nejde v zámku otočit.' },
    ],
    extra: 'druh stromu',
  },
  {
    word: 'myš',
    senses: [
      { key: 'zvire', gloss: 'malé zvíře', sentence: 'Kočka honí myš.' },
      { key: 'pocitac', gloss: 'věc k ovládání počítače', sentence: 'Klikni myší na obrázek.' },
    ],
    extra: 'druh sýra',
  },
  {
    word: 'kolo',
    senses: [
      { key: 'jizdni', gloss: 'jízdní kolo', sentence: 'Knut jezdí do školy na kole.' },
      { key: 'auto', gloss: 'kulatá část auta, která se točí', sentence: 'U auta museli vyměnit přední kolo.' },
      { key: 'soutez', gloss: 'část soutěže', sentence: 'Ingrid postoupila do druhého kola soutěže.' },
    ],
  },
  {
    word: 'noha',
    senses: [
      { key: 'telo', gloss: 'část těla', sentence: 'Liv stojí jen na jedné noze.' },
      { key: 'stul', gloss: 'část nábytku, na které stojí', sentence: 'Stůl má jednu nohu kratší a kývá se.' },
    ],
    extra: 'druh boty',
  },
  {
    word: 'ucho',
    senses: [
      { key: 'telo', gloss: 'část hlavy, kterou slyšíme', sentence: 'Liv mi něco pošeptala do ucha.' },
      { key: 'hrnek', gloss: 'držadlo hrnku', sentence: 'Hrnek se drží za ucho.' },
    ],
    extra: 'druh čepice',
  },
  {
    word: 'křídlo',
    senses: [
      { key: 'drak', gloss: 'část těla ptáka nebo draka', sentence: 'Drak roztáhl jedno křídlo.' },
      { key: 'letadlo', gloss: 'část letadla', sentence: 'Z okénka letadla vidím celé křídlo.' },
      { key: 'klavir', gloss: 'velký klavír', sentence: 'V koncertním sále stojí černé křídlo.' },
      { key: 'budova', gloss: 'část budovy', sentence: 'Naše třída je v novém křídle školy.' },
    ],
  },
  {
    word: 'vlna',
    senses: [
      { key: 'voda', gloss: 'pohyb vody na hladině', sentence: 'Loďku zhoupla velká vlna.' },
      { key: 'ovce', gloss: 'chlupy ovcí na pletení', sentence: 'Babička plete svetr z teplé vlny.' },
    ],
    extra: 'druh chleba',
  },
  {
    word: 'měsíc',
    senses: [
      { key: 'teleso', gloss: 'těleso, které obíhá kolem planety', sentence: 'Kolem planety Jupiter obíhá mnoho měsíců.' },
      { key: 'rok', gloss: 'část roku', sentence: 'Prázdniny trvají dva měsíce.' },
    ],
    extra: 'den v týdnu',
  },
  {
    word: 'pokoj',
    senses: [
      { key: 'mistnost', gloss: 'místnost', sentence: 'Můj pokoj je v prvním patře.' },
      { key: 'klid', gloss: 'klid', sentence: 'Dej mi chvilku pokoj, přemýšlím.' },
    ],
    extra: 'dárek',
  },
  {
    word: 'hodina',
    senses: [
      { key: 'cas', gloss: 'šedesát minut', sentence: 'Cesta k babičce trvá jednu hodinu.' },
      { key: 'skola', gloss: 'vyučovací hodina ve škole', sentence: 'První hodinu máme češtinu.' },
    ],
    extra: 'hodinky na ruku',
  },
  {
    word: 'třída',
    senses: [
      { key: 'mistnost', gloss: 'místnost ve škole', sentence: 'Třída je vyzdobená obrázky.' },
      { key: 'zaci', gloss: 'žáci, kteří se učí spolu', sentence: 'Celá třída jela na výlet.' },
      { key: 'ulice', gloss: 'široká ulice', sentence: 'Pojedeme autobusem po hlavní třídě.' },
    ],
  },
  {
    word: 'houba',
    senses: [
      { key: 'les', gloss: 'to, co sbíráme v lese do košíku, třeba hřib', sentence: '{Našla|Našel} jsem v lese velkou houbu.' },
      { key: 'myti', gloss: 'věc na mytí a utírání', sentence: 'Tabuli smažeme mokrou houbou.' },
    ],
    extra: 'druh ryby',
  },
  {
    word: 'čočka',
    senses: [
      { key: 'jidlo', gloss: 'luštěnina k jídlu', sentence: 'Dnes je k obědu čočka s vajíčkem.' },
      { key: 'sklo', gloss: 'zakřivené sklo v lupě', sentence: 'Lupa má velkou čočku.' },
    ],
    extra: 'druh ptáka',
  },
  {
    word: 'zebra',
    senses: [
      { key: 'zvire', gloss: 'zvíře s pruhy', sentence: 'V zoo jsme viděli zebru.' },
      { key: 'prechod', gloss: 'přechod pro chodce', sentence: 'Přes silnici chodíme po zebře.' },
    ],
    extra: 'druh sýra',
  },
  {
    word: 'pas',
    senses: [
      { key: 'doklad', gloss: 'doklad na cesty do ciziny', sentence: 'Na letišti ukázal táta pas.' },
      { key: 'telo', gloss: 'místo, kde se tělo zužuje nad boky', sentence: 'Šaty mají v pase mašli.' },
    ],
    extra: 'druh psa',
  },
  {
    word: 'rameno',
    senses: [
      { key: 'telo', gloss: 'část těla', sentence: 'Papoušek sedí Liv na rameni.' },
      { key: 'reka', gloss: 'část řeky', sentence: 'Řeka se tu dělí na dvě ramena.' },
    ],
    extra: 'druh ptáka',
  },
  {
    word: 'hvězda',
    senses: [
      { key: 'nebe', gloss: 'svítící těleso na nebi', sentence: 'Polárka je hvězda, která ukazuje sever.' },
      { key: 'slavny', gloss: 'slavný člověk', sentence: 'Ta zpěvačka je hvězdou televize.' },
    ],
    extra: 'druh květiny',
  },
];

function polyEntries(p: Poly): Entry[] {
  return p.senses.map((s) => ({
    key: `${slug(p.word)}-${s.key}`,
    build: (rng) => ({
      prompt: `Co znamená slovo „${p.word}“ v této větě?`,
      visual: { type: 'big' as const, text: s.sentence },
      answer: choice(
        rng,
        s.gloss,
        [...p.senses.filter((o) => o !== s).map((o) => o.gloss), ...(p.extra ? [p.extra] : [])],
      ),
      hints: [
        'Přečti si celou větu. O čem se v ní mluví?',
        `Slovo ${p.word} může znamenat víc věcí. Který význam se hodí do této věty?`,
      ],
      explanation: `Ve větě „${s.sentence}“ znamená slovo ${p.word}: ${s.gloss}.`,
    }),
  }));
}

const levels: Level[] = [1, 2, 3, 4];

export const pools: Pools = {
  1: ANTONYMS_L1.map(antonym),
  2: ANTONYMS_L2.map(antonym),
  3: SYNONYMS_L3.map(synonym),
  4: POLYSEMY.flatMap(polyEntries),
};
assertUniqueKeys(ID, pools);

export const protiklady: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Protiklady a podobná slova',
  description: 'Hledá slova opačného a podobného významu a rozlišuje význam mnohoznačných slov podle věty.',
  levels,
  rvp: {
    1: ['ČJL-3-2-02'],
    2: ['ČJL-3-2-02'],
    3: ['ČJL-3-2-02'],
    4: ['ČJL-5-2-01'],
  },
  ability: 'slovni',
  testLike: 'protiklady',
  generate: makeGenerator(ID, levels, pools),
};
