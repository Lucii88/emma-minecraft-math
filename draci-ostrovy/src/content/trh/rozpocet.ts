// Rozpočet – kapesné, příjmy a výdaje, kolik zbude, graf útraty, tabulka
// příjmů a výdajů, přebytek, schodek a vyrovnaný rozpočet, výlet, který
// musí vyjít, a plán spoření v tabulce.

import { capitalize, count, formatNumber as f, type Forms } from '../../core/czech';
import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import {
  GOODS,
  MESIC,
  PEOPLE,
  fx,
  kc,
  keyOf,
  korun,
  list,
  mix,
  nm,
  pickDistinct,
  pkey,
  plus,
  q,
  sum,
  v,
  zbudeVerb,
  type Attempt,
  type Person,
} from './common';

const ID = 'trh.rozpocet';

const BILANCE = ['Přebytkový', 'Schodkový', 'Vyrovnaný'];

// ---------------------------------------------------------------------------
// L3 – příjem, výdaj, rozpočet

const L3: Spec[] = [
  q('rozpocet', 'Co je rozpočet?', 'Plán příjmů a výdajů',
    ['Účtenka z obchodu', 'Prasátko', 'Seznam hraček'],
    ['Co v něm porovnáváš?'],
    'Rozpočet je plán: kolik peněz přijde a za co se utratí. Mají ho rodiny, obce i stát.'),
  q('prijem', 'Co je příjem?', 'Peníze, které dostaneš',
    ['Peníze, které utratíš', 'Sleva', 'Dluh'],
    ['Peníze přibudou, nebo ubudou?'],
    'Příjem jsou peníze, které přicházejí: kapesné, výplata nebo dárek.'),
  q('vydaj', 'Co je výdaj?', 'Peníze, které utratíš',
    ['Peníze, které dostaneš', 'Úspory', 'Kapesné'],
    ['Peníze přibudou, nebo ubudou?'],
    'Výdaj jsou peníze, které odcházejí: za jídlo, hračky nebo lístek do kina.'),
  q('zapisovat', 'Proč si zapisovat, za co utrácíš?', 'Abys věděla, kam peníze mizí',
    ['Aby peníze přibyly', 'Aby ti obchod dal slevu', 'Není to k ničemu'],
    ['Pamatuješ si každý nákup za celý měsíc?'],
    'Když si výdaje zapisuješ, uvidíš, za co utrácíš nejvíc. Pak se dá lépe plánovat.'),
  q('nejdriv-plan', 'Co je dobré udělat, než utratíš kapesné?', 'Rozmyslet si, na co ho chceš',
    ['Utratit ho hned celé', 'Rozdat ho cizím lidem', 'Vyměnit ho za bonbony'],
    ['Co je plán?'],
    'Když si předem rozmyslíš, na co kapesné použiješ, spíš ti vystačí a můžeš i něco ušetřit.'),
];

// ---------------------------------------------------------------------------
// L4 – přebytek, schodek, rezerva

const L4: Spec[] = [
  q('prebytek', 'Když máš víc příjmů než výdajů, jaký je rozpočet?', 'Přebytkový',
    ['Schodkový', 'Vyrovnaný', 'Prázdný'],
    ['Něco peněz zbude, nebo bude chybět?'],
    'Přebytkový rozpočet znamená, že peníze zbudou. Přebytek se dá ušetřit.'),
  q('schodek', 'Když utratíš víc, než dostaneš, jaký je rozpočet?', 'Schodkový',
    ['Přebytkový', 'Vyrovnaný', 'Veselý'],
    ['Peníze zbudou, nebo budou chybět?'],
    'Schodkový rozpočet znamená, že výdaje jsou vyšší než příjmy a peníze chybějí.'),
  q('vyrovnany', 'Příjmy i výdaje jsou stejně velké. Jaký je rozpočet?', 'Vyrovnaný',
    ['Přebytkový', 'Schodkový', 'Prázdný'],
    ['Zbude něco?'],
    'Když se příjmy rovnají výdajům, rozpočet je vyrovnaný. Nic nezbude, ale nic ani nechybí.'),
  q('reseni-schodku', 'Rodinný rozpočet je schodkový. Co může rodina udělat?', 'Omezit výdaje nebo zvýšit příjmy',
    ['Utrácet ještě víc', 'Nic, schodek zmizí sám', 'Vyhodit účtenky'],
    ['Co se musí změnit, aby peníze nechyběly?'],
    'Buď se utratí méně, nebo se víc peněz vydělá. Často pomůže obojí.'),
  q('rezerva', 'Proč je dobré mít v rozpočtu rezervu?', 'Na nečekané výdaje',
    ['Na sladkosti navíc', 'Aby byl rozpočet delší', 'Rezerva se nesmí použít'],
    ['Co když se něco rozbije?'],
    'Rezerva jsou peníze stranou pro případ, že se stane něco nečekaného.'),
  q('prebytek-co', 'Na konci měsíce máš přebytek 150 Kč. Co s ním můžeš udělat?', 'Ušetřit ho na cíl',
    ['Musíš ho vrátit', 'Propadne', 'Musíš ho utratit'],
    ['Komu přebytek patří?'],
    'Přebytek je tvůj. Můžeš ho ušetřit na cíl nebo na horší časy.'),
];

