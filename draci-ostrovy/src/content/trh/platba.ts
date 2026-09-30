// Placení a kontrola – rozhodování u pultu: stačí peníze? Kterými mincemi
// zaplatit přesně? Vrátili mi správně? Sedí účtenka? Od 3. úrovně odhad
// nákupu zaokrouhlením, ve 4. chytré placení. Samotné sčítání mincí
// procvičuje Ostrov čísel (cisla.penize) – tady je počítání jen nástroj.

import { capitalize, count, formatNumber as f } from '../../core/czech';
import { bankSkill, type Spec } from '../../core/bank';
import { createRng, type Rng } from '../../core/rng';
import {
  ANO_SPRAVNE,
  ANO_STACI,
  COINS,
  GOODS,
  NOTES,
  PAY_WITH,
  PIECES,
  fx,
  goodsBetween,
  greedy,
  isOffer,
  kc,
  keyOf,
  korun,
  list,
  mix,
  nm,
  pickDistinct,
  plus,
  priceOf,
  q,
  round10,
  split,
  sum,
  zbudeVerb,
  type Good,
} from './common';

const ID = 'trh.platba';

// ---------------------------------------------------------------------------
// Nákup: řádky nákupu (věc za cenu, nebo několik kusů po ceně)

interface Line {
  key: string;
  /** Ve 4. pádě: „chléb za 39 Kč“, „3 klubka vlny po 89 Kč“. */
  text: string;
  total: number;
  /** Výpočet do vysvětlení: „39“ nebo „3 × 89“. */
  expr: string;
  trh: boolean;
}

const goodLine = (good: Good, price: number): Line => ({
  key: `${good.key}${price}`,
  text: `${good.acc} za ${kc(price)}`,
  total: price,
  expr: f(price),
  trh: !!good.trh,
});

function buyGoods(rng: Rng, goods: Good[], n: number): Line[] {
  return pickDistinct(rng, goods, n).map((g) => goodLine(g, priceOf(rng, g)));
}

const linesKey = (lines: Line[]) => lines.map((l) => l.key).join('-');
const linesText = (lines: Line[]) => list(lines.map((l) => l.text));
const where = (lines: Line[]) => (lines[0].trh ? 'Na trhu' : 'V obchodě');
const costExpr = (lines: Line[]) => lines.map((l) => l.expr).join(' + ');
const simple = (lines: Line[]) => lines.length === 1 && !lines[0].expr.includes('×');

/** Nákup a čím se platí (nejbližší vyšší bankovkou nebo tou další). */
function purchase(rng: Rng, level: 1 | 2 | 3 | 4): { pay: number; lines: Line[] } | null {
  let lines: Line[];
  let notes: number[];
  if (level === 1) {
    lines = buyGoods(rng, goodsBetween(1, 20), 1);
    notes = [10, 20];
  } else if (level === 2) {
    lines = buyGoods(rng, goodsBetween(1, 100), rng.int(1, 2));
    notes = [50, 100];
  } else if (level === 3) {
    lines = buyGoods(rng, goodsBetween(40, 900), rng.int(1, 2));
    notes = [200, 500, 1000];
  } else {
    const p = rng.pick(PIECES.filter((x) => x.min >= 8));
    const n = rng.int(2, 6);
    const u = rng.int(p.min, p.max);
    const many: Line = {
      key: `${n}x${p.key}${u}`,
      text: `${count(n, p.acc)} po ${kc(u)}`,
      total: n * u,
      expr: `${n} × ${u}`,
      trh: !!p.trh,
    };
    lines = [many, ...buyGoods(rng, goodsBetween(40, 1200), rng.int(1, 2))];
    notes = [500, 1000, 2000, 5000];
  }
  const total = sum(lines.map((l) => l.total));
  const above = notes.filter((n) => n > total).slice(0, 2);
  if (!above.length) return null;
  return { pay: rng.pick(above), lines };
}

// ---------------------------------------------------------------------------
// Stačí ti peníze?

const STACI = {
  1: { goods: goodsBetween(1, 20), n: [1, 1], coins: [1, 2, 5, 10], pieces: [2, 4], max: 20, near: 6, purse: 'měšci' },
  2: { goods: goodsBetween(1, 100), n: [1, 2], coins: [1, 2, 5, 10, 20, 50], pieces: [2, 5], max: 100, near: 12, purse: 'měšci' },
  3: { goods: goodsBetween(40, 1000), n: [2, 3], coins: [1, 2, 5, 10, 20, 50, 100, 200, 500], pieces: [3, 6], max: 1000, near: 60, purse: 'peněžence' },
} as const;

