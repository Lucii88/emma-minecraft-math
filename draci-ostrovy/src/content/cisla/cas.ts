// Hodiny a čas. České vyjádření času: „půl třetí“ = 2:30,
// „čtvrt na tři“ = 2:15, „tři čtvrtě na tři“ = 2:45.

import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { choice, count, type Forms } from '../../core/czech';
import { mk, N, num, type ItemParts } from './common';

const ID = 'cisla.cas';

const HOURS_NOM: Forms = ['hodina', 'hodiny', 'hodin'];
/** Řadová číslovka ve 2. pádě ženského rodu pro „půl …“ (půl třetí = 2:30). */
const HALF: Record<number, string> = {
  1: 'jedné', 2: 'druhé', 3: 'třetí', 4: 'čtvrté', 5: 'páté', 6: 'šesté',
  7: 'sedmé', 8: 'osmé', 9: 'deváté', 10: 'desáté', 11: 'jedenácté', 12: 'dvanácté',
};
/** Základní číslovka ve 4. pádě pro „čtvrt na …“ (čtvrt na tři = 2:15). */
const ON: Record<number, string> = {
  1: 'jednu', 2: 'dvě', 3: 'tři', 4: 'čtyři', 5: 'pět', 6: 'šest',
  7: 'sedm', 8: 'osm', 9: 'devět', 10: 'deset', 11: 'jedenáct', 12: 'dvanáct',
};

const next = (h: number) => (h % 12) + 1;

/** Slovní vyjádření času na ciferníku (h 1–12, m 0/15/30/45). */
export function clockWords(h: number, m: number): string {
  if (m === 0) return count(h, HOURS_NOM);
  if (m === 15) return `čtvrt na ${ON[next(h)]}`;
  if (m === 30) return `půl ${HALF[next(h)]}`;
  return `tři čtvrtě na ${ON[next(h)]}`;
}

const digital = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

