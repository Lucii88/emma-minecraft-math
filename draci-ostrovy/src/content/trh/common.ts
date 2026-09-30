// Společné pomůcky pro Vikingský trh: koruny a mince, zboží s cenami,
// postavy a zkrácené zápisy otázek pro banky úloh (src/core/bank.ts).
//
// Ceny jsou v celých korunách: haléřové mince se v Česku od roku 2008
// nepoužívají. Zboží se prodává „na trhu“ (stánky vikingského trhu) nebo
// „v obchodě“, aby úlohy dávaly smysl i v dnešním Česku.

import { capitalize, form, formatNumber, type Forms } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, Visual } from '../../core/types';
import type { ChoiceSpec, FixedSpec, NumberSpec, OrderSpec, Spec } from '../../core/bank';

// ---------------------------------------------------------------------------
// Koruny, mince a bankovky

/** Mince, které v Česku platí (Kč). */
export const COINS = [1, 2, 5, 10, 20, 50] as const;
/** Bankovky, které v Česku platí (Kč). */
export const NOTES = [100, 200, 500, 1000, 2000, 5000] as const;

/** „39 Kč“, „12 500 Kč“. */
export const kc = (n: number): string => `${formatNumber(n)} Kč`;

/** Koruny ve 4. pádě pro předčítání: „1 korunu“, „3 koruny“, „39 korun“. */
const KORUNA_ACC: Forms = ['korunu', 'koruny', 'korun'];
export const korun = (n: number): string => `${formatNumber(n)} ${form(n, KORUNA_ACC)}`;

/** Čím platíš (7. pád): „Platíš pětistovkou.“ Mince 10–50 Kč a bankovky od 100 Kč. */
export const PAY_WITH: Record<number, string> = {
  10: 'desetikorunou',
  20: 'dvacetikorunou',
  50: 'padesátikorunou',
  100: 'stokorunou',
  200: 'dvoustovkou',
  500: 'pětistovkou',
  1000: 'tisícovkou',
  2000: 'dvoutisícovkou',
  5000: 'pětitisícovkou',
};

/** Rozklad částky hladově jen z hodnot `allowed` (od největší). Když to
 *  nejde beze zbytku, vrátí null. */
export function greedy(amount: number, allowed: readonly number[]): number[] | null {
  const values = [...allowed].sort((a, b) => b - a);
  const out: number[] = [];
  let rest = amount;
  for (const v of values) {
    while (rest >= v) {
      out.push(v);
      rest -= v;
    }
  }
  return rest === 0 ? out : null;
}

/** Náhodný rozklad částky na mince a bankovky z `allowed`, seřazený od
 *  největší. Někdy rozmění velkou minci na menší, aby měšec nevypadal
 *  pokaždé stejně. Nejvýš `maxPieces` kusů; jinak nejmenší počet. */
export function split(rng: Rng, amount: number, allowed: readonly number[], maxPieces = 6): number[] | null {
  const values = [...allowed].sort((a, b) => b - a);
  for (let attempt = 0; attempt < 8; attempt++) {
    const out: number[] = [];
    let rest = amount;
    values.forEach((v, i) => {
      let k = Math.floor(rest / v);
      if (k > 0 && i < values.length - 1 && rng.chance(0.3)) k -= 1;
      for (let j = 0; j < k; j++) out.push(v);
      rest -= k * v;
    });
    if (rest === 0 && out.length <= maxPieces) return out;
  }
  const g = greedy(amount, values);
  return g && g.length <= maxPieces ? g : null;
}

export const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

/** „10 + 5 + 2“ */
export const plus = (values: readonly number[]): string => values.map(formatNumber).join(' + ');

/** Klíč z čísel: „10-5-2“. */
export const keyOf = (values: readonly number[]): string => values.join('-');

// ---------------------------------------------------------------------------
// Zboží

export interface Good {
  key: string;
  /** 1. pád: „svíčka“. */
  nom: string;
  /** 4. pád: „svíčku“. */
  acc: string;
  emoji: string;
  /** Obvyklé ceny v Kč. */
  min: number;
  max: number;
  /** Prodává se na trhu (jinak v obchodě). */
  trh?: boolean;
  /** Pomnožné nebo množné jméno („pastelky“, „ponožky“). */
  pl?: boolean;
}

const PLURAL = new Set(['pastelky', 'ponozky', 'rukavice', 'tenisky']);

const good = (key: string, nom: string, acc: string, emoji: string, min: number, max: number, trh = false): Good =>
  ({ key, nom, acc, emoji, min, max, ...(trh ? { trh: true } : {}), ...(PLURAL.has(key) ? { pl: true } : {}) });

