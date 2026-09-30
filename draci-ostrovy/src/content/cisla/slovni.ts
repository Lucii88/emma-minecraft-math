// Slovní úlohy ze světa draků a Vikingů. Věty jsou stavěné tak, aby
// sedělo skloňování i shoda slovesa s číslovkou (proto často „sedí“, „leží“
// – tvar je stejný pro jednotné i množné číslo – nebo postava jako podmět).

import type { Level, SkillDef } from '../../core/types';
import type { Rng } from '../../core/rng';
import { count, type Forms } from '../../core/czech';
import { CHARACTERS, mk, N, num, v, type Character, type ItemParts, type Noun } from './common';

const ID = 'cisla.slovni';

const pron = (c: Character) => (c.female ? 'jí' : 'mu');

const COLLECT: { noun: Noun; place: string }[] = [
  { noun: N.supina, place: 'na pláži' },
  { noun: N.kaminek, place: 'u potoka' },
  { noun: N.pirko, place: 'na louce' },
  { noun: N.jablko, place: 'v sadu' },
];

const SHOP = [
  { what: 'rybu', min: 12, max: 35 },
  { what: 'bochník chleba', min: 18, max: 40 },
  { what: 'kousek sýra', min: 15, max: 45 },
  { what: 'sklenici medu', min: 25, max: 60 },
  { what: 'vlněné ponožky', min: 30, max: 60 },
  { what: 'dřevěnou lžíci', min: 10, max: 30 },
] as const;

const RADA: Forms = ['řadu', 'řady', 'řad'];
const TYDEN: Forms = ['týden', 'týdny', 'týdnů'];
const JEZDEC: Forms = ['jezdec', 'jezdci', 'jezdců'];

function two(rng: Rng): [Character, Character] {
  const a = rng.pick(CHARACTERS);
  let b = rng.pick(CHARACTERS);
  while (b.name === a.name) b = rng.pick(CHARACTERS);
  return [a, b];
}

type Template = (rng: Rng) => ItemParts | null;

const L1: Template[] = [
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const { noun, place } = rng.pick(COLLECT);
    const a = rng.int(3, 12);
    const b = rng.int(2, 20 - a);
    return {
      key: `t1-${c.name}-${noun.gen}-${a}-${b}`,
      prompt: `${c.name} ${v(c, ['nasbíral', 'nasbírala'])} ${place} ${count(a, noun.acc)}. Potom ${v(c, ['našel', 'našla'])} ještě ${count(b, noun.acc)}. Kolik ${noun.gen} má teď?`,
      answer: num(a + b),
      hints: [`Kolik ${noun.gen} ${v(c, ['měl', 'měla'])} na začátku a kolik přibylo?`, `Přibývá, takže sčítáš: ${a} + ${b}.`],
      explanation: `${a} + ${b} = ${a + b}. ${c.name} má teď ${count(a + b, noun.acc)}.`,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const a = rng.int(6, 19);
    const b = rng.int(2, a - 1);
    return {
      key: `t2-${c.name}-${a}-${b}`,
      prompt: `${c.name} ${v(c, ['měl', 'měla'])} ${count(a, N.jablko.acc)}. Svému drakovi ${v(c, ['dal', 'dala'])} ${count(b, N.jablko.acc)}. Kolik jablek ${pron(c)} zbylo?`,
      answer: num(a - b),
      hints: ['Jablek ubylo, nebo přibylo?', `Ubylo – odečítáš: ${a} − ${b}.`],
      explanation: `${a} − ${b} = ${a - b}. Zbylo ${pron(c)} ${count(a - b, N.jablko.nom)}.`,
    };
  },
  (rng) => {
    const a = rng.int(2, 10);
    const b = rng.int(2, 20 - a);
    return {
      key: `t3-${a}-${b}`,
      prompt: `Na skále sedí ${count(a, N.drak.nom)}. Na stromě vedle skály jich sedí o ${b} víc. Kolik draků sedí na stromě?`,
      answer: num(a + b),
      hints: ['Na stromě je víc draků, nebo méně?', `O ${b} víc než ${a} – sčítáš.`],
      explanation: `${a} + ${b} = ${a + b}. Na stromě sedí ${count(a + b, N.drak.nom)}.`,
      difficulty: 0.2,
    };
  },
  (rng) => {
    const [c1, c2] = two(rng);
    const noun = rng.pick([N.supina, N.kaminek, N.pirko]);
    const a = rng.int(8, 20);
    const b = rng.int(2, a - 2);
    return {
      key: `t4-${c1.name}-${c2.name}-${noun.gen}-${a}-${b}`,
      prompt: `${c1.name} má ${count(a, noun.acc)}, ${c2.name} má ${count(b, noun.acc)}. O kolik ${noun.gen} má ${c1.name} víc než ${c2.name}?`,
      answer: num(a - b),
      hints: [`Kolik ${noun.gen} by ${v(c2, ['musel', 'musela'])} ${c2.name} ještě dostat, aby ${v(c2, ['měl', 'měla'])} stejně?`, `Počítej od ${b} do ${a}.`],
      explanation: `${a} − ${b} = ${a - b}. ${c1.name} má o ${a - b} víc.`,
      difficulty: 0.3,
    };
  },
];