// ---------------------------------------------------------------------------
// L5 – pravidelné a nečekané výdaje, rozpočet výletu i státu

const L5: Spec[] = [
  q('stat', 'Má svůj rozpočet i stát?', 'Ano, i stát plánuje příjmy a výdaje',
    ['Ne, stát má peněz, kolik chce', 'Ne, rozpočet mají jen děti', 'Ne, stát nic neplatí'],
    ['Z čeho stát platí školy a silnice?'],
    'Stát má rozpočet: příjmy hlavně z daní a z pojištění, které lidé platí z výplat, a výdaje třeba na důchody, školy nebo silnice. Schvalují ho poslanci.'),
  q('pravidelny', 'Který výdaj rodina platí pravidelně každý měsíc?', 'Nájem',
    ['Oprava rozbité pračky', 'Dárek na svatbu', 'Nové lyže'],
    ['Co se platí pořád znovu?'],
    'Nájem nebo splátka za bydlení se platí každý měsíc. Opravy a dárky přicházejí jen občas.'),
  q('necekany', 'Který výdaj bývá nečekaný?', 'Oprava rozbitého kola',
    ['Nájem', 'Kapesné', 'Obědy ve škole'],
    ['Který výdaj nejde naplánovat na den přesně?'],
    'Nečekané výdaje nejde předem přesně naplánovat. Proto se hodí rezerva.'),
  q('co-patri-do-vyletu', 'Třída plánuje výlet. Co musí zahrnout do rozpočtu?', 'Dopravu, vstupné a jídlo',
    ['Jen vstupné', 'Jen svačinu', 'Nic, výlet je zadarmo'],
    ['Za co všechno se na výletě platí?'],
    'V rozpočtu výletu musí být všechno: cesta tam i zpátky, vstupné a jídlo.'),
];

// ---------------------------------------------------------------------------
// L6 – když se rozpočet mění (hlavně generátory níže)

const L6: Spec[] = [
  q('nizsi-vyplata', 'Tátovi se snížila výplata. Co dává smysl upravit jako první?', 'Méně utrácet za přání',
    ['Přestat platit nájem', 'Přestat kupovat jídlo', 'Půjčit si na dovolenou'],
    ['Bez čeho se rodina neobejde?'],
    'Potřeby jako bydlení a jídlo se platí dál. Ušetřit se dá hlavně na přáních.'),
  q('obalky', 'Někdo si dělí kapesné do tří obálek: utratit, ušetřit, darovat. K čemu to je?', 'Předem rozhodne, kam peníze půjdou',
    ['Aby peníze přibyly', 'Aby se peníze ztratily', 'Je to povinné'],
    ['Co se stane s penězi v obálce ušetřit?'],
    'Obálky pomáhají rozhodnout předem, kolik utratit, kolik ušetřit a kolik darovat. Je to jeden z nápadů, ne povinnost.'),
];

// ---------------------------------------------------------------------------
// Kapesné: kolik zbude

