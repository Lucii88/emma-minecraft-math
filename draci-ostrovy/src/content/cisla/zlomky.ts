import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { choice, count, type Forms, form } from '../../core/czech';
import { mk, num, type ItemParts } from './common';

const ID = 'cisla.zlomky';

const PART: Record<number, Forms> = {
  2: ['polovina', 'poloviny', 'polovin'],
  3: ['třetina', 'třetiny', 'třetin'],
  4: ['čtvrtina', 'čtvrtiny', 'čtvrtin'],
  5: ['pětina', 'pětiny', 'pětin'],
  6: ['šestina', 'šestiny', 'šestin'],
  7: ['sedmina', 'sedminy', 'sedmin'],
  8: ['osmina', 'osminy', 'osmin'],
  9: ['devítina', 'devítiny', 'devítin'],
  10: ['desetina', 'desetiny', 'desetin'],
  12: ['dvanáctina', 'dvanáctiny', 'dvanáctin'],
  16: ['šestnáctina', 'šestnáctiny', 'šestnáctin'],
  20: ['dvacetina', 'dvacetiny', 'dvacetin'],
};
const NUMERAL = ['', 'jedna', 'dvě', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět'];
const DILY_ACC: Forms = ['stejný díl', 'stejné díly', 'stejných dílů'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „tři čtvrtiny“, „pět osmin“. */
export function fractionWords(n: number, d: number): string {
  return `${NUMERAL[n]} ${form(n, PART[d])}`;
}

const frac = (n: number, d: number) => ({ label: `${n}/${d}`, speak: fractionWords(n, d) });

function attempt(level: Level, rng: Rng): ItemParts | null {
  const pick = rng.int(0, 99);

  if (level === 3) {
    if (pick < 60) {
      const d = rng.pick([2, 3, 4]);
      const shape = rng.pick(['pie', 'bar'] as const);
      return {
        key: `v1-${d}-${shape}`,
        prompt: `Jaká část ${shape === 'pie' ? 'koláče' : 'čokolády'} je vybarvená?`,
        visual: { type: 'fraction', parts: d, filled: 1, shape },
        answer: choice(rng, frac(1, d), [2, 3, 4, 5].filter((x) => x !== d).map((x) => frac(1, x))),
        hints: ['Na kolik stejných dílů je celek rozdělený?', 'Jeden díl ze dvou je polovina, ze tří třetina, ze čtyř čtvrtina.'],
        explanation: `Celek má ${count(d, DILY_ACC)} a vybarvený je jeden: ${fractionWords(1, d)}.`,
      };
    }
    const d = rng.pick([2, 3, 4]);
    const q = rng.int(2, 10);
    return {
      key: `z1-${d}-${q * d}`,
      prompt: `Kolik je ${PART[d][0]} z ${q * d}?`,
      answer: num(q),
      hints: [`${cap(PART[d][0])} znamená rozdělit na ${count(d, DILY_ACC)}.`, `${q * d} : ${d} = ?`],
      explanation: `${q * d} : ${d} = ${q}.`,
      difficulty: 0.2,
    };
  }

  if (level === 4) {
    if (pick < 45) {
      const d = rng.pick([3, 4, 5, 6, 8, 10]);
      const n = rng.int(1, d - 1);
      const shape = rng.pick(['pie', 'bar'] as const);
      const distract = [frac(d - n, d), frac(n, d + 1 > 10 ? d - 1 : d + 1), frac(Math.max(1, n - 1) === n ? n + 1 : n - 1, d)];
      return {
        key: `v-${n}-${d}-${shape}`,
        prompt: `Jaká část je vybarvená?`,
        visual: { type: 'fraction', parts: d, filled: n, shape },
        answer: choice(rng, frac(n, d), distract),
        hints: ['Spočítej všechny díly – to je číslo dole.', 'Spočítej vybarvené díly – to je číslo nahoře.'],
        explanation: `Vybarveno je ${n} z ${d} dílů: ${n}/${d}, tedy ${fractionWords(n, d)}.`,
      };
    }
    if (pick < 75) {
      const d = rng.pick([2, 3, 4, 5, 10]);
      const q = rng.int(2, 12);
      return {
        key: `z1-${d}-${q * d}`,
        prompt: `Kolik je ${PART[d][0]} z ${q * d}?`,
        answer: num(q),
        hints: [`Rozděl ${q * d} na ${count(d, DILY_ACC)}.`],
        explanation: `${q * d} : ${d} = ${q}.`,
      };
    }
    const d = rng.pick([3, 4, 5]);
    const n = rng.int(2, d - 1);
    const q = rng.int(2, 10);
    return {
      key: `zn-${n}-${d}-${q * d}`,
      prompt: `Kolik jsou ${fractionWords(n, d)} z ${q * d}?`,
      answer: num(n * q),
      hints: [`Nejdřív zjisti, kolik je ${PART[d][0]} z ${q * d}.`, `${cap(PART[d][0])} je ${q}. A ${NUMERAL[n]} takové díly?`],
      explanation: `${q * d} : ${d} = ${q} a ${n} × ${q} = ${n * q}.`,
      difficulty: 0.4,
    };
  }

  // L5–L6: porovnání a sčítání se stejným jmenovatelem, doplnění do celku
  const d = rng.pick(level === 5 ? [4, 5, 6, 8] : [6, 8, 10]);
  if (pick < 35) {
    const a = rng.int(1, d - 1);
    let b = rng.int(1, d - 1);
    if (a === b) b = a === 1 ? 2 : a - 1;
    const big = Math.max(a, b);
    return {
      key: `c${a}-${b}-${d}`,
      prompt: `Který díl je větší?`,
      answer: choice(rng, frac(big, d), [frac(Math.min(a, b), d)]),
      hints: ['Oba celky jsou rozdělené na stejně velké díly.', 'Víc stejných dílů je víc.'],
      explanation: `${big}/${d} je víc než ${Math.min(a, b)}/${d}: díly jsou stejně velké a ${big} je víc než ${Math.min(a, b)}.`,
      difficulty: -0.2,
    };
  }
  if (pick < 70) {
    const a = rng.int(1, d - 2);
    const b = rng.int(1, d - a - 1);
    const s = a + b;
    const distract = [frac(s, 2 * d), frac(Math.max(1, s - 1), d), frac(Math.min(9, s + 1), d)].filter((o) => o.label !== `${s}/${d}`);
    return {
      key: `a${a}+${b}-${d}`,
      prompt: `${a}/${d} + ${b}/${d} = ?`,
      speak: `${fractionWords(a, d)} plus ${fractionWords(b, d)}`,
      answer: choice(rng, frac(s, d), distract),
      hints: ['Díly jsou stejně velké – sčítáš jen počet dílů.', 'Číslo dole se nemění.'],
      explanation: `${a} + ${b} = ${s} dílů, tedy ${s}/${d}.`,
      difficulty: 0.2,
    };
  }
  const a = rng.int(1, d - 1);
  return {
    key: `w${a}-${d}`,
    prompt: `Kolik ${PART[d][2]} chybí do celku, když už máš ${a}/${d}?`,
    speak: `Kolik ${PART[d][2]} chybí do celku, když už máš ${fractionWords(a, d)}?`,
    answer: num(d - a),
    hints: [`Celek je ${d}/${d}.`, `Kolik chybí od ${a} do ${d}?`],
    explanation: `${a}/${d} + ${d - a}/${d} = ${d}/${d} = 1 celek.`,
    difficulty: 0.1,
  };
}

function generate(level: Level, rng: Rng) {
  for (let i = 0; i < 50; i++) {
    const p = attempt(level, rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const zlomky: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Díly a zlomky',
  description: 'Polovina, třetina, čtvrtina: část celku v obrázku, část z počtu, porovnání a sčítání dílů se stejným jmenovatelem.',
  levels: [3, 4, 5, 6],
  rvp: { 3: ['M-5-1-05'], 4: ['M-5-1-05'], 5: ['M-5-1-06'], 6: ['M-5-1-06'] },
  ability: 'pocetni',
  generate,
};

