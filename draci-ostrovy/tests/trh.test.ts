import { describe, expect, it } from 'vitest';
import { cards, missions, skills } from '../src/content/trh';
import { enumerateItems } from '../src/core/bank';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

// ---------------------------------------------------------------------------
// Zadání ostrova (nezávislá tabulka)

const EXPECTED: Record<string, { levels: Level[]; ability: string; rvp: Partial<Record<Level, string[]>> }> = {
  'trh.platba': { levels: [1, 2, 3, 4], ability: 'pocetni', rvp: { 1: ['M-3-1-05'], 2: ['M-3-1-05'], 3: ['M-3-1-05'], 4: ['ČJS-5-2-03', 'M-5-1-04'] } },
  'trh.hodnota': { levels: [2, 3, 4, 5, 6], ability: 'usuzovani', rvp: { 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03', 'M-5-1-04'], 5: ['ČJS-5-2-03', 'M-5-1-04'] } },
  'trh.potreby': { levels: [1, 2, 3, 4], ability: 'usuzovani', rvp: { 1: ['ČJS-5-2-03'], 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03'] } },
  'trh.sporeni': { levels: [2, 3, 4, 5, 6], ability: 'pocetni', rvp: { 2: ['ČJS-5-2-03', 'M-3-1-05'], 3: ['ČJS-5-2-03', 'M-3-1-05'], 4: ['ČJS-5-2-03', 'M-5-1-04'], 5: ['ČJS-5-2-03', 'M-5-1-04'] } },
  'trh.prace': { levels: [1, 2, 3, 4, 5], ability: 'znalosti', rvp: { 1: ['ČJS-3-2-02'], 2: ['ČJS-3-2-02'], 3: ['ČJS-3-2-02'], 4: ['ČJS-5-2-03'], 5: ['ČJS-5-2-03'] } },
  'trh.digitalni': { levels: [2, 3, 4, 5], ability: 'znalosti', rvp: { 2: ['ČJS-5-2-03'], 3: ['ČJS-5-2-03'], 4: ['ČJS-5-2-03'], 5: ['ČJS-5-2-03'] } },
  'trh.rozpocet': { levels: [3, 4, 5, 6], ability: 'pocetni', rvp: { 3: ['M-3-1-05'], 4: ['ČJS-5-2-03', 'M-5-2-02'], 5: ['ČJS-5-2-03', 'M-5-2-02'] } },
};

const NAMES: Record<string, string> = {
  'trh.platba': 'Placení a kontrola',
  'trh.hodnota': 'Cena a hodnota',
  'trh.potreby': 'Potřeby a přání',
  'trh.sporeni': 'Spoření na cíl',
  'trh.prace': 'Práce a výdělek',
  'trh.digitalni': 'Peníze na kartě a v mobilu',
  'trh.rozpocet': 'Rozpočet',
};

/** Mince a bankovky, které v Česku platí (Kč). */
const CZK = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

/** Čím se platí (7. pád) – nezávisle na obsahu. */
const PAY_WORD: Record<string, number> = {
  desetikorunou: 10,
  dvacetikorunou: 20,
  padesátikorunou: 50,
  stokorunou: 100,
  dvoustovkou: 200,
  pětistovkou: 500,
  tisícovkou: 1000,
  dvoutisícovkou: 2000,
  pětitisícovkou: 5000,
};

const KRAT: Record<string, number> = {
  dvakrát: 2, třikrát: 3, čtyřikrát: 4, pětkrát: 5, šestkrát: 6, sedmkrát: 7, osmkrát: 8, devětkrát: 9, desetkrát: 10,
};

// ---------------------------------------------------------------------------
// Pomůcky

const keyOfItem = (item: Item) => item.id.split(':')[2];

/** Všechny úlohy: ručně psané + vygenerované přes mnoho semínek (bez opakování id). */
function collect(s: SkillDef, seeds = 400): Item[] {
  const byId = new Map<string, Item>();
  for (const level of s.levels) {
    for (const item of enumerateItems(s.id, level)) byId.set(item.id, item);
    for (let seed = 1; seed <= seeds; seed++) {
      const item = s.generate(level, createRng(seed * 31 + level));
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

const all = new Map(skills.map((s) => [s.id, collect(s)]));
const allItems = [...all.values()].flat();

/** Číslo v českém zápisu („12 500“) na number. */
const n = (s: string) => Number(s.replace(/\s/g, ''));
/** Všechny částky „N Kč“ v textu. */
const amounts = (text: string) => [...text.matchAll(/(\d[\d\u00a0 ]*\d|\d) Kč/g)].map((m) => n(m[1]));
const correctLabel = (item: Item) => (item.answer.kind === 'choice' ? item.answer.options[item.answer.correct].label : null);
const labels = (item: Item) => (item.answer.kind === 'choice' ? item.answer.options.map((o) => o.label) : []);
const numberAnswer = (item: Item) => {
  if (item.answer.kind !== 'number') throw new Error(`${item.id}: čekám číselnou odpověď`);
  return item.answer.correct;
};
const cardsOf = (item: Item) => {
  if (item.visual?.type !== 'cards') throw new Error(`${item.id}: čekám karty`);
  return item.visual.cards;
};
const coinsOf = (item: Item) => {
  if (item.visual?.type !== 'coins') throw new Error(`${item.id}: čekám mince`);
  return item.visual.values;
};
const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const byPrefix = (skillId: string, prefix: string) => all.get(skillId)!.filter((i) => keyOfItem(i).startsWith(`${prefix}-`));
/** Tabulka po řádcích. */
const tableRows = (v: Visual | undefined) => {
  if (v?.type !== 'table') throw new Error('čekám tabulku');
  const rows: (string | number | null)[][] = [];
  for (let i = 0; i < v.cells.length; i += v.cols) rows.push(v.cells.slice(i, i + v.cols));
  return rows;
};

// ---------------------------------------------------------------------------

describe('Vikingský trh – dovednosti', () => {
  it('má sedm dovedností podle zadání (id, název, úrovně, typ myšlení, RVP)', () => {
    expect(skills.map((s) => s.id)).toEqual(Object.keys(EXPECTED));
    for (const s of skills) {
      const e = EXPECTED[s.id];
      expect(s.island).toBe('trh');
      expect(s.name, s.id).toBe(NAMES[s.id]);
      expect(s.levels, s.id).toEqual(e.levels);
      expect(s.ability, s.id).toBe(e.ability);
      expect(s.description.trim(), s.id).toMatch(/\.$/);
      expect(s.rvp, s.id).toEqual(e.rvp);
      for (const level of s.levels) {
        if (level > 5) continue;
        const codes = s.rvp[level] ?? [];
        expect(codes.length, `${s.id} L${level}: RVP`).toBeGreaterThan(0);
        for (const code of codes) expect(code).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
      }
    }
  });

  for (const s of skills) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 300);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: ručně psané úlohy jsou platné, s jedinečnými klíči i zadáními`, () => {
      for (const level of s.levels) {
        const items = enumerateItems(s.id, level);
        for (const item of items) expect(validateItem(item, s, level)).toEqual([]);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size, `duplicitní klíče v ${s.id} L${level}`).toBe(ids.length);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${s.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('klíče generovaných úloh jsou jen a–z, 0–9 a pomlčky', () => {
    for (const item of allItems) expect(keyOfItem(item), item.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('stejné semínko = stejná úloha', () => {
    for (const s of skills) {
      for (const level of s.levels) {
        for (const seed of [1, 42, 777]) expect(s.generate(level, createRng(seed))).toEqual(s.generate(level, createRng(seed)));
      }
    }
  });

  it('stejné id = stejné zadání, vizuál a správná odpověď (400 semínek)', () => {
    const seen = new Map<string, string>();
    for (const s of skills) {
      for (const level of s.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const a = item.answer;
          const answer =
            a.kind === 'choice' ? a.options[a.correct].label : a.kind === 'number' ? String(a.correct) : a.kind === 'order' ? a.correct.join('|') : '';
          const content = `${item.prompt}|${item.speak ?? ''}|${JSON.stringify(item.visual ?? null)}|${answer}`;
          const before = seen.get(item.id);
          if (before !== undefined) expect(content, item.id).toBe(before);
          seen.set(item.id, content);
        }
      }
    }
  });

  it('stejné zadání s vizuálem = stejné id (žádná úloha pod dvěma klíči)', () => {
    for (const s of skills) {
      for (const level of s.levels) {
        const byContent = new Map<string, string>();
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const content = `${item.prompt}|${JSON.stringify(item.visual ?? null)}`;
          const before = byContent.get(content);
          if (before !== undefined) expect(item.id, content).toBe(before);
          byContent.set(content, item.id);
        }
      }
    }
  });

  it('úroveň mimo rozsah dovednosti vrátí platnou úlohu nejbližší úrovně', () => {
    for (const s of skills) {
      for (const level of [1, 6] as Level[]) {
        const item = s.generate(level, createRng(9));
        const expected = s.levels.includes(level) ? level : level === 1 ? s.levels[0] : s.levels[s.levels.length - 1];
        expect(item.level, s.id).toBe(expected);
        expect(validateItem(item, s, expected)).toEqual([]);
      }
    }
  });
});

describe('Vikingský trh – karty a mise', () => {
  it('karty projdou kontrolou, je jich kolem tří na dovednost a aspoň tři jsou opravené stránky', () => {
    expect(validateCards(cards, skills)).toEqual([]);
    for (const s of skills) {
      const count = cards.filter((c) => c.skillId === s.id).length;
      expect(count, s.id).toBeGreaterThanOrEqual(3);
      expect(count, s.id).toBeLessThanOrEqual(5);
    }
    expect(cards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(3);
  });

  it('mise projdou kontrolou a jsou čtyři až pět', () => {
    expect(validateMissions(missions, 'trh')).toEqual([]);
    expect(missions.length).toBeGreaterThanOrEqual(4);
    expect(missions.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Nezávislé přepočítání generovaných úloh (čísla se čtou ze zadání a vizuálu)

/** Ceny „za N Kč“ v zadání. */
const zaPrices = (text: string) => [...text.matchAll(/za (\d[\d\u00a0 ]*\d|\d) Kč/g)].map((m) => n(m[1]));
/** Řádky „3 klubka vlny po 89 Kč“: počet × cena. */
const perPiece = (text: string) => [...text.matchAll(/(\d+) [^\d.,]+? po (\d[\d\u00a0 ]*\d|\d) Kč/g)].map((m) => Number(m[1]) * n(m[2]));
const payWith = (text: string) => {
  const word = Object.keys(PAY_WORD).find((w) => text.includes(`Platíš ${w}`));
  if (!word) throw new Error(`nenašel jsem, čím se platí: ${text}`);
  return PAY_WORD[word];
};
/** „10 + 5 + 2“ → 17 */
const plusSum = (label: string) => label.split(' + ').map(n).reduce((a, b) => a + b, 0);
/** Cenovka „1 250 Kč“ → 1250 */
const tagValue = (tag: string | undefined) => {
  const m = tag?.match(/^(\d[\d\u00a0 ]*) Kč$/);
  if (!m) throw new Error(`neplatná cenovka „${tag}“`);
  return n(m[1]);
};
const round10 = (x: number) => Math.floor((x + 5) / 10) * 10;
const signed = (cell: string | number | null) => {
  const m = String(cell).match(/^([+−])(\d[\d\u00a0 ]*) Kč$/);
  if (!m) throw new Error(`neplatná částka „${cell}“`);
  return (m[1] === '+' ? 1 : -1) * n(m[2]);
};

describe('Vikingský trh – placení: výpočty sedí', () => {
  it('„Stačí ti peníze?“ má právě jednu správnou odpověď podle součtu mincí a cen', () => {
    const items = byPrefix('trh.platba', 'staci');
    expect(items.length).toBeGreaterThan(100);
    for (const item of items) {
      const money = sumOf(coinsOf(item));
      const cost = sumOf(zaPrices(item.prompt));
      expect(labels(item), item.id).toEqual(['Ano, stačí', 'Ne, nestačí']);
      expect(correctLabel(item), item.id).toBe(money >= cost ? 'Ano, stačí' : 'Ne, nestačí');
      expect(item.explanation, item.id).toContain(`= ${money} Kč`);
    }
  });

  it('„Kterými mincemi zaplatíš přesně?“: přesnou částku dá právě jedna možnost', () => {
    const items = byPrefix('trh.platba', 'presne');
    expect(items.length).toBeGreaterThan(50);
    for (const item of items) {
      const price = amounts(item.prompt)[0];
      const exact = labels(item).filter((l) => plusSum(l) === price);
      expect(exact, item.id).toEqual([correctLabel(item)]);
      for (const l of labels(item)) for (const v of l.split(' + ').map(n)) expect(CZK, `${item.id}: ${l}`).toContain(v);
    }
  });

  it('kontrola vrácených peněz: správně/špatně odpovídá cena − zaplaceno', () => {
    const items = byPrefix('trh.platba', 'vratil');
    expect(items.length).toBeGreaterThan(100);
    let ok = 0;
    for (const item of items) {
      const pay = payWith(item.prompt);
      const total = sumOf(zaPrices(item.prompt)) + sumOf(perPiece(item.prompt));
      const given = sumOf(coinsOf(item));
      expect(total, item.id).toBeLessThan(pay);
      expect(given, item.id).toBeLessThan(pay);
      expect(correctLabel(item), item.id).toBe(given === pay - total ? 'Ano, správně' : 'Ne, špatně');
      if (given === pay - total) ok++;
    }
    // Správné i chybné vracení se střídají.
    expect(ok / items.length).toBeGreaterThan(0.3);
    expect(ok / items.length).toBeLessThan(0.7);
  });

  it('kolik ti vrátí, kolik chybí, chytré placení', () => {
    for (const item of byPrefix('trh.platba', 'vrati')) {
      const total = sumOf(zaPrices(item.prompt)) + sumOf(perPiece(item.prompt));
      expect(numberAnswer(item), item.id).toBe(payWith(item.prompt) - total);
    }
    for (const item of byPrefix('trh.platba', 'chybi')) {
      expect(numberAnswer(item), item.id).toBe(amounts(item.prompt)[0] - sumOf(coinsOf(item)));
    }
    const smart = byPrefix('trh.platba', 'chytre');
    expect(smart.length).toBeGreaterThan(20);
    for (const item of smart) {
      const [total, extra] = amounts(item.prompt);
      const back = numberAnswer(item);
      expect(back, item.id).toBe(payWith(item.prompt) + extra - total);
      expect(back % 10, `${item.id}: vrací se kulatá částka`).toBe(0);
    }
  });

  it('odhad zaokrouhlením: správná možnost je nejblíž přesné ceně a odhad nevede k omylu', () => {
    for (const item of byPrefix('trh.platba', 'odhad')) {
      const prices = zaPrices(item.prompt);
      const exact = sumOf(prices);
      const est = sumOf(prices.map(round10));
      expect(correctLabel(item), item.id).toBe(`Asi ${est} Kč`);
      for (const l of labels(item)) {
        if (l === correctLabel(item)) continue;
        expect(Math.abs(amounts(l)[0] - exact), `${item.id}: ${l}`).toBeGreaterThan(Math.abs(est - exact));
      }
    }
    for (const item of byPrefix('trh.platba', 'odhadstaci')) {
      const budget = n(item.prompt.match(/^Máš (\d[\d\u00a0 ]*) Kč/)![1]);
      const prices = zaPrices(item.prompt);
      const exact = sumOf(prices);
      const est = sumOf(prices.map(round10));
      expect(correctLabel(item), item.id).toBe(exact <= budget ? 'Ano, stačí' : 'Ne, nestačí');
      expect(Math.sign(est - budget), `${item.id}: odhad musí vést ke stejnému závěru`).toBe(Math.sign(exact - budget));
    }
  });

  it('účtenka: řádek Celkem porovnaný se skutečným součtem', () => {
    const items = byPrefix('trh.platba', 'uctenka');
    expect(items.length).toBeGreaterThan(20);
    for (const item of items) {
      const rows = tableRows(item.visual);
      expect(rows[0], item.id).toEqual(['Zboží', 'Cena']);
      const last = rows[rows.length - 1];
      expect(last[0], item.id).toBe('Celkem');
      const total = sumOf(rows.slice(1, -1).map((r) => tagValue(String(r[1]))));
      expect(correctLabel(item), item.id).toBe(tagValue(String(last[1])) === total ? 'Ano, správně' : 'Ne, špatně');
    }
  });

  it('mince a bankovky na obrázcích jsou české a seřazené od největší', () => {
    for (const item of allItems) {
      if (item.visual?.type !== 'coins') continue;
      for (const v of item.visual.values) expect(CZK, item.id).toContain(v);
      expect([...item.visual.values].sort((a, b) => b - a), item.id).toEqual(item.visual.values);
    }
  });

  it('nekopíruje Ostrov čísel: žádné holé „Kolik korun je v měšci?“', () => {
    for (const item of all.get('trh.platba')!) expect(item.prompt).not.toMatch(/^Kolik korun je v měšci\?$/);
  });
});

describe('Vikingský trh – cena a hodnota: výpočty sedí', () => {
  it('nejlevnější stánek a pořadí cen podle cenovek', () => {
    for (const item of byPrefix('trh.hodnota', 'stanky')) {
      const cs = cardsOf(item);
      const prices = cs.map((c) => tagValue(c.tag));
      const min = Math.min(...prices);
      expect(prices.filter((p) => p === min).length, item.id).toBe(1);
      expect(correctLabel(item), item.id).toBe(cs[prices.indexOf(min)].title);
    }
    for (const item of byPrefix('trh.hodnota', 'poradi')) {
      if (item.answer.kind !== 'order') throw new Error(`${item.id}: čekám seřazení`);
      const sorted = [...cardsOf(item)].sort((a, b) => tagValue(a.tag) - tagValue(b.tag)).map((c) => c.title);
      expect(item.answer.correct, item.id).toEqual(sorted);
    }
    for (const item of byPrefix('trh.hodnota', 'okolik')) {
      const [a, b] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(Math.abs(a - b));
    }
  });

  it('„skoro stovka“ a akce 3 za cenu 2', () => {
    for (const item of byPrefix('trh.hodnota', 'skoro')) {
      const price = amounts(item.prompt)[0];
      expect(correctLabel(item), item.id).toBe(`Skoro ${Math.ceil(price / 100) * 100} Kč`);
    }
    for (const item of byPrefix('trh.hodnota', 'akce')) {
      const u = amounts(item.prompt)[0];
      const need = /Potřebuješ 3 /.test(item.prompt) ? 3 : 1;
      const single = need * u;
      const deal = 2 * u;
      expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(single < deal ? 0 : 1);
    }
    for (const item of byPrefix('trh.hodnota', 'akcevic')) {
      const u = amounts(item.prompt)[0];
      const count = Number(item.prompt.match(/za (\d+) \S+ v akci/)![1]);
      expect(numberAnswer(item), item.id).toBe((count / 3) * 2 * u);
    }
  });

  it('cena za kus a za 100 g podle karet', () => {
    const packs = byPrefix('trh.hodnota', 'zakus');
    const weighed = byPrefix('trh.hodnota', 'za100g');
    expect(packs.length).toBeGreaterThan(50);
    expect(weighed.length).toBeGreaterThan(30);
    for (const item of [...packs, ...weighed]) {
      const [a, b] = cardsOf(item);
      const qty = (title: string) => Number((title.match(/(\d+) g$/) ?? title.match(/^(\d+) /))![1]);
      // Porovnání cen za jednotku bez dělení: pa / qa < pb / qb ⇔ pa · qb < pb · qa.
      const left = tagValue(a.tag) * qty(b.title);
      const right = tagValue(b.tag) * qty(a.title);
      const expected = left < right ? 0 : left > right ? 1 : 2;
      expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(expected);
      expect(labels(item)[0], item.id).toBe(`${a.title} za ${a.tag}`);
      expect(labels(item)[1], item.id).toBe(`${b.title} za ${b.tag}`);
    }
  });

  it('slevy a permanentky', () => {
    for (const item of byPrefix('trh.hodnota', 'sleva')) {
      const [price, off] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(price - off);
    }
    for (const item of byPrefix('trh.hodnota', 'slevazpet')) {
      const [off, after] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(after + off);
    }
    for (const item of byPrefix('trh.hodnota', 'pulka')) expect(numberAnswer(item), item.id).toBe(amounts(item.prompt)[0] / 2);
    for (const item of byPrefix('trh.hodnota', 'slevy')) {
      const [price, off] = amounts(item.prompt);
      const half = price / 2;
      expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(half < price - off ? 0 : half > price - off ? 1 : 2);
    }
    for (const item of byPrefix('trh.hodnota', 'dvojsleva')) {
      const price = amounts(item.prompt)[0];
      const [d1, d2] = [...item.prompt.matchAll(/(\d+) %/g)].map((m) => Number(m[1]));
      expect(numberAnswer(item), item.id).toBe((price * (100 - d1) * (100 - d2)) / 10000);
    }
    for (const item of byPrefix('trh.hodnota', 'perm')) {
      const [single, pass] = amounts(item.prompt);
      const word = Object.keys(KRAT).find((w) => item.prompt.includes(` ${w}.`))!;
      const visits = KRAT[word];
      expect(visits * single, item.id).not.toBe(pass);
      expect(correctLabel(item), item.id).toBe(pass < visits * single ? 'Permanentka' : 'Platit každý vstup');
    }
    for (const item of byPrefix('trh.hodnota', 'permod')) {
      const [single, pass] = amounts(item.prompt);
      const k = numberAnswer(item);
      expect(k * single, item.id).toBeGreaterThan(pass);
      expect((k - 1) * single, item.id).toBeLessThan(pass);
      expect(k, item.id).toBeLessThanOrEqual(10);
    }
    for (const item of byPrefix('trh.hodnota', 'vydrz')) {
      const [[c, t1], [d, t2]] = [...item.prompt.matchAll(/stojí (\d[\d\u00a0 ]*) Kč a vydrží (\d+)/g)].map((m) => [n(m[1]), Number(m[2])]);
      expect(d, item.id).toBeGreaterThan(c);
      const a = c * t2;
      const b = d * t1;
      expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(a < b ? 0 : a > b ? 1 : 2);
    }
  });
});

describe('Vikingský trh – potřeby a přání: výběr v rozpočtu', () => {
  it('tlačítka Potřeba × Přání odpovídají klíči i vysvětlení', () => {
    const items = all.get('trh.potreby')!.filter((i) => /^(potreba|prani)-/.test(keyOfItem(i)));
    expect(items.length).toBeGreaterThanOrEqual(30);
    for (const item of items) {
      const need = keyOfItem(item).startsWith('potreba-');
      expect(labels(item), item.id).toEqual(['Potřeba', 'Přání']);
      expect(correctLabel(item), item.id).toBe(need ? 'Potřeba' : 'Přání');
      expect(item.explanation.startsWith(need ? 'Potřeba.' : 'Přání.'), item.id).toBe(true);
    }
    const share = items.filter((i) => keyOfItem(i).startsWith('potreba-')).length / items.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.65);
  });

  it('na kterou věc peníze (ne)stačí: právě jedna', () => {
    for (const prefix of ['koupis', 'nestaci']) {
      const items = byPrefix('trh.potreby', prefix);
      expect(items.length, prefix).toBeGreaterThan(30);
      for (const item of items) {
        const budget = amounts(item.prompt)[0];
        const fits = cardsOf(item).filter((c) => (prefix === 'koupis' ? tagValue(c.tag) <= budget : tagValue(c.tag) > budget));
        expect(fits.map((c) => c.title), item.id).toEqual([correctLabel(item)]);
      }
    }
  });

  it('dvojice v rozpočtu: vejde se právě jedna dvojice', () => {
    for (const item of byPrefix('trh.potreby', 'dvojice')) {
      const budget = amounts(item.prompt)[0];
      const cs = cardsOf(item);
      const price = (name: string) => tagValue(cs.find((c) => c.title.toLocaleLowerCase('cs') === name.toLocaleLowerCase('cs'))!.tag);
      let pairs = 0;
      cs.forEach((a, i) => cs.slice(i + 1).forEach((b) => (pairs += tagValue(a.tag) + tagValue(b.tag) <= budget ? 1 : 0)));
      expect(pairs, item.id).toBe(1);
      const ok = labels(item).filter((l) => l.split(' a ').map(price).reduce((a, b) => a + b, 0) <= budget);
      expect(ok, item.id).toEqual([correctLabel(item)]);
    }
  });

  it('co tě výběr stojí a nejdřív potřeby', () => {
    for (const prefix of ['zbude', 'nezbude']) {
      for (const item of byPrefix('trh.potreby', prefix)) {
        const [budget, first] = amounts(item.prompt);
        const rest = budget - first;
        const hits = cardsOf(item).filter((c) => (prefix === 'zbude' ? tagValue(c.tag) <= rest : tagValue(c.tag) > rest));
        expect(hits.map((c) => c.title), item.id).toEqual([correctLabel(item)]);
      }
    }
    for (const item of byPrefix('trh.potreby', 'naprani')) {
      const [budget, ...needs] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(budget - sumOf(needs));
    }
    for (const item of byPrefix('trh.potreby', 'potomprani')) {
      const [budget, ...needs] = amounts(item.prompt);
      const rest = budget - sumOf(needs);
      const fits = cardsOf(item).filter((c) => tagValue(c.tag) <= rest);
      expect(fits.map((c) => c.title), item.id).toEqual([correctLabel(item)]);
    }
  });
});

describe('Vikingský trh – spoření: týdny a úroky sedí', () => {
  it('za kolik týdnů našetříš (dělitelné i se zbytkem)', () => {
    for (const item of byPrefix('trh.sporeni', 'tydny')) {
      const [price, weekly] = amounts(item.prompt);
      expect(price % weekly, item.id).toBe(0);
      expect(numberAnswer(item), item.id).toBe(price / weekly);
    }
    const goals = byPrefix('trh.sporeni', 'cil');
    expect(goals.length).toBeGreaterThan(50);
    for (const item of goals) {
      const [price, start, weekly] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(Math.ceil((price - start) / weekly));
    }
    for (const item of byPrefix('trh.sporeni', 'darek')) {
      const [price, start, gift, weekly] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(Math.ceil((price - start - gift) / weekly));
    }
    for (const item of byPrefix('trh.sporeni', 'stridave')) {
      const [a, b, target] = amounts(item.prompt);
      let total = 0;
      let weeks = 0;
      while (total < target) total += weeks++ % 2 === 0 ? a : b;
      expect(numberAnswer(item), item.id).toBe(weeks);
    }
  });

  it('kolik bude v prasátku a kolik bude chybět', () => {
    for (const item of byPrefix('trh.sporeni', 'bude')) {
      const [start, weekly] = amounts(item.prompt);
      const weeks = Number(item.prompt.match(/za (\d+) týd/)![1]);
      expect(numberAnswer(item), item.id).toBe(start + weeks * weekly);
    }
    for (const item of byPrefix('trh.sporeni', 'chybipo')) {
      const [price, start, weekly] = amounts(item.prompt);
      const weeks = Number(item.prompt.match(/po (\d+) týd/)![1]);
      const left = price - start - weeks * weekly;
      expect(left, item.id).toBeGreaterThan(0);
      expect(numberAnswer(item), item.id).toBe(left);
    }
  });

  it('grafy a tabulka úspor', () => {
    for (const item of byPrefix('trh.sporeni', 'grafsoucet')) {
      if (item.visual?.type !== 'bars') throw new Error(item.id);
      expect(numberAnswer(item), item.id).toBe(sumOf(item.visual.bars.map((b) => b.value)));
    }
    for (const item of byPrefix('trh.sporeni', 'grafnejvic')) {
      if (item.visual?.type !== 'bars') throw new Error(item.id);
      const values = item.visual.bars.map((b) => b.value);
      const max = Math.max(...values);
      expect(values.filter((x) => x === max).length, item.id).toBe(1);
      expect(correctLabel(item), item.id).toBe(item.visual.bars[values.indexOf(max)].label);
    }
    for (const item of byPrefix('trh.sporeni', 'grafpridal')) {
      if (item.visual?.type !== 'bars') throw new Error(item.id);
      const k = Number(item.prompt.match(/(\d)\. týdnu\?$/)![1]);
      const bars = item.visual.bars;
      expect(numberAnswer(item), item.id).toBe(bars[k - 1].value - bars[k - 2].value);
    }
    for (const item of byPrefix('trh.sporeni', 'grafubylo')) {
      if (item.visual?.type !== 'bars') throw new Error(item.id);
      const bars = item.visual.bars;
      const drops = bars.filter((b, i) => i > 0 && b.value < bars[i - 1].value);
      expect(drops.map((b) => b.label), item.id).toEqual([correctLabel(item)]);
    }
    for (const item of byPrefix('trh.sporeni', 'tabulka')) {
      const rows = tableRows(item.visual).slice(1);
      const values = rows.map((r) => (r[1] === null ? numberAnswer(item) : tagValue(String(r[1]))));
      const step = values[1] - values[0];
      expect(step, item.id).toBeGreaterThan(0);
      values.forEach((x, i) => expect(x, item.id).toBe(values[0] + i * step));
    }
  });

  it('úrok, úrok z úroku a porovnání bank', () => {
    for (const item of byPrefix('trh.sporeni', 'urok')) {
      const [rate, hundred, amount] = amounts(item.prompt);
      expect(hundred).toBe(100);
      const add = (amount / 100) * rate;
      expect(numberAnswer(item), item.id).toBe(/po roce/.test(item.prompt) ? amount + add : add);
    }
    for (const item of byPrefix('trh.sporeni', 'urok2')) {
      const [rate, hundred, amount] = amounts(item.prompt);
      expect(hundred).toBe(100);
      expect(numberAnswer(item), item.id).toBe(Math.round(amount * (1 + rate / 100) ** 2));
      expect(Number.isInteger(amount * (1 + rate / 100))).toBe(true);
    }
    for (const item of byPrefix('trh.sporeni', 'banky')) {
      const [r1, hundred, x, base] = amounts(item.prompt);
      expect(hundred).toBe(100);
      const a = r1 * base;
      const b = x * 100;
      expect(correctLabel(item), item.id).toBe(a > b ? 'Banka A' : a < b ? 'Banka B' : 'Obě stejně');
    }
  });
});

describe('Vikingský trh – práce, peníze na kartě a rozpočet: výpočty sedí', () => {
  it('stánek: tržba, zisk, návrat nákladů, zisk nebo ztráta', () => {
    const stall = all.get('trh.prace')!.filter((i) => /^(zisk|trzba|navrat|bilance)-/.test(keyOfItem(i)));
    expect(stall.length).toBeGreaterThan(80);
    for (const item of stall) {
      const costs = zaPrices(item.prompt)[0];
      const price = n(item.prompt.match(/po (\d+) Kč/)![1]);
      const sold = item.prompt.match(/(\d+) \S+ po \d+ Kč/);
      const kind = keyOfItem(item).split('-')[0];
      if (kind === 'navrat') {
        expect(numberAnswer(item), item.id).toBe(Math.ceil(costs / price));
        continue;
      }
      const income = Number(sold![1]) * price;
      if (kind === 'trzba') expect(numberAnswer(item), item.id).toBe(income);
      if (kind === 'zisk') {
        expect(income, item.id).toBeGreaterThan(costs);
        expect(numberAnswer(item), item.id).toBe(income - costs);
      }
      if (kind === 'bilance') expect(correctLabel(item), item.id).toBe(income > costs ? 'Zisk' : income < costs ? 'Ztráta' : 'Vyšlo to nastejno');
    }
  });

  it('příjem × výdaj odpovídá klíči', () => {
    const items = all.get('trh.prace')!.filter((i) => /^(prijem|vydaj)-/.test(keyOfItem(i)));
    expect(items.length).toBeGreaterThanOrEqual(12);
    for (const item of items) {
      expect(labels(item), item.id).toEqual(['Příjem', 'Výdaj']);
      expect(correctLabel(item), item.id).toBe(keyOfItem(item).startsWith('prijem-') ? 'Příjem' : 'Výdaj');
    }
  });

  it('půjčky, splátky a výpis z účtu', () => {
    for (const item of byPrefix('trh.digitalni', 'pujcka')) {
      const [amount, interest] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(amount + interest);
    }
    for (const item of byPrefix('trh.digitalni', 'pujckar')) {
      const [amount, rate, hundred] = amounts(item.prompt);
      expect(hundred).toBe(100);
      expect(numberAnswer(item), item.id).toBe(amount + (amount / 100) * rate);
    }
    for (const item of byPrefix('trh.digitalni', 'splatky')) {
      const price = amounts(item.prompt)[0];
      const count = Number(item.prompt.match(/za (\d+) splát/)![1]);
      const each = n(item.prompt.match(/po (\d[\d\u00a0 ]*) Kč/)![1]);
      const total = count * each;
      expect(total, item.id).toBeGreaterThan(price);
      expect(numberAnswer(item), item.id).toBe(/víc než najednou/.test(item.prompt) ? total - price : total);
    }
    for (const item of byPrefix('trh.digitalni', 'vypis')) {
      const start = n(item.prompt.match(/začátku měsíce (\d[\d\u00a0 ]*) Kč/)![1]);
      const moves = tableRows(item.visual).slice(1).map((r) => signed(r[1]));
      expect(numberAnswer(item), item.id).toBe(start + sumOf(moves));
    }
  });

  it('rozpočet: kolik zbude, grafy, tabulky, výlet a plán', () => {
    for (const item of byPrefix('trh.rozpocet', 'zbude')) {
      const [pocket, ...spent] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(pocket - sumOf(spent));
    }
    for (const item of all.get('trh.rozpocet')!.filter((i) => keyOfItem(i).startsWith('utrata'))) {
      if (item.visual?.type !== 'bars') throw new Error(item.id);
      const bars = item.visual.bars;
      const kind = keyOfItem(item).split('-')[0];
      if (kind === 'utratacelkem') expect(numberAnswer(item), item.id).toBe(sumOf(bars.map((b) => b.value)));
      if (kind === 'utratanejvic') {
        const max = Math.max(...bars.map((b) => b.value));
        expect(bars.filter((b) => b.value === max).map((b) => b.label), item.id).toEqual([correctLabel(item)]);
      }
      if (kind === 'utratarozdil') {
        const [, a, b] = item.prompt.match(/za (\p{L}+) než za (\p{L}+)\?$/u)!;
        const value = (name: string) => bars.find((x) => x.label.toLocaleLowerCase('cs') === name)!.value;
        expect(numberAnswer(item), item.id).toBe(value(a) - value(b));
      }
    }
    for (const item of byPrefix('trh.rozpocet', 'tabulka')) {
      const rows = tableRows(item.visual).slice(1);
      expect(rows[rows.length - 1], item.id).toEqual(['Zbývá', null]);
      expect(numberAnswer(item), item.id).toBe(sumOf(rows.slice(0, -1).map((r) => signed(r[1]))));
    }
    let kinds = new Set<string>();
    for (const item of byPrefix('trh.rozpocet', 'bilance')) {
      const moves = tableRows(item.visual).slice(1).map((r) => signed(r[1]));
      const balance = sumOf(moves);
      kinds.add(correctLabel(item)!);
      expect(correctLabel(item), item.id).toBe(balance > 0 ? 'Přebytkový' : balance < 0 ? 'Schodkový' : 'Vyrovnaný');
    }
    expect([...kinds].sort()).toEqual(['Přebytkový', 'Schodkový', 'Vyrovnaný']);
    kinds = new Set<string>();
    for (const item of byPrefix('trh.rozpocet', 'vylet')) {
      const [budget, ticket, entry, lunch] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(budget - 2 * ticket - entry - lunch);
    }
    for (const item of byPrefix('trh.rozpocet', 'zoo')) {
      const [, adults, kids] = item.prompt.match(/jedou (\d+) \S+ a (\d+) /)!;
      const [pa, pc, park, budget] = amounts(item.prompt);
      const cost = Number(adults) * pa + Number(kids) * pc + park;
      kinds.add(correctLabel(item)!);
      expect(correctLabel(item), item.id).toBe(cost <= budget ? 'Ano, vyjde' : 'Ne, nevyjde');
    }
    expect([...kinds].sort()).toEqual(['Ano, vyjde', 'Ne, nevyjde']);
    for (const item of all.get('trh.rozpocet')!.filter((i) => keyOfItem(i).startsWith('plan'))) {
      const rows = tableRows(item.visual).slice(1);
      const saved = rows.map((r) => (r[1] === null ? null : tagValue(String(r[1]))));
      const totals = rows.map((r) => (r[2] === null ? null : tagValue(String(r[2]))));
      if (keyOfItem(item).startsWith('plankdy')) {
        const goal = amounts(item.prompt).pop()!;
        const first = rows.findIndex((_, i) => totals[i]! >= goal);
        expect(correctLabel(item), item.id).toBe(rows[first][0]);
        continue;
      }
      const missing = numberAnswer(item);
      const s = saved.map((x) => x ?? missing);
      const t = totals.map((x) => x ?? missing);
      t.forEach((x, i) => expect(x, item.id).toBe((i > 0 ? t[i - 1] : 0) + s[i]));
    }
    for (const item of byPrefix('trh.rozpocet', 'oslava')) {
      const [budget, cake, reserve, each] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(Math.floor((budget - cake - reserve) / each));
    }
    for (const item of byPrefix('trh.rozpocet', 'mesice')) {
      const [pocket, spend, price] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(Math.ceil(price / (pocket - spend)));
    }
    for (const item of byPrefix('trh.rozpocet', 'schodek')) {
      const [income, spent, save = 0] = amounts(item.prompt);
      expect(numberAnswer(item), item.id).toBe(spent - income + save);
    }
  });
});

// ---------------------------------------------------------------------------
// Texty, vizuály, předčítání

/** Stálá tlačítka – zadání je jmenuje, proto se u nich nehlídá prozrazení. */
const FIXED = [
  ['Ano, stačí', 'Ne, nestačí'],
  ['Ano, správně', 'Ne, špatně'],
  ['Potřeba', 'Přání'],
  ['Příjem', 'Výdaj'],
  ['Zisk', 'Ztráta', 'Vyšlo to nastejno'],
  ['Přebytkový', 'Schodkový', 'Vyrovnaný'],
  ['Ano, vyjde', 'Ne, nevyjde'],
  ['Permanentka', 'Platit každý vstup'],
].map((x) => x.join('|'));

/** Emoji, která přibyla až po Unicode 12 (Android, iOS i Windows je neumějí všude). */
function tooNewEmoji(text: string): string[] {
  const bad: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const unicode12 = [0x1fa70, 0x1fa71, 0x1fa72, 0x1fa73, 0x1fa78, 0x1fa79, 0x1fa7a, 0x1fa80, 0x1fa81, 0x1fa82, 0x1fa90, 0x1fa91, 0x1fa92, 0x1fa93, 0x1fa94, 0x1fa95];
    if (cp >= 0x1fa70 && cp <= 0x1faff && !unicode12.includes(cp)) bad.push(ch);
    if ([0x1f6d6, 0x1f6d7, 0x1f6fb, 0x1f6fc, 0x1f90c, 0x1f972, 0x1f977, 0x1f978, 0x1f9a3, 0x1f9a4, 0x1f9ab, 0x1f9ac, 0x1f9ad, 0x1f9cb].includes(cp)) bad.push(ch);
    if (cp >= 0x1f1e6 && cp <= 0x1f1ff) bad.push(ch); // vlajky
  }
  return bad;
}

function texts(item: Item): string[] {
  const out = [item.prompt, item.explanation, ...item.hints];
  if (item.speak) out.push(item.speak);
  for (const l of labels(item)) out.push(l);
  if (item.answer.kind === 'order') out.push(...item.answer.correct);
  return out;
}

describe('Vikingský trh – texty a vizuály', () => {
  it('každé kartě s nabídkou nechybí cenovka ve tvaru „N Kč“', () => {
    let offers = 0;
    for (const item of allItems) {
      if (item.visual?.type !== 'cards') continue;
      offers++;
      // Čísla od 10 000 mají mezi tisíci pevnou mezeru (formatNumber).
      for (const c of item.visual.cards) expect(c.tag, `${item.id}: ${c.title}`).toMatch(/^(\d{1,4}|\d{1,3}(\u00a0\d{3})+) Kč$/);
    }
    expect(offers).toBeGreaterThan(300);
  });

  it('karty, grafy a tabulky se dají předčítat a zadání se symboly má speak', () => {
    for (const item of allItems) {
      const t = item.visual?.type;
      if (t === 'cards' || t === 'bars' || t === 'table') expect(item.speak, item.id).toBeTruthy();
      if (/[%×+−→=]/.test(item.prompt)) expect(item.speak, item.id).toBeTruthy();
      if (item.speak) expect(item.speak, item.id).not.toMatch(/[%×→=]/);
    }
  });

  it('výběr má 2–4 různé možnosti, krátké a s velkým písmenem; stálá tlačítka ve známých sadách', () => {
    for (const item of allItems) {
      if (item.answer.kind !== 'choice') continue;
      const ls = labels(item);
      const fixed = FIXED.includes(ls.join('|'));
      if (!fixed && ls.length === 2) expect(ls[1], item.id).toBe('Vezmu akci 3 za 2');
      expect(ls.length, item.id).toBeGreaterThanOrEqual(2);
      for (const l of ls) {
        expect(l.length, `${item.id}: ${l}`).toBeLessThanOrEqual(40);
        expect(l, item.id).toMatch(/^[\p{Lu}\d]/u);
        expect(l, item.id).not.toMatch(/\.$/);
      }
    }
  });

  it('zadání ani nápovědy neprozrazují správnou odpověď', () => {
    for (const item of allItems) {
      if (item.answer.kind === 'choice') {
        const ls = labels(item);
        // Stálá tlačítka a volby, které zadání samo jmenuje („u Leifa, nebo u Runy?“), se nehlídají.
        const named = ls.filter((l) => !/stejně$/.test(l));
        const lower = item.prompt.toLocaleLowerCase('cs');
        if (FIXED.includes(ls.join('|')) || named.every((l) => lower.includes(l.toLocaleLowerCase('cs')))) continue;
        const needle = correctLabel(item)!.toLocaleLowerCase('cs');
        for (const t of [item.prompt, ...item.hints]) {
          expect(t.toLocaleLowerCase('cs').includes(needle), `${item.id}: „${t}“ prozrazuje „${needle}“`).toBe(false);
        }
      }
      if (item.answer.kind === 'number') {
        const result = new RegExp(`=\\s*${String(item.answer.correct).replace(/\B(?=(\d{3})+(?!\d))/g, '\\s?')}(\\s*Kč)?(?!\\d)`);
        for (const h of item.hints) expect(h, item.id).not.toMatch(result);
      }
    }
  });

  it('texty jsou čisté: interpunkce, uvozovky, mezery, čísla, emoji', () => {
    let longest = 0;
    for (const item of allItems) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      longest = Math.max(longest, item.prompt.length);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!;]|\s:(?! )/); // „35 : 5“ je dělení, to je v pořádku
        expect(t, item.id).not.toMatch(/\d{5,}/); // velká čísla s mezerou: 12 500
        expect(t, item.id).not.toMatch(/(^|[^\d\u00a0 ])\d[\u00a0 ]\d{3}(?!\d)/); // čísla do 9 999 bez mezery: 1500
        expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(/kniha draků|\bem+a\b/u);
        expect(tooNewEmoji(t), item.id).toEqual([]);
      }
      if (item.visual) expect(tooNewEmoji(JSON.stringify(item.visual)), item.id).toEqual([]);
    }
    expect(longest).toBeLessThanOrEqual(200);
  });

  it('čeština v generovaných větách: jedna mince, zbytek, množné číslo, zájmena', () => {
    // Vrácené peníze: jeden kus = „tuto minci / bankovku“, víc kusů = „tyto mince / peníze“.
    for (const item of byPrefix('trh.platba', 'vratil')) {
      const coins = coinsOf(item);
      const one = coins.length === 1;
      if (one) expect(item.prompt, item.id).toMatch(coins[0] < 100 ? /tuto minci\./ : /tuto bankovku\./);
      else expect(item.prompt, item.id).toMatch(/tyto (mince|peníze)\./);
    }
    // „1 Kč ti zbude“, „3 Kč ti zbudou“, „5 Kč ti zbude“.
    for (const item of allItems) {
      for (const m of item.explanation.matchAll(/(\d+) Kč ti (zbude|zbudou)\b/g)) {
        const k = Number(m[1]);
        expect(m[2], `${item.id}: ${m[0]}`).toBe(k >= 2 && k <= 4 ? 'zbudou' : 'zbude');
      }
      for (const m of item.explanation.matchAll(/a (zbude|zbudou) (\d+) Kč/g)) {
        const k = Number(m[2]);
        expect(m[1], `${item.id}: ${m[0]}`).toBe(k >= 2 && k <= 4 ? 'zbudou' : 'zbude');
      }
    }
    for (const item of byPrefix('trh.hodnota', 'za100g')) {
      if (item.prompt.startsWith('Ořechy')) expect(item.prompt, item.id).toMatch(/^Ořechy se prodávají/);
    }
    for (const item of byPrefix('trh.digitalni', 'splatky')) {
      const feminine = /^(Herní konzole|Televize) /.test(item.prompt);
      expect(item.prompt, item.id).toMatch(feminine ? /Na splátky ji / : /Na splátky ho /);
    }
    // Předčítání nabídky: sloveso se shoduje s první věcí („je jablko“, „jsou ponožky“).
    for (const item of allItems) {
      expect(item.speak ?? '', item.id).not.toMatch(/\bje (ponožky|pastelky|rukavice|tenisky)\b/);
    }
    // Ve 4. třídě se dělí nejvýš deseti: balení má nejvýš 10 kusů.
    for (const item of all.get('trh.hodnota')!.filter((i) => i.level === 4 && keyOfItem(i).startsWith('zakus-'))) {
      for (const c of cardsOf(item)) expect(Number(c.title.match(/^(\d+) /)![1]), item.id).toBeLessThanOrEqual(10);
    }
  });

  it('nic strašidelného: žádné hroby, smrt ani zabíjení v úlohách, kartách a misích', () => {
    const scary = /hrob|smrt|zemřel|umřel|zabi|zabí/u;
    for (const item of allItems) for (const t of texts(item)) expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(scary);
    for (const c of cards) expect(JSON.stringify(c).toLocaleLowerCase('cs'), c.id).not.toMatch(scary);
    for (const m of missions) expect(JSON.stringify(m).toLocaleLowerCase('cs'), m.id).not.toMatch(scary);
  });

  it('karty a mise: pravdivá čísla podle nezávislé tabulky a jen běžná emoji', () => {
    const FACTS: Record<string, RegExp> = {
      'trh.platba.koruna': /od roku 1993/,
      // Nejstarší mince z elektronu: Lýdie a sousední řecká města (chrám Artemidy v Efesu).
      'trh.platba.prvni-mince': /asi 2 600 let.*Lýdii a sousedních řeckých městech/,
      'trh.platba.papirove-penize': /asi před tisíci lety/,
      'trh.sporeni.sporitelna': /v roce 1825/,
      'trh.sporeni.pojistene': /100 000 eur/,
      'trh.hodnota.voda-diamanty': /před 250 lety/,
      'trh.rozpocet.nejstarsi-zapisy': /přes 5 000 let/,
      // Truhlu z Mästermyru vyoral v roce 1936 zemědělec, ne archeologové.
      'trh.prace.kovar': /zemědělec v roce 1936/,
    };
    for (const [id, re] of Object.entries(FACTS)) expect(cards.find((c) => c.id === id)?.text, id).toMatch(re);
    for (const c of cards) expect(tooNewEmoji(c.emoji + c.title + c.text), c.id).toEqual([]);
    for (const m of missions) expect(tooNewEmoji(m.emoji + m.title + m.text + m.parentTip), m.id).toEqual([]);
  });
});
