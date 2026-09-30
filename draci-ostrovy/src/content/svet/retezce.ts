// Kdo čím se živí: býložravci, masožravci a všežravci, potravní řetězce,
// rovnováha v přírodě, společenstva lesa, rybníka a louky, rozkladači.
//
// O potravních vztazích píšeme jen „živí se“ a „je potravou“ – žádná drsná
// slovesa. Otázky „co by se stalo, kdyby…“ se ptají vždy na přímý důsledek
// v nakresleném řetězci.
//
// Vysvětlení se ukazuje i po správné odpovědi jako zajímavost (showFact):
// nejdřív kdo se čím živí, pak jeden detail o zvířeti ze zadání.

import { bankSkill, type Spec } from '../../core/bank';
import { capitalize } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard, Visual } from '../../core/types';
import { fixed, ord, q, slug } from './common';

const ID = 'svet.retezce';

type Strava = 'bylozravec' | 'masozravec' | 'vsezravec';
const STRAVA_OPTIONS = ['Býložravec', 'Masožravec', 'Všežravec'];
const STRAVA_INDEX: Record<Strava, number> = { bylozravec: 0, masozravec: 1, vsezravec: 2 };

/** Zvířata s jednoznačným zařazením (žádná liška, ježek, myš ani pes). */
export const STRAVA: [string, Strava, string][] = [
  ['kráva', 'bylozravec', 'Kráva se živí trávou a senem, je to býložravec. Za den spase desítky kilogramů trávy.'],
  ['koza', 'bylozravec', 'Koza se živí trávou, listím a větvičkami, je to býložravec. Pro chutné listí vyleze i na skálu nebo na nakloněný strom.'],
  ['ovce', 'bylozravec', 'Ovce se živí trávou, je to býložravec. Spásá ji až těsně u země.'],
  ['kůň', 'bylozravec', 'Kůň se živí trávou, senem a ovsem, je to býložravec. Na pastvě se pase i víc než půl dne.'],
  ['zajíc', 'bylozravec', 'Zajíc se živí trávou a bylinami a v zimě i kůrou, je to býložravec. Oči má po stranách hlavy, a tak vidí skoro dokola.'],
  ['srna', 'bylozravec', 'Srna se živí trávou, bylinami a pupeny keřů, je to býložravec. Vybírá si ty nejchutnější lístky a pupeny.'],
  ['bobr', 'bylozravec', 'Bobr se živí kůrou a větvičkami stromů a vodními rostlinami, je to býložravec. Přední zuby mu rostou celý život a o dřevo se obrušují.'],
  ['slon', 'bylozravec', 'Slon se živí trávou, listím a ovocem, je to býložravec. Za den spotřebuje i přes sto kilogramů rostlin.'],
  ['žirafa', 'bylozravec', 'Žirafa se živí listím z vysokých stromů, je to býložravec. Listí stahuje z větví jazykem dlouhým skoro půl metru.'],
  ['housenka', 'bylozravec', 'Housenka se živí listy rostlin, je to býložravec. Jí skoro pořád, a tak za pár týdnů mnohokrát vyroste.'],
  ['vlk', 'masozravec', 'Vlk se živí hlavně srnci, jeleny a divokými prasaty, je to masožravec. Vlci žijí v rodinných smečkách.'],
  ['rys', 'masozravec', 'Rys se živí hlavně srnami, je to masožravec. Na špičkách uší má černé štětičky chlupů.'],
  ['sova', 'masozravec', 'Sova se živí myšmi a jinými drobnými zvířaty, je to masožravec. Co nestráví, třeba chlupy, vyvrhne jako chuchvalec – vývržek.'],
  ['orel', 'masozravec', 'Orel se živí menšími zvířaty a rybami, je to masožravec. Z velké výšky uvidí i malého zajíce na louce.'],
  ['štika', 'masozravec', 'Štika se živí menšími rybami, je to masožravec. Dorůstá i přes metr.'],
  ['lev', 'masozravec', 'Lev se živí zebrami, antilopami a jinými zvířaty, je to masožravec. Lvi žijí ve smečkách a o potravu se starají hlavně lvice.'],
  ['tygr', 'masozravec', 'Tygr se živí jeleny, divokými prasaty a jinými zvířaty, je to masožravec. Je to největší kočkovitá šelma na světě.'],
  ['krokodýl', 'masozravec', 'Krokodýl se živí rybami a jinými zvířaty, je to masožravec. Bez potravy vydrží i několik měsíců.'],
  ['čáp', 'masozravec', 'Čáp se živí žábami, hmyzem, myšmi a rybkami, je to masožravec. Rád se prochází po čerstvě posečené louce.'],
  ['medvěd', 'vsezravec', 'Medvěd se živí lesními plody, kořínky, medem i masem, je to všežravec. Na podzim se vykrmí a zimu prospí v brlohu.'],
  ['divoké prase', 'vsezravec', 'Divoké prase se živí žaludy, kořínky, žížalami i myšmi, je to všežravec. Potravu vyrývá rypákem ze země.'],
  ['jezevec', 'vsezravec', 'Jezevec se živí žížalami, hmyzem, kořínky i lesními plody, je to všežravec. Jeho rodina bydlí ve stejné noře i desítky let.'],
  ['potkan', 'vsezravec', 'Potkan se živí skoro čímkoli – zrním, ovocem i zbytky masa, je to všežravec. Umí výborně plavat.'],
  ['vrána', 'vsezravec', 'Vrána se živí semínky, hmyzem, žížalami i zbytky jídla, je to všežravec. Vrány jsou velmi chytré a pamatují si i lidské tváře.'],
];

function cimSeZivi(rng: Rng): Spec {
  const [name, strava, explain] = rng.pick(STRAVA);
  return fixed(`strava-${slug(name)}`, `Je ${name} býložravec, masožravec, nebo všežravec?`, STRAVA_OPTIONS, STRAVA_INDEX[strava],
    ['Živí se rostlinami, jinými zvířaty, nebo obojím?'],
    explain);
}

// ---------------------------------------------------------------------------
// Potravní řetězce

