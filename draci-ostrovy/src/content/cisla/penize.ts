import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { count, formatNumber as f, type Forms } from '../../core/czech';
import { mk, num, type ItemParts } from './common';

const ID = 'cisla.penize';

const COINS = [1, 2, 5, 10, 20, 50] as const;
const NOTES = [100, 200, 500, 1000] as const;
const MINCE: Forms = ['minci', 'mince', 'mincí'];

function sumItem(values: number[], difficulty = 0): ItemParts {
  const total = values.reduce((a, b) => a + b, 0);
  const sorted = values.slice().sort((a, b) => b - a);
  return {
    key: `s${sorted.join('+')}`,
    prompt: 'Kolik korun je v měšci?',
    visual: { type: 'coins', values: sorted },
    answer: num(total, 'Kč'),
    hints: ['Začni od největší mince nebo bankovky.', `Sčítej postupně: ${sorted[0]}, pak přidej ${sorted[1]}…`],
    explanation: `${sorted.join(' + ')} = ${f(total)} Kč.`,
    difficulty,
  };
}

/** Nejmenší počet mincí a bankovek (hladový postup funguje pro české mince). */
function fewest(amount: number): number[] {
  const all = [...NOTES, ...COINS].sort((a, b) => b - a);
  const out: number[] = [];
  let rest = amount;
  for (const v of all) {
    while (rest >= v) {
      out.push(v);
      rest -= v;
    }
  }
  return out;
}

function attempt(level: Level, rng: Rng): ItemParts | null {
  if (level === 1) {
    const k = rng.int(2, 4);
    const values = Array.from({ length: k }, () => rng.pick([1, 2, 5, 10]));
    if (values.reduce((a, b) => a + b, 0) > 20) return null;
    return sumItem(values);
  }

  if (level === 2) {
    if (rng.chance(0.55)) {
      const k = rng.int(3, 5);
      const values = Array.from({ length: k }, () => rng.pick(COINS));
      if (values.reduce((a, b) => a + b, 0) > 100) return null;
      return sumItem(values, 0.1);
    }
    const pay = rng.pick([20, 50, 100]);
    const price = rng.int(Math.floor(pay / 4), pay - 1);
    return {
      key: `ch${pay}-${price}`,
      prompt: `Platíš ${pay === 100 ? 'stokorunou' : pay === 50 ? 'padesátikorunou' : 'dvacetikorunou'}. Dračí sušenky stojí ${price} Kč. Kolik korun ti vrátí?`,
      answer: num(pay - price, 'Kč'),
      hints: ['Kolik chybí od ceny do částky, kterou platíš?', `Počítej od ${price} do ${pay}.`],
      explanation: `${pay} − ${price} = ${pay - price} Kč.`,
      difficulty: 0.2,
    };
  }

  if (level === 3) {
    if (rng.chance(0.4)) {
      const k = rng.int(3, 6);
      const values = Array.from({ length: k }, () => rng.pick([...NOTES.slice(0, 3), ...COINS.slice(2)]));
      if (values.reduce((a, b) => a + b, 0) > 1000) return null;
      return sumItem(values, 0.1);
    }
    const amount = rng.int(11, 99);
    const coins = fewest(amount);
    return {
      key: `few${amount}`,
      prompt: `Kolik nejméně mincí potřebuješ, abys {zaplatila|zaplatil} přesně ${amount} Kč? (Mince: 1, 2, 5, 10, 20 a 50 Kč.)`,
      speak: `Kolik nejméně mincí potřebuješ, abys {zaplatila|zaplatil} přesně ${amount} korun?`,
      answer: num(coins.length),
      hints: ['Začni tou největší mincí, která se do částky vejde.', `Nejdřív ${coins[0]} Kč, zbývá ${amount - coins[0]} Kč. Pokračuj stejně.`],
      explanation: `${coins.join(' + ')} = ${amount} Kč, celkem ${count(coins.length, MINCE)}.`,
      difficulty: 0.3,
    };
  }

  // L4+: nákup více věcí a vracení z bankovky
  const pay = rng.pick([200, 500, 1000]);
  const a = rng.int(20, Math.floor(pay / 3));
  const b = rng.int(20, Math.floor(pay / 3));
  const n = rng.int(2, 4);
  const total = a + n * b;
  if (total >= pay) return null;
  return {
    key: `buy${pay}-${a}-${n}x${b}`,
    prompt: `Na trhu kupuješ sedlo pro draka za ${a} Kč a ${n} ${n === 1 ? 'pytel' : 'pytle'} krmení po ${b} Kč. Platíš bankovkou ${f(pay)} Kč. Kolik ti vrátí?`,
    answer: num(pay - total, 'Kč'),
    hints: ['Nejdřív spočítej, kolik stojí všechno dohromady.', `Krmení: ${n} × ${b} = ${n * b} Kč. Celkem ${a} + ${n * b}.`],
    explanation: `${a} + ${n} × ${b} = ${total} Kč a ${f(pay)} − ${total} = ${f(pay - total)} Kč.`,
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

export const penize: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Peníze a placení',
  description: 'Sčítání mincí a bankovek, vracení peněz a placení co nejmenším počtem mincí.',
  levels: [1, 2, 3, 4, 5],
  rvp: { 1: ['M-3-1-01'], 2: ['M-3-1-04', 'M-3-1-05'], 3: ['M-3-1-05'], 4: ['M-5-1-04', 'ČJS-5-2-03'], 5: ['M-5-1-04', 'ČJS-5-2-03'] },
  ability: 'pocetni',
  generate,
};