const SPENDS = [
  { key: 'zmrzlina', acc: 'zmrzlinu', min: 30, max: 80 },
  { key: 'sesit', acc: 'sešit', min: 20, max: 40 },
  { key: 'lizatko', acc: 'lízátko', min: 10, max: 20 },
  { key: 'bazen', acc: 'vstup do bazénu', min: 60, max: 120 },
  { key: 'darek', acc: 'dárek pro kamarádku', min: 50, max: 150 },
  { key: 'pastelky', acc: 'pastelky', min: 40, max: 90 },
  { key: 'knizka', acc: 'knížku', min: 100, max: 250 },
  { key: 'kino', acc: 'lístek do kina', min: 100, max: 180 },
];

function zbude(rng: Rng): Spec | null {
  const pocket = rng.pick([100, 150, 200, 250, 300, 400, 500]);
  const items = pickDistinct(rng, SPENDS, rng.int(2, 3)).map((s) => ({ ...s, amount: rng.int(s.min / 5, s.max / 5) * 5 }));
  const spent = sum(items.map((i) => i.amount));
  const left = pocket - spent;
  if (left < 0) return null;
  return nm(
    `zbude-${pocket}-${items.map((i) => `${i.key}${i.amount}`).join('-')}`,
    `Dostala jsi ${kc(pocket)} kapesného. Utratila jsi ${list(items.map((i) => `${kc(i.amount)} za ${i.acc}`))}. Kolik ti zbylo?`,
    left,
    ['Nejdřív sečti všechny útraty.', 'Součet odečti od kapesného.'],
    `Utratila jsi ${plus(items.map((i) => i.amount))} = ${kc(spent)}. Zbylo ti ${f(pocket)} − ${f(spent)} = ${kc(left)}.`,
    { unit: 'Kč', difficulty: items.length === 3 ? 0.1 : -0.1 },
  );
}

// ---------------------------------------------------------------------------
// Graf útraty

/** `min` = nejmenší uvěřitelná útrata za měsíc (lístek do kina za 5 Kč nebývá). */
const CATS = [
  { key: 'sladkosti', label: 'Sladkosti', emoji: '🍭', min: 10 },
  { key: 'hracky', label: 'Hračky', emoji: '🧸', min: 20 },
  { key: 'knizky', label: 'Knížky', emoji: '📚', min: 50 },
  { key: 'kino', label: 'Kino', emoji: '🎬', min: 80 },
  { key: 'darky', label: 'Dárky', emoji: '🎁', min: 20 },
  { key: 'vylety', label: 'Výlety', emoji: '🚌', min: 30 },
];

function utrata(level: 3 | 4): Attempt {
  return (rng) => {
    const cats = pickDistinct(rng, CATS, level === 3 ? rng.int(3, 4) : rng.int(4, 5));
    const step = level === 3 ? 5 : 10;
    const values = cats.map((c) => rng.int(Math.ceil(c.min / step), level === 3 ? 20 : 40) * step);
    const p = rng.pick(PEOPLE);
    const did = v(p, 'utratil', 'utratila');
    const visual = { type: 'bars' as const, title: 'Kam šly peníze za měsíc', unit: 'Kč', bars: cats.map((c, i) => ({ label: c.label, value: values[i], emoji: c.emoji })) };
    const lead = `Graf ukazuje, za co ${p.name} ${did} peníze za měsíc.`;
    const data = capitalize(cats.map((c, i) => `${c.label.toLowerCase()} ${korun(values[i])}`).join(', '));
    const base = `${pkey(p)}-${cats.map((c, i) => `${c.key}${values[i]}`).join('-')}`;
    const kind = rng.pick(['nejvic', 'celkem', 'rozdil'] as const);
    if (kind === 'nejvic') {
      const max = Math.max(...values);
      if (values.filter((x) => x === max).length !== 1) return null;
      const best = values.indexOf(max);
      const ask = `Za co ${did} nejvíc?`;
      return q(
        `utratanejvic-${base}`,
        `${lead} ${ask}`,
        cats[best].label,
        cats.filter((_, i) => i !== best).map((c) => c.label),
        ['Najdi nejvyšší sloupec.'],
        `Nejvyšší sloupec je u položky ${cats[best].label}: ${kc(max)}. Tam šlo nejvíc peněz.`,
        { visual, speak: `${lead} ${data}. ${ask}`, difficulty: -0.2 },
      );
    }
    if (kind === 'celkem') {
      const total = sum(values);
      const ask = `Kolik ${did} celkem?`;
      return nm(
        `utratacelkem-${base}`,
        `${lead} ${ask}`,
        total,
        ['Přečti hodnotu u každého sloupce.', 'Všechny hodnoty sečti.'],
        `${plus(values)} = ${kc(total)}.`,
        { unit: 'Kč', visual, speak: `${lead} ${data}. ${ask}`, difficulty: 0.1 },
      );
    }
    const [i, j] = rng.shuffle(cats.map((_, k) => k)).slice(0, 2);
    if (values[i] <= values[j]) return null;
    const ask = `O kolik korun víc ${did} za ${cats[i].label.toLowerCase()} než za ${cats[j].label.toLowerCase()}?`;
    return nm(
      `utratarozdil-${base}-${cats[i].key}-${cats[j].key}`,
      `${lead} ${ask}`,
      values[i] - values[j],
      ['Najdi oba sloupce a přečti jejich hodnoty.', 'Od většího čísla odečti menší.'],
      `${cats[i].label}: ${kc(values[i])}, ${cats[j].label.toLowerCase()}: ${kc(values[j])}. ${f(values[i])} − ${f(values[j])} = ${kc(values[i] - values[j])}.`,
      { unit: 'Kč', visual, speak: `${lead} ${data}. ${ask}`, difficulty: 0 },
    );
  };
}