interface Clen {
  /** 1. pád (na kartě řetězce). */
  n: string;
  /** 7. pád: „liška se živí zajíci“. */
  i: string;
  /** 4. pád: „potravou pro zajíce“. */
  a: string;
  /** 2. pád (mn. č. nebo látkové): „zajíců by přibylo“. */
  g: string;
  /** Živí se i jinou potravou než předchozím článkem: „liška se živí i zajíci“. */
  also?: boolean;
  /** Zajímavost o tomto zvířeti – do vysvětlení otázek, které se na ně ptají. */
  fakt?: string;
}

interface Retezec {
  key: string;
  chain: Clen[];
  /** „kdyby z řetězce zmizely všechny lišky“ – jen u řetězců, kde se na to
   *  dá ptát (viz moře). */
  gone?: string;
  /** Vysvětlení, co by se stalo bez posledního článku. */
  goneWhy?: string;
  /** Druhý článek je jasný býložravec. */
  herbivore?: boolean;
}

const c = (n: string, i: string, a: string, g: string, more: { also?: boolean; fakt?: string } = {}): Clen => ({ n, i, a, g, ...more });

/** „liška se živí i zajíci“ */
const ziviSe = (x: Clen, food: Clen) => `se živí ${x.also ? 'i ' : ''}${food.i}`;

/** Zajímavost o článku řetězce (chybějící je chyba v datech). */
function faktOf(x: Clen): string {
  if (!x.fakt) throw new Error(`článek řetězce ${x.n} nemá zajímavost`);
  return x.fakt;
}

export const RETEZCE: Retezec[] = [
  {
    key: 'louka', herbivore: true,
    chain: [
      c('Tráva', 'trávou', 'trávu', 'trávy'),
      c('Zajíc', 'zajíci', 'zajíce', 'zajíců', { fakt: 'Zajíc má oči po stranách hlavy, a tak vidí skoro dokola.' }),
      c('Liška', 'liškami', 'lišku', 'lišek', { also: true, fakt: 'Nejčastěji se ale liška živí myšmi a hraboši.' }),
    ],
    gone: 'zmizely všechny lišky',
    goneWhy: 'Lišky se živí i zajíci. Kdyby zmizely, zajíců by přibylo – a trávy by pak ubylo, protože by ji spásalo víc zajíců.',
  },
  {
    key: 'pole',
    chain: [
      c('Semínka', 'semínky', 'semínka', 'semínek'),
      c('Myš', 'myšmi', 'myš', 'myší'),
      c('Sova', 'sovami', 'sovu', 'sov', { fakt: 'Sova najde myš po sluchu i v úplné tmě.' }),
    ],
    gone: 'zmizely všechny sovy',
    goneWhy: 'Sovy se živí myšmi. Kdyby zmizely, myší by přibylo – a semínek by pak ubylo.',
  },
  {
    key: 'les', herbivore: true,
    chain: [
      c('Listy', 'listy', 'listy', 'listů'),
      c('Housenka', 'housenkami', 'housenku', 'housenek', { fakt: 'Housenka jí skoro pořád, a tak za pár týdnů mnohokrát vyroste.' }),
      c('Sýkora', 'sýkorami', 'sýkoru', 'sýkor', { fakt: 'Rodiče sýkor přinesou mláďatům za den i stovky housenek.' }),
      c('Krahujec', 'krahujci', 'krahujce', 'krahujců', { also: true, fakt: 'Krahujec je dravec velký asi jako holub a obratně proletí i mezi větvemi.' }),
    ],
    gone: 'zmizeli všichni krahujci',
    goneWhy: 'Krahujci se živí drobnými ptáky, třeba sýkorami. Kdyby zmizeli, sýkor by přibylo – a housenek by pak ubylo.',
  },
  {
    key: 'rybnik',
    chain: [
      c('Řasy', 'řasami', 'řasy', 'řas'),
      c('Perloočky', 'perloočkami', 'perloočky', 'perlooček', { fakt: 'Perloočky jsou drobní korýši, menší než zrnko rýže.' }),
      c('Plotice', 'ploticemi', 'plotici', 'plotic', { also: true, fakt: 'Plotici poznáš podle červených očí.' }),
      c('Štika', 'štikami', 'štiku', 'štik', { also: true, fakt: 'Štika dorůstá i přes metr.' }),
    ],
    gone: 'zmizely všechny štiky',
    goneWhy: 'Štiky se živí menšími rybami, třeba ploticemi. Kdyby zmizely, plotic by přibylo – a perlooček by pak ubylo.',
  },
  {
    // Dřív „tráva, kobylka, žába, užovka“: kobylky se ale živí hlavně jiným
    // hmyzem, takže „kobylka se živí trávou“ neplatí. Slimák se živí rostlinami,
    // ropucha i slimáky a užovka i ropuchami. Ne čáp: ten se živí mnoha
    // různými zvířaty, otázky „v tomto řetězci“ by neměly jedinou odpověď.
    key: 'tun',
    chain: [
      c('Rostliny', 'rostlinami', 'rostliny', 'rostlin'),
      c('Slimák', 'slimáky', 'slimáka', 'slimáků', { fakt: 'Slimák je plž jako hlemýžď, jen nemá ulitu.' }),
      c('Ropucha', 'ropuchami', 'ropuchu', 'ropuch', { also: true, fakt: 'Ropucha se na jaře vrací k rybníku, ve kterém se sama vylíhla.' }),
      c('Užovka', 'užovkami', 'užovku', 'užovek', { also: true, fakt: 'Užovku obojkovou poznáš podle dvou žlutých skvrn za hlavou.' }),
    ],
    gone: 'zmizely všechny užovky',
    goneWhy: 'Užovky se živí hlavně žábami a ropuchami. Kdyby zmizely, ropuch by přibylo – a slimáků by pak ubylo.',
  },
  {
    key: 'zahrada', herbivore: true,
    chain: [
      c('Rostliny', 'rostlinami', 'rostliny', 'rostlin'),
      c('Mšice', 'mšicemi', 'mšice', 'mšic', { fakt: 'Mravenci mšice hlídají, protože z nich olizují sladkou šťávu.' }),
      c('Beruška', 'beruškami', 'berušku', 'berušek', { fakt: 'Jedna beruška se za den nasytí desítkami mšic.' }),
    ],
    gone: 'zmizely všechny berušky',
    goneWhy: 'Berušky se živí mšicemi. Kdyby zmizely, mšic by přibylo – a rostlinám by se dařilo hůř.',
  },
  {
    key: 'hvozd', herbivore: true,
    chain: [
      c('Tráva', 'trávou', 'trávu', 'trávy'),
      c('Srna', 'srnami', 'srnu', 'srn', { fakt: 'Kromě trávy srna ráda mlsá i byliny, lístky a pupeny.' }),
      c('Rys', 'rysy', 'rysa', 'rysů', { fakt: 'Rys má na špičkách uší černé štětičky chlupů.' }),
    ],
    gone: 'zmizeli všichni rysové',
    goneWhy: 'Rysové se živí hlavně srnami. Kdyby zmizeli, srn by přibylo – a trávy a mladých stromků by pak ubylo.',
  },
  {
    key: 'puda',
    chain: [
      c('Spadané listí', 'spadaným listím', 'spadané listí', 'spadaného listí'),
      c('Žížala', 'žížalami', 'žížalu', 'žížal'),
      c('Krtek', 'krtky', 'krtka', 'krtků', { fakt: 'Krtek skoro nevidí, žížaly najde hmatem a čichem.' }),
    ],
    gone: 'zmizeli všichni krtci',
    goneWhy: 'Krtci se živí hlavně žížalami. Kdyby zmizeli, žížal by přibylo – a spadaného listí by pak ubylo.',
  },
  {
    // Bez otázky „co by se stalo, kdyby zmizely velryby“: když lidé velryby
    // vylovili, krilu kupodivu nepřibylo, ale ubylo – trus velryb totiž hnojí
    // řasy, kterými se kril živí. Jednoduchý řetězec by tu vedl ke špatné odpovědi.
    key: 'more',
    chain: [
      c('Řasy', 'řasami', 'řasy', 'řas'),
      c('Kril', 'krilem', 'kril', 'krilu'),
      c('Velryba', 'velrybami', 'velrybu', 'velryb', { fakt: 'Kril tvoří drobní korýši podobní krevetám a velká velryba ho za den spotřebuje i několik tun.' }),
    ],
  },
  {
    key: 'doubrava',
    chain: [
      c('Žaludy', 'žaludy', 'žaludy', 'žaludů'),
      c('Divoké prase', 'divokými prasaty', 'divoké prase', 'divokých prasat', { also: true }),
      c('Vlk', 'vlky', 'vlka', 'vlků', { also: true, fakt: 'Vlci se do Česka vrátili po víc než sto letech.' }),
    ],
    gone: 'zmizeli všichni vlci',
    goneWhy: 'Vlci se živí i divokými prasaty. Kdyby zmizeli, divokých prasat by přibylo – a žaludů by pak ubylo.',
  },
];