export const GOODS: Good[] = [
  // do 20 Kč
  good('jablko', 'jablko', 'jablko', '🍎', 5, 9, true),
  good('hruska', 'hruška', 'hrušku', '🍐', 6, 10, true),
  good('rohlik', 'rohlík', 'rohlík', '🥐', 3, 5),
  good('lizatko', 'lízátko', 'lízátko', '🍭', 8, 15),
  good('pernicek', 'perníček', 'perníček', '🍪', 10, 18, true),
  good('tuzka', 'tužka', 'tužku', '✏️', 8, 15),
  good('sesit', 'sešit', 'sešit', '📓', 12, 20),
  good('balonek', 'balónek', 'balónek', '🎈', 5, 12, true),
  good('citron', 'citron', 'citron', '🍋', 6, 12),
  good('vajicko', 'vajíčko', 'vajíčko', '🥚', 4, 7, true),
  // do 100 Kč
  good('mydlo', 'mýdlo', 'mýdlo', '🧼', 15, 35, true),
  good('mleko', 'mléko', 'mléko', '🥛', 18, 28),
  good('svicka', 'svíčka', 'svíčku', '🕯️', 20, 60, true),
  good('chleb', 'chléb', 'chléb', '🍞', 35, 55, true),
  good('syr', 'sýr', 'sýr', '🧀', 40, 80, true),
  good('pastelky', 'pastelky', 'pastelky', '🖍️', 40, 95),
  good('jojo', 'jojo', 'jojo', '🪀', 40, 90),
  good('ponozky', 'ponožky', 'ponožky', '🧦', 50, 95, true),
  good('miska', 'dřevěná miska', 'dřevěnou misku', '🥣', 40, 90, true),
  // dražší
  good('med', 'sklenice medu', 'sklenici medu', '🍯', 120, 220, true),
  good('vlna', 'klubko vlny', 'klubko vlny', '🧶', 60, 150, true),
  good('konik', 'dřevěný koník', 'dřevěného koníka', '🎠', 150, 400, true),
  good('prut', 'rybářský prut', 'rybářský prut', '🎣', 250, 600, true),
  good('kosik', 'proutěný košík', 'proutěný košík', '🧺', 80, 250, true),
  good('dzban', 'hliněný džbán', 'hliněný džbán', '🏺', 100, 300, true),
  good('sala', 'vlněná šála', 'vlněnou šálu', '🧣', 150, 350, true),
  good('rukavice', 'rukavice', 'rukavice', '🧤', 100, 300),
  good('knizka', 'knížka', 'knížku', '📖', 150, 350),
  good('mic', 'míč', 'míč', '⚽', 150, 400),
  good('puzzle', 'puzzle', 'puzzle', '🧩', 150, 400),
  good('plysak', 'plyšák', 'plyšáka', '🧸', 150, 500),
  good('drak', 'papírový drak', 'papírového draka', '🪁', 150, 300),
  good('batoh', 'batoh', 'batoh', '🎒', 400, 900),
  good('tenisky', 'tenisky', 'tenisky', '👟', 500, 1200),
];

/** Zboží na kusy (balení, „3 za cenu 2“, nákup více kusů). */
export interface Piece {
  key: string;
  /** 1. pád pro počet [1, 2–4, 5+]: ['svíčka', 'svíčky', 'svíček']. */
  nom: Forms;
  /** 4. pád pro počet [1, 2–4, 5+]: ['svíčku', 'svíčky', 'svíček']. */
  acc: Forms;
  /** Rod kvůli „jeden / jednu / jedno“. */
  rod: 'm' | 'f' | 'n';
  emoji: string;
  /** Cena za kus v Kč. */
  min: number;
  max: number;
  trh?: boolean;
}

const piece = (key: string, nom: Forms, acc: Forms, rod: Piece['rod'], emoji: string, min: number, max: number, trh = false): Piece =>
  ({ key, nom, acc, rod, emoji, min, max, ...(trh ? { trh: true } : {}) });

