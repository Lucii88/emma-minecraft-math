// Spoření na cíl – za kolik týdnů našetřím, graf úspor, prasátko a účet
// v bance, jednoduchý úrok a od 6. úrovně úrok z úroku. Žádná „povinná
// pravidla“ (třeba odkládat desetinu) – nanejvýš jako jeden z nápadů.

import { capitalize, count, formatNumber as f, type Forms } from '../../core/czech';
import { bankSkill, type Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import {
  GOODS,
  PEOPLE,
  TYDEN,
  fx,
  kc,
  keyOf,
  korun,
  mix,
  nm,
  pkey,
  plus,
  q,
  sum,
  v,
  type Attempt,
  type Good,
} from './common';

const ID = 'trh.sporeni';

/** „po 3 týdnech“ (6. pád). */
const TYDEN_LOC: Forms = ['týdnu', 'týdnech', 'týdnech'];
/** Předložka před řadovou číslovkou: „v 1. týdnu“, „ve 2. týdnu“. */
const ve = (k: number) => (k >= 2 && k <= 4 ? 've' : 'v');
const week = (i: number) => `${i + 1}. týden`;

/** Na jídlo a drobnosti se nešetří – cílem jsou hračky, dárky a větší věci. */
const NOT_GOALS = new Set(['jablko', 'hruska', 'rohlik', 'lizatko', 'pernicek', 'tuzka', 'sesit', 'balonek', 'citron', 'vajicko', 'mydlo', 'mleko', 'chleb', 'syr']);

/** Cíl spoření, jehož obvyklá cena odpovídá částce. */
function goalFor(rng: Rng, price: number): Good | null {
  const goals = GOODS.filter((g) => !NOT_GOALS.has(g.key) && price >= g.min && price <= g.max);
  return goals.length ? rng.pick(goals) : null;
}

/** „to jsou 3 týdny“, „to je 7 týdnů“. */
const toJe = (n: number) => `to ${n >= 2 && n <= 4 ? 'jsou' : 'je'} ${count(n, TYDEN)}`;

// ---------------------------------------------------------------------------
// L2 – proč spořit

const L2: Spec[] = [
  q('proc-sporit', 'Proč je dobré šetřit peníze?', 'Abych si {mohla|mohl} koupit dražší věc',
    ['Aby peníze zmizely', 'Aby se nemusely počítat', 'Protože utrácet se nesmí'],
    ['Na co by ti nestačilo kapesné z jednoho týdne?'],
    'Když šetříš, peníze se sčítají. Časem si můžeš koupit i věc, na kterou by ti jedno kapesné nestačilo.'),
  q('rozbite-kolo', 'Leifovi se rozbilo kolo. Jak mu pomůžou úspory?', 'Zaplatí z nich opravu',
    ['Úspory jsou jen na hračky', 'Kolo se samo opraví', 'Musí kolo vyhodit'],
    ['Co stojí peníze, když se něco rozbije?'],
    'Úspory se hodí i na nečekané výdaje. Když se něco rozbije, je z čeho zaplatit opravu.'),
  q('prasatko', 'K čemu je prasátko?', 'Na šetření peněz',
    ['Na rozměňování mincí', 'Na placení v obchodě', 'Na krmení zvířat'],
    ['Co se do prasátka dává?'],
    'Prasátko je pokladnička. Mince a bankovky se do něj ukládají, aby se nerozkutálely a nerozutrácely.'),
  q('vedet-na-co', 'Proč je dobré vědět, na co šetříš?', 'Líp se vydrží šetřit',
    ['Peníze pak rostou samy', 'Nemusíš nic počítat', 'Prodavač ti dá slevu'],
    ['Na co myslíš, když chceš něco utratit?'],
    'Když víš, na co šetříš, snáz odoláš jiným lákadlům. Pomáhá si cíl nakreslit a pověsit na viditelné místo.'),
  q('kdy-odlozit', '{Dostala|Dostal} jsi kapesné. Kdy se šetří nejsnáz?', 'Když část odložím hned',
    ['Až všechno utratím', 'Až mi zbude po nákupech', 'Až bude prasátko plné'],
    ['Co se často stane s penězi, které jen tak nosíš v kapse?'],
    'Když část odložíš hned, jak peníze dostaneš, nelákají tě k utracení. Je to jeden z dobrých nápadů, jak šetřit.'),
];

// ---------------------------------------------------------------------------
// L3 – prasátko, nebo účet v bance?

const L3: Spec[] = [
  q('bezpeci', 'Kde jsou úspory nejvíc v bezpečí, i kdyby se doma něco ztratilo?', 'Na účtu v bance',
    ['Pod polštářem', 'V kapse bundy', 'V prasátku na parapetu'],
    ['Kde peníze hlídá někdo, kdo se tím zabývá?'],
    'Na účtu v bance peníze nikdo z domu neodnese a neztratí se. Banka je hlídá a vede o nich přesné záznamy.'),
  q('vyhoda-prasatka', 'Co je výhoda prasátka?', 'Vidíš, jak peníze přibývají',
    ['Peníze v něm samy rostou', 'Nedá se rozbít', 'Platí se z něj kartou'],
    ['Co můžeš s prasátkem dělat doma?'],
    'Prasátko je hned po ruce a můžeš sledovat, jak se plní. Peníze v něm ale samy nepřibývají.'),
  q('banka-co-dela', 'Co banka dělá s penězi, které si u ní lidé uloží?', 'Půjčuje je dalším lidem',
    ['Zamkne je a nic s nimi nedělá', 'Rozdá je zadarmo', 'Utratí je za dárky'],
    ['Odkud má banka peníze na půjčky?'],
    'Banka uložené peníze půjčuje dalším lidem a firmám. Za půjčky jí platí úrok a část z něj banka přidává těm, kdo spoří.'),
  q('porad-tvoje', 'Když uložíš 100 Kč do banky, jsou pořád tvoje?', 'Ano, banka je pro mě hlídá',
    ['Ne, teď patří bance', 'Ne, zmizí', 'Jen do večera'],
    ['Můžeš si je potom vybrat?'],
    'Peníze na účtu jsou pořád tvoje. Banka je hlídá a ty si je můžeš vybrat nebo s nimi zaplatit.'),
  q('prasatko-rok', 'Runa má v prasátku 500 Kč a celý rok na ně nesáhne. Kolik tam bude za rok?', 'Pořád 500 Kč',
    ['Víc, prasátko je rozmnoží', 'Méně, prasátko je sní', 'Přesně 1000 Kč'],
    ['Přidá prasátko k penězům něco samo?'],
    'V prasátku peníze samy nepřibývají. Na spořicím účtu by k nim banka za rok přidala úrok.'),
  q('na-horsi-casy', 'K čemu je dobré mít trochu peněz schovaných na horší časy?', 'Na nečekané výdaje',
    ['Na nic, lepší je utratit všechno', 'Aby se nemusely počítat', 'Na mlsání každý den'],
    ['Co když se něco rozbije nebo ztratí?'],
    'Úspory na horší časy pomůžou, když se stane něco nečekaného – rozbije se kolo nebo se ztratí čepice.'),
];

// ---------------------------------------------------------------------------
// L4 – úrok, pravidla a nápady na šetření

const L4: Spec[] = [
  q('co-je-urok', 'Banka ti za uložené peníze něco přidá. Jak se tomu říká?', 'Úrok',
    ['Sleva', 'Kapesné', 'Daň'],
    ['Stejné slovo se používá i u půjček – tam ho platí ten, kdo si půjčil.'],
    'Úrok je odměna od banky za to, že jí peníze necháš. Bývá malý, ale přibývá pravidelně.'),
  q('desetina', 'Kamarád tvrdí, že každý musí šetřit přesně desetinu kapesného. Je to pravidlo?', 'Ne, je to jen jeden nápad',
    ['Ano, tak to musí být', 'Ano, jinak se peníze ztratí', 'Ano, nařizuje to banka'],
    ['Kdo by takové pravidlo určil?'],
    'Kolik šetřit, si každý rozmyslí sám podle toho, kolik má a na co šetří. Desetina je jen jeden z nápadů.'),
  q('tom-kolo', 'Tom dostává 100 Kč měsíčně a všechno hned utratí. Jednou by chtěl kolo. Co mu pomůže?', 'Začít každý měsíc kousek odkládat',
    ['Utrácet ještě rychleji', 'Čekat, až kolo bude zadarmo', 'Nic, na kolo nikdy mít nebude'],
    ['Jak se z malých částek stane velká?'],
    'Když bude každý měsíc kousek odkládat, úspory porostou. I malé částky se časem sečtou.'),
  q('ucet-deti', 'Kdo může malému dítěti založit účet v bance?', 'Rodič',
    ['Kdokoli z ulice', 'Jen paní učitelka', 'Dítě úplně samo'],
    ['Kdo se o tebe stará?'],
    'Malému dítěti zakládá účet rodič nebo jiný zákonný zástupce. Spolu pak můžou sledovat, jak úspory rostou.'),
  q('uspory-rostou', 'Kde úspory rostou samy o sobě, i když nic nepřidáš?', 'Na spořicím účtu s úrokem',
    ['V prasátku', 'V krabici od bot', 'V peněžence'],
    ['Kdo ti může k penězům něco přidat?'],
    'Na spořicím účtu banka přidává úrok. V prasátku, krabici ani peněžence peníze samy nepřibývají.'),
];

// ---------------------------------------------------------------------------
// L5 – proč banka platí úrok, pojištění vkladů

const L5: Spec[] = [
  q('proc-urok', 'Proč ti banka platí úrok?', 'Tvoje peníze půjčuje dalším lidem',
    ['Protože je hodná', 'Protože musí rozdávat', 'Protože jsi {šikovná|šikovný}'],
    ['Co banka dělá s uloženými penězi?'],
    'Banka uložené peníze půjčuje a za půjčky dostává úrok. Část z něj pak přidá tobě.'),
  q('pojisteni', 'Co se stane s úsporami na účtu, kdyby banka zkrachovala?', 'Lidé dostanou úspory zpátky',
    ['Všechno se navždy ztratí', 'Zůstanou navždy zamčené', 'Musí se na ně čekat sto let'],
    ['Víš, co znamená, když je něco pojištěné?'],
    'Vklady v bankách jsou v Česku ze zákona pojištěné. Kdyby banka zkrachovala, každý dostane úspory zpátky až do částky 100 000 eur, což je přes dva miliony korun.'),
  q('plan', 'Co je spořicí plán?', 'Kolik a jak dlouho budu šetřit',
    ['Seznam věcí, které si koupím', 'Přehled, kolik jsem {utratila|utratil}', 'Smlouva o půjčce'],
    ['Co potřebuješ vědět, když šetříš na cíl?'],
    'Spořicí plán říká, kolik budeš odkládat a jak dlouho. Pak víš, kdy budeš mít na svůj cíl dost.'),
  q('rezerva-rodina', 'Rodina má stranou peníze na nečekané výdaje. Kdy je použije?', 'Když se rozbije pračka',
    ['Když chce novou televizi', 'Když je v obchodě sleva', 'Každý pátek na výlet'],
    ['Co se může nečekaně rozbít?'],
    'Takovým úsporám se říká rezerva. Hodí se, když se nečekaně rozbije pračka nebo auto.'),
];

// ---------------------------------------------------------------------------
// L6 – úrok z úroku, inflace, začít dřív

const L6: Spec[] = [
  q('zacit-driv', 'Dvě kamarádky dávají do banky každý rok stejně peněz. Jedna začala o pět let dřív. Která bude mít víc?', 'Ta, která začala dřív',
    ['Ta, která začala později', 'Obě stejně', 'Žádná'],
    ['Co se děje s úsporami v bance každý rok?'],
    'Kdo začne dřív, uloží víc peněz a banka mu přidá víc úroků – i úroků z úroků.'),
  q('inflace', 'Zmrzlina stála před lety 10 Kč, teď stojí 30 Kč. Co to znamená pro stovku schovanou v prasátku?', 'Koupíš za ni méně než dřív',
    ['Koupíš za ni víc', 'Nic se nemění', 'Stovka má větší hodnotu'],
    ['Kolik zmrzlin koupíš za stovku dřív a teď?'],
    'Dřív by stovka stačila na 10 zmrzlin, teď jen na 3. Když ceny rostou, koupí se za stejné peníze méně věcí. Říká se tomu inflace.'),
  q('slozeny-urok', 'Co je úrok z úroku?', 'Úrok i z dřívějších úroků',
    ['Úrok, který se platí dvakrát', 'Sleva na úrok', 'Úrok, který banka vezme zpátky'],
    ['Co se stane s úrokem, který necháš na účtu?'],
    'Když úrok necháš na účtu, příští rok banka počítá úrok i z něj. Proto úspory rostou čím dál rychleji.'),
];

// ---------------------------------------------------------------------------
// Generátory: týdny spoření

/** Za kolik týdnů našetříš? (Dělitelné beze zbytku.) */
function tydny(level: 2 | 3): Attempt {
  return (rng) => {
    const w = rng.pick(level === 2 ? [2, 5, 10] : [10, 20, 25, 50]);
    const n = rng.int(3, level === 2 ? 10 : 12);
    const total = w * n;
    if (total > (level === 2 ? 100 : 600)) return null;
    const goal = goalFor(rng, total);
    if (!goal) return null;
    const steps = Array.from({ length: n }, (_, i) => f((i + 1) * w));
    return nm(
      `tydny-${goal.key}-${total}-${w}`,
      `${capitalize(goal.nom)} stojí ${kc(total)}. Každý týden si ušetříš ${kc(w)}. Za kolik týdnů budeš mít dost peněz?`,
      n,
      [`Přičítej po ${w}: ${w}, ${2 * w}…`, level === 2 ? 'Spočítej, kolikrát přičítáš.' : 'Můžeš i dělit: cenu vyděl tím, co ušetříš za týden.'],
      `${steps.join(', ')} – ${toJe(n)}. Nebo: ${f(total)} : ${w} = ${n}.`,
      { difficulty: level === 2 ? 0 : 0.1 },
    );
  };
}

function bude(rng: Rng): Spec | null {
  const w = rng.pick([2, 5, 10]);
  const n = rng.int(2, 5);
  const start = rng.int(1, 6) * 5;
  const total = start + w * n;
  if (total > 100) return null;
  const steps = Array.from({ length: n + 1 }, (_, i) => f(start + i * w));
  return nm(
    `bude-${start}-${w}-${n}`,
    `V prasátku máš ${kc(start)}. Každý týden přidáš ${kc(w)}. Kolik tam bude za ${count(n, TYDEN)}?`,
    total,
    ['Přičítej za každý týden jednou.', `Začni od ${start} a přičti ${w}.`],
    `${steps.join(', ')} – za ${count(n, TYDEN)} tam bude ${kc(total)}.`,
    { unit: 'Kč', difficulty: -0.1 },
  );
}

/** Na cíl už něco mám: kolik týdnů ještě (L3 dělitelné, L4 se zbytkem). */
function cil(level: 3 | 4): Attempt {
  return (rng) => {
    const w = rng.pick(level === 3 ? [10, 20, 25, 50] : [15, 20, 25, 30, 40, 50, 60, 75]);
    const start = rng.int(1, 12) * 10;
    const missing = level === 3 ? w * rng.int(2, 10) : rng.int(3, 30) * 10 + rng.pick([0, 5]);
    if (level === 4 && missing % w === 0) return null;
    const price = start + missing;
    const goal = goalFor(rng, price);
    if (!goal) return null;
    const n = Math.ceil(missing / w);
    if (n < 2 || n > 16) return null;
    return nm(
      `cil-${goal.key}-${price}-${start}-${w}`,
      `Chceš ${goal.acc} za ${kc(price)}. Už máš ${kc(start)} a každý týden ušetříš ${kc(w)}. Za kolik týdnů budeš mít dost?`,
      n,
      ['Nejdřív spočítej, kolik ti ještě chybí.', 'Kolikrát musíš přidat týdenní úsporu, aby to stačilo?'],
      level === 3
        ? `Chybí ${f(price)} − ${f(start)} = ${kc(missing)}. ${f(missing)} : ${w} = ${n}, takže ${count(n, TYDEN)}.`
        : `Chybí ${f(price)} − ${f(start)} = ${kc(missing)}. Za ${count(n - 1, TYDEN)} ušetříš ${kc((n - 1) * w)}, to ještě nestačí. Za ${count(n, TYDEN)} ušetříš ${kc(n * w)}, a to už stačí.`,
      { difficulty: level === 4 ? 0.2 : 0.1 },
    );
  };
}

function chybiPo(rng: Rng): Spec | null {
  const w = rng.pick([15, 20, 25, 30, 40, 50]);
  const start = rng.int(1, 12) * 10;
  const n = rng.int(2, 8);
  const price = start + n * w + rng.int(1, 20) * 5;
  const goal = goalFor(rng, price);
  if (!goal) return null;
  const left = price - start - n * w;
  return nm(
    `chybipo-${goal.key}-${price}-${start}-${w}-${n}`,
    `Chceš ${goal.acc} za ${kc(price)}. Už máš ${kc(start)} a každý týden ušetříš ${kc(w)}. Kolik ti bude chybět po ${count(n, TYDEN_LOC)}?`,
    left,
    [`Kolik ušetříš za ${count(n, TYDEN)}?`, 'Přičti to k tomu, co už máš, a porovnej s cenou.'],
    `Za ${count(n, TYDEN)} ušetříš ${n} × ${w} = ${kc(n * w)}. Budeš mít ${f(start)} + ${f(n * w)} = ${kc(start + n * w)}. Chybět bude ${f(price)} − ${f(start + n * w)} = ${kc(left)}.`,
    { unit: 'Kč', difficulty: 0.1 },
  );
}

// ---------------------------------------------------------------------------
// Graf úspor

function grafTydny(rng: Rng): Spec | null {
  const n = rng.int(3, 5);
  const values = Array.from({ length: n }, () => rng.int(1, 4) * 5);
  const p = rng.pick(PEOPLE);
  const did = v(p, 'ušetřil', 'ušetřila');
  const visual = { type: 'bars' as const, title: 'Úspory po týdnech', unit: 'Kč', bars: values.map((value, i) => ({ label: week(i), value })) };
  const data = values.map((x, i) => `${week(i)} ${korun(x)}`).join(', ');
  const lead = `Graf ukazuje, kolik ${p.name} ${did} každý týden.`;
  if (rng.chance(0.5)) {
    const total = sum(values);
    return nm(
      `grafsoucet-${pkey(p)}-${keyOf(values)}`,
      `${lead} Kolik ${did} celkem?`,
      total,
      ['Přečti hodnotu u každého sloupce.', 'Všechny hodnoty sečti.'],
      `${plus(values)} = ${kc(total)}.`,
      { unit: 'Kč', visual, speak: `${lead} ${data}. Kolik ${did} celkem?`, difficulty: 0 },
    );
  }
  const max = Math.max(...values);
  if (values.filter((x) => x === max).length !== 1) return null;
  const best = values.indexOf(max);
  return q(
    `grafnejvic-${pkey(p)}-${keyOf(values)}`,
    `${lead} Ve kterém týdnu ${did} nejvíc?`,
    week(best),
    values.map((_, i) => week(i)).filter((_, i) => i !== best),
    ['Najdi nejvyšší sloupec.'],
    `Nejvyšší sloupec je ${ve(best + 1)} ${best + 1}. týdnu: ${kc(max)}.`,
    { visual, speak: `${lead} ${data}. Ve kterém týdnu ${did} nejvíc?`, difficulty: -0.2 },
  );
}

/** Graf stavu prasátka na konci týdnů: kolik přibylo, kdy ubylo. */
function grafStav(rng: Rng): Spec | null {
  const n = rng.int(4, 5);
  const adds = Array.from({ length: n }, () => rng.int(1, 6) * 10);
  const drop = rng.chance(0.4);
  const di = rng.int(1, n - 1);
  if (drop) adds[di] = -rng.int(1, 3) * 10;
  const totals: number[] = [];
  adds.reduce((acc, a) => {
    totals.push(acc + a);
    return acc + a;
  }, 0);
  if (totals.some((t) => t <= 0)) return null;
  const p = rng.pick(PEOPLE);
  const visual = { type: 'bars' as const, title: 'V prasátku na konci týdne', unit: 'Kč', bars: totals.map((value, i) => ({ label: week(i), value })) };
  const data = totals.map((x, i) => `${week(i)} ${korun(x)}`).join(', ');
  const lead = `Graf ukazuje, kolik peněz ${v(p, 'měl', 'měla')} ${p.name} v prasátku na konci každého týdne.`;
  if (drop) {
    const ask = 'Ve kterém týdnu peníze v prasátku ubyly?';
    return q(
      `grafubylo-${pkey(p)}-${keyOf(totals)}`,
      `${lead} ${ask}`,
      week(di),
      totals.map((_, i) => week(i)).filter((_, i) => i !== di && i > 0),
      ['Hledej sloupec, který je nižší než ten před ním.'],
      `${capitalize(ve(di + 1))} ${di + 1}. týdnu klesl sloupec z ${kc(totals[di - 1])} na ${kc(totals[di])}. ${p.name} si ${v(p, 'vzal', 'vzala')} ${kc(totals[di - 1] - totals[di])}.`,
      { visual, speak: `${lead} ${data}. ${ask}`, difficulty: 0.1 },
    );
  }
  const k = rng.int(2, n);
  const d = totals[k - 1] - totals[k - 2];
  const ask = `Kolik korun ${v(p, 'přidal', 'přidala')} ${ve(k)} ${k}. týdnu?`;
  return nm(
    `grafpridal-${pkey(p)}-${keyOf(totals)}-${k}`,
    `${lead} ${ask}`,
    d,
    ['Porovnej sloupec toho týdne se sloupcem týdne před ním.', 'Odečti menší číslo od většího.'],
    `Na konci ${k - 1}. týdne bylo v prasátku ${kc(totals[k - 2])}, na konci ${k}. týdne ${kc(totals[k - 1])}. ${f(totals[k - 1])} − ${f(totals[k - 2])} = ${kc(d)}.`,
    { unit: 'Kč', visual, speak: `${lead} ${data}. ${ask}`, difficulty: 0.1 },
  );
}

/** Spořicí tabulka se stálou týdenní částkou a jedním prázdným políčkem. */
function tabulka(rng: Rng): Spec | null {
  const w = rng.pick([15, 20, 25, 30, 35, 40, 45, 50]);
  const start = rng.int(0, 10) * 10;
  const totals = [1, 2, 3, 4].map((i) => start + i * w);
  const k = rng.int(2, 4);
  const p = rng.pick(PEOPLE);
  const cells: (string | null)[] = ['Týden', 'V prasátku'];
  totals.forEach((t, i) => cells.push(`${i + 1}.`, i + 1 === k ? null : kc(t)));
  const [a, b] = k === 2 ? [3, 4] : [1, 2];
  const lead = `${p.name} dává do prasátka každý týden stejnou částku.`;
  const ask = `Kolik v něm bylo na konci ${k}. týdne?`;
  return nm(
    `tabulka-${pkey(p)}-${start}-${w}-${k}`,
    `${lead} ${ask}`,
    totals[k - 1],
    ['O kolik se částka mění z týdne na týden?', 'Tu změnu přičti k předchozímu týdnu.'],
    `Každý týden přibude ${f(totals[b - 1])} − ${f(totals[a - 1])} = ${kc(w)}. Na konci ${k}. týdne tedy bylo ${f(totals[k - 2])} + ${f(w)} = ${kc(totals[k - 1])}.`,
    {
      unit: 'Kč',
      visual: { type: 'table', cols: 2, cells, ask: 2 + (k - 1) * 2 + 1 },
      speak: `${lead} V tabulce je: ${totals.map((t, i) => `${i + 1}. týden ${i + 1 === k ? 'nevíme' : korun(t)}`).join(', ')}. ${ask}`,
      difficulty: 0.1,
    },
  );
}

// ---------------------------------------------------------------------------
// Úrok

function urok(rng: Rng): Spec | null {
  const r = rng.int(1, 5);
  const amount = rng.int(2, 50) * 100;
  const add = (amount / 100) * r;
  const after = rng.chance(0.5);
  const hundreds = amount / 100;
  return nm(
    `urok-${amount}-${r}-${after ? 'po' : 'prida'}`,
    `Banka přidá za rok ${kc(r)} z každých 100 Kč. Na účtu máš ${kc(amount)}. ${after ? 'Kolik tam budeš mít po roce?' : 'Kolik korun banka přidá za rok?'}`,
    after ? amount + add : add,
    ['Kolik stovek je na účtu?', `Za každou stovku přidá banka ${kc(r)}.`],
    `${kc(amount)} je ${hundreds}krát 100 Kč. Banka přidá ${hundreds} × ${r} = ${kc(add)}.${after ? ` Po roce tam bude ${f(amount)} + ${f(add)} = ${kc(amount + add)}.` : ''}`,
    { unit: 'Kč', difficulty: after ? 0.2 : 0 },
  );
}

/** Babička přidala a zbytek se našetří. */
function darek(rng: Rng): Spec | null {
  const w = rng.pick([20, 25, 30, 40, 50, 60, 75, 100]);
  const start = rng.int(2, 30) * 10;
  const gift = rng.int(2, 10) * 50;
  const price = rng.int(40, 200) * 10;
  const missing = price - start - gift;
  if (missing <= 0) return null;
  const n = Math.ceil(missing / w);
  if (n < 2 || n > 20) return null;
  const goal = goalFor(rng, price);
  if (!goal) return null;
  const exact = missing % w === 0;
  return nm(
    `darek-${goal.key}-${price}-${start}-${gift}-${w}`,
    `Na ${goal.acc} za ${kc(price)} máš ${kc(start)}. Babička ti dnes přidala ${kc(gift)} a ty každý týden ušetříš ${kc(w)}. Za kolik týdnů budeš mít dost?`,
    n,
    ['Kolik máš i s dárkem od babičky?', 'Kolik ještě chybí? Kolik týdnů spoření to pokryje?'],
    `Máš ${f(start)} + ${f(gift)} = ${kc(start + gift)}, chybí ${kc(missing)}. ${exact ? `${f(missing)} : ${w} = ${n}, takže ${count(n, TYDEN)}.` : `Za ${count(n - 1, TYDEN)} ušetříš ${kc((n - 1) * w)}, to nestačí. Za ${count(n, TYDEN)} ${kc(n * w)}, a to už stačí.`}`,
    { difficulty: 0.2 },
  );
}

/** Úrok z úroku za dva roky (čísla vycházejí beze zbytku). */
function urok2(rng: Rng): Spec | null {
  const [amount, r] = rng.pick([[2500, 2], [5000, 2], [7500, 2], [10000, 2], [2500, 4], [5000, 4], [7500, 4], [10000, 4], [10000, 5]] as const);
  const y1 = (amount * r) / 100;
  const a1 = amount + y1;
  const y2 = (a1 * r) / 100;
  const a2 = a1 + y2;
  return nm(
    `urok2-${amount}-${r}`,
    `Banka přidá každý rok ${kc(r)} z každých 100 Kč, které jsou na účtu. Uložíš ${kc(amount)} a nic nevybereš. Kolik tam bude za 2 roky?`,
    a2,
    ['Nejdřív spočítej, kolik bude na účtu po prvním roce.', 'Ve druhém roce se úrok počítá z nové, vyšší částky.'],
    `Po 1. roce: ${f(amount)} + ${f(y1)} = ${kc(a1)}. Ve 2. roce se úrok počítá z ${kc(a1)}: ${f(a1)} + ${f(y2)} = ${kc(a2)}. Úrok z úroku přidal ${kc(a2 - amount - 2 * y1)} navíc.`,
    { unit: 'Kč', difficulty: 0.2 },
  );
}

/** Která banka přidá víc? */
function banky(rng: Rng): Spec | null {
  const r1 = rng.int(1, 5);
  const same = rng.chance(0.25);
  const r2 = same ? r1 : r1 + rng.pick([-2, -1, 1, 2]);
  if (r2 < 1) return null;
  const base = rng.pick([200, 500, 1000]);
  const x = (r2 * base) / 100;
  const correct = r1 > r2 ? 0 : r1 < r2 ? 1 : 2;
  return fx(
    `banky-${r1}-${x}-${base}`,
    `Banka A přidá za rok ${kc(r1)} z každých 100 Kč. Banka B přidá za rok ${kc(x)} z každých ${kc(base)}. Která přidá víc?`,
    ['Banka A', 'Banka B', 'Obě stejně'],
    correct,
    ['Převeď nabídku banky B na 100 Kč.', `${kc(base)} je ${base / 100}krát 100 Kč.`],
    `Banka B: ${f(x)} Kč z ${f(base)} Kč je ${f(x)} : ${base / 100} = ${kc(r2)} ze 100 Kč. Banka A dává ${kc(r1)} ze 100 Kč. ${correct === 2 ? 'Obě přidají stejně.' : `Víc přidá banka ${correct === 0 ? 'A' : 'B'}.`}`,
    { difficulty: 0.1 },
  );
}

/** Střídavé spoření: kdy poprvé budeš mít aspoň cílovou částku? */
function stridave(rng: Rng): Spec | null {
  const a = rng.int(3, 10) * 10;
  const b = rng.int(1, 8) * 10;
  if (a === b) return null;
  const target = rng.int(20, 80) * 10;
  let total = 0;
  let n = 0;
  while (total < target) {
    total += n % 2 === 0 ? a : b;
    n++;
  }
  if (n < 4 || n > 16) return null;
  const pair = a + b;
  const k = Math.floor(target / pair);
  const afterPairs = k * pair;
  const tail =
    afterPairs >= target
      ? `Po ${count(2 * k, TYDEN_LOC)} máš ${k} × ${pair} = ${kc(afterPairs)}, a to stačí.`
      : afterPairs + a >= target
        ? `Po ${count(2 * k, TYDEN_LOC)} máš ${k} × ${pair} = ${kc(afterPairs)}. ${capitalize(ve(2 * k + 1))} ${2 * k + 1}. týdnu přidáš ${kc(a)} a máš ${kc(afterPairs + a)}, to stačí.`
        : `Po ${count(2 * k, TYDEN_LOC)} máš ${k} × ${pair} = ${kc(afterPairs)}. Pak přidáš ${kc(a)} a ${kc(b)} a máš ${kc(afterPairs + pair)}, to stačí.`;
  return nm(
    `stridave-${a}-${b}-${target}`,
    `Jeden týden ušetříš ${kc(a)}, další týden ${kc(b)} a tak pořád dokola. Za kolik týdnů budeš mít aspoň ${kc(target)}?`,
    n,
    ['Kolik ušetříš za každé dva týdny?', 'Pozor na poslední týden: stačí ti ušetřit jen jeden z nich?'],
    `Každé dva týdny ušetříš ${f(a)} + ${f(b)} = ${kc(pair)}. ${tail} Celkem ${count(n, TYDEN)}.`,
    { difficulty: 0.3 },
  );
}

// ---------------------------------------------------------------------------

export const sporeni = bankSkill({
  id: ID,
  island: 'trh',
  name: 'Spoření na cíl',
  description: 'Spoření na vlastní cíl: za kolik týdnů našetřím, graf úspor, prasátko a účet v bance, úrok a úrok z úroku.',
  rvp: {
    2: ['ČJS-5-2-03', 'M-3-1-05'],
    3: ['ČJS-5-2-03', 'M-3-1-05'],
    4: ['ČJS-5-2-03', 'M-5-1-04'],
    5: ['ČJS-5-2-03', 'M-5-1-04'],
  },
  ability: 'pocetni',
  banks: { 2: L2, 3: L3, 4: L4, 5: L5, 6: L6 },
  genShare: 0.75,
  gen: {
    2: mix(ID, [[2, tydny(2)], [1.5, bude], [1.5, grafTydny]]),
    3: mix(ID, [[1.5, tydny(3)], [1.5, cil(3)], [2, grafStav]]),
    4: mix(ID, [[2, cil(4)], [1.5, chybiPo], [1.5, tabulka]]),
    5: mix(ID, [[2, urok], [2, darek], [1, cil(4)]]),
    6: mix(ID, [[2, urok2], [1.5, banky], [1.5, stridave]]),
  },
});