const byKey = (key: string): Retezec => {
  const r = RETEZCE.find((x) => x.key === key);
  if (!r) throw new Error(`neznámý řetězec ${key}`);
  return r;
};

/** Řetězec jako očíslovaný postup a jeho přečtení nahlas. */
function chainVisual(r: Retezec): { visual: Visual; said: string } {
  return {
    visual: { type: 'steps', title: 'Kdo je čí potravou', steps: r.chain.map((x) => x.n) },
    said: `Potravní řetězec: ${r.chain.map((x) => x.n.toLocaleLowerCase('cs')).join(', ')}.`,
  };
}

/** Věta „Zajíc se živí trávou, liška se živí i zajíci.“ */
function kdoCimSeZivi(r: Retezec): string {
  const parts = r.chain.slice(1).map((x, k) => {
    const who = k === 0 ? x.n : x.n.toLocaleLowerCase('cs');
    return `${who} ${ziviSe(x, r.chain[k])}`;
  });
  return `${parts.join(', ')}.`;
}

/** Seřazení řetězce od rostliny (zajímavost o posledním článku). */
function seradRetezec(keys: string[]) {
  return (rng: Rng): Spec => {
    const r = byKey(rng.pick(keys));
    return ord(`rada-${r.key}`, 'Seřaď potravní řetězec. Začni rostlinou.', r.chain.map((x) => x.n),
      ['Najdi v řetězci rostlinu nebo její část.', 'Kdo se živí tím, co je před ním?'],
      `${kdoCimSeZivi(r)} ${faktOf(r.chain[r.chain.length - 1])}`);
  };
}

/** „Kdo je v tomto řetězci býložravec?“ */
function kdoJeBylozravec(keys: string[]) {
  return (rng: Rng): Spec => {
    const r = byKey(rng.pick(keys));
    const { visual, said } = chainVisual(r);
    const prompt = 'Kdo je v tomto řetězci býložravec?';
    return q(`bylozravec-${r.key}`, prompt, r.chain[1].n, r.chain.filter((_, i) => i !== 1).map((x) => x.n),
      ['Býložravec se živí rostlinami.', 'Kdo je v řetězci hned za rostlinou?'],
      `${r.chain[1].n} ${ziviSe(r.chain[1], r.chain[0])}, a tak je to býložravec. ${faktOf(r.chain[1])}`,
      { visual, speak: `${said} ${prompt}` });
  };
}

/** „Kdo je v tomto řetězci potravou pro X?“ (jen u řetězců se čtyřmi články). */
function potravouPro(keys: string[]) {
  return (rng: Rng): Spec => {
    const r = byKey(rng.pick(keys));
    const i = rng.int(1, r.chain.length - 1);
    const x = r.chain[i];
    const { visual, said } = chainVisual(r);
    const prompt = `Kdo je v tomto řetězci potravou pro ${x.a}?`;
    return q(`potrava-${r.key}-${slug(x.n)}`, prompt, r.chain[i - 1].n, r.chain.filter((_, j) => j !== i && j !== i - 1).map((y) => y.n),
      ['V řetězci se každý živí tím, co je hned před ním.'],
      `${x.n} ${ziviSe(x, r.chain[i - 1])}. ${faktOf(x)}`,
      { visual, speak: `${said} ${prompt}` });
  };
}

