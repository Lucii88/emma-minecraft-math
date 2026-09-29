// Přesmyčky: z přeházených písmen složit běžné podstatné jméno.
// Písmena s diakritikou jsou samostatná (Ř, Í, Ů…). Slova s „ch“ nepoužíváme,
// protože ch je v češtině jedno písmeno a na dvou kartičkách by mátlo.
// Seznam je vybraný tak, aby z písmen žádného slova nešlo složit jiné běžné
// české slovo (např. vynecháváme SOVA/VOSA, LAMPA/PALMA, RAK/KRA, HRAD/HADR,
// KABÁT/TABÁK, RAKETA/KARATE, BUBENÍK/BUBÍNEK, LÍPA/PÍLA, SEŠIT/ŠESTI, VRÁNA/VARNÁ).

import type { Level, SkillDef } from '../../core/types';
import { assertUniqueKeys, makeGenerator, slug, type Entry, type Pools } from './common';

const ID = 'slova.presmycky';

const C = {
  zvire: 'Je to zvíře.',
  jidlo: 'Je to něco k jídlu.',
  piti: 'Je to něco k pití.',
  ovoce: 'Je to ovoce.',
  zelenina: 'Je to zelenina.',
  telo: 'Je to část těla.',
  doprava: 'Je to dopravní prostředek.',
  stavba: 'Je to stavba.',
  priroda: 'Je to něco z přírody.',
  obloha: 'Najdeš to na obloze nebo ve vesmíru.',
  rostlina: 'Je to rostlina.',
  strom: 'Je to strom.',
  vec: 'Je to užitečná věc.',
  kuchyn: 'Je to věc z kuchyně.',
  nabytek: 'Je to kus nábytku.',
  obleceni: 'Je to oblečení nebo obuv.',
  skola: 'Je to věc do školy.',
  hracka: 'Je to hračka.',
  hudba: 'Je to hudební nástroj.',
  viking: 'Patří to do světa Vikingů a lodí.',
  osoba: 'Je to člověk.',
  pohadka: 'Znáš to z pohádek a pověstí.',
  hlava: 'Nosí se to na hlavě.',
  kridlo: 'Mají to ptáci, draci i letadla.',
  pribeh: 'Dá se to vyprávět nebo číst.',
  zima: 'Patří to k zimě.',
  ozdoba: 'Je to ozdoba.',
  svatek: 'Dostaneš to k narozeninám nebo k Vánocům.',
  nahore: 'Je to vysoko nad námi.',
} as const;

type Cat = keyof typeof C;