// ---------------------------------------------------------------------------
// Tabulka příjmů a výdajů, přebytek a schodek

const INCOMES = [
  { key: 'kapesne', label: 'Kapesné', min: 20, max: 50 },
  { key: 'babicka', label: 'Od babičky', min: 10, max: 30 },
  { key: 'narozeniny', label: 'K narozeninám', min: 20, max: 50 },
  { key: 'prodej', label: 'Prodej starých her', min: 5, max: 20 },
];
const OUTGOINGS = [
  { key: 'knizka', label: 'Knížka', min: 15, max: 30 },
  { key: 'zmrzlina', label: 'Zmrzlina', min: 3, max: 8 },
  { key: 'kino', label: 'Kino', min: 10, max: 18 },
  { key: 'darek', label: 'Dárek pro tátu', min: 10, max: 30 },
  { key: 'pastelky', label: 'Pastelky', min: 4, max: 9 },
  { key: 'bazen', label: 'Bazén', min: 6, max: 12 },
];

type Row = { key: string; label: string; amount: number };

function rows(rng: Rng, from: typeof INCOMES, n: number): Row[] {
  return pickDistinct(rng, from, n).map((x) => ({ key: x.key, label: x.label, amount: rng.int(x.min, x.max) * 10 }));
}

const speakRows = (rs: Row[]) => rs.map((r) => `${r.label.toLowerCase()} ${korun(r.amount)}`).join(', ');

function ledger(p: Person) {
  return `${p.name} si ${v(p, 'zapsal', 'zapsala')} příjmy a výdaje za měsíc.`;
}

function tabulka(rng: Rng): Spec | null {
  const p = rng.pick(PEOPLE);
  const ins = rows(rng, INCOMES, rng.int(1, 2));
  const outs = rows(rng, OUTGOINGS, 4 - ins.length === 3 ? rng.int(2, 3) : 2);
  const left = sum(ins.map((r) => r.amount)) - sum(outs.map((r) => r.amount));
  if (left < 0) return null;
  const cells: (string | null)[] = ['Položka', 'Částka', ...ins.flatMap((r) => [r.label, `+${kc(r.amount)}`]), ...outs.flatMap((r) => [r.label, `−${kc(r.amount)}`]), 'Zbývá', null];
  const ask = `Kolik ${v(p, 'mu', 'jí')} zbývá?`;
  return nm(
    `tabulka-${pkey(p)}-${ins.map((r) => `${r.key}${r.amount}`).join('-')}-${outs.map((r) => `${r.key}${r.amount}`).join('-')}`,
    `${ledger(p)} ${ask}`,
    left,
    ['Plus jsou příjmy, mínus výdaje.', 'Sečti příjmy, sečti výdaje a odečti je.'],
    `Příjmy: ${ins.length > 1 ? `${plus(ins.map((r) => r.amount))} = ` : ''}${kc(sum(ins.map((r) => r.amount)))}. Výdaje: ${plus(outs.map((r) => r.amount))} = ${kc(sum(outs.map((r) => r.amount)))}. Zbývá ${f(sum(ins.map((r) => r.amount)))} − ${f(sum(outs.map((r) => r.amount)))} = ${kc(left)}.`,
    {
      unit: 'Kč',
      visual: { type: 'table', cols: 2, cells, ask: cells.length - 1 },
      speak: `${ledger(p)} Příjmy: ${speakRows(ins)}. Výdaje: ${speakRows(outs)}. ${ask}`,
      difficulty: 0.1,
    },
  );
}

