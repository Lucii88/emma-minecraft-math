// Školní ostrov: slovní zásoba angličtiny. Obsah se obměňuje podle učiva ze
// školy – nová lekce = nová slova s jejím `unit` a zápis do CURRENT_UNITS.
// Starší lekce zůstávají na opakování. Úroveň 3 je navíc nad rámec školy
// (příprava na dětskou zkoušku Cambridge Pre A1 Starters).
//
// Pravidla obsahu: britská angličtina (colour, grey, rubber), malá písmena,
// žádná jména ani údaje konkrétních lidí, škol či tříd.

export type Topic = 'barvy' | 'cisla' | 'trida' | 'zvirata' | 'jidlo' | 'hracky' | 'telo' | 'obleceni' | 'domov';

export interface Word {
  /** Anglicky, malými písmeny. */
  en: string;
  /** Česky (význam pro dítě). */
  cs: string;
  topic: Topic;
  /** 1 = základ ze školy, 2 = celé školní učivo, 3 = navíc ke zkoušce. */
  level: 1 | 2 | 3;
  /** Lekce ze školy (u slov navíc chybí). */
  unit?: 'hello' | 'school';
  /** Obrázek (emoji), jen pokud je jednoznačný a funguje i na starším iPadu. */
  pic?: string;
  /** Barva vzorku (u barev). */
  color?: string;
  /** Číslo (u čísel). */
  n?: number;
  /** Množné číslo, pokud není jen + s. */
  plural?: string;
  /** Člen „an“ (an apple). */
  an?: boolean;
  /** Další správné tvary při psaní (rubber/eraser). */
  accept?: string[];
}

/** Lekce, které se ve škole právě probírají (na test). */
export const CURRENT_UNITS: Word['unit'][] = ['hello', 'school'];

export const TOPIC_HINT: Record<Topic, string> = {
  barvy: 'Je to barva.',
  cisla: 'Je to číslo.',
  trida: 'Je to něco ve třídě nebo ve škole.',
  zvirata: 'Je to zvíře.',
  jidlo: 'Je to jídlo nebo pití.',
  hracky: 'Je to hračka nebo něco, čím se jezdí.',
  telo: 'Je to část těla.',
  obleceni: 'Je to oblečení.',
  domov: 'Je to něco z domova nebo z přírody.',
};

const w = (en: string, cs: string, topic: Topic, level: Word['level'], extra: Partial<Word> = {}): Word => ({ en, cs, topic, level, ...extra });