/** „Co by se nejspíš stalo, kdyby z tohoto řetězce zmizel poslední článek?“ */
function zmiziPosledni(keys: string[]) {
  return (rng: Rng): Spec => {
    const r = byKey(rng.pick(keys));
    if (!r.gone || !r.goneWhy) throw new Error(`řetězec ${r.key} nemá otázku „co by se stalo“`);
    const n = r.chain.length;
    const prey = r.chain[n - 2];
    const below = r.chain[n - 3];
    const { visual, said } = chainVisual(r);
    const prompt = `Co by se nejspíš stalo, kdyby z tohoto řetězce ${r.gone}?`;
    return q(`zmizi-${r.key}`, prompt, `${capitalize(prey.g)} by přibylo`,
      [`${capitalize(prey.g)} by ubylo`, `${capitalize(below.g)} by přibylo`, 'Nic by se nezměnilo'],
      ['Čím se živí poslední článek řetězce?', 'Když už to nebude nikomu potravou, přibude toho, nebo ubude?'],
      r.goneWhy,
      { visual, speak: `${said} ${prompt}` });
  };
}

/** Když zmizí třetí článek čtyřčlenného řetězce (L5). */
const PROSTREDNI: Record<string, { gone: string; top: string; why: string }> = {
  les: {
    gone: 'zmizely všechny sýkory',
    top: 'Krahujci by měli víc potravy',
    why: 'Sýkory se živí housenkami. Bez sýkor by housenek přibylo a okusovaly by víc listů. Krahujcům by naopak potrava ubyla.',
  },
  rybnik: {
    gone: 'zmizely všechny plotice',
    top: 'Štiky by měly víc potravy',
    why: 'Plotice se živí perloočkami. Bez plotic by perlooček přibylo a spotřebovaly by víc řas. Štikám by naopak potrava ubyla.',
  },
  tun: {
    gone: 'zmizely všechny ropuchy',
    top: 'Užovky by měly víc potravy',
    why: 'Ropuchy se živí i slimáky. Bez ropuch by slimáků přibylo a okusovali by víc rostlin. Užovkám by naopak potrava ubyla.',
  },
};

function zmiziProstredni(rng: Rng): Spec {
  const key = rng.pick(Object.keys(PROSTREDNI));
  const r = byKey(key);
  const p = PROSTREDNI[key];
  const { visual, said } = chainVisual(r);
  const prompt = `Co by se nejspíš stalo, kdyby z tohoto řetězce ${p.gone}?`;
  return q(`prostredni-${r.key}`, prompt, `${capitalize(r.chain[1].g)} by přibylo`,
    [`${capitalize(r.chain[1].g)} by ubylo`, `${capitalize(r.chain[0].g)} by přibylo`, p.top],
    ['Čím se živilo to, co zmizelo?', 'Když už to nebude nikomu potravou, přibude toho, nebo ubude?'],
    p.why,
    { visual, speak: `${said} ${prompt}` });
}

// ---------------------------------------------------------------------------
// L2 – býložravci, masožravci, všežravci; čím se kdo živí

const L2: Spec[] = [
  q('bylozravec', 'Kdo z nich je býložravec?', 'Kráva',
    ['Vlk', 'Sova', 'Rys', 'Štika'],
    ['Býložravec se živí jen rostlinami.'],
    'Kráva se živí trávou a senem, je to býložravec. Vlk, sova, rys i štika se živí jinými zvířaty.'),
  q('masozravec', 'Kdo z nich je masožravec?', 'Vlk',
    ['Kráva', 'Zajíc', 'Koza', 'Srna'],
    ['Masožravec se živí jinými zvířaty.'],
    'Vlk se živí hlavně srnci, jeleny a divokými prasaty – je to masožravec. Ostatní jsou býložravci.'),
  q('vsezravec', 'Kdo z nich je všežravec?', 'Medvěd',
    ['Kráva', 'Rys', 'Zajíc', 'Srna'],
    ['Všežravec se živí rostlinami i živočichy.'],
    'Medvěd se živí lesními plody, kořínky, medem i masem – je to všežravec.'),
  q('co-bylozravec', 'Čím se živí býložravec?', 'Rostlinami',
    ['Jinými zvířaty', 'Rostlinami i zvířaty', 'Jen hmyzem'],
    ['Napoví ti první část slova: býlí.'],
    'Býložravec se živí rostlinami – trávou, listím, plody nebo kůrou. Býlí je staré slovo pro byliny.'),
  q('co-vsezravec', 'Čím se živí všežravec?', 'Rostlinami i živočichy',
    ['Jen rostlinami', 'Jen masem', 'Jen hmyzem'],
    ['Napoví ti první část slova: vše.'],
    'Všežravec se živí rostlinami i živočichy. Takový je třeba medvěd, divoké prase nebo člověk.'),
  q('clovek', 'Kam patří člověk podle toho, čím se může živit?', 'Mezi všežravce',
    ['Mezi býložravce', 'Mezi masožravce', 'Mezi hmyzožravce'],
    ['Co všechno lidé jedí?'],
    'Lidé umějí jíst rostliny i maso, a proto patří mezi všežravce.'),
  q('zajic-potrava', 'Čím se živí zajíc?', 'Trávou a bylinami',
    ['Myšmi', 'Rybami', 'Hmyzem'],
    ['Zajíc je býložravec.'],
    'Zajíc se živí trávou a bylinami, v zimě i kůrou a pupeny.'),
  q('sova-potrava', 'Čím se živí sova?', 'Myšmi a jinými drobnými zvířaty',
    ['Trávou', 'Semínky a ovocem', 'Listím'],
    ['Sova je masožravec.'],
    'Sova se živí hlavně myšmi a hraboši. V noci je najde díky skvělému sluchu.'),
  q('vcela-potrava', 'Čím se živí včely?', 'Nektarem a pylem',
    ['Listím', 'Hmyzem', 'Dřevem'],
    ['Co včely sbírají v květech?'],
    'Včely se živí nektarem a pylem z květů. Z nektaru vyrábějí med.'),
  q('housenka-potrava', 'Čím se živí housenka?', 'Listy rostlin',
    ['Mravenci', 'Mlékem', 'Semínky z krmítka'],
    ['Housenky najdeš na listech.'],
    'Housenky se živí listy. Proto bývají v listech okousané díry.'),
  q('zacatek', 'Co bývá na začátku potravního řetězce?', 'Rostlina',
    ['Masožravec', 'Všežravec', 'Dravý pták'],
    ['Kdo si umí potravu vyrobit sám?'],
    'Na začátku řetězce je rostlina, protože si potravu vyrábí sama pomocí slunečního světla. Živočichové se živí rostlinami nebo jinými živočichy.'),
  q('sykora-potrava', 'Čím se živí sýkory?', 'Hmyzem a semínky',
    ['Trávou', 'Rybami', 'Listím'],
    ['V létě je všude spousta hmyzu, v zimě jsou na krmítku semínka.'],
    'Sýkory se v létě živí hlavně hmyzem a housenkami, v zimě semínky. Proto rády chodí na krmítko.'),
  q('datel', 'Čím se živí datel?', 'Hmyzem schovaným ve dřevě',
    ['Listím', 'Rybami', 'Trávou'],
    ['Proč datel ťuká do kmene?'],
    'Datel vyťukává do stromů díry a dlouhým jazykem vytahuje larvy hmyzu, které žijí ve dřevě.'),
  q('beruska-potrava', 'Čím se živí beruška?', 'Mšicemi',
    ['Listy', 'Dřevem', 'Semínky'],
    ['Beruška je malý masožravec.'],
    'Beruška se živí mšicemi a za den jich sní desítky. Proto ji mají zahradníci rádi.'),
  q('zuby-bylozravec', 'Jaké zuby mají býložravci, třeba kráva?', 'Široké ploché zuby na žvýkání',
    ['Dlouhé ostré tesáky', 'Žádné zuby', 'Jen jeden zub'],
    ['Tráva se musí pořádně rozžvýkat.'],
    'Býložravci mají široké ploché stoličky, kterými rozmělní trávu. Masožravci mají ostré tesáky.'),
  q('kdo-trava', 'Kdo z nich se živí trávou?', 'Ovce',
    ['Rys', 'Sova', 'Štika'],
    ['Hledej zvíře, které se pase.'],
    'Ovce se pase na louce a živí se trávou. Rys, sova a štika se živí jinými zvířaty.'),
  q('kdo-mysi', 'Kdo z nich se živí myšmi?', 'Sova',
    ['Kráva', 'Zajíc', 'Ovce'],
    ['Hledej zvíře, které je v noci vzhůru a dobře slyší.'],
    'Sova se živí myšmi a jinými drobnými zvířaty. Kráva, zajíc a ovce se živí rostlinami.'),
  q('krtek-potrava', 'Čím se živí krtek?', 'Žížalami a larvami hmyzu',
    ['Kořínky a mrkví', 'Trávou', 'Semínky'],
    ['Krtek žije pod zemí. Kdo tam žije s ním?'],
    'Krtek se živí žížalami a larvami hmyzu, rostliny nejí. Mrkev na záhonu jen někdy podryje, když hrabe chodbičky.'),
  q('veverka-potrava', 'Čím se živí hlavně veverka?', 'Oříšky a semínky ze šišek',
    ['Rybami', 'Myšmi', 'Senem'],
    ['Co si veverka schovává na zimu?'],
    'Veverka se živí hlavně oříšky, semeny ze šišek, bukvicemi a žaludy.'),
];