function staci(level: 1 | 2 | 3) {
  const c = STACI[level];
  return (rng: Rng): Spec | null => {
    const lines = buyGoods(rng, [...c.goods], rng.int(c.n[0], c.n[1]));
    const total = sum(lines.map((l) => l.total));
    if (total > c.max) return null;
    const enough = rng.chance(0.5);
    const money = enough ? total + rng.int(0, c.near) : total - rng.int(1, c.near);
    if (money < 3 || money > c.max) return null;
    const coins = split(rng, money, c.coins, c.pieces[1]);
    if (!coins || coins.length < c.pieces[0]) return null;
    const one = lines.length === 1;
    const lead = level === 1 ? 'Chceš koupit' : `${where(lines)} chceš koupit`;
    const verdict =
      money > total
        ? `${kc(money)} je víc než ${kc(total)}, takže peníze stačí a ${kc(money - total)} ti ${zbudeVerb(money - total)}.`
        : money === total
          ? `Máš přesně ${kc(total)}, takže peníze stačí akorát.`
          : `${kc(money)} je méně než ${kc(total)}, takže peníze nestačí. Chybí ${kc(total - money)}.`;
    return fx(
      `staci-${keyOf(coins)}-${linesKey(lines)}`,
      `${lead} ${linesText(lines)}. Stačí ti peníze v ${c.purse}?`,
      ANO_STACI,
      money >= total ? 0 : 1,
      [
        `Nejdřív sečti peníze v ${c.purse}. Začni od největší hodnoty.`,
        one ? 'Pak porovnej součet s cenou.' : 'Pak sečti ceny a porovnej obě čísla.',
      ],
      `V ${c.purse} je ${plus(coins)} = ${kc(money)}.${one ? '' : ` Nákup stojí ${costExpr(lines)} = ${kc(total)}.`} ${verdict}`,
      { visual: { type: 'coins', values: coins }, difficulty: one ? -0.2 : 0.1 },
    );
  };
}

// ---------------------------------------------------------------------------
// Kterými mincemi zaplatíš přesně?

const PRESNE = {
  1: { allowed: [1, 2, 5, 10], min: 6, max: 20, pieces: [2, 4], word: 'mincemi' },
  2: { allowed: [1, 2, 5, 10, 20, 50], min: 21, max: 99, pieces: [2, 5], word: 'mincemi' },
  3: { allowed: [1, 2, 5, 10, 20, 50, 100, 200, 500], min: 101, max: 999, pieces: [3, 6], word: 'mincemi a bankovkami' },
} as const;

/** Věrohodné chybné možnosti: jedna mince jiná, jedna chybí, jedna navíc. */
function nearMisses(pay: number[], price: number, allowed: readonly number[]): number[][] {
  const vals = [...allowed].sort((a, b) => a - b);
  const out = new Map<string, number[]>();
  const add = (coins: number[]) => {
    const s = coins.slice().sort((a, b) => b - a);
    const t = sum(s);
    if (s.length < 2 || t === price || Math.abs(t - price) > Math.max(5, price / 2)) return;
    out.set(keyOf(s), s);
  };
  pay.forEach((coin, i) => {
    const j = vals.indexOf(coin);
    const rest = pay.filter((_, k) => k !== i);
    if (j > 0) add([...rest, vals[j - 1]]);
    if (j < vals.length - 1) add([...rest, vals[j + 1]]);
    add(rest);
  });
  add([...pay, 1]);
  add([...pay, 2]);
  return [...out.values()];
}

function presne(level: 1 | 2 | 3) {
  const c = PRESNE[level];
  return (rng: Rng): Spec | null => {
    const good = rng.pick(GOODS.filter((x) => x.max >= c.min && x.min <= c.max));
    const price = rng.int(Math.max(c.min, good.min), Math.min(c.max, good.max));
    // Rozklad je daný cenou, aby stejné zadání mělo vždy stejnou správnou možnost.
    const pay = split(createRng(price * 31 + level), price, c.allowed, c.pieces[1]);
    if (!pay || pay.length < c.pieces[0]) return null;
    const wrong = nearMisses(pay, price, c.allowed);
    if (wrong.length < 3) return null;
    return q(
      `presne-${good.key}-${price}`,
      `${capitalize(good.nom)} stojí ${kc(price)}. Kterými ${c.word} zaplatíš přesně?`,
      plus(pay),
      rng.shuffle(wrong).slice(0, 5).map(plus),
      ['Sečti každou možnost zvlášť.', `Hledáš přesně ${kc(price)}, ani o korunu víc, ani míň.`],
      `${plus(pay)} = ${kc(price)}. U ostatních možností vyjde jiná částka.`,
      { difficulty: level === 3 ? 0.2 : 0 },
    );
  };
}