function bilance(rng: Rng): Spec | null {
  const p = rng.pick(PEOPLE);
  const ins = rows(rng, INCOMES, 2);
  const outs = rows(rng, OUTGOINGS, 2);
  const income = sum(ins.map((r) => r.amount));
  // Výlet dorovná rozpočet tak, aby přebytek, schodek i vyrovnaný vycházely podobně často.
  const kind = rng.pick(['plus', 'minus', 'plus', 'minus', 'zero'] as const);
  const delta = kind === 'zero' ? 0 : rng.int(1, 15) * 10 * (kind === 'plus' ? -1 : 1);
  const trip = income - sum(outs.map((r) => r.amount)) + delta;
  if (trip < 60 || trip > 600) return null;
  outs.push({ key: 'vylet', label: 'Výlet', amount: trip });
  const spent = sum(outs.map((r) => r.amount));
  const correct = income > spent ? 0 : income < spent ? 1 : 2;
  const cells = ['Položka', 'Částka', ...ins.flatMap((r) => [r.label, `+${kc(r.amount)}`]), ...outs.flatMap((r) => [r.label, `−${kc(r.amount)}`])];
  const ask = `Jaký je ${v(p, 'jeho', 'její')} rozpočet?`;
  const verdict =
    correct === 0
      ? `Příjmy jsou vyšší o ${kc(income - spent)}, rozpočet je přebytkový.`
      : correct === 1
        ? `Výdaje jsou vyšší o ${kc(spent - income)}, rozpočet je schodkový.`
        : 'Příjmy a výdaje jsou stejné, rozpočet je vyrovnaný.';
  return fx(
    `bilance-${pkey(p)}-${ins.map((r) => `${r.key}${r.amount}`).join('-')}-${outs.map((r) => `${r.key}${r.amount}`).join('-')}`,
    `${ledger(p)} ${ask}`,
    BILANCE,
    correct,
    ['Sečti zvlášť příjmy a zvlášť výdaje.', 'Porovnej oba součty.'],
    `Příjmy: ${plus(ins.map((r) => r.amount))} = ${kc(income)}. Výdaje: ${plus(outs.map((r) => r.amount))} = ${kc(spent)}. ${verdict}`,
    { visual: { type: 'table', cols: 2, cells }, speak: `${ledger(p)} Příjmy: ${speakRows(ins)}. Výdaje: ${speakRows(outs)}. ${ask}`, difficulty: 0.1 },
  );
}

// ---------------------------------------------------------------------------
// Výlet: vyjde to?

const PLACES = [
  { key: 'hrad', text: 'na hrad' },
  { key: 'zoo', text: 'do zoo' },
  { key: 'muzeum', text: 'do muzea' },
  { key: 'skanzen', text: 'do skanzenu' },
  { key: 'planetarium', text: 'do planetária' },
];