// ---------------------------------------------------------------------------
// L3 – řetězce, rovnováha, užitečná zvířata

const L3: Spec[] = [
  q('bez-vcel', 'Kdyby zmizely včely a čmeláci, čeho by bylo méně?', 'Ovoce',
    ['Sněhu', 'Kamenů', 'Dešťových kapek'],
    ['Kdo přenáší pyl z květu na květ?'],
    'Včely a čmeláci opylují květy. Bez nich by z mnoha květů nevyrostly plody – bylo by méně jablek, třešní i jahod.'),
  q('hodne-zajicu', 'Na louce je najednou moc zajíců. Co se stane s trávou?', 'Bude jí ubývat',
    ['Bude jí přibývat', 'Zmodrá', 'Nic se nestane'],
    ['Čím se zajíci živí?'],
    'Hodně zajíců spase hodně trávy, a tak jí bude ubývat. Pak ale zajíci nebudou mít dost potravy a zase jich ubude.'),
  q('berusky-zahrada', 'Proč zahradníci mají rádi berušky?', 'Berušky se živí mšicemi',
    ['Berušky kypří hlínu', 'Berušky dávají med', 'Berušky odhánějí ptáky'],
    ['Kdo škodí růžím a ovocným stromům?'],
    'Mšice sají šťávu z rostlin a škodí jim. Berušky se mšicemi živí, a tak zahradě pomáhají.'),
  q('zizaly', 'Proč jsou žížaly v zahradě užitečné?', 'Kypří půdu a mění listí v hlínu',
    ['Opylují květy', 'Dávají med', 'Odhánějí krtky'],
    ['Co dělají žížaly pod zemí?'],
    'Žížaly se živí spadaným listím a hlínou. Svými chodbičkami půdu kypří a jejich trus je výborné hnojivo.'),
  q('ptaci-budky', 'Proč lidé věší do sadu budky pro sýkory?', 'Sýkory se živí housenkami ze stromů',
    ['Sýkory opylují květy', 'Sýkory hlídají sad v noci', 'Sýkory dávají vejce k jídlu'],
    ['Čím sýkory krmí svá mláďata?'],
    'Sýkory krmí mláďata spoustou housenek. Tím chrání ovocné stromy, a tak jim lidé rádi dají budku.'),
  q('zuby-masozravec', 'Jaké zuby mají masožravci, třeba vlk?', 'Dlouhé ostré tesáky',
    ['Široké ploché zuby', 'Žádné zuby', 'Zobák'],
    ['Porovnej zuby psa a krávy.'],
    'Masožravci mají ostré tesáky a zuby jako nůžky. Býložravci mají široké ploché zuby na žvýkání.'),
  q('liska-sit', 'Liška se živí myšmi, hmyzem i lesními plody. Co z toho plyne?', 'Patří do mnoha řetězců',
    ['Patří jen do jednoho řetězce', 'Je býložravec', 'Nikdo ji nepotřebuje'],
    ['Kolik různých druhů potravy liška má?'],
    'Liška se živí různou potravou, a tak je součástí mnoha potravních řetězců. Když jedna potrava chybí, najde si jinou.'),
  q('krmelec', 'Proč myslivci v zimě dávají do krmelce seno?', 'Pod sněhem je málo potravy',
    ['Aby se zvířata naučila jíst seno', 'Aby zvířata v zimě spala', 'Aby zvířata nechodila k lesu'],
    ['Co srny v zimě najdou pod sněhem?'],
    'Pod sněhem je tráva schovaná a srny i jeleni těžko hledají potravu. Seno v krmelci jim pomůže přečkat zimu.'),
  q('cap-kobylky', 'Proč je na louce mnohem víc kobylek než čápů?', 'Jeden čáp potřebuje hodně potravy',
    ['Čápi jsou líní', 'Kobylky jsou chytřejší', 'Čápům se nelíbí louka'],
    ['Kolik drobných zvířat musí čáp za den najít, aby se nasytil?'],
    'Čáp se musí každý den nasytit spoustou drobných zvířat. Proto musí být kobylek, žab a myší mnohem víc než čápů.'),
  q('vlastovka-hmyz', 'Kdo z nich se živí hlavně hmyzem?', 'Vlaštovka',
    ['Kráva', 'Zajíc', 'Veverka'],
    ['Hledej ptáka, který se živí za letu.'],
    'Vlaštovka se živí hmyzem, který létá ve vzduchu. Kráva a zajíc jsou býložravci a veverka se živí hlavně semeny a oříšky.'),
  q('jezek-potrava', 'Čím se živí ježek?', 'Hmyzem, žížalami a slimáky',
    ['Jablky, která nosí na bodlinách', 'Trávou', 'Kůrou stromů'],
    ['Ježek chodí v noci po zahradě a hledá drobné živočichy.'],
    'Ježek se živí hlavně hmyzem, žížalami a slimáky. Jablka na bodlinách jsou z obrázků a pohádek – ovoce jí jen málokdy.'),
  q('kos-zizala', 'Kos na trávníku vytáhl ze země žížalu. Kdo je tu čí potravou?', 'Žížala je potravou kosa',
    ['Kos je potravou žížaly', 'Tráva je potravou kosa', 'Nikdo nikoho'],
    ['Kdo se tu čím živí?'],
    'Kos se živí žížalami, takže žížala je potravou kosa.'),
  q('pavouk-sit', 'Proč pavouk plete síť?', 'Uvíznou v ní mouchy, kterými se živí',
    ['Aby v ní spal', 'Aby se v ní houpal', 'Aby zachytil déšť'],
    ['Čím se pavouk živí?'],
    'Do lepkavé sítě uvíznou mouchy a komáři. Pavouk se jimi živí, a tak zároveň hlídá, aby jich nebylo moc.'),
  q('vcely-kvety', 'Jak si pomáhají včely a květy?', 'Včela dostane nektar a květ je opylen',
    ['Květ dává včele úkryt na zimu', 'Včela květy zalévá', 'Nijak, včely květům škodí'],
    ['Co včela v květu najde a co z něj odnese?'],
    'Včela se v květu nasytí nektarem a na chloupcích přitom odnese pyl na další květ. Obě strany z toho mají užitek.'),
];

