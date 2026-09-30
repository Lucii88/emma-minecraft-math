// Nauč stroj z příkladů – strojové učení po dětsku. Stroj vidí karty draků
// (řádky „vlastnost: hodnota“) s nálepkami a má říct, co udělá s novým
// drakem. Hráčka hledá vlastnost, kterou příklady se stejnou nálepkou sdílejí,
// odhaluje zaujatost příkladů (všichni ohniví draci byli červení → červené
// jablko je „ohnivý drak“) a na L5–L6 třídí podle dvou čísel v tabulce metodou
// nejbližšího souseda.
//
// Úlohy s kartami se skládají ze scénářů níže. Zamýšlená odpověď je zapsaná
// ručně a při načtení se porovná s jednoduchým „strojem“, který hledá řádky
// bez výjimky. Test pak totéž nezávisle ověří z hotových karet a tabulek.

import { bankSkill, type Spec } from '../../core/bank';
import { createRng, type Rng } from '../../core/rng';
import type { KnowledgeCard, Level, Visual } from '../../core/types';
import { fixed, q } from './digitalni-common';

const ID = 'dilna.stroj';

type Card = Extract<Visual, { type: 'cards' }>['cards'][number];

export const NEJISTY = 'Stroj si není jistý';

// ---------------------------------------------------------------------------
// Vlastnosti, nálepky a druhy karet

interface AttrInfo {
  /** Název řádku na kartě: „barva: červená“. */
  name: string;
  /** Možnost u otázky „Podle čeho se stroj rozhoduje?“. */
  podle: string;
}

export const ATTRS: Record<string, AttrInfo> = {
  barva: { name: 'barva', podle: 'Podle barvy' },
  kridla: { name: 'křídla', podle: 'Podle křídel' },
  ocas: { name: 'ocas', podle: 'Podle ocasu' },
  domov: { name: 'domov', podle: 'Podle domova' },
  supiny: { name: 'šupiny', podle: 'Podle šupin' },
  rohy: { name: 'rohy', podle: 'Podle rohů' },
  oci: { name: 'oči', podle: 'Podle očí' },
  vzor: { name: 'vzor', podle: 'Podle vzoru' },
  velikost: { name: 'velikost', podle: 'Podle velikosti' },
};

interface LabelInfo {
  /** Nálepka na kartě. */
  tag: string;
  /** Tlačítko. */
  option: string;
  /** Množné číslo do vysvětlení. */
  plural: string;
}

const LABELS: Record<string, LabelInfo> = {
  ohnivy: { tag: 'ohnivý', option: 'Ohnivý', plural: 'ohniví draci' },
  vodni: { tag: 'vodní', option: 'Vodní', plural: 'vodní draci' },
  ledovy: { tag: 'ledový', option: 'Ledový', plural: 'ledoví draci' },
  lesni: { tag: 'lesní', option: 'Lesní', plural: 'lesní draci' },
  rychly: { tag: 'rychlý', option: 'Rychlý', plural: 'rychlí draci' },
  pomaly: { tag: 'pomalý', option: 'Pomalý', plural: 'pomalí draci' },
  denni: { tag: 'denní', option: 'Denní', plural: 'denní draci' },
  nocni: { tag: 'noční', option: 'Noční', plural: 'noční draci' },
  ohnive: { tag: 'ohnivé', option: 'Ohnivé', plural: 'ohnivá vejce' },
  vodniVejce: { tag: 'vodní', option: 'Vodní', plural: 'vodní vejce' },
};

const KINDS = {
  drak: { emoji: '🐉', title: (i: number) => `Drak ${i}`, novy: 'Nový drak', o: 'o novém drakovi', byl: 'by byl nový drak' },
  vejce: { emoji: '🥚', title: (i: number) => `Vejce ${i}`, novy: 'Nové vejce', o: 'o novém vejci', byl: 'by bylo nové vejce' },
};

// ---------------------------------------------------------------------------
// Jednoduchý „stroj“: řádky, podle kterých jdou nálepky příkladů určit bez výjimky

interface Example {
  v: string[];
  l: string;
}

/** Indexy řádků, ve kterých mají všechny příklady se stejnou hodnotou stejnou nálepku. */
function consistentAttrs(ex: Example[], nAttrs: number): number[] {
  const out: number[] = [];
  for (let a = 0; a < nAttrs; a++) {
    const seen = new Map<string, string>();
    let ok = true;
    for (const e of ex) {
      const before = seen.get(e.v[a]);
      if (before !== undefined && before !== e.l) ok = false;
      seen.set(e.v[a], e.l);
    }
    if (ok) out.push(a);
  }
  return out;
}

/** Co stroj řekne: nálepka, nebo 'nejisty', když řádky bez výjimky ukazují
 *  různé nálepky nebo když nový drak má v některém z nich hodnotu, kterou
 *  stroj v příkladech neviděl. */
function predict(ex: Example[], nAttrs: number, query: string[]): string {
  const preds = new Set<string>();
  for (const a of consistentAttrs(ex, nAttrs)) {
    const hit = ex.find((e) => e.v[a] === query[a]);
    if (!hit) return 'nejisty';
    preds.add(hit.l);
  }
  return preds.size === 1 ? [...preds][0] : 'nejisty';
}

// ---------------------------------------------------------------------------
// Scénáře s kartami

interface Scenario {
  key: string;
  kind: keyof typeof KINDS;
  attrs: string[];
  labels: string[];
  /** Příklady: hodnoty řádků a na konci id nálepky. */
  ex: string[][];
  /** Nové karty: klíč, hodnoty řádků a na konci zamýšlená odpověď (id nálepky nebo 'nejisty'). */
  queries?: string[][];
  /** Přidat otázku „Podle čeho se stroj rozhoduje?“. */
  podle?: boolean;
  /** Úkol najít příklad se špatnou nálepkou: číslo karty (od 1). */
  nesedi?: number;
  /** Jiné zadání otázky na nového draka. */
  prompt?: string;
}

const examplesOf = (sc: Scenario): Example[] => sc.ex.map((e) => ({ v: e.slice(0, -1), l: e[e.length - 1] }));

const line = (sc: Scenario, a: number, value: string) => `${ATTRS[sc.attrs[a]].name}: ${value}`;

function exampleCards(sc: Scenario): Card[] {
  const k = KINDS[sc.kind];
  return examplesOf(sc).map((e, i) => ({
    emoji: k.emoji,
    title: k.title(i + 1),
    lines: e.v.map((v, a) => line(sc, a, v)),
    tag: LABELS[e.l].tag,
  }));
}

function queryCard(sc: Scenario, v: string[]): Card {
  const k = KINDS[sc.kind];
  return { emoji: k.emoji, title: k.novy, lines: v.map((x, a) => line(sc, a, x)), tag: '?', mark: true };
}