function attempt(level: Level, rng: Rng): ItemParts | null {
  if (level === 1) {
    const h = rng.int(1, 12);
    const others = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((x) => x !== h)).slice(0, 3);
    // typická chyba: záměna ručiček – malá ručička ukazuje na 12
    return {
      key: `h${h}`,
      prompt: 'Kolik je hodin?',
      visual: { type: 'clock', h, m: 0 },
      answer: choice(rng, count(h, HOURS_NOM), others.map((x) => count(x, HOURS_NOM))),
      hints: ['Velká ručička ukazuje nahoru na dvanáctku – je celá hodina.', 'Podívej se, kam ukazuje malá ručička.'],
      explanation: `Malá ručička ukazuje na ${h}, velká na 12: je ${count(h, HOURS_NOM)}.`,
    };
  }

  if (level === 2) {
    const h = rng.int(1, 12);
    const m = rng.pick([15, 30, 45]);
    const correct = clockWords(h, m);
    const wrongHour = m === 30 ? `půl ${HALF[h]}` : m === 15 ? `čtvrt na ${ON[h]}` : `tři čtvrtě na ${ON[h]}`;
    const others = [
      wrongHour, // častá chyba: „půl třetí“ místo „půl čtvrté“
      clockWords(h, m === 15 ? 45 : m === 45 ? 15 : 15),
      clockWords(h, m === 30 ? 45 : 30),
      count(h, HOURS_NOM),
    ];
    return {
      key: `q${h}-${m}`,
      prompt: 'Kolik je hodin?',
      visual: { type: 'clock', h, m },
      answer: choice(rng, correct, others),
      hints: [
        m === 30 ? 'Velká ručička je dole na šestce – je půl.' : m === 15 ? 'Velká ručička je na trojce – je čtvrt.' : 'Velká ručička je na devítce – jsou tři čtvrtě.',
        `Malá ručička už je za číslem ${h} a blíží se k číslu ${next(h)}. Čas říkáme podle hodiny, která teprve přijde.`,
      ],
      explanation: `Je ${digital(h, m)}, česky ${correct}.`,
      difficulty: 0.3,
    };
  }

  if (level === 3) {
    const h = rng.int(1, 12);
    const m = rng.int(1, 11) * 5;
    const wrong = [
      digital(h, (m + 5) % 60 === 0 ? m - 5 : (m + 5) % 60),
      digital(h === 12 ? 1 : h + 1, m),
      // záměna ručiček: minuty čtené jako číslo, na které ukazuje velká ručička
      digital(h, (m / 5) % 12 === 0 ? 10 : m / 5),
      digital(h === 1 ? 12 : h - 1, m),
    ];
    return {
      key: `m${h}-${m}`,
      prompt: 'Kolik je hodin? Vyber, jak to vypadá na digitálních hodinách.',
      visual: { type: 'clock', h, m },
      answer: choice(rng, digital(h, m), wrong),
      hints: ['Velká ručička: každé číslo na ciferníku znamená 5 minut.', `Velká ručička ukazuje na ${m / 5}, to je ${m / 5} × 5 minut.`],
      explanation: `Malá ručička je mezi ${h} a ${next(h)}, velká na ${m / 5} = ${m} minut: ${digital(h, m)}.`,
      difficulty: 0.2,
    };
  }

  // L4–L6: délka trvání
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const hrs = rng.int(1, 3);
    const mins = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    return {
      key: `conv${hrs}-${mins}`,
      prompt: `Kolik minut je ${count(hrs, N.hodina.nom)} a ${count(mins, N.minuta.nom)}?`,
      answer: num(hrs * 60 + mins, 'min'),
      hints: ['Jedna hodina má 60 minut.', `${hrs} × 60 = ${hrs * 60}. Přičti ${mins}.`],
      explanation: `${hrs} × 60 + ${mins} = ${hrs * 60 + mins} minut.`,
    };
  }
  if (kind === 1) {
    const sh = rng.int(8, 19);
    const sm = rng.int(0, 11) * 5;
    const dur = rng.int(3, 11) * 5;
    const end = sh * 60 + sm + dur;
    if (Math.floor(end / 60) === sh && rng.chance(0.6)) return null; // častěji přes celou hodinu
    return {
      key: `dur${sh}:${sm}+${dur}`,
      prompt: `Let k sousednímu ostrovu začal v ${sh}:${String(sm).padStart(2, '0')} a trval ${count(dur, N.minuta.acc)}. V kolik hodin drak přistál?`,
      answer: choice(rng, `${Math.floor(end / 60)}:${String(end % 60).padStart(2, '0')}`, [
        `${Math.floor(end / 60) + 1}:${String(end % 60).padStart(2, '0')}`,
        `${sh}:${String((sm + dur) % 100).padStart(2, '0')}`,
        `${Math.floor((end - 10) / 60)}:${String((end - 10) % 60).padStart(2, '0')}`,
      ]),
      hints: ['Kolik minut zbývá do celé hodiny?', `Od ${sh}:${String(sm).padStart(2, '0')} do ${sh + 1}:00 je ${60 - sm} minut.`],
      explanation: `${sh}:${String(sm).padStart(2, '0')} + ${dur} minut = ${Math.floor(end / 60)}:${String(end % 60).padStart(2, '0')}.`,
      difficulty: 0.3,
    };
  }
  const sh = rng.int(7, 18);
  const sm = rng.int(1, 11) * 5;
  const eh = sh + 1;
  const em = rng.int(0, 11) * 5;
  const diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 5 || diff >= 120) return null;
  return {
    key: `span${sh}:${sm}-${eh}:${em}`,
    prompt: `Kolik minut uplyne od ${sh}:${String(sm).padStart(2, '0')} do ${eh}:${String(em).padStart(2, '0')}?`,
    answer: num(diff, 'min'),
    hints: [`Od ${sh}:${String(sm).padStart(2, '0')} do ${eh}:00 je ${60 - sm} minut.`, `Přičti ještě ${em} minut.`],
    explanation: `${60 - sm} + ${em} = ${diff} minut.`,
    difficulty: 0.3,
  };
}

function generate(level: Level, rng: Rng) {
  for (let i = 0; i < 50; i++) {
    const p = attempt(level, rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const cas: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Hodiny a čas',
  description: 'Čtení ručičkových hodin (celé, půl, čtvrt, minuty) a počítání s časem – jak dlouho něco trvá a kdy skončí.',
  levels: [1, 2, 3, 4, 5],
  rvp: { 1: ['M-3-2-01'], 2: ['M-3-2-01', 'ČJS-3-3-01'], 3: ['M-3-2-01'], 4: ['M-3-2-01', 'ČJS-5-3-01'], 5: ['ČJS-5-3-01'] },
  ability: 'pocetni',
  generate,
};