// ---------------------------------------------------------------------------
// L4 – společenstva lesa, rybníka a louky, rovnováha

const L4: Spec[] = [
  q('rybnik-dvojice', 'Která dvojice žije v rybníce?', 'Kapr a leknín',
    ['Srnec a kapradí', 'Krtek a pampeliška', 'Veverka a smrk'],
    ['Hledej živočicha a rostlinu, kteří potřebují vodu.'],
    'Kapr plave ve vodě a leknín v ní roste. Srnec a kapradí patří do lesa, krtek a pampeliška na louku, veverka a smrk do lesa.'),
  q('les-dvojice', 'Která dvojice patří do lesa?', 'Veverka a smrk',
    ['Kapr a rákos', 'Čáp a leknín', 'Pstruh a orobinec'],
    ['Hledej zvíře, které šplhá po stromech.'],
    'Veverka žije v korunách stromů a živí se i semeny ze smrkových šišek. Ostatní dvojice patří k vodě.'),
  q('louka-dvojice', 'Která dvojice patří na louku?', 'Kobylka a jetel',
    ['Kapr a leknín', 'Datel a smrk', 'Štika a rákos'],
    ['Hledej hmyz, který skáče v trávě.'],
    'Kobylka skáče v trávě a jetel kvete na louce. Kapr, leknín, štika a rákos patří k vodě, datel a smrk do lesa.'),
  ord('patra-lesa', 'Seřaď patra lesa od země nahoru.', ['Mechové patro', 'Bylinné patro', 'Keřové patro', 'Stromové patro'],
    ['Co roste úplně při zemi?'],
    'Les má patra: u země mechy, nad nimi byliny, pak keře a nahoře koruny stromů. V každém patře žijí jiní živočichové.'),
  q('rakos', 'Která rostlina roste na břehu rybníka?', 'Rákos',
    ['Smrk', 'Borůvka', 'Vřes'],
    ['Hledej rostlinu, která má ráda mokro.'],
    'Rákos roste na mokrých březích rybníků. V rákosí hnízdí ptáci a schovávají se tam ryby.'),
  q('rovnovaha', 'Co znamená rovnováha v přírodě?', 'Žádného druhu není příliš mnoho ani málo',
    ['V přírodě se nic nemění', 'Všech zvířat je stejně', 'Rostliny i zvířata váží stejně'],
    ['Co se stane, když jeden druh zmizí?'],
    'Rovnováha znamená, že se počty rostlin a živočichů drží v mezích. Když jeden druh zmizí nebo se přemnoží, změní se i ostatní.'),
  q('vlci-navrat', 'Do některých českých lesů se vrátili vlci. Kterých zvířat tam nejspíš ubude?', 'Srnců a jelenů',
    ['Ryb v rybnících', 'Žížal', 'Sov'],
    ['Čím se vlci živí?'],
    'Vlci se živí hlavně srnci, jeleny a divokými prasaty. Těch je v našich lesích hodně a okusují mladé stromky.'),
  q('spolecenstvo', 'Co je společenstvo?', 'Organismy žijící spolu na jednom místě',
    ['Jedno zvíře a jeho mládě', 'Skupina stejných kamenů', 'Seznam zvířat v zoo'],
    ['Vzpomeň si na les nebo rybník.'],
    'Společenstvo tvoří rostliny, živočichové a houby, kteří žijí spolu na jednom místě, třeba v lese nebo v rybníce, a potřebují se navzájem.'),
  q('smrkovy-les', 'Proč v hustém smrkovém lese roste málo bylin?', 'Je tam málo světla',
    ['Je tam moc vody', 'Byliny tam nikdo nezasadil', 'Smrky byliny odhánějí'],
    ['Podívej se, jak husté jsou koruny smrků.'],
    'Husté smrky nepustí k zemi skoro žádné světlo. Bylinám proto chybí energie na růst.'),
  q('sasanky', 'Proč v listnatém lese kvetou sasanky brzy na jaře?', 'Stromy ještě nemají listy',
    ['V lese je tehdy nejtepleji', 'Sasanky nesnášejí vodu', 'Včely létají jen v březnu'],
    ['Kdy se dostane nejvíc světla až k zemi?'],
    'Brzy na jaře ještě stromy nemají listy a slunce svítí až na zem. Sasanky rychle vykvetou, než koruny zhoustnou.'),
  q('mravenci', 'Jak pomáhají mravenci lesu?', 'Roznášejí semena a uklízejí',
    ['Opylují stromy', 'Vyrábějí kyslík', 'Zalévají mech'],
    ['Co všechno mravenci nosí do mraveniště?'],
    'Mravenci roznášejí semena některých rostlin a uklízejí les od zbytků. Lesní mravenci jsou u nás chránění, a tak mraveniště nerozhrabáváme.'),
  q('vyrobci', 'Jak se v řetězci říká rostlinám?', 'Výrobci',
    ['Spotřebitelé', 'Rozkladači', 'Opylovači'],
    ['Rostliny si potravu samy vyrábějí.'],
    'Rostliny jsou výrobci – pomocí světla si samy vyrábějí potravu. Živočichové jsou spotřebitelé a houby s bakteriemi rozkladači.'),
  q('rostliny-prvni', 'Proč jsou na začátku každého řetězce rostliny?', 'Umějí si samy vyrobit potravu',
    ['Jsou největší', 'Jsou nejstarší', 'Nikdo se jimi neživí'],
    ['Čím se živí první živočich v řetězci?'],
    'Rostliny si umějí samy vyrobit potravu z vody a vzduchu pomocí světla. Všichni ostatní jsou na nich závislí.'),
  q('vodni-rostliny', 'Proč jsou v rybníce důležité vodní rostliny?', 'Vyrábějí kyslík pro ryby',
    ['Ryby na nich spí', 'Barví vodu do zelena', 'Hřejí vodu'],
    ['Co ryby dýchají?'],
    'Vodní rostliny a řasy vyrábějí na světle kyslík, který ryby dýchají žábrami. Jsou také potravou a úkrytem.'),
  q('dutiny', 'Proč lesníci nechávají v lese i staré duté stromy?', 'Bydlí v nich sovy, netopýři a brouci',
    ['Aby les vypadal staře', 'Aby se neztratila cesta', 'Protože je nikdo nenašel'],
    ['Kdo si v dutině udělá domov?'],
    'Staré stromy s dutinami jsou domovem sov, netopýrů, datlů i vzácných brouků. Bez nich by v lese chyběli.'),
];