// ---------------------------------------------------------------------------
// Vrátili ti správně? (mince na obrázku = co ti vrátili)

/** Obvyklé chyby při vracení podle úrovně. */
const SLIPS: Record<1 | 2 | 3 | 4, number[]> = {
  1: [-2, -1, 1, 2, -5, 5],
  2: [-1, 1, -2, 2, -5, 5, -10, 10],
  3: [-10, 10, -100, 100, -1, 1, -20],
  4: [-100, 100, -10, 10, -1, -50, 50],
};

function vratil(level: 1 | 2 | 3 | 4) {
  return (rng: Rng): Spec | null => {
    const buy = purchase(rng, level);
    if (!buy) return null;
    const { pay, lines } = buy;
    const total = sum(lines.map((l) => l.total));
    const change = pay - total;
    if (change < 1) return null;
    const ok = rng.chance(0.5);
    const given = ok ? change : change + rng.pick(SLIPS[level]);
    if (given < 1 || given >= pay) return null;
    const coins = greedy(given, [...COINS, ...NOTES].filter((x) => x < pay));
    if (!coins || coins.length > 7) return null;
    const she = total % 2 === 0;
    const seller = she ? 'Prodavačka' : 'Prodavač';
    const gave = she ? 'vrátila' : 'vrátil';
    const coinsOnly = coins.every((x) => x < 100);
    // Jeden kus: „tuto minci“, „tuto bankovku“; víc kusů: „tyto mince“, „tyto peníze“.
    const what = coins.length === 1 ? (coinsOnly ? 'tuto minci' : 'tuto bankovku') : coinsOnly ? 'tyto mince' : 'tyto peníze';
    const check = coins.length === 1 ? 'Pak se podívej, kolik je na obrázku, a porovnej.' : `Pak sečti ${coinsOnly ? 'mince' : 'peníze'} na obrázku a porovnej.`;
    const shown = coins.length > 1 ? `${plus(coins)} = ${kc(given)}` : kc(given);
    const should = `${simple(lines) ? '' : `Nákup stojí ${costExpr(lines)} = ${kc(total)}. `}${f(pay)} − ${f(total)} = ${f(change)}, vrátit se má ${kc(change)}.`;
    const verdict =
      given === change
        ? `${seller} ${gave} ${shown}. Je to správně.`
        : given < change
          ? `${seller} ale ${gave} jen ${shown}. Chybí ${kc(change - given)} – klidně a zdvořile to řekni.`
          : `${seller} ale ${gave} ${shown}, o ${kc(given - change)} víc. Poctivé je to říct a peníze navíc vrátit.`;
    return fx(
      `vratil-${pay}-${linesKey(lines)}-${given}`,
      `Kupuješ ${linesText(lines)}. Platíš ${PAY_WITH[pay]}. ${seller} ti ${gave} ${what}. Je to správně?`,
      ANO_SPRAVNE,
      ok ? 0 : 1,
      simple(lines)
        ? [`Kolik se má vrátit? Počítej od ${f(total)} do ${f(pay)}.`, check]
        : ['Nejdřív spočítej, kolik stojí celý nákup.', `Pak zjisti, kolik se má vrátit z ${kc(pay)}, a porovnej s obrázkem.`],
      `${should} ${verdict}`,
      { visual: { type: 'coins', values: coins }, difficulty: level >= 3 ? 0.2 : 0.1 },
    );
  };
}

// ---------------------------------------------------------------------------
// Kolik ti vrátí? Kolik ti chybí?

function vrati(level: 3 | 4) {
  return (rng: Rng): Spec | null => {
    const buy = purchase(rng, level);
    if (!buy) return null;
    const { pay, lines } = buy;
    const total = sum(lines.map((l) => l.total));
    const change = pay - total;
    if (change < 1 || lines.length < 2) return null;
    return nm(
      `vrati-${pay}-${linesKey(lines)}`,
      `${where(lines)} kupuješ ${linesText(lines)}. Platíš ${PAY_WITH[pay]}. Kolik ti vrátí?`,
      change,
      ['Nejdřív spočítej, kolik stojí celý nákup.', `Pak cenu nákupu odečti od ${kc(pay)}.`],
      `Nákup stojí ${costExpr(lines)} = ${kc(total)}. ${f(pay)} − ${f(total)} = ${kc(change)}.`,
      { unit: 'Kč', difficulty: level === 4 ? 0.2 : 0 },
    );
  };
}

