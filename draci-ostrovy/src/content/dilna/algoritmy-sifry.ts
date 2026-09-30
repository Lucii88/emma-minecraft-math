// Šifry a tajné kódy. Klíč je vždy součástí úlohy (tabulka symbol ↔ písmeno,
// abeceda, Morseova abeceda, hodnoty lamp). Slova jsou krátká a bez
// diakritiky. Přiřazení symbolů k písmenům je odvozené ze slova, takže
// stejný klíč úlohy znamená vždy stejnou šifru.

import { bankSkill, type ChoiceSpec, type NumberSpec, type Spec } from '../../core/bank';
import { createRng, type Rng } from '../../core/rng';
import type { ChoiceOption, KnowledgeCard, Visual } from '../../core/types';
import { joinA } from './algoritmy-mrizka';

const ID = 'dilna.sifry';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Semínko ze slova – přiřazení symbolů je pro dané slovo vždy stejné. */
function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const distinct = (word: string) => [...new Set(word)];
const spell = (word: string) => [...word].join(', ');
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);

/** Chybné možnosti vznikají záměnou písmen – tyhle nesmí vzniknout ani omylem
 *  (sprostá a strašidelná slova, i jako část: DRAK → DREK, MRKEV → MKREV). */
const UNSUITABLE = /DREK|SRA[CKLNT]|PRD|SUK|KAKA|KREV|BLB|KURV|PIC[AEIO]|HOVN|CURA|KOKOT|SMRT|MRTV|VRAH|HROB|PEKL|SEX|VUL|PRS|KOZY|DEBIL|CHCA/;
const suitable = (text: string) => !UNSUITABLE.test(text);

/** Chybná slova: prohozená sousední písmena, jedno písmeno zaměněné za jiné
 *  z klíče, slovo pozpátku. */
function wordDistractors(word: string, letters: string[]): string[] {
  const out = new Set<string>();
  for (let i = 0; i + 1 < word.length; i++) {
    if (word[i] !== word[i + 1]) out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }
  for (let i = 0; i < word.length; i++) {
    for (const l of letters) if (l !== word[i]) out.add(word.slice(0, i) + l + word.slice(i + 1));
  }
  out.add([...word].reverse().join(''));
  out.delete(word);
  return [...out].filter(suitable);
}