export const WORDS: Word[] = [
  // Barvy (lekce Hello)
  w('red', 'červená', 'barvy', 1, { unit: 'hello', color: '#e63946' }),
  w('blue', 'modrá', 'barvy', 1, { unit: 'hello', color: '#2f6fd6' }),
  w('yellow', 'žlutá', 'barvy', 1, { unit: 'hello', color: '#ffd60a' }),
  w('green', 'zelená', 'barvy', 1, { unit: 'hello', color: '#2a9d55' }),
  w('orange', 'oranžová', 'barvy', 1, { unit: 'hello', color: '#ff8a1f' }),
  w('purple', 'fialová', 'barvy', 1, { unit: 'hello', color: '#8e44ad' }),
  w('pink', 'růžová', 'barvy', 1, { unit: 'hello', color: '#ff8fc8' }),
  w('grey', 'šedá', 'barvy', 1, { unit: 'hello', color: '#9aa0a6', accept: ['gray'] }),
  w('black', 'černá', 'barvy', 1, { unit: 'hello', color: '#222222' }),
  w('white', 'bílá', 'barvy', 1, { unit: 'hello', color: '#ffffff' }),
  w('brown', 'hnědá', 'barvy', 1, { unit: 'hello', color: '#8c5a3c' }),

  // Čísla (lekce Hello; jedenáct až dvacet navíc)
  ...['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].map((en, i) =>
    w(en, ['jedna', 'dva', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět', 'deset'][i], 'cisla', 1, { unit: 'hello', n: i + 1, pic: String(i + 1) }),
  ),
  ...['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'].map((en, i) =>
    w(en, ['jedenáct', 'dvanáct', 'třináct', 'čtrnáct', 'patnáct', 'šestnáct', 'sedmnáct', 'osmnáct', 'devatenáct', 'dvacet'][i], 'cisla', 3, { n: i + 11, pic: String(i + 11) }),
  ),

  // Ve třídě (lekce Our New School)
  w('bag', 'taška', 'trida', 1, { unit: 'school', pic: '🎒' }),
  w('book', 'kniha', 'trida', 1, { unit: 'school', pic: '📕' }),
  w('chair', 'židle', 'trida', 1, { unit: 'school', pic: '🪑' }),
  w('pen', 'pero', 'trida', 1, { unit: 'school', pic: '🖊️' }),
  w('pencil', 'tužka', 'trida', 1, { unit: 'school', pic: '✏️' }),
  w('crayon', 'pastelka', 'trida', 1, { unit: 'school', pic: '🖍️' }),
  w('desk', 'lavice', 'trida', 1, { unit: 'school' }),
  w('pencil case', 'penál', 'trida', 1, { unit: 'school' }),
  w('rubber', 'guma', 'trida', 1, { unit: 'school', accept: ['eraser'] }),
  w('teacher', 'učitel / učitelka', 'trida', 1, { unit: 'school', pic: '🧑‍🏫' }),
  w('classroom', 'třída (místnost)', 'trida', 2, { unit: 'school' }),
  w('board', 'tabule', 'trida', 2, { unit: 'school' }),
  w('bookcase', 'knihovna (skříň na knihy)', 'trida', 2, { unit: 'school' }),
  w('cupboard', 'skříňka', 'trida', 2, { unit: 'school', accept: ['cabinet'] }),
  w('door', 'dveře', 'trida', 2, { unit: 'school', pic: '🚪' }),
  w('paper', 'papír', 'trida', 2, { unit: 'school', pic: '📄' }),
  w('playground', 'hřiště', 'trida', 2, { unit: 'school' }),
  w('ruler', 'pravítko', 'trida', 2, { unit: 'school', pic: '📏' }),
  w('wall', 'zeď', 'trida', 2, { unit: 'school' }),
  w('window', 'okno', 'trida', 2, { unit: 'school', pic: '🪟' }),

  // Navíc ke zkoušce: zvířata
  w('cat', 'kočka', 'zvirata', 3, { pic: '🐱' }),
  w('dog', 'pes', 'zvirata', 3, { pic: '🐶' }),
  w('fish', 'ryba', 'zvirata', 3, { pic: '🐟', plural: 'fish' }),
  w('bird', 'pták', 'zvirata', 3, { pic: '🐦' }),
  w('horse', 'kůň', 'zvirata', 3, { pic: '🐴' }),
  w('duck', 'kachna', 'zvirata', 3, { pic: '🦆' }),
  w('cow', 'kráva', 'zvirata', 3, { pic: '🐄' }),
  w('sheep', 'ovce', 'zvirata', 3, { pic: '🐑', plural: 'sheep' }),
  w('goat', 'koza', 'zvirata', 3, { pic: '🐐' }),
  w('frog', 'žába', 'zvirata', 3, { pic: '🐸' }),
  w('snake', 'had', 'zvirata', 3, { pic: '🐍' }),
  w('spider', 'pavouk', 'zvirata', 3, { pic: '🕷️' }),
  w('mouse', 'myš', 'zvirata', 3, { pic: '🐭', plural: 'mice' }),
  w('tiger', 'tygr', 'zvirata', 3, { pic: '🐯' }),
  w('monkey', 'opice', 'zvirata', 3, { pic: '🐵' }),
  w('elephant', 'slon', 'zvirata', 3, { pic: '🐘', an: true }),
  w('giraffe', 'žirafa', 'zvirata', 3, { pic: '🦒' }),
  w('crocodile', 'krokodýl', 'zvirata', 3, { pic: '🐊' }),
  w('zebra', 'zebra', 'zvirata', 3, { pic: '🦓' }),
  w('chicken', 'slepice', 'zvirata', 3, { pic: '🐔' }),

  // Navíc: jídlo
  w('apple', 'jablko', 'jidlo', 3, { pic: '🍎', an: true }),
  w('banana', 'banán', 'jidlo', 3, { pic: '🍌' }),
  w('pear', 'hruška', 'jidlo', 3, { pic: '🍐' }),
  w('lemon', 'citron', 'jidlo', 3, { pic: '🍋' }),
  w('egg', 'vajíčko', 'jidlo', 3, { pic: '🥚', an: true }),
  w('cake', 'dort', 'jidlo', 3, { pic: '🍰' }),
  w('bread', 'chleba', 'jidlo', 3, { pic: '🍞' }),
  w('milk', 'mléko', 'jidlo', 3, { pic: '🥛' }),
  w('carrot', 'mrkev', 'jidlo', 3, { pic: '🥕' }),
  w('tomato', 'rajče', 'jidlo', 3, { pic: '🍅', plural: 'tomatoes' }),
  w('ice cream', 'zmrzlina', 'jidlo', 3, { pic: '🍦', an: true }),
  w('chocolate', 'čokoláda', 'jidlo', 3, { pic: '🍫' }),

  // Navíc: hračky a co jezdí
  w('ball', 'míč', 'hracky', 3, { pic: '⚽' }),
  w('kite', 'drak (pouštěcí)', 'hracky', 3, { pic: '🪁' }),
  w('robot', 'robot', 'hracky', 3, { pic: '🤖' }),
  w('train', 'vlak', 'hracky', 3, { pic: '🚂' }),
  w('car', 'auto', 'hracky', 3, { pic: '🚗' }),
  w('bike', 'kolo', 'hracky', 3, { pic: '🚲' }),
  w('boat', 'loďka', 'hracky', 3, { pic: '⛵' }),
  w('plane', 'letadlo', 'hracky', 3, { pic: '✈️' }),
  w('bus', 'autobus', 'hracky', 3, { pic: '🚌', plural: 'buses' }),

  // Navíc: tělo
  w('hand', 'ruka (dlaň)', 'telo', 3, { pic: '✋' }),
  w('foot', 'chodidlo', 'telo', 3, { pic: '🦶', plural: 'feet' }),
  w('nose', 'nos', 'telo', 3, { pic: '👃' }),
  w('ear', 'ucho', 'telo', 3, { pic: '👂', an: true }),
  w('eye', 'oko', 'telo', 3, { pic: '👁️', an: true }),
  w('mouth', 'pusa', 'telo', 3, { pic: '👄' }),
  w('leg', 'noha', 'telo', 3, { pic: '🦵' }),

  // Navíc: oblečení
  w('hat', 'klobouk', 'obleceni', 3, { pic: '👒' }),
  w('shoe', 'bota', 'obleceni', 3, { pic: '👟' }),
  w('sock', 'ponožka', 'obleceni', 3, { pic: '🧦' }),
  w('dress', 'šaty', 'obleceni', 3, { pic: '👗', plural: 'dresses' }),
  w('glasses', 'brýle', 'obleceni', 3, { pic: '👓' }),
  w('jacket', 'bunda', 'obleceni', 3, { pic: '🧥' }),

  // Navíc: domov a příroda
  w('house', 'dům', 'domov', 3, { pic: '🏠' }),
  w('bed', 'postel', 'domov', 3, { pic: '🛏️' }),
  w('clock', 'hodiny', 'domov', 3, { pic: '🕐' }),
  w('box', 'krabice', 'domov', 3, { pic: '📦', plural: 'boxes' }),
  w('tree', 'strom', 'domov', 3, { pic: '🌳' }),
  w('flower', 'květina', 'domov', 3, { pic: '🌸' }),
  w('sun', 'slunce', 'domov', 3, { pic: '☀️' }),
];

export const byEn = (en: string): Word => {
  const found = WORDS.find((x) => x.en === en);
  if (!found) throw new Error(`Školní ostrov: neznámé slovo „${en}“`);
  return found;
};

export const pluralOf = (word: Word) => word.plural ?? `${word.en}s`;

export const article = (word: Word) => (word.an ? 'an' : 'a');

/** Anglická jména pro hláskování (formát zkoušky: jméno se vyhláskuje). */
export const NAMES = ['Sam', 'Ben', 'Tom', 'Nick', 'Dan', 'Kim', 'Anna', 'Lucy', 'Bill', 'Pat', 'Matt', 'May', 'Jill', 'Ann', 'Grace', 'Hugo', 'Sue', 'Tony', 'Alex', 'Eva', 'Mark'];

/** Česká výslovnost anglických názvů písmen – pro vysvětlení dítěti i rodiči. */
export const LETTER_CZ: Record<string, string> = {
  A: 'ej', B: 'bí', C: 'sí', D: 'dí', E: 'í', F: 'ef', G: 'dží', H: 'ejč', I: 'aj', J: 'džej', K: 'kej', L: 'el', M: 'em',
  N: 'en', O: 'ou', P: 'pí', Q: 'kjú', R: 'á', S: 'es', T: 'tí', U: 'jú', V: 'ví', W: 'dabl jú', X: 'eks', Y: 'uaj', Z: 'zed',
};