function chybi(rng: Rng): Spec | null {
  const good = rng.pick(goodsBetween(15, 100));
  const price = priceOf(rng, good);
  const have = price - rng.int(3, Math.min(40, price - 5));
  const coins = split(rng, have, [1, 2, 5, 10, 20, 50], 5);
  if (!coins || coins.length < 2) return null;
  return nm(
    `chybi-${good.key}${price}-${keyOf(coins)}`,
    `V měšci máš tyto mince. ${capitalize(good.nom)} stojí ${kc(price)}. Kolik korun ti chybí?`,
    price - have,
    ['Nejdřív sečti mince v měšci.', 'Pak spočítej, kolik korun chybí do ceny.'],
    `V měšci je ${plus(coins)} = ${kc(have)}. ${f(price)} − ${f(have)} = ${f(price - have)}, chybí ti ${kc(price - have)}.`,
    { unit: 'Kč', visual: { type: 'coins', values: coins }, difficulty: 0.1 },
  );
}

// ---------------------------------------------------------------------------
// Odhad nákupu zaokrouhlením na desítky

function roundedHint(lines: Line[]): string | null {
  const l = lines.find((x) => x.total % 10 !== 0);
  return l ? `Třeba ${kc(l.total)} je zhruba ${kc(round10(l.total))}.` : null;
}

function odhad(level: 3 | 4) {
  return (rng: Rng): Spec | null => {
    const lines = buyGoods(rng, level === 3 ? goodsBetween(10, 100) : goodsBetween(40, 900), level === 3 ? 3 : rng.int(3, 4));
    const prices = lines.map((l) => l.total);
    const rounded = prices.map(round10);
    const est = sum(rounded);
    const exact = sum(prices);
    const hint = roundedHint(lines);
    if (!hint) return null;
    const step = level === 3 ? 50 : 100;
    const wrong = [est - step, est + step, est + 2 * step, est - 2 * step, 2 * est].filter((x) => x > 0 && Math.abs(x - est) >= step);
    return q(
      `odhad-${linesKey(lines)}`,
      `${where(lines)} kupuješ ${linesText(lines)}. Kolik zhruba zaplatíš?`,
      `Asi ${kc(est)}`,
      [...new Set(wrong)].map((x) => `Asi ${kc(x)}`),
      ['Zaokrouhli každou cenu na desítky a sečti.', hint],
      `Zaokrouhlené ceny: ${plus(rounded)} = ${kc(est)}. ${exact === est ? `Přesně je to také ${kc(exact)}, odhad vyšel na korunu.` : `Přesně by to bylo ${kc(exact)}, a to je opravdu asi ${kc(est)}.`}`,
      { difficulty: level === 4 ? 0.1 : 0 },
    );
  };
}

function odhadStaci(level: 3 | 4) {
  return (rng: Rng): Spec | null => {
    const budget = level === 3 ? rng.pick([100, 200]) : rng.pick([500, 1000]);
    const lines = buyGoods(rng, level === 3 ? goodsBetween(1, 100) : goodsBetween(40, 900), level === 3 ? 3 : rng.int(3, 4));
    const prices = lines.map((l) => l.total);
    const rounded = prices.map(round10);
    const est = sum(rounded);
    const exact = sum(prices);
    const d = exact - budget;
    const [lo, hi] = level === 3 ? [3, 30] : [5, 120];
    if (Math.abs(d) < lo || Math.abs(d) > hi) return null;
    if (est === budget || Math.sign(est - budget) !== Math.sign(d)) return null;
    const hint = roundedHint(lines);
    if (!hint) return null;
    return fx(
      `odhadstaci-${budget}-${linesKey(lines)}`,
      `Máš ${kc(budget)}. ${where(lines)} chceš koupit ${linesText(lines)}. Stačí ti to? Zkus to odhadnout.`,
      ANO_STACI,
      exact <= budget ? 0 : 1,
      ['Zaokrouhli každou cenu na desítky a sečti.', hint, 'Porovnej odhad s penězi, které máš.'],
      `Odhad: ${plus(rounded)} = ${kc(est)}, to je ${est < budget ? 'méně' : 'víc'} než ${kc(budget)}. Přesně je to ${kc(exact)}, takže peníze ${exact <= budget ? 'stačí' : 'nestačí'}.`,
      { difficulty: 0.1 },
    );
  };
}