function vylet(rng: Rng): Spec | null {
  const budget = rng.pick([300, 400, 500]);
  const ticket = rng.int(4, 12) * 5;
  const entry = rng.int(5, 20) * 10;
  const lunch = rng.int(8, 15) * 10;
  const where = rng.pick(PLACES);
  const cost = 2 * ticket + entry + lunch;
  const left = budget - cost;
  if (left < 0) return null;
  return nm(
    `vylet-${budget}-${ticket}-${where.key}-${entry}-${lunch}`,
    `Na školní výlet ${where.text} máš ${kc(budget)}. Jízdenka stojí ${kc(ticket)} jedním směrem, vstupné ${kc(entry)} a oběd ${kc(lunch)}. Kolik ti zbude?`,
    left,
    ['Kolik jízdenek potřebuješ, když se chceš vrátit domů?', 'Sečti všechny výdaje a odečti je od svých peněz.'],
    `Jízdenky tam i zpátky: 2 × ${ticket} = ${kc(2 * ticket)}. Celkem ${f(2 * ticket)} + ${f(entry)} + ${f(lunch)} = ${kc(cost)}. Zbude ${f(budget)} − ${f(cost)} = ${kc(left)}.`,
    { unit: 'Kč', difficulty: 0.2 },
  );
}

const DOSPELY: Forms = ['dospělý', 'dospělí', 'dospělých'];
const DITE: Forms = ['dítě', 'děti', 'dětí'];

function zoo(rng: Rng): Spec | null {
  const adults = rng.int(1, 2);
  const kids = rng.int(1, 3);
  const pa = rng.int(12, 25) * 10;
  const pc = rng.int(6, 15) * 10;
  const park = rng.pick([50, 60, 80, 100]);
  const cost = adults * pa + kids * pc + park;
  const budget = Math.round((cost + rng.int(-8, 8) * 10) / 50) * 50;
  if (budget === cost || budget <= 0) return null;
  const ok = cost <= budget;
  return fx(
    `zoo-${adults}-${kids}-${pa}-${pc}-${park}-${budget}`,
    `Do zoo jedou ${count(adults, DOSPELY)} a ${count(kids, DITE)}. Vstupné je ${kc(pa)} za dospělého a ${kc(pc)} za dítě, parkování ${kc(park)}. Rodina má ${kc(budget)}. Vyjde to?`,
    ['Ano, vyjde', 'Ne, nevyjde'],
    ok ? 0 : 1,
    ['Spočítej zvlášť vstupné pro dospělé a pro děti.', 'Přičti parkování a porovnej s penězi rodiny.'],
    `${adults === 1 ? 'Dospělý' : 'Dospělí'}: ${adults} × ${pa} = ${kc(adults * pa)}. ${kids === 1 ? 'Dítě' : 'Děti'}: ${kids} × ${pc} = ${kc(kids * pc)}. S parkováním celkem ${kc(cost)}. ${ok ? `Vyjde to a zbude ${kc(budget - cost)}.` : `Nevyjde to, chybí ${kc(cost - budget)}.`}`,
    { difficulty: 0.2 },
  );
}

// ---------------------------------------------------------------------------
// Plán spoření v tabulce

const MONTHS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
/** 2. pád: „na konci ledna“. */
const MONTHS_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
/** 6. pád s předložkou: „v lednu“. */
const MONTHS_LOC = ['v lednu', 'v únoru', 'v březnu', 'v dubnu', 'v květnu', 'v červnu', 'v červenci', 'v srpnu', 'v září', 'v říjnu', 'v listopadu', 'v prosinci'];