const joinCs = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} a ${xs[xs.length - 1]}`);

/** „ohniví draci vždy „ocas: dlouhý“ a vodní draci vždy „ocas: krátký““. */
function mapping(sc: Scenario, ex: Example[], a: number): string {
  const parts = sc.labels
    .filter((l) => ex.some((e) => e.l === l))
    .map((l) => {
      const values = [...new Set(ex.filter((e) => e.l === l).map((e) => e.v[a]))];
      return `${LABELS[l].plural} vždy ${values.map((v) => `„${line(sc, a, v)}“`).join(' nebo ')}`;
    });
  return joinCs(parts);
}

/** Věta o řádcích, podle kterých se rozhodnout nedá. */
function noiseSentence(sc: Scenario, cons: number[]): string {
  const noise = sc.attrs.map((_, a) => a).filter((a) => !cons.includes(a)).map((a) => `„${ATTRS[sc.attrs[a]].name}“`);
  if (!noise.length) return '';
  return noise.length === 1
    ? `Řádek ${noise[0]} nerozhoduje – stejnou hodnotu v něm mají příklady s různými nálepkami.`
    : `Řádky ${joinCs(noise)} nerozhodují – stejnou hodnotu v nich mají příklady s různými nálepkami.`;
}

const HLEDEJ = 'Najdi řádek, ve kterém mají všechny příklady se stejnou nálepkou stejnou hodnotu.';
const NEJISTY_HINT = 'Když z příkladů nejde poznat, co stroj řekne, není si jistý.';

/** Úloha „Co stroj řekne o novém drakovi?“. */
function classify(sc: Scenario, qv: string[], intended: string, withUnsure: boolean, qkey: string): Spec {
  const ex = examplesOf(sc);
  const k = KINDS[sc.kind];
  const got = predict(ex, sc.attrs.length, qv);
  if (got !== intended) throw new Error(`${ID}: ${sc.key}-${qkey} – stroj řekne ${got}, zamýšleno ${intended}`);
  if (got === 'nejisty' && !withUnsure) throw new Error(`${ID}: ${sc.key}-${qkey} – chybí možnost ${NEJISTY}`);
  const cons = consistentAttrs(ex, sc.attrs.length);
  let explain: string;
  if (got !== 'nejisty') {
    const a = cons[0];
    explain = [
      `V příkladech mají ${mapping(sc, ex, a)}.`,
      noiseSentence(sc, cons),
      `${k.novy} má „${line(sc, a, qv[a])}“, a proto stroj řekne: ${LABELS[got].tag}.`,
    ].filter(Boolean).join(' ');
  } else if (cons.length === 1) {
    const a = cons[0];
    explain = `Podle příkladů rozhoduje řádek „${ATTRS[sc.attrs[a]].name}“. ${k.novy} má „${line(sc, a, qv[a])}“, a to stroj v příkladech nikdy neviděl. Proto si není jistý.`;
  } else {
    const [a1, a2] = cons;
    const l1 = ex.find((e) => e.v[a1] === qv[a1])!.l;
    const l2 = ex.find((e) => e.v[a2] === qv[a2])!.l;
    explain = `Řádky „${ATTRS[sc.attrs[a1]].name}“ i „${ATTRS[sc.attrs[a2]].name}“ oddělují druhy v příkladech stejně dobře, a tak stroj neví, podle kterého se řídit. ${ATTRS[sc.attrs[a1]].podle} ${k.byl} ${LABELS[l1].tag}, ${ATTRS[sc.attrs[a2]].podle.toLocaleLowerCase('cs')} ${LABELS[l2].tag}. Proto si není jistý.`;
  }
  const options = [...sc.labels.map((l) => LABELS[l].option), ...(withUnsure ? [NEJISTY] : [])];
  const correct = got === 'nejisty' ? sc.labels.length : sc.labels.indexOf(got);
  const hint2 = withUnsure ? NEJISTY_HINT : noiseSentence(sc, cons);
  return fixed(`trid-${sc.key}-${qkey}`, sc.prompt ?? `Stroj se učil z těchto příkladů. Co řekne ${k.o}?`, options, correct,
    [HLEDEJ, ...(hint2 ? [hint2] : [])], explain,
    { visual: { type: 'cards', cards: [...exampleCards(sc), queryCard(sc, qv)] } });
}

/** Úloha „Podle čeho se stroj rozhoduje?“. */
function podle(sc: Scenario): Spec {
  const ex = examplesOf(sc);
  const cons = consistentAttrs(ex, sc.attrs.length);
  if (cons.length !== 1) throw new Error(`${ID}: ${sc.key} – pro otázku „podle čeho“ musí rozhodovat právě jeden řádek`);
  const a = cons[0];
  return q(`podle-${sc.key}`, 'Stroj se učil z těchto příkladů. Podle čeho se rozhoduje?', ATTRS[sc.attrs[a]].podle,
    sc.attrs.filter((_, i) => i !== a).map((x) => ATTRS[x].podle),
    [HLEDEJ],
    [`V příkladech mají ${mapping(sc, ex, a)}.`, noiseSentence(sc, cons)].filter(Boolean).join(' '),
    { visual: { type: 'cards', cards: exampleCards(sc) } });
}

/** Úloha „Který příklad má špatnou nálepku?“. */
function nesedi(sc: Scenario): Spec {
  const ex = examplesOf(sc);
  const k = KINDS[sc.kind];
  const bad = sc.nesedi! - 1;
  const fits = ex.map((_, i) => consistentAttrs(ex.filter((__, j) => j !== i), sc.attrs.length));
  if (fits.filter((c) => c.length > 0).length !== 1 || !fits[bad].length) {
    throw new Error(`${ID}: ${sc.key} – špatná nálepka musí jít najít jednoznačně`);
  }
  const rest = ex.filter((_, j) => j !== bad);
  const a = fits[bad][0];
  const titles = ex.map((_, i) => k.title(i + 1));
  return q(`nesedi-${sc.key}`, 'Jeden příklad má omylem špatnou nálepku. Který?', titles[bad], titles.filter((_, i) => i !== bad),
    ['Najdi pravidlo, které platí pro všechny příklady až na jeden.'],
    `Ve všech ostatních příkladech mají ${mapping(sc, rest, a)}. ${titles[bad]} má „${line(sc, a, ex[bad].v[a])}“, a přesto nálepku ${LABELS[ex[bad].l].tag} – ta k pravidlu nesedí.`,
    { visual: { type: 'cards', cards: exampleCards(sc) }, difficulty: 0.3 });
}

function scenarioItems(sc: Scenario, withUnsure: boolean): Spec[] {
  const out: Spec[] = [];
  for (const qd of sc.queries ?? []) out.push(classify(sc, qd.slice(1, -1), qd[qd.length - 1], withUnsure, qd[0]));
  if (sc.podle) out.push(podle(sc));
  if (sc.nesedi) out.push(nesedi(sc));
  return out;
}

// L2: dvě vlastnosti, čtyři příklady, jedna vlastnost rozhoduje.
const S2: Scenario[] = [
  {
    key: 'kridla', kind: 'drak', attrs: ['barva', 'kridla'], labels: ['ohnivy', 'vodni'],
    ex: [['červená', 'velká', 'ohnivy'], ['modrá', 'malá', 'vodni'], ['modrá', 'velká', 'ohnivy'], ['červená', 'malá', 'vodni']],
    queries: [['a', 'zelená', 'velká', 'ohnivy'], ['b', 'žlutá', 'malá', 'vodni']],
  },
  {
    key: 'ocas', kind: 'drak', attrs: ['ocas', 'barva'], labels: ['rychly', 'pomaly'],
    ex: [['dlouhý', 'zelená', 'rychly'], ['krátký', 'zelená', 'pomaly'], ['dlouhý', 'fialová', 'rychly'], ['krátký', 'fialová', 'pomaly']],
    queries: [['a', 'dlouhý', 'červená', 'rychly'], ['b', 'krátký', 'modrá', 'pomaly']],
  },
  {
    key: 'domov', kind: 'drak', attrs: ['domov', 'barva'], labels: ['ohnivy', 'vodni'],
    ex: [['sopka', 'zelená', 'ohnivy'], ['jezero', 'zelená', 'vodni'], ['sopka', 'žlutá', 'ohnivy'], ['jezero', 'žlutá', 'vodni']],
    queries: [['a', 'jezero', 'červená', 'vodni'], ['b', 'sopka', 'modrá', 'ohnivy']],
  },
  {
    key: 'supiny', kind: 'drak', attrs: ['supiny', 'barva'], labels: ['denni', 'nocni'],
    ex: [['hladké', 'modrá', 'denni'], ['ostnaté', 'modrá', 'nocni'], ['ostnaté', 'oranžová', 'nocni'], ['hladké', 'oranžová', 'denni']],
    queries: [['a', 'hladké', 'fialová', 'denni'], ['b', 'ostnaté', 'zelená', 'nocni']],
  },
  {
    key: 'rohy', kind: 'drak', attrs: ['rohy', 'oci'], labels: ['ledovy', 'lesni'],
    ex: [['ano', 'zelené', 'ledovy'], ['ne', 'zelené', 'lesni'], ['ne', 'žluté', 'lesni'], ['ano', 'žluté', 'ledovy']],
    queries: [['a', 'ano', 'modré', 'ledovy'], ['b', 'ne', 'modré', 'lesni']],
  },
  {
    key: 'vejce', kind: 'vejce', attrs: ['vzor', 'barva'], labels: ['ohnive', 'vodniVejce'],
    ex: [['tečky', 'modrá', 'ohnive'], ['proužky', 'modrá', 'vodniVejce'], ['proužky', 'žlutá', 'vodniVejce'], ['tečky', 'žlutá', 'ohnive']],
    queries: [['a', 'tečky', 'zelená', 'ohnive'], ['b', 'proužky', 'červená', 'vodniVejce']],
  },
];

// L3: tři vlastnosti, pět příkladů, někdy tři nálepky.
const S3: Scenario[] = [
  {
    key: 'ocas', kind: 'drak', attrs: ['barva', 'kridla', 'ocas'], labels: ['ohnivy', 'vodni'], podle: true,
    ex: [
      ['červená', 'velká', 'dlouhý', 'ohnivy'], ['červená', 'malá', 'krátký', 'vodni'], ['modrá', 'velká', 'krátký', 'vodni'],
      ['modrá', 'malá', 'dlouhý', 'ohnivy'], ['zelená', 'velká', 'dlouhý', 'ohnivy'],
    ],
    queries: [['a', 'zelená', 'malá', 'krátký', 'vodni'], ['b', 'modrá', 'velká', 'dlouhý', 'ohnivy']],
  },
  {
    key: 'supiny', kind: 'drak', attrs: ['domov', 'supiny', 'barva'], labels: ['denni', 'nocni'], podle: true,
    ex: [
      ['les', 'hladké', 'žlutá', 'denni'], ['les', 'ostnaté', 'žlutá', 'nocni'], ['hory', 'ostnaté', 'modrá', 'nocni'],
      ['hory', 'hladké', 'modrá', 'denni'], ['jeskyně', 'ostnaté', 'žlutá', 'nocni'],
    ],
    queries: [['a', 'jeskyně', 'hladké', 'modrá', 'denni'], ['b', 'les', 'ostnaté', 'zelená', 'nocni']],
  },
  {
    key: 'oci', kind: 'drak', attrs: ['rohy', 'oci', 'kridla'], labels: ['ledovy', 'lesni', 'ohnivy'], podle: true,
    ex: [
      ['ano', 'modré', 'velká', 'ledovy'], ['ne', 'zelené', 'velká', 'lesni'], ['ano', 'žluté', 'malá', 'ohnivy'],
      ['ne', 'modré', 'malá', 'ledovy'], ['ano', 'zelené', 'malá', 'lesni'],
    ],
    // Nový drak s nálepkou z jediného příkladu (ohnivý) se tomu příkladu
    // i nejvíc podobá, aby „nejpodobnější drak“ nevedl k jiné odpovědi.
    queries: [['c', 'ano', 'žluté', 'střední', 'ohnivy'], ['b', 'ano', 'zelené', 'velká', 'lesni']],
  },
  {
    key: 'vejce', kind: 'vejce', attrs: ['vzor', 'barva', 'velikost'], labels: ['ohnive', 'vodniVejce'], podle: true,
    ex: [
      ['tečky', 'zelená', 'velká', 'vodniVejce'], ['proužky', 'zelená', 'malá', 'ohnive'], ['proužky', 'fialová', 'velká', 'ohnive'],
      ['tečky', 'fialová', 'malá', 'vodniVejce'], ['proužky', 'zelená', 'velká', 'ohnive'],
    ],
    queries: [['a', 'tečky', 'žlutá', 'velká', 'vodniVejce'], ['b', 'proužky', 'žlutá', 'malá', 'ohnive']],
  },
  {
    key: 'domov', kind: 'drak', attrs: ['kridla', 'domov', 'barva'], labels: ['rychly', 'pomaly'], podle: true,
    ex: [
      ['velká', 'hory', 'červená', 'rychly'], ['velká', 'les', 'modrá', 'pomaly'], ['malá', 'hory', 'modrá', 'rychly'],
      ['malá', 'les', 'červená', 'pomaly'], ['velká', 'les', 'červená', 'pomaly'],
    ],
    queries: [['a', 'malá', 'hory', 'zelená', 'rychly'], ['b', 'velká', 'les', 'zelená', 'pomaly']],
  },
  {
    key: 'rohy', kind: 'drak', attrs: ['ocas', 'rohy', 'barva'], labels: ['denni', 'nocni'], podle: true,
    ex: [
      ['dlouhý', 'ano', 'modrá', 'nocni'], ['dlouhý', 'ne', 'modrá', 'denni'], ['krátký', 'ne', 'fialová', 'denni'],
      ['krátký', 'ano', 'fialová', 'nocni'], ['dlouhý', 'ano', 'fialová', 'nocni'],
    ],
    queries: [['a', 'krátký', 'ne', 'modrá', 'denni'], ['b', 'dlouhý', 'ano', 'žlutá', 'nocni']],
  },
];

// L4: tři nálepky, nevídané hodnoty, dvě vlastnosti, které se v příkladech
// mění spolu, příklady proti selskému rozumu a špatně označené příklady.
const S4: Scenario[] = [
  {
    key: 'domov', kind: 'drak', attrs: ['domov', 'supiny', 'oci'], labels: ['ohnivy', 'vodni', 'ledovy'],
    ex: [
      ['les', 'hladké', 'zelené', 'ohnivy'], ['hory', 'hladké', 'žluté', 'vodni'], ['jeskyně', 'ostnaté', 'zelené', 'ledovy'],
      ['les', 'ostnaté', 'žluté', 'ohnivy'], ['hory', 'ostnaté', 'zelené', 'vodni'],
    ],
    // Neviděný domov je „louka“, ne třeba „moře“, které by selský rozum
    // spojil s vodními draky.
    queries: [['d', 'jeskyně', 'ostnaté', 'modré', 'ledovy'], ['b', 'les', 'hladké', 'modré', 'ohnivy'], ['e', 'louka', 'ostnaté', 'zelené', 'nejisty']],
  },
  {
    key: 'spolu', kind: 'drak', attrs: ['barva', 'kridla', 'ocas'], labels: ['ohnivy', 'vodni'],
    ex: [['červená', 'velká', 'dlouhý', 'ohnivy'], ['modrá', 'malá', 'dlouhý', 'vodni'], ['červená', 'velká', 'krátký', 'ohnivy'], ['modrá', 'malá', 'krátký', 'vodni']],
    queries: [['a', 'modrá', 'velká', 'dlouhý', 'nejisty'], ['b', 'červená', 'malá', 'krátký', 'nejisty']],
  },
  {
    key: 'oci', kind: 'drak', attrs: ['domov', 'oci', 'kridla'], labels: ['ohnivy', 'vodni'],
    prompt: 'Stroj zná jen tyto příklady, nic jiného o dracích neví. Co řekne o novém drakovi?',
    ex: [
      ['sopka', 'žluté', 'velká', 'ohnivy'], ['jezero', 'zelené', 'velká', 'vodni'], ['jezero', 'žluté', 'malá', 'ohnivy'],
      ['sopka', 'zelené', 'malá', 'vodni'], ['hory', 'zelené', 'malá', 'vodni'],
    ],
    queries: [['a', 'sopka', 'zelené', 'velká', 'vodni'], ['b', 'jezero', 'žluté', 'velká', 'ohnivy']],
  },
  {
    key: 'supiny', kind: 'drak', attrs: ['ocas', 'supiny', 'barva'], labels: ['rychly', 'pomaly'],
    ex: [['dlouhý', 'hladké', 'modrá', 'rychly'], ['krátký', 'ostnaté', 'modrá', 'pomaly'], ['krátký', 'hladké', 'žlutá', 'rychly'], ['dlouhý', 'ostnaté', 'žlutá', 'pomaly']],
    queries: [['a', 'dlouhý', 'hladké', 'fialová', 'rychly'], ['b', 'krátký', 'ostnaté', 'červená', 'pomaly'], ['d', 'krátký', 'hrbolaté', 'fialová', 'nejisty']],
  },
  {
    key: 'rohy', kind: 'drak', attrs: ['barva', 'rohy', 'ocas'], labels: ['denni', 'nocni'], nesedi: 4,
    ex: [
      ['modrá', 'ano', 'dlouhý', 'nocni'], ['modrá', 'ne', 'dlouhý', 'denni'], ['žlutá', 'ano', 'krátký', 'nocni'],
      ['červená', 'ne', 'dlouhý', 'nocni'], ['žlutá', 'ne', 'krátký', 'denni'],
    ],
  },
  {
    key: 'domov-sopka', kind: 'drak', attrs: ['kridla', 'domov', 'oci'], labels: ['ohnivy', 'vodni'], nesedi: 5,
    ex: [
      ['velká', 'sopka', 'zelené', 'ohnivy'], ['velká', 'jezero', 'žluté', 'vodni'], ['malá', 'sopka', 'žluté', 'ohnivy'],
      ['malá', 'jezero', 'zelené', 'vodni'], ['velká', 'sopka', 'žluté', 'vodni'],
    ],
  },
  {
    key: 'ocas', kind: 'drak', attrs: ['supiny', 'barva', 'ocas'], labels: ['rychly', 'pomaly'], nesedi: 2,
    ex: [
      ['hladké', 'modrá', 'dlouhý', 'rychly'], ['hladké', 'zelená', 'dlouhý', 'pomaly'], ['hladké', 'zelená', 'krátký', 'pomaly'],
      ['ostnaté', 'modrá', 'krátký', 'pomaly'], ['ostnaté', 'zelená', 'dlouhý', 'rychly'],
    ],
  },
];

// ---------------------------------------------------------------------------
// Zaujaté příklady: stroj se naučil barvu nebo pozadí místo draka

const OHNIVY_DRAK = 'Ohnivý drak';
const VODNI_DRAK = 'Vodní drak';

function dragonCard(i: number, what: string, tag: 'ohnivý drak' | 'vodní drak'): Card {
  return { emoji: '🐉', title: `Drak ${i}`, lines: [what], tag };
}

const BARVY: Card[] = [
  dragonCard(1, 'barva: červená', 'ohnivý drak'), dragonCard(2, 'barva: modrá', 'vodní drak'),
  dragonCard(3, 'barva: červená', 'ohnivý drak'), dragonCard(4, 'barva: modrá', 'vodní drak'),
];
const BARVY_JINAK: Card[] = [
  dragonCard(1, 'barva: modrá', 'vodní drak'), dragonCard(2, 'barva: červená', 'ohnivý drak'),
  dragonCard(3, 'barva: modrá', 'vodní drak'), dragonCard(4, 'barva: červená', 'ohnivý drak'),
];
const POZADI: Card[] = [
  dragonCard(1, 'pozadí: sopka', 'ohnivý drak'), dragonCard(2, 'pozadí: jezero', 'vodní drak'),
  dragonCard(3, 'pozadí: jezero', 'vodní drak'), dragonCard(4, 'pozadí: sopka', 'ohnivý drak'),
];

const cards = (...cs: Card[]): Visual => ({ type: 'cards', cards: cs });
const JABLKO: Card = { emoji: '🍎', title: 'Jablko', lines: ['barva: červená'], tag: '?', mark: true };
const KNIHA: Card = { emoji: '📘', title: 'Kniha', lines: ['barva: modrá'], tag: '?', mark: true };
const KACHNA: Card = { emoji: '🦆', title: 'Kachna', lines: ['pozadí: jezero'], tag: '?', mark: true };
const ZNA_JEN = 'Stroj zná jen nálepky „ohnivý drak“ a „vodní drak“.';

const ZAUJATOST: Spec[] = [
  fixed('trid-jablko', `${ZNA_JEN} Učil se z těchto obrázků. Co řekne o červeném jablku?`, [OHNIVY_DRAK, VODNI_DRAK], 0,
    ['Čím se na obrázcích liší ohniví draci od vodních?', 'Stroj jiné nálepky nezná.'],
    'Na obrázcích byli všichni ohniví draci červení a všichni vodní modří. Stroj se naučil jen barvu, a tak červené jablko nazve ohnivým drakem.',
    { visual: cards(...BARVY, JABLKO) }),
  fixed('trid-kniha', `${ZNA_JEN} Učil se z těchto obrázků. Co řekne o modré knize?`, [OHNIVY_DRAK, VODNI_DRAK], 1,
    ['Čím se na obrázcích liší ohniví draci od vodních?', 'Stroj jiné nálepky nezná.'],
    'Všichni vodní draci na obrázcích byli modří. Stroj se naučil jen barvu, a tak modrou knihu nazve vodním drakem.',
    { visual: cards(...BARVY_JINAK, KNIHA) }),
  fixed('trid-kachna', `${ZNA_JEN} Učil se z těchto fotek. Co řekne o fotce kachny na jezeře?`, [OHNIVY_DRAK, VODNI_DRAK], 1,
    ['Co mají společného všechny fotky vodních draků?', 'Stroj jiné nálepky nezná.'],
    'Všichni vodní draci byli vyfocení u jezera. Stroj se naučil pozadí, ne draka, a tak kachnu na jezeře nazve vodním drakem.',
    { visual: cards(...POZADI, KACHNA) }),
  q('proc-jablko', 'Stroj řekl, že červené jablko je ohnivý drak. Proč se spletl?', 'Naučil se jen barvu.',
    ['Jablko je opravdu drak.', 'Stroj má hlad.', 'Stroj je unavený.'],
    ['Čím se na obrázcích lišili ohniví draci od vodních?'],
    'Všichni ohniví draci v příkladech byli červení. Stroj si všiml jen barvy a nenaučil se, co je drak ani co je oheň.',
    { visual: cards(...BARVY, JABLKO) }),
  q('proc-kachna', 'Stroj řekl, že kachna na jezeře je vodní drak. Proč se spletl?', 'Naučil se pozadí, ne draky.',
    ['Kachna je opravdu drak.', 'Kachny létají jako draci.', 'Stroj nemá rád kachny.'],
    ['Co bylo na všech fotkách vodních draků?'],
    'Všichni vodní draci byli vyfocení u jezera. Stroj si všiml jezera v pozadí, a ne toho, jak vypadá drak.',
    { visual: cards(...POZADI, KACHNA) }),
  q('pridat-barvy', 'Všichni ohniví draci v příkladech byli červení. Co přidat do příkladů, aby se stroj učil líp?', 'Modré ohnivé a červené vodní draky',
    ['Další červené ohnivé draky', 'Další modré vodní draky', 'Nic, příkladů je dost'],
    ['Jak stroj odnaučit, že ohnivý znamená červený?'],
    'Když stroj uvidí i modré ohnivé a červené vodní draky, přijde na to, že barva o druhu draka nerozhoduje.',
    { visual: cards(...BARVY) }),
  q('pridat-pozadi', 'Všichni vodní draci byli vyfocení u jezera. Co přidat do příkladů, aby se stroj učil líp?', 'Fotky draků na různých místech',
    ['Další vodní draky u jezera', 'Další ohnivé draky u sopky', 'Nic, fotek je dost'],
    ['Jak stroj odnaučit, že vodní drak znamená jezero?'],
    'Když stroj uvidí draky na různých místech, přijde na to, že pozadí o druhu draka nerozhoduje.',
    { visual: cards(...POZADI) }),
];

// ---------------------------------------------------------------------------
// Tabulky: nejbližší soused podle dvou čísel (L5–L6)

type Tag2 = 'ohnivý' | 'vodní';

interface Row {
  name: string;
  w: number;
  t: number;
  tag: Tag2;
}

interface NumTask {
  rows: Row[];
  qw: number;
  qt: number;
}

const ROW_NAMES = ['A', 'B', 'C', 'D'];
const TAG_OPTIONS = ['Ohnivý', 'Vodní'];
const TAG_PLURAL: Record<Tag2, string> = { ohnivý: 'ohniví', vodní: 'vodní' };
const optionOf = (t: Tag2) => (t === 'ohnivý' ? 0 : 1);

const dw = (x: NumTask, r: Row) => Math.abs(r.w - x.qw);
const dt = (x: NumTask, r: Row) => Math.abs(r.t - x.qt);
const dist = (x: NumTask, r: Row) => dw(x, r) + dt(x, r);
const byDist = (x: NumTask) => [...x.rows].sort((a, b) => dist(x, a) - dist(x, b));

function randomTask(rng: Rng): NumTask | null {
  const qw = rng.int(2, 8);
  const qt = rng.int(2, 8);
  const tags = rng.shuffle<Tag2>(['ohnivý', 'ohnivý', 'vodní', 'vodní']);
  const rows = ROW_NAMES.map((name, i) => ({ name, w: rng.int(1, 9), t: rng.int(1, 9), tag: tags[i] }));
  const points = new Set(rows.map((r) => `${r.w},${r.t}`));
  if (points.size < rows.length || points.has(`${qw},${qt}`)) return null;
  return { rows, qw, qt };
}

/** Nejbližší drak je novému nejblíž v obou sloupcích zároveň (nikdo ho v žádném nepředčí). */
const dominant = (x: NumTask, best: Row) => x.rows.every((r) => dw(x, best) <= dw(x, r) && dt(x, best) <= dt(x, r));

const mirror = (x: NumTask, a: Row, b: Row) =>
  (a.t === x.qt && b.t === x.qt && a.w - x.qw === x.qw - b.w) || (a.w === x.qw && b.w === x.qw && a.t - x.qt === x.qt - b.t);

type NumKind = 'nn' | 'remiza' | 'kdo' | 'soucet' | 'remiza-soucet' | 'tri' | 'rozdil';

function fits(kind: NumKind, x: NumTask): boolean {
  const s = byDist(x);
  const d = s.map((r) => dist(x, r));
  switch (kind) {
    case 'nn':
    case 'kdo':
      return d[0] < d[1] && d[0] <= 3 && dominant(x, s[0]) && s[1].tag !== s[0].tag;
    case 'remiza':
      return d[0] === d[1] && d[0] <= 2 && s[0].tag !== s[1].tag && mirror(x, s[0], s[1]) && d[2] >= d[0] + 2;
    case 'soucet':
      // Nejbližší podle součtu, ale jiný drak jiného druhu je blíž v jednom sloupci.
      return d[0] < d[1] && d[0] >= 2 && d[0] <= 6 && !dominant(x, s[0])
        && x.rows.some((r) => r.tag !== s[0].tag && (dw(x, r) < dw(x, s[0]) || dt(x, r) < dt(x, s[0])));
    case 'remiza-soucet':
      return d[0] === d[1] && d[0] >= 2 && s[0].tag !== s[1].tag && !mirror(x, s[0], s[1]) && d[2] > d[0];
    case 'tri':
      // Tři nejbližší jsou jasně dané a většina z nich je jiného druhu než ten úplně nejbližší.
      return d[0] < d[1] && d[2] < d[3] && s[1].tag !== s[0].tag && s[2].tag !== s[0].tag;
    case 'rozdil':
      return x.rows.some((r) => rozdilOk(x, r));
  }
}

/** Drak, u kterého se dá rozdíl pěkně počítat: liší se v obou sloupcích a celkem aspoň o 4. */
const rozdilOk = (x: NumTask, r: Row) => dw(x, r) >= 1 && dt(x, r) >= 1 && dist(x, r) >= 4;

const numKey = (prefix: string, x: NumTask) =>
  `${prefix}-${x.qw}${x.qt}-${x.rows.map((r) => `${r.w}${r.t}${r.tag === 'ohnivý' ? 'o' : 'v'}`).join('-')}`;

function table(x: NumTask): Visual {
  const cells: (string | number | null)[] = ['Drak', 'Křídla', 'Ocas', 'Druh'];
  for (const r of x.rows) cells.push(r.name, r.w, r.t, r.tag);
  cells.push('Nový', x.qw, x.qt, null);
  return { type: 'table', cols: 4, cells, ask: cells.length - 1, head: 'row' };
}

const tableSpeech = (x: NumTask) =>
  `V tabulce: ${x.rows.map((r) => `drak ${r.name}: křídla ${r.w}, ocas ${r.t}, ${r.tag}`).join('; ')}; nový drak: křídla ${x.qw}, ocas ${x.qt}.`;

const sums = (x: NumTask) => `Součty rozdílů: ${x.rows.map((r) => `${r.name} ${dist(x, r)}`).join(', ')}.`;

function differs(x: NumTask, r: Row): string {
  const w = dw(x, r);
  const t = dt(x, r);
  return `${w ? `křídla se liší o ${w}` : 'křídla má stejná'} a ${t ? `ocas o ${t}` : 'ocas má stejný'}`;
}

const P_NN = 'Stroj najde v tabulce draka, který se novému drakovi nejvíc podobá, a řekne jeho druh. Co řekne?';
const P_SOUCET = 'Stroj u každého draka sečte, o kolik se liší křídla a o kolik ocas. Řekne druh draka s nejmenším součtem. Co řekne?';
const P_TRI = 'Stroj vezme tři draky s nejmenším součtem rozdílů v křídlech a v ocasu a řekne druh, kterého je mezi nimi víc. Co řekne?';

function numSpec(kind: NumKind, x: NumTask, rng: Rng): Spec {
  const s = byDist(x);
  const best = s[0];
  const visual = table(x);
  const unsure = [...TAG_OPTIONS, NEJISTY];
  switch (kind) {
    case 'nn':
      return fixed(numKey('nn', x), P_NN, unsure, optionOf(best.tag),
        ['Porovnej čísla nového draka s každým drakem v tabulce.', 'Hledej draka, který má křídla i ocas novému nejblíž.'],
        `Nejvíc se novému drakovi podobá drak ${best.name}: ${differs(x, best)}. Drak ${best.name} je ${best.tag}, a proto stroj řekne: ${best.tag}.`,
        { visual, speak: `${P_NN} ${tableSpeech(x)}` });
    case 'kdo':
      return q(numKey('kdo', x), 'Který drak z tabulky se novému drakovi podobá nejvíc?', `Drak ${best.name}`,
        s.slice(1).map((r) => `Drak ${r.name}`),
        ['Porovnej křídla i ocas nového draka s každým drakem v tabulce.'],
        `Nejvíc se novému drakovi podobá drak ${best.name}: ${differs(x, best)}. Ostatní draci se od nového liší víc.`,
        { visual, speak: `Který drak z tabulky se novému drakovi podobá nejvíc? ${tableSpeech(x)}` });
    case 'remiza':
      return fixed(numKey('remiza', x), P_NN, unsure, 2,
        ['Porovnej čísla nového draka s každým drakem v tabulce.', 'Co když jsou novému dva draci podobní stejně?'],
        `Draci ${s[0].name} a ${s[1].name} se od nového draka liší stejně málo, ale drak ${s[0].name} je ${s[0].tag} a drak ${s[1].name} ${s[1].tag}. Proto si stroj není jistý.`,
        { visual, speak: `${P_NN} ${tableSpeech(x)}` });
    case 'soucet':
      return fixed(numKey('soucet', x), P_SOUCET, unsure, optionOf(best.tag),
        ['U každého draka spočítej rozdíl v křídlech a rozdíl v ocasu a sečti je.', 'Drak, který je blízko jen v jednom sloupci, nemusí mít nejmenší součet.'],
        `${sums(x)} Nejmenší součet má drak ${best.name}, a ten je ${best.tag}.`,
        { visual, speak: `${P_SOUCET} ${tableSpeech(x)}`, difficulty: 0.2 });
    case 'remiza-soucet':
      return fixed(numKey('remiza', x), P_SOUCET, unsure, 2,
        ['U každého draka spočítej rozdíl v křídlech a rozdíl v ocasu a sečti je.', 'Co když mají dva draci stejný součet?'],
        `${sums(x)} Nejmenší součet mají draci ${s[0].name} a ${s[1].name}, ale jeden je ${s[0].tag} a druhý ${s[1].tag}. Proto si stroj není jistý.`,
        { visual, speak: `${P_SOUCET} ${tableSpeech(x)}`, difficulty: 0.2 });
    case 'tri': {
      const top = s.slice(0, 3);
      const major = s[1].tag;
      return fixed(numKey('tri', x), P_TRI, TAG_OPTIONS, optionOf(major),
        ['Nejdřív u každého draka spočítej součet rozdílů.', 'Vyber tři nejmenší součty a podívej se na druhy těch draků.'],
        `${sums(x)} Tři nejmenší součty mají draci ${joinCs(top.map((r) => r.name))}. Dva z nich jsou ${TAG_PLURAL[major]} a jeden ${best.tag}, a tak stroj řekne: ${major}.`,
        { visual, speak: `${P_TRI} ${tableSpeech(x)}`, difficulty: 0.3 });
    }
    case 'rozdil': {
      const r = rng.pick(x.rows.filter((row) => rozdilOk(x, row)));
      const prompt = `O kolik se nový drak liší od draka ${r.name}? Sečti rozdíl v křídlech a rozdíl v ocasu.`;
      return {
        kind: 'number',
        key: `rozdil-${r.name.toLowerCase()}${numKey('', x)}`,
        prompt,
        correct: dist(x, r),
        hints: ['Rozdíl dvou čísel je větší číslo minus menší.', `Spočítej zvlášť rozdíl v křídlech a v ocasu u draka ${r.name}.`],
        explain: `Křídla se liší o ${dw(x, r)}, ocas o ${dt(x, r)}. Dohromady ${dw(x, r)} + ${dt(x, r)} = ${dist(x, r)}.`,
        visual,
        speak: `${prompt} ${tableSpeech(x)}`,
      };
    }
  }
}

/** Deterministicky vybere `n` různých tabulek daného druhu. */
function numTasks(kind: NumKind, n: number, seed: number): Spec[] {
  const rng = createRng(seed);
  const out: Spec[] = [];
  const keys = new Set<string>();
  for (let i = 0; i < 200000 && out.length < n; i++) {
    const x = randomTask(rng);
    if (!x || !fits(kind, x)) continue;
    const spec = numSpec(kind, x, rng);
    if (keys.has(spec.key)) continue;
    keys.add(spec.key);
    out.push(spec);
  }
  if (out.length < n) throw new Error(`${ID}: málo tabulek druhu ${kind}`);
  return out;
}

// ---------------------------------------------------------------------------
// Banky

const L2: Spec[] = [
  ...S2.flatMap((sc) => scenarioItems(sc, false)),
  q('jak-se-uci', 'Jak se stroj naučí poznávat kočky na fotkách?', 'Ukážeme mu hodně fotek koček.',
    ['Řekneme mu kouzelné slovo.', 'Stroj to ví sám od sebe.', 'Pošleme mu dopis.'],
    ['Jak ses {naučila|naučil} poznávat kočky ty?'],
    'Stroj se učí z příkladů. Když uvidí hodně fotek s nálepkou „kočka“, najde, co mají společného.'),
  q('kdo-dava-nalepky', 'V dílně učí stroj poznávat draky. Kdo dá obrázkům nálepky „ohnivý“ a „vodní“?', 'Lidé z dílny',
    ['Stroj sám', 'Draci', 'Nikdo'],
    ['Kdo stroj učí?'],
    'Nálepky k příkladům dávají lidé. Stroj se pak z obrázků a nálepek učí.'),
  q('kdy-nejlepe', 'Kdy se stroj naučí poznávat draky nejlépe?', 'Když uvidí hodně různých draků.',
    ['Když uvidí jen jednoho draka.', 'Když uvidí pořád stejného draka.', 'Když bude dlouho vypnutý.'],
    ['Z čeho se dá naučit víc?'],
    'Čím víc různých příkladů stroj uvidí, tím lépe pozná i draka, kterého ještě neviděl.'),
  q('jedna-fotka', 'Proč nestačí ukázat stroji jednu fotku psa?', 'Psi vypadají různě.',
    ['Stroj psy nemá rád.', 'Jedna fotka je moc těžká.', 'Psi na fotkách spí.'],
    ['Vypadají všichni psi stejně?'],
    'Psi jsou malí i velcí, chlupatí i krátkosrstí. Z jedné fotky by se stroj nenaučil poznat ostatní.'),
  q('pes-nebo-kocka', 'Tove ukázala stroji 100 fotek psů a 100 fotek koček s nálepkami. Co se stroj učí?', 'Rozeznat psa od kočky',
    ['Vařit polévku', 'Zpívat písničky', 'Počítat do sta'],
    ['Jaké nálepky byly na fotkách?'],
    'Na fotkách byly nálepky „pes“ a „kočka“. Stroj se tedy učí rozeznat psa od kočky.'),
  q('nova-fotka', 'Stroj se naučil poznávat jablka. Proč mu pak ukážeme fotku, kterou ještě neviděl?', 'Abychom zjistili, co se naučil.',
    ['Aby se nenudil.', 'Aby fotku snědl.', 'Abychom ho vypnuli.'],
    ['Jak se ve škole zjišťuje, co ses {naučila|naučil}?'],
    'Na nových fotkách se ukáže, jestli se stroj opravdu naučil poznávat jablka, nebo si jen pamatuje staré fotky.'),
  q('spatna-nalepka', 'Na jedné kartě ohnivého draka je omylem nálepka „vodní“. Co se může stát?', 'Stroj se může splést.',
    ['Stroj chybu vždycky sám opraví.', 'Stroj začne chrlit oheň.', 'Nic, na nálepkách nezáleží.'],
    ['Z čeho se stroj učí?'],
    'Stroj se učí z nálepek, které dostane. Když je nálepka špatně, naučí se i chybu.'),
  q('kun', 'Stroj se učil jen na fotkách psů a koček. Ukážeš mu koně. Co řekne?', 'Pes, nebo kočka',
    ['Kůň', 'Jednorožec', 'Žirafa'],
    ['Jaké nálepky stroj zná?'],
    'Stroj zná jen nálepky „pes“ a „kočka“, jiné slovo neumí. Proto koně nazve psem, nebo kočkou – a splete se.'),
];

const L3: Spec[] = [
  ...S3.flatMap((sc) => scenarioItems(sc, false)),
  ...ZAUJATOST,
  q('ktery-stroj', 'Který stroj se naučí poznávat kočky nejlépe?', 'Ten, který viděl tisíc různých koček.',
    ['Ten, který viděl jednu kočku.', 'Ten, který viděl tisíc fotek téže kočky.', 'Ten, který kočku nikdy neviděl.'],
    ['Záleží jen na tom, kolik fotek viděl?'],
    'Nejvíc se naučí stroj, který viděl hodně různých koček. Tisíc fotek téže kočky ho naučí jen tuhle jednu kočku.'),
  q('bile-kocky', 'Stroj se učil jen na fotkách bílých koček. Co se může stát, když uvidí černou kočku?', 'Nepozná, že je to kočka.',
    ['Obarví ji nabílo.', 'Začne mňoukat.', 'Pozná, jak se kočka jmenuje.'],
    ['Viděl stroj někdy černou kočku?'],
    'Stroj zná jen bílé kočky. Černou kočku v příkladech nikdy neviděl, a tak ji nemusí poznat.'),
  {
    kind: 'order',
    key: 'poradi-uceni',
    prompt: 'Seřaď, jak se stroj učí poznávat draky.',
    correct: ['Lidé nasbírají obrázky draků.', 'Lidé k obrázkům přidají nálepky.', 'Stroj se z obrázků učí.'],
    hints: ['Co musí být hotové, než se stroj začne učit?'],
    explain: 'Nejdřív lidé nasbírají obrázky, pak k nim přidají nálepky a teprve potom se z nich stroj učí.',
  },
];

const L4: Spec[] = [
  ...S4.flatMap((sc) => scenarioItems(sc, true)),
  q('proc-nejisty', 'Proč si stroj u nového draka není jistý?', 'Barva a křídla si odporují.',
    ['Stroj nemá rád modrou.', 'Nový drak je moc malý.', 'Stroj se unavil.'],
    ['Co ukazuje barva a co křídla?'],
    'V příkladech měli všichni červení draci velká křídla. Nový drak je modrý jako vodní draci, ale má velká křídla jako ohniví. Z příkladů nejde poznat, co rozhoduje.',
    { visual: cards(...exampleCards(S4[1]), queryCard(S4[1], ['modrá', 'velká', 'dlouhý'])) }),
  q('co-pridat-spolu', 'Stroj neví, jestli rozhoduje barva, nebo křídla. Který nový příklad mu pomůže?', 'Červený drak s malými křídly',
    ['Další červený drak s velkými křídly', 'Další modrý drak s malými křídly', 'Žádný, stačí to'],
    ['Který příklad oddělí barvu od křídel?'],
    'Červený drak s malými křídly ukáže, co rozhoduje: podle jeho nálepky stroj pozná, jestli se má řídit barvou, nebo křídly.',
    { visual: cards(...exampleCards(S4[1])) }),
  q('jak-vyzkouset', 'Jak zjistíš, jestli se stroj naučil dobře?', 'Ukážu mu nové příklady a zkontroluji ho.',
    ['Zeptám se ho, jestli to umí.', 'Ukážu mu znovu stejné příklady.', 'Počkám, až bude starší.'],
    ['Jak se ve škole zjišťuje, co ses {naučila|naučil}?'],
    'Stroj se zkouší na příkladech, které při učení neviděl. Na starých příkladech by mohl jen opakovat, co si zapamatoval.'),
  q('devet-z-deseti', 'Stroj správně pozná draka na 9 fotkách z 10. Co to znamená?', 'Na jedné fotce z deseti se splete.',
    ['Nikdy se nesplete.', 'Splete se pokaždé.', 'Na světě je jen 9 draků.'],
    ['Kolik fotek z deseti zbývá?'],
    'Z deseti fotek pozná devět správně a na jedné se splete. Proto se i dobrý stroj občas mýlí.'),
  q('drace', 'Stroj se učil jen na fotkách dospělých draků. Jak si poradí s malým dráčetem?', 'Může se splést.',
    ['Určitě ho pozná.', 'Počká, až dráče vyroste.', 'Dráčata stroj nevidí.'],
    ['Viděl stroj při učení nějaké dráče?'],
    'Dráčata vypadají jinak než dospělí draci a stroj je v příkladech nikdy neviděl. Proto se může splést.'),
  q('pestre-priklady', 'Proč mají být příklady pro stroj pestré?', 'Aby se naučil to důležité.',
    ['Aby byly barevné a hezké.', 'Aby jich bylo méně.', 'Aby se stroj nenudil.'],
    ['Co se stane, když mají všichni ohniví draci v příkladech stejnou barvu?'],
    'Když jsou příklady pestré, stroj se nenaučí náhodnou věc, třeba barvu nebo pozadí, ale to, co opravdu rozhoduje.'),
  {
    kind: 'order',
    key: 'poradi-uceni-a-zkouseni',
    prompt: 'Seřaď kroky, jak se stroj učí a jak se zkouší.',
    correct: ['Nasbírat hodně různých příkladů', 'Dát příkladům nálepky', 'Nechat stroj učit se z příkladů', 'Vyzkoušet stroj na nových příkladech'],
    hints: ['Co musí být hotové, než se stroj začne učit?', 'Zkouší se až na konci.'],
    explain: 'Nejdřív se nasbírají pestré příklady, pak dostanou nálepky, stroj se z nich učí a nakonec se zkouší na příkladech, které nikdy neviděl.',
  },
];

// Součet rozdílů u jednoho draka je příprava na L6 (na L6 by byl příliš snadný).
const L5: Spec[] = [
  ...numTasks('nn', 10, 501),
  ...numTasks('remiza', 5, 502),
  ...numTasks('kdo', 6, 503),
  ...numTasks('rozdil', 5, 604),
  q('proc-priznat', 'Proč je dobré, když stroj řekne, že si není jistý?', 'Člověk ví, že to má ověřit.',
    ['Stroj pak vypadá chytřeji.', 'Stroj se tím rychleji nabije.', 'Nic se tím nezmění.'],
    ['Co uděláš s odpovědí, která může být špatně?'],
    'Když stroj přizná nejistotu, člověk ví, že má odpověď ověřit. Horší je stroj, který se plete a tváří se jistě.'),
  q('nejblizsi-soused', 'Jak se říká metodě, kdy stroj najde nejpodobnější příklad a dá novému stejnou nálepku?', 'Nejbližší soused',
    ['Hádání', 'Nejdelší cesta', 'Kouzelná kostka'],
    ['Nejpodobnější příklad je novému nejblíž.'],
    'Říká se jí metoda nejbližšího souseda. Patří k nejjednodušším způsobům, jak se stroj učí z příkladů.'),
];

const L6: Spec[] = [
  ...numTasks('soucet', 8, 601),
  ...numTasks('remiza-soucet', 4, 602),
  ...numTasks('tri', 8, 603),
];

const BANKS: Partial<Record<Level, Spec[]>> = { 2: L2, 3: L3, 4: L4, 5: L5, 6: L6 };

export const strojSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Nauč stroj z příkladů',
  description: 'Dítě objevuje, jak se stroj učí z příkladů: hledá v datech pravidlo, odhaluje zaujaté příklady a na vyšších úrovních třídí metodou nejbližšího souseda.',
  rvp: {
    2: ['ČJS-3-4-02'],
    3: ['ČJS-3-4-02'],
    4: ['I-5-1-01', 'I-5-1-02'],
    5: ['I-5-1-01', 'I-5-1-03'],
    6: ['I-5-1-03'],
  },
  ability: 'usuzovani',
  banks: BANKS,
});

export const strojCards: KnowledgeCard[] = [
  {
    id: 'dilna.stroj.priklady',
    skillId: ID,
    level: 2,
    emoji: '🖼️',
    title: 'Stroj se učí z příkladů',
    text: 'Aby stroj poznal psa na fotce, ukážou mu lidé tisíce fotek s nálepkou „pes“ a tisíce s nálepkou „není pes“. Stroj si sám najde, čím se liší.',
  },
  {
    id: 'dilna.stroj.vlk-a-snih',
    skillId: ID,
    level: 4,
    emoji: '🐺',
    title: 'Vlk, nebo sníh?',
    text: 'Stroj se naučí to, co mají příklady společného – i když je to náhoda, třeba sníh v pozadí. Proto potřebuje pestré příklady.',
    fix: {
      before: 'Když stroj dobře třídí fotky, určitě se naučil to, co jsme chtěli.',
      evidence: 'Vědci v roce 2016 schválně učili stroj rozeznat vlka od psa husky na fotkách, kde byli vlci vždycky na sněhu. Pak si nechali ukázat, na co se stroj dívá – díval se na sníh, ne na zvíře.',
    },
  },
  {
    id: 'dilna.stroj.nejblizsi-soused',
    skillId: ID,
    level: 5,
    emoji: '🔍',
    title: 'Nejbližší soused',
    text: 'Jedna z nejjednodušších metod strojového učení: stroj najde příklad, který se novému nejvíc podobá, a dá mu stejnou nálepku. Vědci ji popsali už před více než 70 lety.',
  },
];