// ---------------------------------------------------------------------------
// Účtenka

function uctenka(level: 3 | 4) {
  return (rng: Rng): Spec | null => {
    const items = pickDistinct(rng, level === 3 ? goodsBetween(1, 100) : goodsBetween(1, 900), level === 3 ? 3 : 4)
      .map((good) => ({ good, price: priceOf(rng, good) }));
    const total = sum(items.map((i) => i.price));
    const ok = rng.chance(0.5);
    const shown = ok ? total : total + rng.pick(level === 3 ? [-10, 10, -1, 1, 20] : [-100, 100, -10, 10, -1]);
    if (shown <= 0) return null;
    const from = items[0].good.trh ? 'z trhu' : 'z obchodu';
    const d = shown - total;
    return fx(
      `uctenka-${shown}-${items.map((i) => `${i.good.key}${i.price}`).join('-')}`,
      `Zkontroluj účtenku ${from}. Je součet správně?`,
      ANO_SPRAVNE,
      ok ? 0 : 1,
      ['Sečti ceny všech věcí na účtence.', 'Porovnej svůj součet s řádkem Celkem.'],
      ok
        ? `${plus(items.map((i) => i.price))} = ${kc(total)}. Součet na účtence je správně.`
        : `${plus(items.map((i) => i.price))} = ${kc(total)}, ale na účtence je ${kc(shown)}, o ${kc(Math.abs(d))} ${d > 0 ? 'víc' : 'míň'}. Účtenku se vyplatí zkontrolovat.`,
      {
        visual: { type: 'table', cols: 2, cells: ['Zboží', 'Cena', ...items.flatMap((i) => [capitalize(i.good.nom), kc(i.price)]), 'Celkem', kc(shown)] },
        speak: `Na účtence ${isOffer(items)}. Celkem ${korun(shown)}. Je součet správně?`,
        difficulty: 0.2,
      },
    );
  };
}

// ---------------------------------------------------------------------------
// Chytré placení: k bankovce přidáš drobné, aby ti vrátili kulatou částku

function chytre(rng: Rng): Spec | null {
  const total = rng.int(110, 1900);
  if (total % 10 === 0) return null;
  const pay = [200, 500, 1000, 2000].find((n) => n > total)!;
  const extra = rng.chance(0.5) ? total % 10 : total % 100;
  const back = pay + extra - total;
  return nm(
    `chytre-${total}-${pay}-${extra}`,
    `Nákup stojí ${kc(total)}. Platíš ${PAY_WITH[pay]} a k tomu ${kc(extra)}. Kolik ti vrátí?`,
    back,
    ['Kolik peněz dáváš prodavačce celkem?', 'Od toho odečti cenu nákupu.'],
    `Dáváš ${f(pay)} + ${f(extra)} = ${kc(pay + extra)}. ${f(pay + extra)} − ${f(total)} = ${kc(back)}. Díky drobným navíc dostaneš zpátky kulatou částku a méně mincí.`,
    { unit: 'Kč', difficulty: 0.3 },
  );
}

// ---------------------------------------------------------------------------

export const platba = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Placení a kontrola',
  description: 'Rozhodování u pultu: stačí peníze, jak zaplatit přesně, kontrola vrácených peněz a účtenky a odhad nákupu zaokrouhlením.',
  rvp: { 1: ['M-3-1-05'], 2: ['M-3-1-05'], 3: ['M-3-1-05'], 4: ['ČJS-5-2-03', 'M-5-1-04'] },
  ability: 'pocetni',
  gen: {
    1: mix(ID, [[4, staci(1)], [3, presne(1)], [3, vratil(1)]]),
    2: mix(ID, [[3, staci(2)], [2.5, presne(2)], [2.5, vratil(2)], [2, chybi]]),
    3: mix(ID, [[1.5, staci(3)], [1.5, presne(3)], [2, vratil(3)], [1.5, vrati(3)], [1.5, odhad(3)], [1, odhadStaci(3)], [1, uctenka(3)]]),
    4: mix(ID, [[2, vratil(4)], [2, vrati(4)], [1.5, chytre], [1.5, odhad(4)], [1.5, odhadStaci(4)], [1.5, uctenka(4)]]),
  },
});