/** [slovo velkými písmeny, kategorie] podle úrovně. */
export const WORDS: Record<1 | 2 | 3 | 4, [string, Cat][]> = {
  1: [
    ['DŮM', 'stavba'], ['LES', 'priroda'], ['PES', 'zvire'], ['KŮŇ', 'zvire'], ['SÝR', 'jidlo'],
    ['NOS', 'telo'], ['LEV', 'zvire'], ['OKO', 'telo'], ['VŮZ', 'doprava'], ['SŮL', 'jidlo'],
    ['LOĎ', 'doprava'], ['DRAK', 'pohadka'], ['RYBA', 'zvire'], ['KOZA', 'zvire'], ['MAPA', 'vec'],
    ['KOLO', 'doprava'], ['AUTO', 'doprava'], ['MOST', 'stavba'], 
    ['NEBE', 'nahore'], ['ŽÁBA', 'zvire'], ['SLON', 'zvire'], ['MRAK', 'obloha'], ['HORA', 'priroda'],
    ['HŮL', 'vec'], ['ZUB', 'telo'], ['KLÍČ', 'vec'], ['PERO', 'skola'],
    ['STŮL', 'nabytek'], ['MYŠ', 'zvire'], ['BOTA', 'obleceni'], ['ŠÁLA', 'obleceni'], ['DORT', 'jidlo'],
    ['MED', 'jidlo'], ['CUKR', 'jidlo'], ['VODA', 'piti'], ['OHEŇ', 'priroda'], ['LED', 'priroda'],
    ['SNÍH', 'priroda'], ['ŠNEK', 'zvire'], ['VĚŽ', 'stavba'], ['ŠTÍT', 'viking'], ['LANO', 'vec'],
    ['PLOT', 'stavba'], ['DUB', 'strom'], ['BUK', 'strom'], ['MÁK', 'rostlina'], ['ČAJ', 'piti'],
  ],
  2: [
    ['KOČKA', 'zvire'], ['MLÉKO', 'piti'], ['TRÁVA', 'rostlina'], ['KNIHA', 'vec'], ['LŽÍCE', 'kuchyn'],
    ['TALÍŘ', 'kuchyn'], ['HELMA', 'hlava'], ['VESLO', 'viking'], ['KRÁVA', 'zvire'], ['OVOCE', 'jidlo'],
    ['MRKEV', 'zelenina'], ['ŠIŠKA', 'priroda'], ['HOUBA', 'priroda'], ['HRNEK', 'kuchyn'], ['MOTÝL', 'zvire'],
    ['LIŠKA', 'zvire'], ['ŽIDLE', 'nabytek'], ['DVEŘE', 'vec'], ['STROM', 'rostlina'], ['DOMEK', 'stavba'],
    ['SOPKA', 'priroda'], ['RYBÁŘ', 'osoba'], ['BOUDA', 'stavba'],
    ['BRÁNA', 'stavba'], ['TAŠKA', 'vec'], ['PENÁL', 'skola'],
    ['KŘÍDA', 'skola'], ['BUBEN', 'hudba'], ['HARFA', 'hudba'], ['BANÁN', 'ovoce'], ['KOLÁČ', 'jidlo'],
    ['ŽALUD', 'priroda'], ['OBLAK', 'obloha'], ['SUKNĚ', 'obleceni'], ['KOVÁŘ', 'osoba'],
  ],
  3: [
    ['SLUNCE', 'obloha'], ['JAHODA', 'ovoce'], ['CIBULE', 'zelenina'], ['HRUŠKA', 'ovoce'], ['MELOUN', 'ovoce'],
    ['CITRON', 'ovoce'], ['ROHLÍK', 'jidlo'], ['KOHOUT', 'zvire'], ['POSTEL', 'nabytek'], ['ZVONEK', 'vec'],
    ['OSTROV', 'priroda'], ['PŘILBA', 'hlava'], ['VIKING', 'osoba'], ['SEKERA', 'vec'], ['KŘÍDLO', 'kridlo'],
    ['KLUBKO', 'vec'], ['SÝKORA', 'zvire'], ['ČEPICE', 'obleceni'], ['LAVICE', 'skola'], ['ŽIRAFA', 'zvire'],
    ['HVĚZDA', 'obloha'], ['PRSTEN', 'ozdoba'], ['KORUNA', 'pohadka'], ['JABLKO', 'ovoce'],
    ['HOUSKA', 'jidlo'], ['SVÍČKA', 'vec'], ['KOSTKA', 'hracka'], ['PAVOUK', 'zvire'], ['DELFÍN', 'zvire'],
    ['TUČŇÁK', 'zvire'], ['MEDVĚD', 'zvire'], ['JEZERO', 'priroda'], ['RYBNÍK', 'priroda'],
  ],
  4: [
    ['KAMARÁD', 'osoba'], ['PODKOVA', 'vec'], ['POLÉVKA', 'jidlo'], ['BALÓNEK', 'hracka'],
    ['PANENKA', 'hracka'], ['BERUŠKA', 'zvire'], ['VELRYBA', 'zvire'], ['ZAHRADA', 'priroda'], ['JESKYNĚ', 'priroda'],
    ['TULIPÁN', 'rostlina'], ['SLEPICE', 'zvire'], ['VEVERKA', 'zvire'], ['MRAVENEC', 'zvire'], ['POLŠTÁŘ', 'vec'],
    ['SUŠENKA', 'jidlo'], ['ČOKOLÁDA', 'jidlo'], ['KROKODÝL', 'zvire'], ['MOTÝLEK', 'zvire'], ['LETADLO', 'doprava'],
    ['ZMRZLINA', 'jidlo'], ['BRAMBORA', 'zelenina'], ['PAPRIKA', 'zelenina'], ['KAPUSTA', 'zelenina'], ['PASTELKA', 'skola'],
    ['PRAVÍTKO', 'skola'], ['SEMAFOR', 'vec'], ['AUTOBUS', 'doprava'], ['TRAKTOR', 'doprava'], ['TRAMVAJ', 'doprava'],
    ['PŘÍSTAV', 'viking'], ['KORMIDLO', 'viking'], ['VODOPÁD', 'priroda'], ['SNĚHULÁK', 'zima'], ['POHÁDKA', 'pribeh'],
    ['DRAČICE', 'pohadka'], ['KRÁLOVNA', 'osoba'], ['TRUMPETA', 'hudba'], ['DÁREČEK', 'svatek'],
  ],
};

/** Zamíchá písmena tak, aby nevzniklo původní slovo. */
export function scramble(word: string, rng: { shuffle<T>(a: readonly T[]): T[] }): string[] {
  const letters = [...word];
  for (let i = 0; i < 50; i++) {
    const s = rng.shuffle(letters);
    if (s.join('') !== word) return s;
  }
  // Záchrana (prakticky nenastane): posun o jedno místo.
  return [...letters.slice(1), letters[0]];
}

function entry(word: string, cat: Cat, level: number): Entry {
  const letters = [...word];
  const first = letters[0];
  const last = letters[letters.length - 1];
  const hints = [C[cat], `Slovo začíná písmenem ${first}.`];
  if (level >= 2) hints.push(`Slovo končí písmenem ${last}.`);
  return {
    key: slug(word),
    build: (rng) => ({
      prompt: 'Slož slovo z přeházených písmen.',
      answer: { kind: 'letters', letters: scramble(word, rng), correct: word },
      hints,
      explanation: `Z těchto písmen se dá složit slovo ${word}.`,
    }),
  };
}

const levels: Level[] = [1, 2, 3, 4];

export const pools: Pools = {
  1: WORDS[1].map(([w, c]) => entry(w, c, 1)),
  2: WORDS[2].map(([w, c]) => entry(w, c, 2)),
  3: WORDS[3].map(([w, c]) => entry(w, c, 3)),
  4: WORDS[4].map(([w, c]) => entry(w, c, 4)),
};
assertUniqueKeys(ID, pools);

export const presmycky: SkillDef = {
  id: ID,
  island: 'slova',
  name: 'Přesmyčky',
  description: 'Skládá slova z přeházených písmen; procvičuje hláskovou stavbu slova, pozornost a slovní zásobu.',
  levels,
  rvp: {
    1: ['ČJL-3-2-01'],
    2: ['ČJL-3-2-01'],
    3: ['ČJL-3-2-01'],
    4: ['ČJL-3-2-01'],
  },
  ability: 'slovni',
  generate: makeGenerator(ID, levels, pools),
};
