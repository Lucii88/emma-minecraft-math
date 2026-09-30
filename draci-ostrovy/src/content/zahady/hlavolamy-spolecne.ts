// Společné pomůcky pro hlavolamy na Ostrově záhad: postavy a draci se
// skloňováním, obrázky s názvy pro předčítání a drobnosti pro češtinu.

import type { ChoiceOption } from '../../core/types';

/** Obrázek (emoji) s českým názvem pro předčítání. */
export interface Pic {
  e: string;
  name: string;
}

export const picOption = (p: Pic): ChoiceOption => ({ label: p.e, speak: p.name });

/** Postava. Pády 2 a 3 mají jen jména, která se skloňují bez potíží
 *  (vedle Runy, naproti Leifovi); ostatní se používají jen v 1. pádě. */
export interface Person {
  nom: string;
  gen?: string;
  dat?: string;
  female: boolean;
}

export const PEOPLE: Person[] = [
  { nom: 'Runa', gen: 'Runy', dat: 'Runě', female: true },
  { nom: 'Alva', gen: 'Alvy', dat: 'Alvě', female: true },
  { nom: 'Anna', gen: 'Anny', dat: 'Anně', female: true },
  { nom: 'Freja', female: true },
  { nom: 'Maja', female: true },
  { nom: 'Liv', female: true },
  { nom: 'Sigrid', female: true },
  { nom: 'Ingrid', female: true },
  { nom: 'Tove', female: true },
  { nom: 'Leif', gen: 'Leifa', dat: 'Leifovi', female: false },
  { nom: 'Erik', gen: 'Erika', dat: 'Erikovi', female: false },
  { nom: 'Knut', gen: 'Knuta', dat: 'Knutovi', female: false },
  { nom: 'Ivar', gen: 'Ivara', dat: 'Ivarovi', female: false },
  { nom: 'Dag', gen: 'Daga', dat: 'Dagovi', female: false },
  { nom: 'Tom', gen: 'Toma', dat: 'Tomovi', female: false },
  { nom: 'Petr', gen: 'Petra', dat: 'Petrovi', female: false },
  { nom: 'Jonas', female: false },
];

/** Dračí jména: 1., 2. a 4. pád a obrázek živlu. */
export interface DragonName {
  nom: string;
  gen: string;
  acc: string;
  female: boolean;
  e: string;
}

export const DRAGON_NAMES: DragonName[] = [
  { nom: 'Jiskra', gen: 'Jiskry', acc: 'Jiskru', female: true, e: '🔥' },
  { nom: 'Kapka', gen: 'Kapky', acc: 'Kapku', female: true, e: '💧' },
  { nom: 'Vločka', gen: 'Vločky', acc: 'Vločku', female: true, e: '❄️' },
  { nom: 'Duha', gen: 'Duhy', acc: 'Duhu', female: true, e: '🌈' },
  { nom: 'Blesk', gen: 'Bleska', acc: 'Bleska', female: false, e: '⚡' },
  { nom: 'Mech', gen: 'Mecha', acc: 'Mecha', female: false, e: '🌿' },
  { nom: 'Obláček', gen: 'Obláčka', acc: 'Obláčka', female: false, e: '☁️' },
  { nom: 'Měsíček', gen: 'Měsíčka', acc: 'Měsíčka', female: false, e: '🌙' },
];

/** Výčet „a, b a c“. */
export function listCz(items: readonly string[], last = 'a'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`;
}

/** Řadové číslovky pro řádky a sloupce („první řádek“, „ve druhém řádku“). */
export const ORDINAL = ['první', 'druhý', 'třetí', 'čtvrtý', 'pátý', 'šestý'];
export const ORDINAL_LOC = ['prvním', 'druhém', 'třetím', 'čtvrtém', 'pátém', 'šestém'];

/** Všechna pořadí čísel 0 … n−1 (pro ověřování hrubou silou, n ≤ 6). */
export function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const rest of permutations(n - 1)) {
    for (let i = 0; i <= rest.length; i++) out.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  }
  return out;
}

/** Klíč z textu: malá písmena bez diakritiky, jiné znaky → pomlčka. */
export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Tvar počítaného předmětu pro předčítání: rod a tvary pro 1, 2–4. */
export interface Noun {
  /** 'm' = mužský (neživotný i životný), 'f' = ženský, 'n' = střední. */
  g: 'm' | 'f' | 'n';
  one: string;
  few: string;
}

const NUM: Record<'m' | 'f' | 'n', [string, string, string, string]> = {
  m: ['jeden', 'dva', 'tři', 'čtyři'],
  f: ['jedna', 'dvě', 'tři', 'čtyři'],
  n: ['jedno', 'dvě', 'tři', 'čtyři'],
};

/** „dvě hrušky“, „jeden citron“ (počet 1–4). Přídavné jméno volitelně
 *  i s tvary pro rod: [m1, f1, n1, m2–4, f2–4, n2–4]. */
export function countWords(n: number, noun: Noun, adj?: readonly [string, string, string, string, string, string]): string {
  if (n < 1 || n > 4) throw new Error(`countWords: počet ${n} mimo 1–4`);
  const gi = noun.g === 'm' ? 0 : noun.g === 'f' ? 1 : 2;
  const a = adj ? `${adj[n === 1 ? gi : 3 + gi]} ` : '';
  return `${NUM[noun.g][n - 1]} ${a}${n === 1 ? noun.one : noun.few}`;
}

/** Tvary tvrdého přídavného jména („modrý“) pro countWords. */
export function hardAdj(stem: string): [string, string, string, string, string, string] {
  // jeden modrý / jedna modrá / jedno modré / dva modré / dvě modré / dvě modrá
  return [`${stem}ý`, `${stem}á`, `${stem}é`, `${stem}é`, `${stem}é`, `${stem}á`];
}

/** Kolikrát zopakovat obrázek. */
export const rep = (e: string, n: number) => Array.from({ length: n }, () => e).join('');
