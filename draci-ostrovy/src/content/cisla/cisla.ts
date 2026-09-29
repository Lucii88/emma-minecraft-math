// Čísla, číselná osa, porovnávání, zaokrouhlování, záporná čísla.

import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { choice, count, formatNumber as f, type Forms } from '../../core/czech';
import { mk, num, type ItemParts } from './common';

const ID = 'cisla.cisla';

const DESITKA: Forms = ['desítka', 'desítky', 'desítek'];
const JEDNOTKA: Forms = ['jednotka', 'jednotky', 'jednotek'];
const STOVKA: Forms = ['stovka', 'stovky', 'stovek'];
const TISIC: Forms = ['tisíc', 'tisíce', 'tisíc'];
const STUPEN: Forms = ['stupeň', 'stupně', 'stupňů'];

function compareSign(a: number, b: number): string {
  return a < b ? '<' : a > b ? '>' : '=';
}

function signItem(rng: Rng, a: number, b: number, difficulty = 0): ItemParts {
  const correct = compareSign(a, b);
  const answer = choice(rng, { label: correct, speak: correct === '<' ? 'menší' : correct === '>' ? 'větší' : 'rovná se' }, [
    { label: '<', speak: 'menší' },
    { label: '>', speak: 'větší' },
    { label: '=', speak: 'rovná se' },
  ]);
  return {
    key: `s${a}?${b}`,
    prompt: `Doplň znaménko: ${f(a)} ☐ ${f(b)}`,
    speak: `Které znaménko patří mezi ${f(a)} a ${f(b)}?`,
    answer,
    hints: ['Které číslo je větší? Zobáček znaménka ukazuje vždy na menší číslo.', a >= 100 || b >= 100 ? 'Porovnej nejdřív stovky, pak desítky.' : 'Porovnej nejdřív desítky.'],
    explanation: `${f(a)} ${correct} ${f(b)}.`,
    difficulty,
  };
}

function lineItem(min: number, max: number, target: number, tolerance: number, difficulty = 0): ItemParts {
  return {
    key: `n${min}-${max}-${target}`,
    prompt: `Kam na ose patří číslo ${f(target)}? Posuň draka.`,
    visual: { type: 'numberline', min, max },
    answer: { kind: 'numberline', min, max, correct: target, tolerance },
    hints: [`Kde je na ose polovina, tedy ${f((min + max) / 2)}?`, `Je ${f(target)} víc, nebo míň než ${f((min + max) / 2)}?`],
    explanation: `Číslo ${f(target)} leží ${target < (min + max) / 2 ? 'před' : 'za'} polovinou osy (${f((min + max) / 2)}).`,
    difficulty,
  };
}