/** Totéž pro zápis z jednotek (symboly, kódy Morseovy abecedy, čísla). */
function unitDistractors(units: string[], pool: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i + 1 < units.length; i++) {
    if (units[i] !== units[i + 1]) out.push(units.map((u, j) => (j === i ? units[i + 1] : j === i + 1 ? units[i] : u)));
  }
  for (let i = 0; i < units.length; i++) {
    for (const p of pool) if (p !== units[i]) out.push(units.map((u, j) => (j === i ? p : u)));
  }
  out.push([...units].reverse());
  const target = units.join('|');
  const seen = new Set([target]);
  return out.filter((u) => {
    const k = u.join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Záměna symbolů za písmena

const SYMBOLS = [
  { s: '⭐', name: 'hvězda' },
  { s: '🌙', name: 'měsíc' },
  { s: '☀️', name: 'slunce' },
  { s: '🍎', name: 'jablko' },
  { s: '🐟', name: 'ryba' },
  { s: '🔥', name: 'oheň' },
  { s: '🌸', name: 'kytička' },
  { s: '🍀', name: 'čtyřlístek' },
  { s: '❄️', name: 'vločka' },
  { s: '💧', name: 'kapka' },
  { s: '🎈', name: 'balonek' },
  { s: '🔔', name: 'zvonek' },
];

const SYMBOL_NAME = new Map(SYMBOLS.map((x) => [x.s, x.name]));

/** Slova podle úrovně (bez diakritiky, nejvýš 6 různých písmen). */
const WORDS: Record<1 | 2 | 3, string[]> = {
  1: ['LES', 'PES', 'KOS', 'NOS', 'DUB', 'BUK', 'LEV', 'VLK', 'OKO', 'MED', 'LED', 'SYN', 'OBR', 'SUD', 'ROK', 'DRAK', 'SOVA', 'RYBA', 'KOZA', 'KOLO', 'VLAK', 'NORA', 'VODA', 'ZIMA', 'JARO', 'NOHA', 'RUKA', 'LAMA', 'MAPA', 'VOSA', 'LIPA', 'HORA', 'DORT'],
  2: ['DRAK', 'SOVA', 'RYBA', 'KOLO', 'LAMPA', 'VEJCE', 'MOTYL', 'SLON', 'TYGR', 'ZEBRA', 'KAPR', 'VLNA', 'OSEL', 'PERO', 'KOPEC', 'KOZEL', 'HUSA', 'BUBEN', 'KOTVA', 'HOUBA', 'MRKEV', 'OKNO', 'STROM', 'MOST'],
  3: ['POKLAD', 'OSTROV', 'KOMPAS', 'VESLO', 'ROBOT', 'KOMETA', 'PLANETA', 'OBLAKA', 'MALINA', 'DOMINO', 'KAKTUS', 'HOLUB', 'TUNEL', 'KLOBOUK', 'PARAPLE', 'BALON', 'SOPKA', 'MOTOR'],
};

/** Písmena navíc do klíče (aby klíč nebyl jen přesně to slovo). */
const EXTRA_LETTERS = 'AEIOUKLMNPRSTV';

interface SymbolKey {
  word: string;
  /** Dvojice [symbol, písmeno] v pořadí klíče. */
  pairs: [string, string][];
  code: Map<string, string>;
}

/** Klíč pro slovo: každému písmenu jiný symbol, k tomu `extra` písmen navíc.
 *  Řádek písmen v klíči nikdy nepřečte samotné slovo. */
function symbolKey(word: string, extra: number): SymbolKey {
  const rng = createRng(seedOf(`znaky:${word}:${extra}`));
  const letters = distinct(word);
  const extras = rng.shuffle([...EXTRA_LETTERS].filter((l) => !letters.includes(l))).slice(0, extra);
  const symbols = rng.shuffle(SYMBOLS.map((x) => x.s));
  const all = [...letters, ...extras];
  let order = rng.shuffle(all);
  for (let i = 0; i < 20 && readsWord(order, word); i++) order = rng.shuffle(all);
  const pairs = order.map((l): [string, string] => [symbols[all.indexOf(l)], l]);
  return { word, pairs, code: new Map(pairs.map(([s, l]) => [l, s])) };
}

/** Přečte se v řadě písmen slovo (nebo pozpátku)? */
function readsWord(order: string[], word: string): boolean {
  const row = order.join('');
  return row.includes(distinct(word).join('')) || row.includes(distinct(word).reverse().join(''));
}

function keyTable(pairs: [string | number, string][]): Visual {
  return { type: 'table', cols: pairs.length, head: 'row', cells: [...pairs.map((p) => p[0]), ...pairs.map((p) => p[1])] };
}

const encodeSymbols = (key: SymbolKey) => [...key.word].map((l) => key.code.get(l)!);
const symbolsSpeak = (units: string[]) => units.map((s) => SYMBOL_NAME.get(s)).join(', ');

/** Rozlušti slovo zapsané obrázky. */
function znaky(level: 1 | 2 | 3, rng: Rng): ChoiceSpec {
  const word = rng.pick(WORDS[level]);
  const room = 6 - distinct(word).length;
  const extra = Math.min(room, level === 1 ? (word.length === 3 ? 1 : 0) : level === 2 ? 2 : 1);
  const key = symbolKey(word, extra);
  const msg = encodeSymbols(key);
  return {
    key: `znaky-${word.toLowerCase()}`,
    prompt: `Jaké slovo je ukryté v tajné zprávě ${msg.join(' ')}?`,
    speak: `Tajná zpráva: ${symbolsSpeak(msg)}. Jaké slovo je v ní ukryté?`,
    visual: keyTable(key.pairs),
    correct: word,
    wrong: wordDistractors(word, key.pairs.map((p) => p[1])),
    hints: ['Najdi každý obrázek zprávy v klíči.', 'Pod obrázkem je jeho písmeno.'],
    explain: `Podle klíče je ${joinA(distinct(word).map((l) => `${key.code.get(l)} ${l}`))}. Zpráva tedy znamená ${word}.`,
    difficulty: (word.length - (level + 3)) * 0.2,
  };
}

/** Zapiš slovo obrázky podle klíče. */
function zapis(rng: Rng): ChoiceSpec {
  const word = rng.pick(WORDS[2]);
  const key = symbolKey(word, Math.min(1, 6 - distinct(word).length));
  const msg = encodeSymbols(key);
  const option = (units: string[]): ChoiceOption => ({ label: units.join(' '), speak: symbolsSpeak(units) });
  return {
    key: `zapis-${word.toLowerCase()}`,
    prompt: `Jak zapíšeš slovo ${word} tajným písmem podle klíče?`,
    visual: keyTable(key.pairs),
    correct: option(msg),
    wrong: unitDistractors(msg, key.pairs.map((p) => p[0])).map(option),
    hints: ['Najdi v klíči každé písmeno slova.', 'Nad písmenem je jeho obrázek.'],
    explain: `Podle klíče je ${joinA(distinct(word).map((l) => `${l} ${key.code.get(l)}`))}. Slovo ${word} se tedy zapíše ${msg.join(' ')}.`,
    difficulty: 0.2,
  };
}

// ---------------------------------------------------------------------------
// Čísla za písmena (A = 1, B = 2, …)

const numberOf = (l: string) => ALPHABET.indexOf(l) + 1;

/** Celá abeceda s čísly v tabulce 6 × 5 (poslední čtyři políčka prázdná). */
const NUMBER_TABLE: Visual = {
  type: 'table',
  cols: 6,
  cells: [...[...ALPHABET].map((l, i) => `${l} = ${i + 1}`), null, null, null, null],
};

/** Celá abeceda v tabulce 6 × 5. */
const ALPHABET_TABLE: Visual = { type: 'table', cols: 6, cells: [...ALPHABET, null, null, null, null] };

function numberKey(word: string): [number, string][] {
  const rng = createRng(seedOf(`cisla:${word}`));
  const letters = distinct(word);
  const extras = rng.shuffle([...EXTRA_LETTERS].filter((l) => !letters.includes(l))).slice(0, Math.min(2, 6 - letters.length));
  let order = [...letters, ...extras].sort((a, b) => numberOf(a) - numberOf(b));
  for (let i = 0; i < 20 && readsWord(order, word); i++) order = rng.shuffle(order);
  return order.map((l) => [numberOf(l), l]);
}

function cisla(level: 2 | 3, rng: Rng): ChoiceSpec {
  const word = rng.pick(level === 2 ? WORDS[2] : WORDS[3].filter((w) => w.length <= 6));
  const nums = [...word].map(numberOf);
  const full = level === 3;
  const pairs = full ? null : numberKey(word);
  const letters = full ? [...ALPHABET] : pairs!.map((p) => p[1]);
  return {
    key: `cisla-${word.toLowerCase()}`,
    prompt: `Každé písmeno je nahrazené číslem podle klíče. Jaké slovo je ukryté ve zprávě ${nums.join(', ')}?`,
    visual: full ? NUMBER_TABLE : keyTable(pairs!),
    correct: word,
    wrong: wordDistractors(word, full ? distinct(word).flatMap((l) => [ALPHABET[numberOf(l) - 2], ALPHABET[numberOf(l)]]).filter(Boolean) : letters),
    hints: ['Najdi každé číslo zprávy v klíči.', full ? 'Písmena jdou v abecedě po řadě: A = 1, B = 2…' : 'Pod číslem je jeho písmeno.'],
    explain: `${cap(joinA(distinct(word).map((l) => `${numberOf(l)} je ${l}`)))}. Zpráva tedy znamená ${word}.`,
    difficulty: full ? 0.2 : 0,
  };
}

function cislaZapis(rng: Rng): ChoiceSpec {
  const word = rng.pick(WORDS[2]);
  const nums = [...word].map((l) => String(numberOf(l)));
  const pool = [...new Set(nums.flatMap((n) => [String(Number(n) - 1), String(Number(n) + 1)]))].filter((n) => Number(n) >= 1 && Number(n) <= 26);
  return {
    key: `cislazapis-${word.toLowerCase()}`,
    prompt: `Každé písmeno se nahradí číslem podle klíče. Jak zapíšeš slovo ${word}?`,
    visual: NUMBER_TABLE,
    correct: nums.join(', '),
    wrong: unitDistractors(nums, pool).map((u) => u.join(', ')),
    hints: ['Najdi v klíči každé písmeno slova.', 'Pozor na pořadí písmen.'],
    explain: `${cap(joinA(distinct(word).map((l) => `${l} je ${numberOf(l)}`)))}. Slovo ${word} se tedy zapíše ${nums.join(', ')}.`,
    difficulty: 0.3,
  };
}

// ---------------------------------------------------------------------------
// Posun v abecedě (Caesarova šifra)

export const shift = (word: string, by: number) => [...word].map((l) => ALPHABET[(ALPHABET.indexOf(l) + by + 26) % 26]).join('');

const CAESAR_WORDS = {
  bezPreteceni: ['DRAK', 'ROBOT', 'KOLO', 'SOVA', 'LEV', 'VLNA', 'KOTVA', 'MAPA', 'POKLAD', 'OSTROV', 'VESLO', 'KOMPAS', 'LAMPA', 'STROM', 'HORA', 'NOHA', 'RYBA', 'VODA', 'SLON', 'MOST', 'DORT', 'OKNO', 'PERO', 'TYGR'],
  sPretecenim: ['ZIMA', 'KOZA', 'ZEBRA', 'ZUB', 'KOZEL', 'MOZEK', 'JAZYK', 'ZVON', 'ZLATO', 'AUTO', 'ANDULKA', 'ANO', 'ANANAS', 'ZAHRADA', 'ZOO'],
};

/** Varianta posunu: o 1 dál (dešifruj), zašifruj o 1 dál, o 1 zpět, o 3 dál. */
function posun(kind: 'dal' | 'zasifruj' | 'zpet' | 'tri', rng: Rng): ChoiceSpec {
  const pool = kind === 'dal' ? CAESAR_WORDS.bezPreteceni : [...CAESAR_WORDS.bezPreteceni, ...CAESAR_WORDS.sPretecenim];
  const word = rng.pick(pool);
  const hintsBack = ['Najdi každé písmeno zprávy v abecedě.'];
  switch (kind) {
    case 'dal': {
      const msg = shift(word, 1);
      return {
        key: `posun-${word.toLowerCase()}`,
        prompt: `Každé písmeno se posunulo v abecedě o jedno dál (A → B). Co znamená zpráva ${msg}?`,
        speak: `Každé písmeno se posunulo v abecedě o jedno dál, z A je B. Co znamená zpráva ${spell(msg)}?`,
        visual: ALPHABET_TABLE,
        correct: word,
        wrong: [msg, shift(word, 2), ...wordDistractors(word, distinct(msg))].filter(suitable),
        hints: [...hintsBack, 'Vezmi vždy písmeno, které je v abecedě o jedno před ním.'],
        explain: `Každé písmeno vrátíme o jedno zpět: ${joinA([...msg].map((l, i) => `${l} → ${word[i]}`))}. Vyjde ${word}.`,
        difficulty: word.length >= 5 ? 0.2 : -0.1,
      };
    }
    case 'zasifruj': {
      const enc = shift(word, 1);
      return {
        key: `zasifruj-${word.toLowerCase()}`,
        prompt: `Zašifruj slovo ${word}: posuň každé písmeno v abecedě o jedno dál (A → B, Z → A). Co vyjde?`,
        speak: `Zašifruj slovo ${word}: posuň každé písmeno v abecedě o jedno dál, z A je B a ze Z je A. Co vyjde?`,
        visual: ALPHABET_TABLE,
        correct: enc,
        wrong: [shift(word, -1), word, ...wordDistractors(enc, distinct(word))].filter(suitable),
        hints: ['Najdi každé písmeno slova v abecedě.', 'Za písmenem Z abeceda začíná znovu od A.'],
        explain: `${joinA([...word].map((l, i) => `${l} → ${enc[i]}`))}. Zašifrované slovo je ${enc}.`,
        difficulty: /[Z]/.test(word) ? 0.3 : 0,
      };
    }
    case 'zpet': {
      const msg = shift(word, -1);
      return {
        key: `zpet-${word.toLowerCase()}`,
        prompt: `Každé písmeno se posunulo v abecedě o jedno zpět (B → A, A → Z). Co znamená zpráva ${msg}?`,
        speak: `Každé písmeno se posunulo v abecedě o jedno zpět, z B je A a z A je Z. Co znamená zpráva ${spell(msg)}?`,
        visual: ALPHABET_TABLE,
        correct: word,
        wrong: [msg, shift(word, -2), ...wordDistractors(word, distinct(msg))].filter(suitable),
        hints: [...hintsBack, 'Vezmi vždy písmeno, které je v abecedě o jedno za ním. Za Z je zase A.'],
        explain: `Každé písmeno posuneme o jedno dál: ${joinA([...msg].map((l, i) => `${l} → ${word[i]}`))}. Vyjde ${word}.`,
        difficulty: /[A]/.test(word) ? 0.3 : 0,
      };
    }
    case 'tri': {
      const msg = shift(word, 3);
      return {
        key: `caesar3-${word.toLowerCase()}`,
        prompt: `Caesarova šifra: každé písmeno se posunulo o tři místa dál (A → D, X → A). Co znamená zpráva ${msg}?`,
        speak: `Caesarova šifra: každé písmeno se posunulo o tři místa dál, z A je D a z X je A. Co znamená zpráva ${spell(msg)}?`,
        visual: ALPHABET_TABLE,
        correct: word,
        wrong: [shift(word, 1), shift(word, -1), ...wordDistractors(word, distinct(msg))].filter(suitable),
        hints: [...hintsBack, 'Vezmi vždy písmeno, které je o tři místa před ním.'],
        explain: `Každé písmeno vrátíme o tři místa zpět: ${joinA([...msg].map((l, i) => `${l} → ${word[i]}`))}. Vyjde ${word}.`,
        difficulty: 0.2,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Obrázek z nul a jedniček

export interface Picture {
  code: string;
  name: string;
  rows: string[];
  /** Pomnožné jméno („Schody“ → „vzniknou schody“). */
  plural?: true;
  /** Obrázky, za které by se tenhle dal splést – nenabízí se jako chybná možnost. */
  similar?: string[];
}

export const PICTURES_5: Picture[] = [
  { code: 'srdce', name: 'Srdce', rows: ['01010', '11111', '11111', '01110', '00100'] },
  { code: 'domecek', name: 'Domeček', rows: ['00100', '01110', '11111', '11011', '11011'] },
  { code: 'plus', name: 'Znaménko plus', rows: ['00100', '00100', '11111', '00100', '00100'] },
  { code: 'sipka', name: 'Šipka nahoru', rows: ['00100', '01110', '10101', '00100', '00100'] },
  { code: 'pismeno-t', name: 'Písmeno T', rows: ['11111', '00100', '00100', '00100', '00100'] },
  { code: 'pismeno-l', name: 'Písmeno L', rows: ['10000', '10000', '10000', '10000', '11111'] },
  { code: 'pismeno-h', name: 'Písmeno H', rows: ['10001', '10001', '11111', '10001', '10001'] },
  { code: 'ramecek', name: 'Rámeček', rows: ['11111', '10001', '10001', '10001', '11111'] },
  { code: 'smajlik', name: 'Smajlík', rows: ['01010', '01010', '00000', '10001', '01110'] },
  { code: 'lodka', name: 'Loďka', rows: ['00100', '00110', '00100', '11111', '01110'] },
  { code: 'pismeno-x', name: 'Písmeno X', rows: ['10001', '01010', '00100', '01010', '10001'] },
  { code: 'cislo-1', name: 'Číslo 1', rows: ['00100', '01100', '00100', '00100', '01110'] },
  { code: 'cislo-7', name: 'Číslo 7', rows: ['11111', '00001', '00010', '00100', '00100'] },
];

export const PICTURES_6: Picture[] = [
  { code: 'pismeno-a', name: 'Písmeno A', rows: ['001100', '010010', '100001', '111111', '100001', '100001'] },
  { code: 'pismeno-e', name: 'Písmeno E', rows: ['111111', '100000', '111110', '100000', '100000', '111111'] },
  { code: 'pismeno-m', name: 'Písmeno M', rows: ['100001', '110011', '101101', '100001', '100001', '100001'] },
  { code: 'pismeno-s', name: 'Písmeno S', rows: ['011111', '100000', '011110', '000001', '000001', '111110'] },
  { code: 'pismeno-u', name: 'Písmeno U', rows: ['100001', '100001', '100001', '100001', '100001', '011110'], similar: ['pohar'] },
  { code: 'cislo-2', name: 'Číslo 2', rows: ['011110', '100001', '000010', '001100', '010000', '111111'] },
  { code: 'cislo-4', name: 'Číslo 4', rows: ['100010', '100010', '100010', '111111', '000010', '000010'] },
  { code: 'cislo-0', name: 'Číslo 0', rows: ['011110', '100001', '100001', '100001', '100001', '011110'] },
  { code: 'schody', name: 'Schody', rows: ['100000', '110000', '111000', '111100', '111110', '111111'], plural: true },
  { code: 'sipka-doprava', name: 'Šipka doprava', rows: ['000100', '000110', '111111', '111111', '000110', '000100'] },
  { code: 'sachovnice', name: 'Šachovnice', rows: ['101010', '010101', '101010', '010101', '101010', '010101'] },
  { code: 'kosoctverec', name: 'Kosočtverec', rows: ['001100', '011110', '111111', '111111', '011110', '001100'] },
  { code: 'pohar', name: 'Pohár', rows: ['111111', '111111', '011110', '001100', '001100', '011110'], similar: ['pismeno-u'] },
];

function obrazek(level: 4 | 5, rng: Rng): ChoiceSpec {
  const pics = level === 4 ? PICTURES_5 : PICTURES_6;
  const pic = rng.pick(pics);
  const size = pic.rows.length;
  return {
    key: `obrazek-${pic.code}`,
    prompt: 'Jednička je vybarvené políčko, nula prázdné. Co je na obrázku?',
    speak: 'V tabulce jsou nuly a jedničky. Jednička je vybarvené políčko, nula prázdné. Co je na obrázku?',
    visual: { type: 'table', cols: size, cells: pic.rows.flatMap((r) => [...r].map(Number)) },
    correct: pic.name,
    wrong: pics.filter((p) => p !== pic && !pic.similar?.includes(p.code)).map((p) => p.name),
    hints: ['Zkus si jedničky vybarvit na čtverečkovaném papíře.', 'Dívej se jen na jedničky – jaký tvar dělají?'],
    explain: `Když se jedničky vybarví, ${pic.plural ? 'vzniknou' : 'vznikne'} ${pic.name.charAt(0).toLocaleLowerCase('cs')}${pic.name.slice(1)}.`,
    difficulty: level === 4 ? 0 : 0.2,
  };
}

// ---------------------------------------------------------------------------
// Morseova abeceda

/** Mezinárodní Morseova abeceda (tečka •, čárka –). */
export const MORSE: Record<string, string> = {
  A: '•–', B: '–•••', C: '–•–•', D: '–••', E: '•', F: '••–•', G: '––•', H: '••••', I: '••', J: '•–––',
  K: '–•–', L: '•–••', M: '––', N: '–•', O: '–––', P: '•––•', Q: '––•–', R: '•–•', S: '•••', T: '–',
  U: '••–', V: '•••–', W: '•––', X: '–••–', Y: '–•––', Z: '––••',
};

/** Kód k zobrazení s mezerami mezi znaky: „• • •“. */
const morseShow = (letter: string) => [...MORSE[letter]].join(' ');
const morseSpeak = (letter: string) => [...MORSE[letter]].map((c) => (c === '•' ? 'tečka' : 'čárka')).join(' ');

const MORSE_WORDS = ['SOS', 'ANO', 'OKO', 'NORA', 'ROSA', 'LES', 'DRAK', 'LEV', 'KOS', 'MOST', 'VLK', 'TMA', 'NOS', 'SEN', 'DEN', 'MRAK', 'KOLO', 'SOVA', 'RYBA', 'NOHA', 'MED', 'LED', 'ROK', 'DUB'];

function morseKey(word: string): string[] {
  const rng = createRng(seedOf(`morse:${word}`));
  const letters = distinct(word);
  const extras = rng.shuffle([...'AEIMNOSTUDKRGW'].filter((l) => !letters.includes(l))).slice(0, Math.min(2, 6 - letters.length));
  let order = [...letters, ...extras].sort();
  for (let i = 0; i < 20 && readsWord(order, word); i++) order = rng.shuffle(order);
  return order;
}

function morse(encode: boolean, rng: Rng): ChoiceSpec {
  const word = rng.pick(MORSE_WORDS);
  const keyLetters = morseKey(word);
  const visual = keyTable(keyLetters.map((l) => [morseShow(l), l]));
  const units = [...word].map(morseShow);
  const msg = units.join(' / ');
  const msgSpeak = [...word].map(morseSpeak).join(', lomítko, ');
  if (!encode) {
    return {
      key: `morse-${word.toLowerCase()}`,
      prompt: `Tečky a čárky jsou Morseova abeceda, lomítko odděluje písmena. Co je napsáno ve zprávě ${msg}?`,
      speak: `Zpráva je v Morseově abecedě a lomítko odděluje písmena. Zpráva: ${msgSpeak}. Co je v ní napsáno?`,
      visual,
      correct: word,
      wrong: wordDistractors(word, keyLetters),
      hints: ['Vezmi zprávu po písmenech – od lomítka k lomítku.', 'Každou skupinu teček a čárek najdi v klíči.'],
      explain: `${cap(joinA(distinct(word).map((l) => `${morseShow(l)} je ${l}`)))}. Zpráva tedy znamená ${word}.`,
      difficulty: word.length >= 4 ? 0.2 : -0.1,
    };
  }
  const option = (u: string[]): ChoiceOption => ({
    label: u.join(' / '),
    speak: u.map((x) => [...x.replace(/ /g, '')].map((c) => (c === '•' ? 'tečka' : 'čárka')).join(' ')).join(', lomítko, '),
  });
  return {
    key: `morsezapis-${word.toLowerCase()}`,
    prompt: `Jak se v Morseově abecedě zapíše slovo ${word}?`,
    visual,
    correct: option(units),
    wrong: unitDistractors(units, keyLetters.map(morseShow)).map(option),
    hints: ['Najdi v klíči každé písmeno slova.', 'Pozor na pořadí písmen.'],
    explain: `${cap(joinA(distinct(word).map((l) => `${l} je ${morseShow(l)}`)))}. Slovo ${word} se tedy zapíše ${msg}.`,
    difficulty: 0.3,
  };
}

// ---------------------------------------------------------------------------
// Dvojková světla (L6)

const LAMP_VALUES = [16, 8, 4, 2, 1];
const ON = '💡';
const OFF = '⚫';
const bitsOf = (n: number) => LAMP_VALUES.map((v) => ((n & v) !== 0 ? 1 : 0));
const bitsLabel = (n: number) => bitsOf(n).join('');
const bitsOption = (n: number): ChoiceOption => ({ label: bitsLabel(n), speak: bitsOf(n).join(', ') });
const lampTable = (n: number | null): Visual => ({
  type: 'table',
  cols: 5,
  head: 'row',
  cells: [...LAMP_VALUES, ...(n === null ? LAMP_VALUES.map(() => OFF) : bitsOf(n).map((b) => (b ? ON : OFF)))],
});

/** „13 = 8 + 4 + 1, takže svítí lampy 8, 4 a 1: 01101.“ */
function lampText(n: number): string {
  const lit = LAMP_VALUES.filter((v) => n & v);
  if (lit.length === 1) return `Číslo ${n} ukáže jediná lampa ${n}: ${bitsLabel(n)}.`;
  return `${n} = ${lit.join(' + ')}, takže svítí lampy ${joinA(lit.map(String))}: ${bitsLabel(n)}.`;
}

/** Jiná čísla, jejichž zápis se od správného liší jedním nebo dvěma bity. */
function nearBits(n: number): number[] {
  const out = new Set<number>();
  for (const v of LAMP_VALUES) out.add(n ^ v);
  for (let i = 0; i + 1 < LAMP_VALUES.length; i++) {
    const [a, b] = [LAMP_VALUES[i], LAMP_VALUES[i + 1]];
    if (((n & a) !== 0) !== ((n & b) !== 0)) out.add(n ^ a ^ b);
  }
  out.add(parseInt(bitsLabel(n).split('').reverse().join(''), 2));
  out.delete(n);
  return [...out].filter((x) => x >= 0 && x <= 31);
}

function svetla(kind: 'precti' | 'zapni' | 'plus1', rng: Rng): Spec {
  if (kind === 'precti') {
    let n: number;
    do n = rng.int(3, 31);
    while (bitsOf(n).filter(Boolean).length < 2);
    const lit = LAMP_VALUES.filter((v) => n & v);
    return {
      kind: 'number',
      key: `svetla-${bitsLabel(n)}`,
      prompt: 'Každá rozsvícená lampa přidá číslo, které je nad ní. Jaké číslo lampy ukazují?',
      speak: `Každá rozsvícená lampa přidá číslo, které je nad ní. Svítí lampy pod čísly ${joinA(lit.map(String))}. Jaké číslo lampy ukazují?`,
      visual: lampTable(n),
      correct: n,
      hints: ['Zhasnutá lampa nepřidá nic.', 'Sečti čísla nad rozsvícenými lampami.'],
      explain: `${LAMP_VALUES.map((v) => (n & v ? v : 0)).join(' + ')} = ${n}.`,
      difficulty: lit.length >= 4 ? 0.3 : 0,
    } satisfies NumberSpec;
  }
  if (kind === 'zapni') {
    const n = rng.int(5, 30);
    return {
      key: `zapni-${n}`,
      prompt: `Rozsvícenou lampu zapiš jako 1, zhasnutou jako 0. Jak lampy ukážou číslo ${n}?`,
      visual: lampTable(null),
      correct: bitsOption(n),
      wrong: nearBits(n).map(bitsOption),
      hints: ['Začni největší lampou, která se do čísla ještě vejde.', 'Co zbude, poskládej z menších lamp.'],
      explain: lampText(n),
      difficulty: 0.2,
    };
  }
  const n = rng.pick([3, 5, 7, 9, 11, 13, 15, 19, 23, 27]);
  return {
    key: `plus1-${n}`,
    prompt: `Lampy ukazují číslo ${n}. Jak budou svítit, když k němu přičteš 1? Rozsvícená lampa je 1, zhasnutá 0.`,
    speak: `Lampy ukazují číslo ${n}. Jak budou svítit, když k němu přičteš jedna? Rozsvícená lampa je jednička, zhasnutá nula.`,
    visual: lampTable(n),
    correct: bitsOption(n + 1),
    wrong: [bitsOption(n | 1), bitsOption(n + 2), ...nearBits(n + 1).filter((x) => x !== n).map(bitsOption)],
    hints: ['Jaké číslo máš ukázat?', `Poskládej číslo ${n + 1} z lamp 16, 8, 4, 2 a 1.`],
    explain: `${n} + 1 = ${n + 1}. ${lampText(n + 1)}`,
    difficulty: 0.4,
  };
}

const L6: Spec[] = [
  {
    kind: 'number',
    key: 'lampy-tri',
    prompt: 'Máš tři lampy s čísly 4, 2 a 1. Každá rozsvícená lampa přidá své číslo. Kolik různých čísel ukážeš, když počítáš i nulu (všechny zhasnuté)?',
    correct: 8,
    hints: ['Každá lampa může svítit, nebo nesvítit.', 'Jaké největší číslo ukážeš?'],
    explain: 'Ukážeš všechna čísla od 0 do 7 (4 + 2 + 1 = 7). To je osm různých čísel.',
  },
  {
    kind: 'number',
    key: 'lampy-nejvic',
    prompt: 'Lampy mají čísla 8, 4, 2 a 1. Každá rozsvícená lampa přidá své číslo. Jaké největší číslo s nimi ukážeš?',
    correct: 15,
    hints: ['Kdy lampy ukazují nejvíc?'],
    explain: 'Když svítí všechny, ukazují 8 + 4 + 2 + 1 = 15.',
  },
  {
    kind: 'number',
    key: 'lampy-dalsi',
    prompt: 'Lampy mají čísla 1, 2, 4, 8 a 16. Jaké číslo bude mít další lampa v řadě?',
    correct: 32,
    hints: ['Jak se mění čísla z jedné lampy na další?'],
    explain: 'Každá další lampa má dvojnásobek předchozí: 16 × 2 = 32.',
  },
  {
    kind: 'number',
    key: 'lampy-dvacet',
    prompt: 'Lampy v řadě mají čísla 1, 2, 4, 8 a tak dál. Každá rozsvícená lampa přidá své číslo. Kolik lamp musí řada mít, abys {ukázala|ukázal} číslo 20?',
    correct: 5,
    hints: ['Jaké největší číslo ukážou lampy 1, 2, 4 a 8?', 'Která lampa se do 20 ještě vejde?'],
    explain: 'Lampy 1, 2, 4 a 8 ukážou nejvýš 15, a to na 20 nestačí. Řada potřebuje i lampu 16 (20 = 16 + 4), takže musí mít pět lamp.',
  },
  {
    key: 'lampy-liche',
    prompt: 'Lampy mají čísla 16, 8, 4, 2 a 1. Každá rozsvícená lampa přidá své číslo. Podle které lampy hned poznáš, že je ukázané číslo liché?',
    correct: 'Podle lampy 1',
    wrong: ['Podle lampy 2', 'Podle lampy 8', 'Podle lampy 16'],
    hints: ['Lampy 16, 8, 4 a 2 mají sudá čísla.'],
    explain: 'Součet sudých čísel je vždycky sudý. Liché číslo vznikne, jen když svítí lampa 1.',
  },
  {
    kind: 'number',
    key: 'lampy-vse-sviti',
    prompt: 'Všech pět lamp s čísly 16, 8, 4, 2 a 1 svítí. Každá rozsvícená lampa přidá své číslo. Jaké číslo ukazují?',
    correct: 31,
    hints: ['Sečti čísla všech lamp.'],
    explain: '16 + 8 + 4 + 2 + 1 = 31.',
  },
];

// ---------------------------------------------------------------------------

export const sifrySkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Šifry a tajné kódy',
  description: 'Luští a zapisuje tajné zprávy podle klíče: obrázky za písmena, čísla, posun v abecedě, Morseovu abecedu, obrázky z nul a jedniček a dvojková světla.',
  rvp: {
    1: ['I-5-2-01'],
    2: ['I-5-2-01'],
    3: ['I-5-2-01'],
    4: ['I-5-1-02', 'I-5-2-01'],
    5: ['I-5-1-02', 'I-5-2-01'],
  },
  ability: 'usuzovani',
  testLike: 'sifry',
  banks: { 6: L6 },
  gen: {
    1: (rng) => znaky(1, rng),
    2: (rng) => {
      const r = rng.next();
      return r < 0.45 ? znaky(2, rng) : r < 0.75 ? cisla(2, rng) : zapis(rng);
    },
    3: (rng) => {
      const r = rng.next();
      return r < 0.4 ? posun('dal', rng) : r < 0.6 ? cisla(3, rng) : r < 0.75 ? cislaZapis(rng) : znaky(3, rng);
    },
    4: (rng) => {
      const r = rng.next();
      return r < 0.35 ? posun('zasifruj', rng) : r < 0.65 ? posun('zpet', rng) : obrazek(4, rng);
    },
    5: (rng) => {
      const r = rng.next();
      return r < 0.4 ? morse(false, rng) : r < 0.6 ? morse(true, rng) : obrazek(5, rng);
    },
    6: (rng) => {
      const r = rng.next();
      return r < 0.35 ? svetla('precti', rng) : r < 0.6 ? svetla('zapni', rng) : r < 0.8 ? svetla('plus1', rng) : posun('tri', rng);
    },
  },
  genShare: 0.75,
});

export const sifryCards: KnowledgeCard[] = [
  {
    id: `${ID}.braillovo-pismo`,
    skillId: ID,
    level: 2,
    emoji: '👆',
    title: 'Písmo pro prsty',
    text: 'Louis Braille vymyslel písmo z vystouplých teček, když mu bylo asi patnáct let. Každé písmeno tvoří nejvýš šest teček a nevidomí lidé je čtou prsty.',
  },
  {
    id: `${ID}.caesar`,
    skillId: ID,
    level: 3,
    emoji: '🏛️',
    title: 'Caesarova šifra',
    text: 'Římský vládce Julius Caesar podle starých zápisů posílal tajné dopisy, ve kterých každé písmeno posunul o tři místa v abecedě. Proto se takové šifře dodnes říká Caesarova.',
  },
  {
    id: `${ID}.sos`,
    skillId: ID,
    level: 5,
    emoji: '🆘',
    title: 'Co znamená SOS',
    text: 'Nouzový signál SOS se v Morseově abecedě vysílá jako tři tečky, tři čárky a tři tečky. Dá se vyťukat, zablikat baterkou i zapískat.',
    fix: {
      before: 'SOS je zkratka anglických slov „save our souls“.',
      evidence: 'V mezinárodních pravidlech z roku 1906, kdy se signál zaváděl, žádná slova nejsou – jen tečky a čárky, které se snadno vysílají i poznají. Slova si k písmenům lidé vymysleli až později.',
    },
  },
  {
    id: `${ID}.nuly-jednicky`,
    skillId: ID,
    level: 6,
    emoji: '💡',
    title: 'Nuly a jedničky',
    text: 'Počítač si všechno pamatuje jako nuly a jedničky – jako lampy, které svítí, nebo nesvítí. Z nich skládá čísla, písmena, obrázky i hudbu.',
  },
];