const L2: Template[] = [
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const [i1, i2] = rng.shuffle(SHOP).slice(0, 2);
    const a = rng.int(i1.min, i1.max);
    const b = rng.int(i2.min, i2.max);
    if (a + b > 100) return null;
    return {
      key: `t5-${c.name}-${i1.what}-${i2.what}-${a}-${b}`,
      prompt: `${c.name} si na trhu ${v(c, ['koupil', 'koupila'])} ${i1.what} za ${a} Kč a ${i2.what} za ${b} Kč. Kolik korun ${v(c, ['zaplatil', 'zaplatila'])}?`,
      answer: num(a + b, 'Kč'),
      hints: ['Platí za obě věci dohromady.', `Sečti ${a} + ${b}. Pomůže ti rozložit ${b} na desítky a jednotky.`],
      explanation: `${a} + ${b} = ${a + b} Kč.`,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const item = rng.pick(SHOP);
    const a = rng.pick([50, 60, 80, 100]);
    const b = rng.int(item.min, Math.min(item.max, a - 5));
    return {
      key: `t6-${c.name}-${item.what}-${a}-${b}`,
      prompt: `${c.name} ${v(c, ['měl', 'měla'])} ${a} Kč. ${v(c, ['Koupil', 'Koupila'])} si ${item.what} za ${b} Kč. Kolik korun ${pron(c)} zbylo?`,
      answer: num(a - b, 'Kč'),
      hints: ['Peníze ubyly – odečítáš.', `Kolik chybí od ${b} do ${a}?`],
      explanation: `${a} − ${b} = ${a - b} Kč.`,
      difficulty: 0.2,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const k = rng.int(2, 5);
    const q = rng.int(2, 10);
    return {
      key: `t7-${c.name}-${k}-${q}`,
      prompt: `${c.name} ${v(c, ['rozdělil', 'rozdělila'])} ${count(k * q, N.ryba.acc)} rovným dílem ${k} drakům. Kolik ryb dostal každý drak?`,
      answer: num(q),
      hints: ['Každý drak dostane stejně.', `Kolikrát se ${k} vejde do ${k * q}?`],
      explanation: `${k * q} : ${k} = ${q}. Každý drak dostal ${count(q, N.ryba.acc)}.`,
      difficulty: 0.3,
    };
  },
  (rng) => {
    const a = rng.int(3, 9);
    const b = a + rng.int(12, 60);
    return {
      key: `t8-${a}-${b}`,
      prompt: `Dráče vážilo při narození ${a} kg. Teď váží ${b} kg. O kolik kilogramů přibralo?`,
      answer: num(b - a, 'kg'),
      hints: ['Kolik vážilo dřív a kolik teď?', `Počítej od ${a} do ${b}.`],
      explanation: `${b} − ${a} = ${b - a} kg.`,
    };
  },
];

const L3: Template[] = [
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const a = rng.int(12, 60);
    const b = rng.int(5, 30);
    return {
      key: `t9-${c.name}-${a}-${b}`,
      prompt: `Ráno ${c.name} ${v(c, ['nasbíral', 'nasbírala'])} ${count(a, N.supina.acc)}, odpoledne o ${b} víc než ráno. Kolik šupin ${v(c, ['nasbíral', 'nasbírala'])} za celý den?`,
      answer: num(a + (a + b)),
      hints: ['Nejdřív zjisti, kolik šupin bylo odpoledne.', `Odpoledne: ${a} + ${b} = ${a + b}. Teď sečti ráno a odpoledne.`],
      explanation: `Odpoledne ${a} + ${b} = ${a + b}, za celý den ${a} + ${a + b} = ${2 * a + b}.`,
    };
  },
  (rng) => {
    const a = rng.int(40, 120);
    const b = rng.int(10, Math.floor(a / 2));
    const c = rng.int(5, a - b - 3);
    return {
      key: `t10-${a}-${b}-${c}`,
      prompt: `Na trh přivezli ${count(a, N.sud.acc)} medu. Ráno prodali ${count(b, N.sud.acc)} a odpoledne ${count(c, N.sud.acc)}. Kolik sudů jim zbylo?`,
      answer: num(a - b - c),
      hints: ['Kolik sudů prodali za celý den?', `Prodali ${b} + ${c} = ${b + c}. Kolik zbylo z ${a}?`],
      explanation: `${a} − ${b} − ${c} = ${a - b - c}.`,
      difficulty: 0.2,
    };
  },
  (rng) => {
    const a = rng.int(15, 45);
    const b = rng.int(3, 15);
    return {
      key: `t11-${a}-${b}`,
      prompt: `Let na vzdálený ostrov trvá ${count(a, N.minuta.acc)}. Cesta zpátky proti větru trvá o ${count(b, N.minuta.acc)} déle. Kolik minut trvá cesta tam i zpátky?`,
      answer: num(2 * a + b, 'min'),
      hints: ['Nejdřív zjisti, jak dlouho trvá cesta zpátky.', `Zpátky: ${a} + ${b} = ${a + b} minut. Teď přičti cestu tam.`],
      explanation: `Zpátky ${a + b} minut, celkem ${a} + ${a + b} = ${2 * a + b} minut.`,
      difficulty: 0.3,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const p = rng.pick([6, 8, 9, 12, 15, 18, 20, 25, 30]);
    const n = rng.int(2, 9);
    return {
      key: `t12-${c.name}-${p}-${n}`,
      prompt: `Jedna ryba stojí ${p} Kč. ${c.name} ${v(c, ['koupil', 'koupila'])} ${count(n, N.ryba.acc)}. Kolik korun ${v(c, ['zaplatil', 'zaplatila'])}?`,
      answer: num(n * p, 'Kč'),
      hints: [`Za každou rybu zaplatí ${p} Kč.`, `Je to ${n} × ${p}.`],
      explanation: `${n} × ${p} = ${n * p} Kč.`,
    };
  },
  (rng) => {
    const r = rng.int(3, 9);
    const k = rng.int(4, 9);
    return {
      key: `t13-${r}-${k}`,
      prompt: `Vikingská loď má ${count(r, RADA)} vesel. V každé řadě sedí ${count(k, N.viking.nom)}. Kolik Vikingů vesluje?`,
      answer: num(r * k),
      hints: ['Kolik je řad a kolik Vikingů sedí v jedné?', `Je to ${r} × ${k}.`],
      explanation: `${r} × ${k} = ${r * k}.`,
    };
  },
];

const L4: Template[] = [
  (rng) => {
    const k = rng.int(5, 9);
    const a = rng.int(k * 2 + 1, k * 6);
    if (a % k === 0) return null;
    const boats = Math.ceil(a / k);
    return {
      key: `t14-${a}-${k}`,
      prompt: `Ve vesnici je ${a} Vikingů. Na jednu loď se vejde ${k} Vikingů. Kolik lodí potřebují, aby se na výpravu vydali všichni?`,
      answer: num(boats),
      hints: ['Kolik lodí se úplně zaplní?', `${a} : ${k} = ${Math.floor(a / k)}, zbytek ${a % k}. Vejdou se opravdu všichni?`],
      explanation: `Zaplní se ${count(Math.floor(a / k), N.lod.nom)} a na břehu stojí ještě ${count(a % k, N.viking.nom)}, a tak potřebují další loď. Celkem ${boats}.`,
      difficulty: 0.5,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const k = rng.int(3, 8);
    const a = rng.int(k * 3 + 1, k * 9);
    if (a % k === 0) return null;
    return {
      key: `t15-${c.name}-${a}-${k}`,
      prompt: `${c.name} ${v(c, ['rozdělil', 'rozdělila'])} ${count(a, N.jablko.acc)} mezi ${count(k, N.drak.acc)} tak, aby každý dostal stejně a co nejvíc. Kolik jablek zbylo?`,
      answer: num(a % k),
      hints: [`Kolik jablek dostane každý drak? Hledej v násobilce čísla ${k}.`, `${k} × ${Math.floor(a / k)} = ${k * Math.floor(a / k)}. Kolik zbývá do ${a}?`],
      explanation: `Každý dostal ${Math.floor(a / k)}, rozdalo se ${k * Math.floor(a / k)} a ${a % k >= 2 && a % k <= 4 ? 'zbyla' : 'zbylo'} ${count(a % k, N.jablko.nom)}.`,
      difficulty: 0.4,
    };
  },
  (rng) => {
    const s = rng.pick([12, 15, 24, 25, 35, 40, 45]);
    const h = rng.int(2, 8);
    const tens = Math.floor(s / 10) * 10;
    return {
      key: `t16-${s}-${h}`,
      prompt: `Drak uletí za hodinu ${s} kilometrů. Kolik kilometrů uletí za ${count(h, N.hodina.acc)}?`,
      answer: num(s * h, 'km'),
      hints: [
        `Každou hodinu uletí ${s} km.`,
        s === tens ? `Spočítej ${tens / 10} × ${h} a přidej nulu.` : `Rozlož ${s} na ${tens} a ${s - tens} a obě části vynásob číslem ${h}.`,
      ],
      explanation: `${h} × ${s} = ${s * h} km.`,
    };
  },
  (rng) => {
    const k = rng.int(2, 6);
    const w = rng.int(2, 4);
    return {
      key: `t17-${k}-${w}`,
      prompt: `Dráček sní každý den ${count(k, N.ryba.acc)}. Kolik ryb sní za ${count(w, TYDEN)}?`,
      answer: num(k * 7 * w),
      hints: ['Kolik dní má jeden týden?', `Za týden sní ${k} × 7 = ${k * 7}. A za ${w} týdny?`],
      explanation: `${k} × 7 = ${k * 7} za týden, ${k * 7} × ${w} = ${k * 7 * w}.`,
      difficulty: 0.3,
    };
  },
];

const L5: Template[] = [
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const d = rng.pick([2, 3, 4] as const);
    const word = { 2: 'Polovinu', 3: 'Třetinu', 4: 'Čtvrtinu' }[d];
    const nomWord = { 2: 'polovina', 3: 'třetina', 4: 'čtvrtina' }[d];
    const a = d * rng.int(4, 25);
    return {
      key: `t18-${c.name}-${a}-${d}`,
      prompt: `V truhle je ${a} mincí. ${word} mincí ${v(c, ['dal', 'dala'])} ${c.name} na stavbu nové lodi. Kolik mincí zůstalo v truhle?`,
      answer: num(a - a / d),
      hints: [`Kolik je ${nomWord} z ${a}?`, `${a} : ${d} = ${a / d}. Tolik mincí odešlo.`],
      explanation: `${nomWord.charAt(0).toUpperCase() + nomWord.slice(1)} z ${a} je ${a / d}. Zůstalo ${a} − ${a / d} = ${a - a / d}.`,
      difficulty: 0.3,
    };
  },
  (rng) => {
    const k = rng.int(2, 6);
    const small = rng.int(3, 12);
    const a = small * k;
    return {
      key: `t19-${a}-${k}`,
      prompt: `Velký drak sní za den ${count(a, N.ryba.acc)}. Dráček sní ${k}krát méně. Kolik ryb sní dráček?`,
      answer: num(small),
      hints: [`${k}krát méně znamená dělit ${k}.`, `${a} : ${k} = ?`],
      explanation: `${a} : ${k} = ${small}.`,
      difficulty: 0.2,
    };
  },
  (rng) => {
    const d = rng.int(8, 40);
    const s = rng.int(5, d - 1);
    return {
      key: `t20-${d}-${s}`,
      prompt: `Ohrada pro draky má tvar obdélníku. Je dlouhá ${d} metrů a široká ${s} metrů. Kolik metrů plotu je potřeba na celou ohradu?`,
      answer: num(2 * (d + s), 'm'),
      hints: ['Kolik stran má obdélník a které jsou stejně dlouhé?', `Obvod = ${d} + ${s} + ${d} + ${s}.`],
      explanation: `${d} + ${s} + ${d} + ${s} = ${2 * (d + s)} metrů.`,
      difficulty: 0.3,
    };
  },
  (rng) => {
    const c = rng.pick(CHARACTERS);
    const p = rng.pick([12, 15, 18, 25, 35]);
    const n = rng.int(3, 8);
    const m = rng.pick([200, 300, 500]);
    if (n * p >= m) return null;
    return {
      key: `t21-${c.name}-${p}-${n}-${m}`,
      prompt: `${c.name} ${v(c, ['měl', 'měla'])} ${m} Kč. ${v(c, ['Koupil', 'Koupila'])} ${count(n, N.ryba.acc)} po ${p} Kč. Kolik korun ${pron(c)} zbylo?`,
      answer: num(m - n * p, 'Kč'),
      hints: ['Nejdřív spočítej, kolik stály všechny ryby.', `${n} × ${p} = ${n * p}. Kolik zbude z ${m}?`],
      explanation: `${n} × ${p} = ${n * p} Kč a ${m} − ${n * p} = ${m - n * p} Kč.`,
      difficulty: 0.4,
    };
  },
];

const L6: Template[] = [
  (rng) => {
    const [c1, c2] = two(rng);
    const small = rng.int(5, 25);
    const diff = rng.int(2, 12);
    const total = small * 2 + diff;
    return {
      key: `t22-${c1.name}-${c2.name}-${total}-${diff}`,
      prompt: `${c1.name} a ${c2.name} mají dohromady ${total} šupin. ${c1.name} má o ${diff} víc než ${c2.name}. Kolik šupin má ${c2.name}?`,
      answer: num(small),
      hints: [`Co kdyby ${c1.name} ${v(c1, ['odložil', 'odložila'])} ${count(diff, N.supina.acc)} navíc?`, `Pak by ${c1.female && c2.female ? 'obě měly' : 'oba měli'} stejně a dohromady ${total - diff}.`],
      explanation: `${total} − ${diff} = ${total - diff}, polovina je ${small}. ${c2.name} má ${small}, ${c1.name} ${small + diff}.`,
      difficulty: 0.3,
    };
  },
  (rng) => {
    const legsDragon = 4;
    const riders = rng.int(2, 6);
    const dragons = riders;
    const legs = dragons * legsDragon + riders * 2;
    return {
      key: `t23-${riders}`,
      prompt: `Na louce stojí jezdci a jejich draci. Každý jezdec má jednoho draka. Všichni dohromady mají ${legs} nohou. Kolik je tam jezdců?`,
      answer: num(riders),
      hints: ['Kolik nohou mají dohromady jeden jezdec a jeho drak?', `Jezdec 2 a drak 4, tedy 6 nohou na dvojici. Kolikrát se 6 vejde do ${legs}?`],
      explanation: `Dvojice má 6 nohou a ${legs} : 6 = ${riders}. Na louce stojí ${count(riders, JEZDEC)}.`,
      difficulty: 0.2,
    };
  },
];

const BY_LEVEL: Record<Level, Template[]> = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5, 6: L6 };

function generate(level: Level, rng: Rng) {
  const templates = BY_LEVEL[level];
  for (let i = 0; i < 50; i++) {
    const p = rng.pick(templates)(rng);
    if (p) return mk(ID, level, p);
  }
  throw new Error(`${ID}: nepodařilo se vytvořit úlohu úrovně ${level}`);
}

export const slovni: SkillDef = {
  id: ID,
  island: 'cisla',
  name: 'Slovní úlohy',
  description: 'Úlohy z dračího světa: porozumět situaci, vybrat správnou operaci, u vyšších úrovní více kroků a úlohy „na přemýšlení“.',
  levels: [1, 2, 3, 4, 5, 6],
  rvp: { 1: ['M-3-1-05'], 2: ['M-3-1-05'], 3: ['M-3-1-05'], 4: ['M-5-1-04'], 5: ['M-5-1-04', 'M-5-3-02'], 6: ['M-5-4-01'] },
  ability: 'pocetni',
  generate,
};