export const PIECES: Piece[] = [
  piece('rohlik', ['rohlík', 'rohlíky', 'rohlíků'], ['rohlík', 'rohlíky', 'rohlíků'], 'm', '🥐', 3, 5),
  piece('vajicko', ['vajíčko', 'vajíčka', 'vajíček'], ['vajíčko', 'vajíčka', 'vajíček'], 'n', '🥚', 4, 7, true),
  piece('jablko', ['jablko', 'jablka', 'jablek'], ['jablko', 'jablka', 'jablek'], 'n', '🍎', 5, 9, true),
  piece('svicka', ['svíčka', 'svíčky', 'svíček'], ['svíčku', 'svíčky', 'svíček'], 'f', '🕯️', 15, 40, true),
  piece('tuzka', ['tužka', 'tužky', 'tužek'], ['tužku', 'tužky', 'tužek'], 'f', '✏️', 6, 15),
  piece('mydlo', ['mýdlo', 'mýdla', 'mýdel'], ['mýdlo', 'mýdla', 'mýdel'], 'n', '🧼', 12, 30, true),
  piece('sesit', ['sešit', 'sešity', 'sešitů'], ['sešit', 'sešity', 'sešitů'], 'm', '📓', 10, 25),
  piece('vlna', ['klubko vlny', 'klubka vlny', 'klubek vlny'], ['klubko vlny', 'klubka vlny', 'klubek vlny'], 'n', '🧶', 60, 120, true),
  piece('pernicek', ['perníček', 'perníčky', 'perníčků'], ['perníček', 'perníčky', 'perníčků'], 'm', '🍪', 8, 18, true),
  piece('lizatko', ['lízátko', 'lízátka', 'lízátek'], ['lízátko', 'lízátka', 'lízátek'], 'n', '🍭', 6, 15),
  piece('balonek', ['balónek', 'balónky', 'balónků'], ['balónek', 'balónky', 'balónků'], 'm', '🎈', 4, 12, true),
  piece('med', ['sklenice medu', 'sklenice medu', 'sklenic medu'], ['sklenici medu', 'sklenice medu', 'sklenic medu'], 'f', '🍯', 120, 200, true),
  piece('ponozky', ['pár ponožek', 'páry ponožek', 'párů ponožek'], ['pár ponožek', 'páry ponožek', 'párů ponožek'], 'm', '🧦', 50, 95, true),
  piece('citron', ['citron', 'citrony', 'citronů'], ['citron', 'citrony', 'citronů'], 'm', '🍋', 6, 12),
];

/** „jeden rohlík“, „jednu svíčku“, „jedno mýdlo“ (4. pád). */
export const ONE_ACC: Record<Piece['rod'], string> = { m: 'jeden', f: 'jednu', n: 'jedno' };
/** „jeden rohlík“, „jedna svíčka“, „jedno mýdlo“ (1. pád). */
export const ONE_NOM: Record<Piece['rod'], string> = { m: 'jeden', f: 'jedna', n: 'jedno' };

/** Zboží, jehož cena se vejde do rozsahu. */
export const goodsBetween = (min: number, max: number): Good[] => GOODS.filter((x) => x.min >= min && x.max <= max);

/** Náhodná cena zboží. U dražších věcí často končí devítkou, jako v obchodě. */
export function priceOf(rng: Rng, x: Good): number {
  const p = rng.int(x.min, x.max);
  if (p >= 40 && rng.chance(0.4)) {
    const nine = Math.round(p / 10) * 10 - 1;
    if (nine >= x.min && nine <= x.max) return nine;
  }
  return p;
}

/** Karty s nabídkou: zboží a cenovka „N Kč“. */
export function offer(items: { good: Good; price: number }[]): Visual {
  return { type: 'cards', cards: items.map((i) => ({ emoji: i.good.emoji, title: capitalize(i.good.nom), tag: kc(i.price) })) };
}

/** Nabídka k předčítání: „lízátko za 12 korun, balónek za 8 korun a míč za 150 korun“. */
export const speakOffer = (items: { good: Good; price: number }[]): string =>
  list(items.map((i) => `${i.good.nom} za ${korun(i.price)}`));

/** Nabídka se slovesem, které se shoduje s první věcí: „je lízátko za 12 korun…“,
 *  „jsou ponožky za 82 korun…“ (pro „Na kartách …“, „Na účtence …“). */
export const isOffer = (items: { good: Good; price: number }[]): string =>
  `${items[0].good.pl ? 'jsou' : 'je'} ${speakOffer(items)}`;

/** Sloveso ke zbytku: „1 Kč ti zbude“, „3 Kč ti zbudou“, „5 Kč ti zbude“. */
export const zbudeVerb = (n: number): string => form(n, ['zbude', 'zbudou', 'zbude']);