// ---------------------------------------------------------------------------
// L5 – rozkladači, potravní síť a pyramida, energie ze Slunce

const L5: Spec[] = [
  q('rozkladaci', 'Kdo v lese rozkládá spadané listí?', 'Houby, bakterie a žížaly',
    ['Srnci a jeleni', 'Sovy a káňata', 'Veverky a sojky'],
    ['Kdo se živí spadaným listím a starým dřevem?'],
    'Houby, bakterie, žížaly a další drobní živočichové rozkládají listí a dřevo na hlínu. Říká se jim rozkladači.'),
  q('bez-rozkladacu', 'Co by se stalo, kdyby v lese nebyli rozkladači?', 'Hromadilo by se listí a chyběla hlína',
    ['Les by rostl rychleji', 'Nic by se nezměnilo', 'Listí by samo odletělo'],
    ['Kdo mění spadané listí v hlínu?'],
    'Bez rozkladačů by listí a staré dřevo zůstávaly ležet. Nevznikala by nová hlína a rostlinám by chyběly živiny.'),
  q('pyramida', 'Proč je v řetězci na každém dalším místě méně zvířat?', 'Každý potřebuje hodně potravy',
    ['Větší zvířata jsou líná', 'Větší zvířata spí déle', 'Nahoře je méně místa'],
    ['Kolik myší potřebuje jedna sova za rok?'],
    'Jedna sova se za rok nasytí stovkami myší a myši zase spoustou semínek. Proto je na každém dalším místě řetězce méně jedinců.'),
  q('energie-slunce', 'Odkud pochází energie v každém potravním řetězci?', 'Ze Slunce',
    ['Z masa', 'Z vody', 'Z hlíny'],
    ['Co potřebují rostliny, aby vyrobily potravu?'],
    'Rostliny zachytí energii slunečního světla a uloží ji do potravy. Z nich ji pak získávají všichni další v řetězci.'),
  q('sit', 'Proč se mluví o potravní síti, a ne jen o řetězci?', 'Většina zvířat se živí různou potravou',
    ['Pavouci spojují zvířata sítí', 'Všechna zvířata se živí stejně', 'Řetězy jsou z kovu'],
    ['Čím vším se živí třeba liška nebo medvěd?'],
    'Většina zvířat se živí více druhy potravy a sama je potravou pro různé další. Řetězce se proto propojují do sítě.'),
  q('spotrebitele', 'Jak se v řetězci říká živočichům?', 'Spotřebitelé',
    ['Výrobci', 'Rozkladači', 'Opylovači'],
    ['Potravu si nevyrobí, musí ji spotřebovat.'],
    'Živočichové jsou spotřebitelé – potravu si nevyrobí, a tak se živí rostlinami nebo jinými živočichy.'),
  ord('kolobeh-listu', 'Seřaď, co se děje s listem.',
    ['List roste na stromě', 'Na podzim spadne', 'Rozloží ho houby a žížaly', 'Vznikne z něj hlína', 'Kořeny z hlíny berou živiny'],
    ['Kdy list opadá?', 'Kdo mění listí v hlínu?'],
    'List roste, na podzim spadne, rozkladači ho promění v hlínu a z ní pak kořeny stromů berou živiny. Koloběh se uzavře.'),
  q('hlina-k-cemu', 'K čemu je rostlinám hlína z rozložených listů?', 'Obsahuje živiny pro růst',
    ['Je v ní voda z moře', 'Chrání je před hmyzem', 'Nic jim nedává'],
    ['Proč zahradníci dávají na záhony kompost?'],
    'Rozložené listí obsahuje živiny, které rostliny potřebují k růstu. Proto zahradníci dávají na záhony kompost.'),
  q('premnozene-srny', 'V lese se přemnožily srny a okusují mladé stromky. Co může rovnováhu vrátit?', 'Návrat rysů nebo vlků',
    ['Víc krmelců se senem', 'Zákaz chodit do lesa', 'Víc hub v lese'],
    ['Kdo se srnami živí?'],
    'Rysové a vlci se živí srnami. Když se vrátí, srn ubude a mladé stromky mohou vyrůst. Pomáhají i myslivci.'),
  q('opylovaci', 'Kdyby zmizeli opylovači, koho by se to dotklo?', 'Rostlin i zvířat, která se živí plody',
    ['Jen včelařů', 'Jen včel', 'Nikoho'],
    ['Kdo potřebuje plody a semena?'],
    'Bez opylovačů by mnoho rostlin nemělo plody ani semena. Chyběla by potrava ptákům, savcům i lidem a méně by bylo i nových rostlin.'),
  q('stiky', 'Rybář vypustil do malého rybníka moc štik. Co se nejspíš stane?', 'Menších ryb ubude, štikám dojde potrava',
    ['Menších ryb přibude', 'Štiky se začnou živit řasami', 'Nic se nezmění'],
    ['Čím se štiky živí a kolik té potravy v rybníce je?'],
    'Štiky se živí menšími rybami. Když je štik moc, menších ryb rychle ubude a štikám pak začne potrava chybět.'),
  q('komari', 'Proč by bylo špatné, kdyby zmizeli všichni komáři?', 'Jsou potravou ptáků, netopýrů a ryb',
    ['Komáři vyrábějí med', 'Komáři hlídají rybník', 'Nic by se nestalo'],
    ['Kdo se komáry a jejich larvami živí?'],
    'Komáři i jejich larvy ve vodě jsou potravou pro vlaštovky, netopýry, ryby i vážky. Bez nich by potrava chyběla mnoha dalším.'),
  q('rozkladac-kdo', 'Kdo z nich je rozkladač?', 'Houba',
    ['Tráva', 'Zajíc', 'Liška'],
    ['Rozkladači se živí zbytky rostlin a spadaným listím.'],
    'Houby rozkládají spadané listí a staré dřevo. Tráva je výrobce, zajíc a liška jsou spotřebitelé.'),
  q('myslivci', 'Proč myslivci počítají srny a jeleny v lese?', 'Aby jich nebylo příliš mnoho ani málo',
    ['Aby věděli, kolik mají kamarádů', 'Aby jim dali jména', 'Aby je naučili počítat'],
    ['Co se stane s mladými stromky, když je srn moc?'],
    'Když je srn a jelenů moc, okusují mladé stromky a les neroste. Když je jich málo, chybí rysům a vlkům potrava.'),
];