function attempt(level: Level, rng: Rng): ItemParts | null {
  const pick = rng.int(0, 99);

  if (level === 1) {
    if (pick < 35) {
      const a = rng.int(1, 20);
      let b = rng.int(1, 20);
      if (rng.chance(0.15)) b = a;
      return signItem(rng, a, b);
    }
    if (pick < 70) {
      const a = rng.int(1, 19);
      const after = rng.chance(0.5);
      return {
        key: `${after ? 'a' : 'b'}${a}`,
        prompt: after ? `Které číslo je hned za ${a}?` : `Které číslo je hned před ${a + 1}?`,
        answer: num(after ? a + 1 : a),
        hints: ['Počítej po jedné.'],
        explanation: after ? `Za ${a} je ${a + 1}.` : `Před ${a + 1} je ${a}.`,
        difficulty: -0.3,
      };
    }
    return lineItem(0, 20, rng.int(2, 18), 2);
  }

  if (level === 2) {
    if (pick < 25) {
      const t = rng.int(1, 9);
      const o = rng.int(0, 9);
      const askTens = rng.chance(0.5);
      return {
        key: `pv${t}${o}-${askTens ? 't' : 'o'}`,
        prompt: askTens ? `Kolik desítek má číslo ${t * 10 + o}?` : `Kolik jednotek má číslo ${t * 10 + o}?`,
        answer: num(askTens ? t : o),
        hints: ['Desítky jsou vlevo, jednotky vpravo.'],
        explanation: `${t * 10 + o} = ${count(t, DESITKA)} a ${count(o, JEDNOTKA)}.`,
        difficulty: -0.2,
      };
    }
    if (pick < 45) {
      const t = rng.int(1, 9);
      const o = rng.int(1, 9);
      return {
        key: `mk${t}-${o}`,
        prompt: `Které číslo má ${count(t, ['desítku', 'desítky', 'desítek'])} a ${count(o, ['jednotku', 'jednotky', 'jednotek'])}?`,
        answer: num(t * 10 + o),
        hints: [`${count(t, DESITKA)} je ${t * 10}.`],
        explanation: `${t * 10} + ${o} = ${t * 10 + o}.`,
      };
    }
    if (pick < 70) {
      const a = rng.int(10, 99);
      let b = rng.chance(0.4) ? Number(String(a).split('').reverse().join('')) : rng.int(10, 99);
      if (b < 10) b = a + 1 > 99 ? a - 1 : a + 1;
      return signItem(rng, a, b, 0.1);
    }
    return lineItem(0, 100, rng.int(5, 95), 7, 0.2);
  }

  if (level === 3) {
    if (pick < 30) {
      const digits = rng.shuffle([rng.int(1, 9), rng.int(0, 9), rng.int(1, 9)]);
      const nums = [...new Set([
        digits[0] * 100 + digits[1] * 10 + digits[2],
        digits[0] * 100 + digits[2] * 10 + digits[1],
        digits[1] * 100 + digits[0] * 10 + digits[2],
        digits[2] * 100 + digits[1] * 10 + digits[0],
        digits[2] * 100 + digits[0] * 10 + digits[1],
      ].filter((n) => n >= 100))];
      if (nums.length < 3) return null;
      const opts = rng.shuffle(nums).slice(0, 4);
      const askMax = rng.chance(0.5);
      const target = askMax ? Math.max(...opts) : Math.min(...opts);
      return {
        key: `mm${opts.slice().sort().join('-')}-${askMax ? 'max' : 'min'}`,
        prompt: askMax ? 'Které číslo je největší?' : 'Které číslo je nejmenší?',
        answer: choice(rng, String(target), opts.filter((n) => n !== target).map(String)),
        hints: ['Porovnej nejdřív stovky.', 'Když jsou stovky stejné, rozhodnou desítky.'],
        explanation: `${askMax ? 'Největší' : 'Nejmenší'} je ${target}.`,
        difficulty: 0.1,
      };
    }
    if (pick < 55) {
      const n = rng.int(101, 999);
      const place = rng.pick(['stovek', 'desítek', 'jednotek'] as const);
      const value = place === 'stovek' ? Math.floor(n / 100) : place === 'desítek' ? Math.floor(n / 10) % 10 : n % 10;
      return {
        key: `pv${n}-${place}`,
        prompt: `Kolik ${place} má číslo ${n}?`,
        answer: num(value),
        hints: ['Stovky jsou první zleva, pak desítky, pak jednotky.'],
        explanation: `${n} = ${count(Math.floor(n / 100), STOVKA)}, ${count(Math.floor(n / 10) % 10, DESITKA)} a ${count(n % 10, JEDNOTKA)}.`,
      };
    }
    if (pick < 75) {
      const a = rng.int(100, 999);
      const b = rng.chance(0.5) ? Number(String(a).split('').reverse().join('')) : rng.int(100, 999);
      if (b < 100 || b === a) return null;
      return signItem(rng, a, b, 0.2);
    }
    return lineItem(0, 1000, rng.int(3, 97) * 10, 60, 0.3);
  }

  if (level === 4) {
    if (pick < 45) {
      const unit = rng.pick([10, 100] as const);
      const n = unit === 10 ? rng.int(101, 999) : rng.int(1001, 9999);
      if (n % unit === 0) return null;
      const r = Math.round(n / unit) * unit;
      const word = unit === 10 ? 'desítky' : 'stovky';
      const last = unit === 10 ? n % 10 : Math.floor(n / 10) % 10;
      return {
        key: `r${n}-${unit}`,
        prompt: `Zaokrouhli číslo ${f(n)} na ${word}.`,
        answer: num(r),
        hints: [`Rozhoduje číslice na místě ${unit === 10 ? 'jednotek' : 'desítek'}: ${last}.`, `Je-li to 5 nebo víc, zaokrouhlujeme nahoru.`],
        explanation: `Číslice ${last} je ${last >= 5 ? '5 nebo víc – nahoru' : 'menší než 5 – dolů'}: ${f(n)} ≐ ${f(r)}.`,
        difficulty: 0.1,
      };
    }
    if (pick < 70) {
      const th = rng.int(2, 99);
      const rest = rng.int(0, 999);
      const n = th * 1000 + rest;
      return {
        key: `th${n}`,
        prompt: `Kolik celých tisíců má číslo ${f(n)}?`,
        answer: num(th),
        hints: ['Tisíce jsou číslice před posledními třemi číslicemi.'],
        explanation: `${f(n)} = ${count(th, TISIC)} a ${rest}.`,
      };
    }
    const a = rng.int(1000, 99999);
    const b = rng.chance(0.5) ? a + rng.pick([-1000, 1000, -100, 100, 9, -9]) : rng.int(1000, 99999);
    if (b <= 0 || b === a) return null;
    return signItem(rng, a, b, 0.2);
  }

  // L5–L6: záporná čísla, teploměr
  if (pick < 40) {
    const start = rng.int(-9, 5);
    const change = rng.int(2, 12) * (rng.chance(0.5) ? 1 : -1);
    const end = start + change;
    if (Math.abs(end) > 20) return null;
    const warmer = change > 0;
    return {
      key: `t${start}${change > 0 ? '+' : ''}${change}`,
      prompt: `Ráno ukazoval teploměr ${f(start)} °C. Pak se ${warmer ? 'oteplilo' : 'ochladilo'} o ${count(Math.abs(change), STUPEN)}. Kolik stupňů ukazuje teploměr teď?`,
      speak: `Ráno ukazoval teploměr ${start < 0 ? 'mínus ' : ''}${count(Math.abs(start), ['stupeň', 'stupně', 'stupňů'])}. Pak se ${warmer ? 'oteplilo' : 'ochladilo'} o ${count(Math.abs(change), STUPEN)}. Kolik stupňů ukazuje teploměr teď?`,
      visual: { type: 'numberline', min: -20, max: 20, ticks: [start] },
      answer: num(end, '°C', true),
      hints: [`Když se otepluje, jdeš na ose doprava. Když se ochlazuje, doleva.`, `Začni na ${f(start)} a posuň se o ${Math.abs(change)} ${warmer ? 'doprava' : 'doleva'}.`],
      explanation: `${f(start)} ${warmer ? '+' : '−'} ${Math.abs(change)} = ${f(end)} °C.`,
      difficulty: 0.2,
    };
  }
  if (pick < 70) {
    const a = rng.int(-15, 10);
    let b = rng.int(-15, 10);
    if (a === b) b = a - 1;
    if (a >= 0 && b >= 0) return null;
    const low = Math.min(a, b);
    return {
      key: `nm${a}?${b}`,
      prompt: `Které číslo je menší?`,
      answer: choice(rng, f(low), [f(Math.max(a, b))]),
      hints: ['Na číselné ose je menší to, které leží víc vlevo.', 'Mínus deset je menší než mínus dva – je dál vlevo.'],
      explanation: `${f(low)} leží na ose víc vlevo, proto je menší.`,
      difficulty: 0.1,
    };
  }
  return lineItem(-10, 10, rng.int(-9, 9), 1, 0.2);
}

function generate(level: Level, rng: Rng) {
  for (let i = 0; i < 50; i++) {
    const p = attempt(level, rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const cisla: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Čísla a číselná osa',
  description: 'Porovnávání, stavba čísla (desítky, stovky, tisíce), odhad na číselné ose, zaokrouhlování a záporná čísla.',
  levels: [1, 2, 3, 4, 5, 6],
  rvp: { 1: ['M-3-1-02', 'M-3-1-03'], 2: ['M-3-1-02', 'M-3-1-03'], 3: ['M-3-1-02', 'M-3-1-03'], 4: ['M-5-1-03'], 5: ['M-5-1-08'], 6: ['M-5-1-08'] },
  ability: 'pocetni',
  generate,
};