/** „a, b a c“ */
export function list(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} a ${parts[parts.length - 1]}`;
}

/** Vybere `n` různých prvků (pořadí podle vstupu, aby vizuál byl pro stejný
 *  klíč vždy stejný). */
export function pickDistinct<T>(rng: Rng, items: readonly T[], n: number): T[] {
  const chosen = new Set(rng.shuffle(items.map((_, i) => i)).slice(0, n));
  return items.filter((_, i) => chosen.has(i));
}

// ---------------------------------------------------------------------------
// Postavy

export interface Person {
  name: string;
  f: boolean;
  /** 2. pád (u koho): „u Leifa“, „u Runy“. */
  gen: string;
}

export const PEOPLE: Person[] = [
  { name: 'Ingrid', f: true, gen: 'Ingrid' },
  { name: 'Runa', f: true, gen: 'Runy' },
  { name: 'Sigrid', f: true, gen: 'Sigrid' },
  { name: 'Liv', f: true, gen: 'Liv' },
  { name: 'Tove', f: true, gen: 'Tove' },
  { name: 'Alva', f: true, gen: 'Alvy' },
  { name: 'Anna', f: true, gen: 'Anny' },
  { name: 'Leif', f: false, gen: 'Leifa' },
  { name: 'Knut', f: false, gen: 'Knuta' },
  { name: 'Erik', f: false, gen: 'Erika' },
  { name: 'Ivar', f: false, gen: 'Ivara' },
  { name: 'Dag', f: false, gen: 'Daga' },
  { name: 'Petr', f: false, gen: 'Petra' },
  { name: 'Tom', f: false, gen: 'Toma' },
];

/** Tvar podle rodu postavy: v(p, 'koupil', 'koupila'). */
export const v = (p: Person, masc: string, fem: string): string => (p.f ? fem : masc);

/** Klíč postavy: „ingrid“. */
export const pkey = (p: Person): string => p.name.toLowerCase();

// ---------------------------------------------------------------------------
// Čísla ve správném tvaru

export const TYDEN: Forms = ['týden', 'týdny', 'týdnů'];
export const MESIC: Forms = ['měsíc', 'měsíce', 'měsíců'];
export const ROK: Forms = ['rok', 'roky', 'let'];

// ---------------------------------------------------------------------------
// Generátory

/** Pokus o úlohu: když náhodná čísla nevyjdou, vrátí null a zkusí se znovu. */
export type Attempt = (rng: Rng) => Spec | null;

/** Generátor z několika druhů úloh s vahami. Nevydařené pokusy opakuje. */
export function mix(id: string, parts: [number, Attempt][]): (rng: Rng) => Spec {
  const total = parts.reduce((a, [w]) => a + w, 0);
  return (rng) => {
    for (let i = 0; i < 300; i++) {
      let r = rng.next() * total;
      let chosen = parts[parts.length - 1][1];
      for (const [w, gen] of parts) {
        if (r < w) {
          chosen = gen;
          break;
        }
        r -= w;
      }
      const spec = chosen(rng);
      if (spec) return spec;
    }
    throw new Error(`${id}: nepodařilo se vytvořit úlohu`);
  };
}

/** Zaokrouhlení na desítky (5 nahoru, jak se učí ve škole). */
export const round10 = (n: number): number => Math.floor((n + 5) / 10) * 10;

// ---------------------------------------------------------------------------
// Zkrácené zápisy otázek

type Extra = { speak?: string; visual?: Visual; difficulty?: number };

/** Výběr: správná + 2–5 chybných (ukážou se nejvýš 3). */
export function q(
  key: string,
  prompt: string,
  correct: string | ChoiceOption,
  wrong: (string | ChoiceOption)[],
  hints: string[],
  explain: string,
  extra: Extra = {},
): ChoiceSpec {
  return { key, prompt, correct, wrong, hints, explain, ...extra };
}

/** Stálá tlačítka ve stálém pořadí. */
export function fx(
  key: string,
  prompt: string,
  options: (string | ChoiceOption)[],
  correct: number,
  hints: string[],
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return { kind: 'fixed', key, prompt, options, correct, hints, explain, ...extra };
}

/** Číselná odpověď. */
export function nm(
  key: string,
  prompt: string,
  correct: number,
  hints: string[],
  explain: string,
  extra: Extra & { unit?: string } = {},
): NumberSpec {
  return { kind: 'number', key, prompt, correct, hints, explain, ...extra };
}

/** Seřazení: `correct` je správné pořadí. */
export function ord(key: string, prompt: string, correct: string[], hints: string[], explain: string, extra: Extra = {}): OrderSpec {
  return { kind: 'order', key, prompt, correct, hints, explain, ...extra };
}

/** Stálé dvojice tlačítek. */
export const ANO_STACI = ['Ano, stačí', 'Ne, nestačí'];
export const ANO_SPRAVNE = ['Ano, správně', 'Ne, špatně'];
export const POTREBA_PRANI = ['Potřeba', 'Přání'];
export const PRIJEM_VYDAJ = ['Příjem', 'Výdaj'];