function plan(level: 5 | 6): Attempt {
  return (rng) => {
    const first = rng.int(0, 7);
    const n = level === 5 ? 4 : 5;
    const saved = Array.from({ length: n }, () => rng.int(5, 30) * 10);
    const totals: number[] = [];
    saved.reduce((acc, s) => {
      totals.push(acc + s);
      return acc + s;
    }, 0);
    const p = rng.pick(PEOPLE);
    const lead = `${p.name} si zapisuje, kolik každý měsíc ušetří a kolik má celkem.`;
    const months = MONTHS.slice(first, first + n);
    const speakRow = (i: number, hideSaved: boolean, hideTotal: boolean) =>
      `${months[i]}: ${hideSaved ? 'kolik ušetří, nevíme' : `ušetří ${korun(saved[i])}`}, ${hideTotal ? 'kolik má celkem, nevíme' : `celkem ${korun(totals[i])}`}`;
    if (level === 6 && rng.chance(0.5)) {
      // Kdy poprvé bude mít aspoň cílovou částku?
      const lo = Math.ceil(totals[1] / 50) + 1;
      const hi = Math.floor(totals[n - 1] / 50);
      if (lo > hi) return null;
      const goal = rng.int(lo, hi) * 50;
      const hit = totals.findIndex((t) => t >= goal);
      if (hit < 1 || totals[hit - 1] >= goal) return null;
      const cells = ['Měsíc', 'Ušetří', 'Celkem', ...months.flatMap((m, i) => [m, kc(saved[i]), kc(totals[i])])];
      const ask = `Na konci kterého měsíce bude mít poprvé aspoň ${kc(goal)}?`;
      return q(
        `plankdy-${pkey(p)}-${first}-${keyOf(saved)}-${goal}`,
        `${lead} ${ask}`,
        months[hit],
        months.filter((_, i) => i !== hit),
        ['Dívej se do sloupce Celkem.', `Hledáš první částku, která je aspoň ${kc(goal)}.`],
        `Na konci ${MONTHS_GEN[first + hit - 1]} má ${kc(totals[hit - 1])}, to je méně než ${kc(goal)}. Na konci ${MONTHS_GEN[first + hit]} má ${kc(totals[hit])}, a to už stačí.`,
        { visual: { type: 'table', cols: 3, cells }, speak: `${lead} ${months.map((_, i) => speakRow(i, false, false)).join('. ')}. ${ask}`, difficulty: 0.1 },
      );
    }
    // Doplň prázdné políčko: celkem (L5), nebo kolik ušetří (L6).
    const k = rng.int(1, n - 1);
    const askSaved = level === 6;
    const cells: (string | null)[] = ['Měsíc', 'Ušetří', 'Celkem'];
    months.forEach((m, i) => cells.push(m, askSaved && i === k ? null : kc(saved[i]), !askSaved && i === k ? null : kc(totals[i])));
    const ask = askSaved ? `Kolik ušetří ${MONTHS_LOC[first + k]}?` : `Kolik bude mít celkem na konci ${MONTHS_GEN[first + k]}?`;
    const answer = askSaved ? saved[k] : totals[k];
    return nm(
      `plan${askSaved ? 'usetri' : 'celkem'}-${pkey(p)}-${first}-${keyOf(saved)}-${k}`,
      `${lead} ${ask}`,
      answer,
      askSaved
        ? ['Porovnej sloupec Celkem v tomto a v předchozím měsíci.', 'O kolik se celkem zvětšilo?']
        : ['Celkem = celkem z minulého měsíce + to, co ušetří teď.', 'Sečti ta dvě čísla.'],
      askSaved
        ? `Celkem se zvětšilo z ${kc(totals[k - 1])} na ${kc(totals[k])}. ${f(totals[k])} − ${f(totals[k - 1])} = ${kc(saved[k])}.`
        : `${f(totals[k - 1])} + ${f(saved[k])} = ${kc(totals[k])}.`,
      {
        unit: 'Kč',
        visual: { type: 'table', cols: 3, cells, ask: 3 + k * 3 + (askSaved ? 1 : 2) },
        speak: `${lead} ${months.map((_, i) => speakRow(i, askSaved && i === k, !askSaved && i === k)).join('. ')}. ${ask}`,
        difficulty: askSaved ? 0.2 : 0,
      },
    );
  };
}

// ---------------------------------------------------------------------------
// L6: oslava s rezervou, spoření z kapesného, schodek rodiny

const BALONEK: Forms = ['balónek', 'balónky', 'balónků'];

function oslava(rng: Rng): Spec | null {
  const budget = rng.pick([300, 400, 500, 600]);
  const cake = rng.int(15, 35) * 10;
  const reserve = rng.pick([30, 50, 80, 100]);
  const each = rng.pick([8, 12, 15, 18, 25]);
  const rest = budget - cake - reserve;
  if (rest < each * 2) return null;
  const n = Math.floor(rest / each);
  const rem = rest - n * each;
  return nm(
    `oslava-${budget}-${cake}-${reserve}-${each}`,
    `Na oslavu máš ${kc(budget)}. Dort stojí ${kc(cake)} a ${kc(reserve)} si necháš stranou jako rezervu. Za zbytek koupíš balónky po ${kc(each)}. Kolik nejvíc balónků koupíš?`,
    n,
    ['Nejdřív spočítej, kolik zbude na balónky.', 'Kolikrát se cena balónku vejde do zbytku?'],
    `Na balónky zbude ${f(budget)} − ${f(cake)} − ${f(reserve)} = ${kc(rest)}. ${count(n, BALONEK)} stojí ${kc(n * each)}${rem ? ` a ${zbudeVerb(rem)} ${kc(rem)}, na další balónek to už nestačí` : ''}.`,
    { difficulty: 0.2 },
  );
}