export const retezce = bankSkill({
  id: ID,
  island: 'svet',
  name: 'Kdo čím se živí',
  description: 'Uvažování o vztazích v přírodě: býložravci a masožravci, potravní řetězce a sítě, rovnováha a rozkladači.',
  rvp: {
    2: ['ČJS-3-4-02'],
    3: ['ČJS-3-4-02'],
    4: ['ČJS-5-4-01', 'ČJS-5-4-03'],
    5: ['ČJS-5-4-01', 'ČJS-5-4-03'],
  },
  ability: 'usuzovani',
  showFact: true,
  banks: { 2: L2, 3: L3, 4: L4, 5: L5 },
  gen: {
    2: (rng) => (rng.chance(0.6) ? cimSeZivi(rng) : seradRetezec(['louka', 'pole', 'hvozd', 'more'])(rng)),
    3: (rng) => {
      const r = rng.next();
      if (r < 0.35) return seradRetezec(['les', 'tun', 'zahrada', 'puda', 'doubrava'])(rng);
      if (r < 0.6) return kdoJeBylozravec(['louka', 'les', 'zahrada', 'hvozd'])(rng);
      return zmiziPosledni(['louka', 'pole', 'zahrada', 'hvozd', 'puda', 'doubrava'])(rng);
    },
    4: (rng) => {
      const r = rng.next();
      if (r < 0.3) return seradRetezec(['les', 'rybnik', 'tun'])(rng);
      if (r < 0.7) return potravouPro(['les', 'rybnik', 'tun'])(rng);
      return zmiziPosledni(['les', 'rybnik', 'tun'])(rng);
    },
    5: zmiziProstredni,
  },
  genShare: 0.45,
});

export const retezceCards: KnowledgeCard[] = [
  {
    id: `${ID}.beruska`,
    skillId: ID,
    level: 2,
    emoji: '🐞',
    title: 'Beruška pomocnice',
    text: 'Beruška se živí mšicemi, které sají šťávu z rostlin. Zahradníci mají berušky rádi, protože chrání růže i ovocné stromy.',
  },
  {
    id: `${ID}.jezek`,
    skillId: ID,
    level: 3,
    emoji: '🦔',
    title: 'Ježek jablka nenosí',
    text: 'Ježek se živí hlavně hmyzem, žížalami a slimáky. Ovoce jí jen výjimečně a na bodlinách ho nenosí.',
    fix: {
      before: 'Na obrázcích a v pohádkách nosí ježek na bodlinách jablka.',
      evidence: 'Zoologové ježky dlouho pozorovali v přírodě i na zahradách a zkoumali, co mají v trusu. Zjistili, že se živí hlavně drobnými živočichy a jablka nenosí.',
    },
  },
  {
    id: `${ID}.rozkladaci`,
    skillId: ID,
    level: 5,
    emoji: '🍂',
    title: 'Neviditelní uklízeči',
    text: 'Houby, bakterie a žížaly rozkládají spadané listí a staré dřevo na hlínu. Bez nich by se v lese listí hromadilo a rostlinám by chyběly živiny.',
  },
];