function mesice(rng: Rng): Spec | null {
  const pocket = rng.pick([200, 250, 300, 400, 500]);
  const spend = rng.int(4, Math.floor(pocket / 10) - 5) * 10;
  const save = pocket - spend;
  const goal = rng.pick(GOODS.filter((g) => g.max >= 500));
  const price = rng.int(Math.ceil(goal.min / 50), Math.floor(goal.max / 50)) * 50;
  const n = Math.ceil(price / save);
  if (n < 3 || n > 18) return null;
  return nm(
    `mesice-${pocket}-${spend}-${goal.key}-${price}`,
    `Každý měsíc dostaneš ${kc(pocket)} kapesného a ${kc(spend)} utratíš. Zbytek šetříš. Za kolik měsíců budeš mít na ${goal.acc} za ${kc(price)}?`,
    n,
    ['Kolik každý měsíc ušetříš?', 'Kolik měsíců potřebuješ, aby úspory stačily na cenu?'],
    `Každý měsíc ušetříš ${f(pocket)} − ${f(spend)} = ${kc(save)}. ${price % save === 0 ? `${f(price)} : ${f(save)} = ${n}.` : `Za ${count(n - 1, MESIC)} budeš mít ${kc((n - 1) * save)}, to nestačí. Za ${count(n, MESIC)} ${kc(n * save)}, a to už stačí.`}`,
    { difficulty: 0.2 },
  );
}

function schodek(rng: Rng): Spec | null {
  const income = rng.int(60, 120) * 500;
  const over = rng.int(2, 40) * 100;
  const spent = income + over;
  const save = rng.chance(0.5) ? rng.int(2, 20) * 100 : 0;
  const answer = over + save;
  return nm(
    `schodek-${income}-${spent}-${save}`,
    `Rodina má měsíčně příjmy ${kc(income)} a výdaje ${kc(spent)}. O kolik korun musí snížit výdaje, aby ${save ? `každý měsíc ušetřila ${kc(save)}` : 'byl rozpočet vyrovnaný'}?`,
    answer,
    ['O kolik jsou výdaje vyšší než příjmy?', ...(save ? ['K tomu přičti částku, kterou chce rodina ušetřit.'] : [])],
    `Výdaje jsou vyšší o ${f(spent)} − ${f(income)} = ${kc(over)}.${save ? ` Aby rodina ještě ušetřila ${kc(save)}, musí výdaje snížit o ${f(over)} + ${f(save)} = ${kc(answer)}.` : ' O tolik musí výdaje snížit.'}`,
    { unit: 'Kč', difficulty: save ? 0.3 : 0.1 },
  );
}

// ---------------------------------------------------------------------------

export const rozpocet = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Rozpočet',
  description: 'Kapesné a rozpočet: příjmy a výdaje, kolik zbude, graf útraty, přebytek a schodek, výlet, který musí vyjít, a plán spoření v tabulce.',
  rvp: { 3: ['M-3-1-05'], 4: ['ČJS-5-2-03', 'M-5-2-02'], 5: ['ČJS-5-2-03', 'M-5-2-02'] },
  ability: 'pocetni',
  banks: { 3: L3, 4: L4, 5: L5, 6: L6 },
  genShare: 0.8,
  gen: {
    3: mix(ID, [[2, zbude], [2, utrata(3)]]),
    4: mix(ID, [[2, tabulka], [2, bilance], [1.5, utrata(4)]]),
    5: mix(ID, [[2, vylet], [2, zoo], [2, plan(5)]]),
    6: mix(ID, [[2, plan(6)], [1.5, oslava], [1.5, mesice], [1.5, schodek]]),
  },
});
