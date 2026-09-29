// Logické hlavolamy: seřazení podle vodítek, kdo má kterého draka, zasedací
// pořádek, dny v týdnu, „když…, tak…“, kombinace, holubníkový princip
// a poctivci s lháři.
//
// Úlohy s vodítky se generují a každá se ověří hrubou silou: projdou se
// všechna možná pořadí (rozdělení draků, zasedací pořádky) a úloha se použije,
// jen když otázka má ve všech vyhovujících možnostech stejnou odpověď.

import type { ChoiceSpec, FixedSpec, NumberSpec, OrderSpec, Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { Level, Visual } from '../../core/types';
import { DRAGON_NAMES, ORDINAL_LOC, PEOPLE, listCz, permutations, slug } from './hlavolamy-spolecne';

type CardsVisual = Extract<Visual, { type: 'cards' }>;

/** Účastník hádanky (dítě nebo drak). */
interface Who {
  nom: string;
  gen?: string;
  dat?: string;
  acc?: string;
  female: boolean;
  emoji: string;
}

const KIDS: Who[] = PEOPLE.map((p) => ({ ...p, emoji: p.female ? '👧' : '👦' }));
const DRAGONS: Who[] = DRAGON_NAMES.map((d) => ({ nom: d.nom, gen: d.gen, acc: d.acc, female: d.female, emoji: d.e }));

const CANT = 'Nedá se to poznat';

function pickSome(rng: Rng, pool: readonly Who[], n: number, ok: (w: Who) => boolean = () => true): Who[] {
  return rng.shuffle(pool.filter(ok)).slice(0, n);
}

/** Karty s účastníky v abecedním pořadí (pořadí karet nic neprozradí). */
function castCards(cast: readonly Who[]): CardsVisual {
  const sorted = [...cast].sort((a, b) => a.nom.localeCompare(b.nom, 'cs'));
  return { type: 'cards', cards: sorted.map((w) => ({ emoji: w.emoji, title: w.nom })) };
}

const castKey = (cast: readonly Who[]) => cast.map((w) => slug(w.nom)).join('-');

const byName = (a: Who, b: Who) => a.nom.localeCompare(b.nom, 'cs');

/** Klíč musí vycházet jen z toho, co hráčka vidí: jména v abecedním pořadí
 *  a vodítka zapsaná pomocí pořadí jmen v abecedě. */
function alphaIndex(cast: readonly Who[]): (w: Who) => number {
  const sorted = [...cast].sort(byName);
  return (w) => sorted.indexOf(w);
}

// ---------------------------------------------------------------------------
// Seřazení podle vodítek („Freja je vyšší než Leif…“)

interface Scale {
  key: string;
  kind: 'dite' | 'drak';
  /** „A je vyšší než B.“ (more) / „A je menší než B.“ */
  cmp: (a: string, b: string, more: boolean) => string;
  qMax: string;
  qMin: string;
  qMid3: string;
  sMax: (x: string) => string;
  sMin: (x: string) => string;
  sMid3: (x: string) => string;
  hintMax: string;
  hintMin: string;
  hintMid3: string;
  /** Jen stupnice s přídavným jménem (řazení, „druhý nejvyšší“). */
  adj?: { more: string; less: string; max: string; fromMax: string };
}

function adjScale(key: string, kind: 'dite' | 'drak', more: string, less: string, max: string, min: string, fromMax: string): Scale {
  return {
    key,
    kind,
    cmp: (a, b, m) => `${a} je ${m ? more : less} než ${b}.`,
    qMax: `Kdo je ${max}?`,
    qMin: `Kdo je ${min}?`,
    qMid3: `Kdo není ani ${max}, ani ${min}?`,
    sMax: (x) => `${x} je ${max}.`,
    sMin: (x) => `${x} je ${min}.`,
    sMid3: (x) => `${x} není ani ${max}, ani ${min}.`,
    hintMax: `Hledej toho, o kom žádné vodítko neříká, že je někdo ${more} než on.`,
    hintMin: `Hledej toho, o kom žádné vodítko neříká, že je někdo ${less} než on.`,
    hintMid3: `Nejdřív najdi, kdo je ${max} a kdo ${min}.`,
    adj: { more, less, max, fromMax },
  };
}

function countScale(key: string, thing: string): Scale {
  return {
    key,
    kind: 'dite',
    cmp: (a, b, m) => `${a} má ${m ? 'víc' : 'méně'} ${thing} než ${b}.`,
    qMax: `Kdo má nejvíc ${thing}?`,
    qMin: `Kdo má nejméně ${thing}?`,
    qMid3: `Kdo nemá ani nejvíc, ani nejméně ${thing}?`,
    sMax: (x) => `${x} má nejvíc ${thing}.`,
    sMin: (x) => `${x} má nejméně ${thing}.`,
    sMid3: (x) => `${x} nemá ani nejvíc, ani nejméně ${thing}.`,
    hintMax: `Hledej toho, o kom žádné vodítko neříká, že má někdo víc ${thing} než on.`,
    hintMin: `Hledej toho, o kom žádné vodítko neříká, že má někdo méně ${thing} než on.`,
    hintMid3: `Nejdřív najdi, kdo má nejvíc a kdo nejméně ${thing}.`,
  };
}

const SCALES: Scale[] = [
  adjScale('vyska', 'dite', 'vyšší', 'menší', 'nejvyšší', 'nejmenší', 'od nejvyššího k nejmenšímu'),
  adjScale('vek', 'dite', 'starší', 'mladší', 'nejstarší', 'nejmladší', 'od nejstaršího k nejmladšímu'),
  adjScale('rychlost', 'drak', 'rychlejší', 'pomalejší', 'nejrychlejší', 'nejpomalejší', 'od nejrychlejšího k nejpomalejšímu'),
  adjScale('vaha', 'drak', 'těžší', 'lehčí', 'nejtěžší', 'nejlehčí', 'od nejtěžšího k nejlehčímu'),
  countScale('muslicky', 'mušlí'),
  countScale('kaminky', 'kamínků'),
  countScale('sisky', 'šišek'),
];

type OrderQ = 'max' | 'min' | 'mid3' | 'second' | 'third' | 'order';

/** Všechna pořadí (index účastníka na místě 0 = „nejvíc“), která splňují vodítka. */
function rankingsFor(n: number, rels: readonly [number, number][]): number[][] {
  return permutations(n).filter((perm) => rels.every(([a, b]) => perm.indexOf(a) < perm.indexOf(b)));
}

function answerOf(q: OrderQ, perm: number[]): string {
  switch (q) {
    case 'max':
      return String(perm[0]);
    case 'min':
      return String(perm[perm.length - 1]);
    case 'mid3':
    case 'second':
      return String(perm[1]);
    case 'third':
      return String(perm[2]);
    case 'order':
      return perm.join('');
  }
}

function orderingAttempt(level: Level, rng: Rng): Spec | null {
  const scale = rng.pick(level <= 3 ? SCALES : SCALES.filter((s) => s.adj));
  const adj = scale.adj;
  let n: number;
  let q: OrderQ;
  if (level === 1) {
    n = 3;
    q = rng.pick(['max', 'min'] as const);
  } else if (level === 2) {
    n = 3;
    q = rng.pick(['max', 'min', 'mid3'] as const);
  } else if (level === 3) {
    if (adj && rng.chance(0.35)) {
      n = 3;
      q = 'order';
    } else {
      n = 4;
      q = rng.pick(adj ? (['max', 'min', 'second'] as const) : (['max', 'min'] as const));
    }
  } else if (level === 4) {
    n = rng.pick([4, 5]);
    q = rng.pick(['order', 'order', 'second', 'min', 'max'] as const);
  } else if (level === 5) {
    n = 5;
    q = rng.pick(['order', 'max', 'min', 'second'] as const);
  } else {
    n = 5;
    q = rng.pick(['second', 'third', 'third', 'max', 'min'] as const);
  }
  if ((q === 'order' || q === 'second' || q === 'third') && !adj) return null;

  // cast[i] je v pravém pořadí na místě i (0 = nejvyšší, nejrychlejší…)
  const cast = pickSome(rng, scale.kind === 'drak' ? DRAGONS : KIDS, n);
  const adjacent: [number, number][] = Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  let rels: [number, number][];
  const partial = level >= 5 && q !== 'order';
  if (!partial) {
    rels = adjacent;
    if (level === 4 && rng.chance(0.4)) {
      const a = rng.int(0, n - 3);
      rels = [...rels, [a, rng.int(a + 2, n - 1)]];
    }
  } else {
    const all: [number, number][] = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b]);
    rels = rng.shuffle(all).slice(0, rng.int(4, 6));
  }

  const ranks = rankingsFor(n, rels);
  const answers = new Set(ranks.map((p) => answerOf(q, p)));
  if (answers.size !== 1) return null;
  const full = ranks.length === 1;
  if (level === 6 && full) return null; // na L6 jen úlohy, kde celé pořadí poznat nejde

  // Podoba vodítek: L1 všechna stejným směrem jako řetěz, jinak zamíchaná.
  let clues: { a: number; b: number; more: boolean }[];
  if (level === 1) {
    const more = rng.chance(0.5);
    clues = rels.map(([a, b]) => ({ a, b, more }));
    if (!more) clues.reverse();
  } else {
    clues = rng.shuffle(rels.map(([a, b]) => ({ a, b, more: rng.chance(0.5) })));
  }
  const sentence = (c: { a: number; b: number; more: boolean }) =>
    c.more ? scale.cmp(cast[c.a].nom, cast[c.b].nom, true) : scale.cmp(cast[c.b].nom, cast[c.a].nom, false);

  const who = scale.kind === 'drak' ? 'draky' : 'děti';
  let question: string;
  switch (q) {
    case 'max':
      question = scale.qMax;
      break;
    case 'min':
      question = scale.qMin;
      break;
    case 'mid3':
      question = scale.qMid3;
      break;
    case 'second':
      question = `Kdo je druhý ${adj!.max}?`;
      break;
    case 'third':
      question = `Kdo je třetí ${adj!.max}?`;
      break;
    case 'order':
      question = `Seřaď ${who} ${adj!.fromMax}.`;
      break;
  }
  const prompt = `${clues.map(sentence).join(' ')} ${question}`;

  // Nápovědy
  const hints: string[] = [level <= 2 ? 'Postav si je v duchu do řady podle vodítek.' : 'Nakresli si čáru a zapisuj na ni jména podle vodítek.'];
  const flipped = clues.find((c) => !c.more);
  if (flipped && clues.some((c) => c.more)) {
    const x = cast[flipped.b].nom;
    const y = cast[flipped.a].nom;
    hints.push(`„${scale.cmp(x, y, false).slice(0, -1)}“ znamená totéž jako „${scale.cmp(y, x, true).slice(0, -1)}“.`);
  }
  if (q === 'max') hints.push(scale.hintMax);
  else if (q === 'min') hints.push(scale.hintMin);
  else if (q === 'mid3') hints.push(scale.hintMid3);
  else if (q === 'order') hints.push(`Začni tím, kdo je ${adj!.max}.`);
  else hints.push(`Seřaď si je ${adj!.fromMax} a pak počítej.`);

  // Vysvětlení
  const perm = ranks[0];
  const ans = cast[perm[q === 'max' ? 0 : q === 'min' ? n - 1 : q === 'third' ? 2 : 1]];
  let explain: string;
  if (full) {
    const head = scale.cmp(cast[0].nom, cast[1].nom, true).slice(0, -1);
    const rest = Array.from({ length: n - 2 }, (_, i) => `${cast[i + 1].nom} než ${cast[i + 2].nom}`);
    explain = `${listCz([head, ...rest])}.`;
  } else {
    const ai = cast.indexOf(ans);
    if (q === 'max' || q === 'min') {
      explain = `${scale.cmp(ans.nom, 'všichni ostatní', q === 'max').slice(0, -1)} – buď přímo, nebo přes někoho dalšího.`;
    } else {
      const above = cast.filter((_, i) => i < ai).sort(byName).map((w) => w.nom);
      const below = cast.filter((_, i) => i > ai).sort(byName).map((w) => w.nom);
      explain = `${ans.nom} je ${adj!.less} než ${listCz(above)}, ale ${adj!.more} než ${listCz(below)}.`;
    }
  }
  if (q !== 'order' && (full || (q !== 'max' && q !== 'min'))) {
    const s =
      q === 'max' ? scale.sMax(ans.nom)
      : q === 'min' ? scale.sMin(ans.nom)
      : q === 'mid3' ? scale.sMid3(ans.nom)
      : `${ans.nom} je ${q === 'third' ? 'třetí' : ans.female ? 'druhá' : 'druhý'} ${adj!.max}.`;
    explain += ` ${s}`;
  }
  if (!full) explain += ' Celé pořadí se z vodítek určit nedá, na otázku to ale stačí.';

  const ix = alphaIndex(cast);
  const clueCode = (c: { a: number; b: number; more: boolean }) =>
    c.more ? `${ix(cast[c.a])}${ix(cast[c.b])}v` : `${ix(cast[c.b])}${ix(cast[c.a])}m`;
  const key = `rad-${scale.key}-${q}-${castKey([...cast].sort(byName))}-${clues.map(clueCode).join('')}`;
  const difficulty = Math.max(-0.5, Math.min(0.5, (n - 4) * 0.15 + (q === 'order' || q === 'mid3' ? 0.1 : 0) + (partial ? 0.2 : 0) + (flipped ? 0.1 : -0.1)));
  const visual = castCards(cast);

  if (q === 'order') {
    const spec: OrderSpec = { kind: 'order', key, prompt, visual, correct: cast.map((w) => w.nom), hints, explain, difficulty };
    return spec;
  }
  const others = cast.filter((w) => w !== ans).map((w) => w.nom);
  const wrong = level >= 4 ? [...rng.shuffle(others).slice(0, 2), CANT] : others;
  const spec: ChoiceSpec = { key, prompt, visual, correct: ans.nom, wrong, hints: hints.slice(0, 3), explain, difficulty };
  return spec;
}

// ---------------------------------------------------------------------------
// Kdo má kterého draka

type DragonClue =
  | { t: 'ma'; p: number; d: number }
  | { t: 'nema'; p: number; d: number }
  | { t: 'nema2'; p: number; d: number; d2: number }
  /** „Kapku nemá Tom ani Liv.“ */
  | { t: 'nikdo2'; d: number; p: number; p2: number };

function clueHolds(c: DragonClue, owner: number[]): boolean {
  if (c.t === 'ma') return owner[c.p] === c.d;
  if (c.t === 'nema') return owner[c.p] !== c.d;
  if (c.t === 'nema2') return owner[c.p] !== c.d && owner[c.p] !== c.d2;
  return owner[c.p] !== c.d && owner[c.p2] !== c.d;
}

/** Dvojice (dítě, drak), které vodítko vylučuje. */
function excluded(c: DragonClue): [number, number][] {
  if (c.t === 'nema') return [[c.p, c.d]];
  if (c.t === 'nema2') return [[c.p, c.d], [c.p, c.d2]];
  if (c.t === 'nikdo2') return [[c.p, c.d], [c.p2, c.d]];
  return [];
}

/** Krok úvahy: dítě `p` má draka `d`. `by: 'p'` = dítěti zbyl jediný drak,
 *  `by: 'd'` = drakovi zbylo jediné dítě. `why` říká proč: u „p“ dvojice
 *  [jiný drak, kdo ho už má], u „d“ dvojice [jiné dítě, kterého draka už má];
 *  −1 = vyloučeno přímo vodítkem. `deps` = dřívější kroky, na které se
 *  úvaha odvolává. */
interface DragonStep {
  p: number;
  d: number;
  by: 'p' | 'd';
  why: [number, number][];
  deps: number[];
}

/** Postupné vyvozování: kdo může mít jen jednoho draka, kterého draka může
 *  mít jen jeden. Vrací kroky v pořadí, v jakém se na ně přijde. */
function deduceDragons(n: number, clues: DragonClue[]): DragonStep[] {
  const can = Array.from({ length: n }, () => Array.from({ length: n }, () => true));
  const byClue = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
  const known = new Map<number, number>();
  /** U každého známého dítěte krok, ve kterém se na to přišlo (−1 = vodítko „má“). */
  const knownAt = new Map<number, number>();
  const assign = (p: number, d: number, at: number) => {
    known.set(p, d);
    knownAt.set(p, at);
    for (let i = 0; i < n; i++) {
      if (i !== d) can[p][i] = false;
      if (i !== p) can[i][d] = false;
    }
  };
  for (const c of clues) {
    if (c.t === 'ma') assign(c.p, c.d, -1);
    else
      for (const [p, d] of excluded(c)) {
        can[p][d] = false;
        byClue[p][d] = true;
      }
  }
  const owner = (d: number) => [...known.entries()].find(([, x]) => x === d)?.[0] ?? -1;
  const steps: DragonStep[] = [];
  const depsOf = (people: number[]) => [...new Set(people.map((q) => knownAt.get(q) ?? -1).filter((s) => s >= 0))];
  for (let guard = 0; guard < 2 * n; guard++) {
    let found = false;
    for (let p = 0; p < n && !found; p++) {
      if (known.has(p)) continue;
      const opts = can[p].flatMap((ok, d) => (ok ? [d] : []));
      if (opts.length === 1) {
        const why: [number, number][] = [];
        for (let d = 0; d < n; d++) if (d !== opts[0]) why.push([d, byClue[p][d] ? -1 : owner(d)]);
        const step: DragonStep = { p, d: opts[0], by: 'p', why, deps: depsOf(why.map(([, q]) => q).filter((q) => q >= 0)) };
        assign(p, opts[0], steps.length);
        steps.push(step);
        found = true;
      }
    }
    for (let d = 0; d < n && !found; d++) {
      if ([...known.values()].includes(d)) continue;
      const opts = can.flatMap((row, p) => (row[d] ? [p] : []));
      if (opts.length === 1) {
        const why: [number, number][] = [];
        for (let q = 0; q < n; q++) if (q !== opts[0]) why.push([q, byClue[q][d] ? -1 : known.get(q)!]);
        const step: DragonStep = { p: opts[0], d, by: 'd', why, deps: depsOf(why.filter(([, x]) => x >= 0).map(([q]) => q)) };
        assign(opts[0], d, steps.length);
        steps.push(step);
        found = true;
      }
    }
    if (!found) break;
  }
  return steps;
}

function dragonsAttempt(level: Level, rng: Rng): Spec | null {
  // L1: tři děti, dva draci „dané“ a otázka na třetího; nebo dvě děti a jedno „nemá“.
  const n = level === 1 ? rng.pick([2, 3]) : level <= 3 ? 3 : 4;
  const people = pickSome(rng, KIDS, n);
  const dragons = pickSome(rng, DRAGONS, n).sort(byName); // v abecedě, jako na kartách
  const owner = rng.shuffle(Array.from({ length: n }, (_, i) => i)); // owner[p] = drak dítěte p

  const pool: DragonClue[] = [];
  for (let p = 0; p < n; p++) {
    pool.push({ t: 'ma', p, d: owner[p] });
    for (let d = 0; d < n; d++) {
      if (d === owner[p]) continue;
      pool.push({ t: 'nema', p, d });
      for (let d2 = d + 1; d2 < n; d2++) if (d2 !== owner[p] && n >= 3) pool.push({ t: 'nema2', p, d, d2 });
      for (let p2 = p + 1; p2 < n; p2++) if (owner[p2] !== d && n >= 4) pool.push({ t: 'nikdo2', d, p, p2 });
    }
  }
  const allowed = (c: DragonClue) => {
    if (level === 1) return n === 3 ? c.t === 'ma' : c.t === 'ma' || c.t === 'nema';
    if (level === 5) return c.t !== 'ma';
    if (level === 3) return c.t === 'nema' || c.t === 'nema2';
    return c.t !== 'nikdo2';
  };
  const candidates = rng.shuffle(pool.filter(allowed));
  const solutions = (cl: DragonClue[]) => permutations(n).filter((o) => cl.every((c) => clueHolds(c, o)));

  // Přidávej vodítka, dokud není řešení jediné, pak odeber zbytečná. Každé
  // dítě má nejvýš jedno vodítko „nemá…“, každý drak nejvýš jedno „… nemá X
  // ani Y“ a žádná dvojice dítě–drak se nevylučuje dvakrát.
  const clash = (a: DragonClue, b: DragonClue) =>
    (a.t !== 'nikdo2' && b.t !== 'nikdo2' && a.p === b.p) ||
    (a.t === 'nikdo2' && b.t === 'nikdo2' && a.d === b.d) ||
    excluded(a).some(([p, d]) => excluded(b).some(([q, e]) => p === q && d === e));
  let clues: DragonClue[] = [];
  for (const c of candidates) {
    if (clues.some((x) => clash(x, c))) continue;
    clues.push(c);
    if (solutions(clues).length === 1) break;
  }
  if (solutions(clues).length !== 1) return null;
  for (const c of rng.shuffle(clues)) {
    const without = clues.filter((x) => x !== c);
    if (solutions(without).length === 1) clues = without;
  }
  const maCount = clues.filter((c) => c.t === 'ma').length;
  if (level === 2 && maCount !== 1) return null;
  if (level === 4 && maCount !== 1) return null;
  if (level === 1 && n === 3 && clues.length !== 2) return null;
  if (clues.length > (level >= 4 ? 4 : 3)) return null;

  // Otázka: na něco, co není řečeno přímo.
  const steps = deduceDragons(n, clues);
  type Ask = { kind: 'kdo'; d: number } | { kind: 'co'; p: number };
  const asks: Ask[] = [];
  for (let d = 0; d < n; d++) if (!clues.some((c) => c.t === 'ma' && c.d === d)) asks.push({ kind: 'kdo', d });
  for (let p = 0; p < n; p++) if (!clues.some((c) => c.t === 'ma' && c.p === p)) asks.push({ kind: 'co', p });
  const stepOf = (a: Ask) => steps.findIndex((s) => (a.kind === 'kdo' ? s.d === a.d : s.p === a.p));
  // Od L3 musí otázka vyžadovat aspoň dva kroky úvahy, kde druhý stojí na
  // prvním (nebo úvahu nad rámec jednoduchých kroků).
  const good = asks.filter((a) => {
    const i = stepOf(a);
    return level <= 2 ? true : i === -1 || steps[i].deps.length > 0;
  });
  if (!good.length) return null;
  const ask = rng.pick(good);
  const ansP = ask.kind === 'kdo' ? owner.indexOf(ask.d) : ask.p;
  const ansD = ask.kind === 'kdo' ? ask.d : owner[ask.p];
  // Od L2 nesmí na otázku odpovědět žádné vodítko samo o sobě.
  const answerIn = (o: number[]) => (ask.kind === 'kdo' ? o.indexOf(ask.d) : o[ask.p]);
  if (level >= 2 && clues.some((c) => new Set(solutions([c]).map(answerIn)).size === 1)) return null;

  const P = (i: number) => people[i].nom;
  const Dacc = (i: number) => dragons[i].acc!;
  const say = (c: DragonClue) =>
    c.t === 'ma' ? `${P(c.p)} má ${Dacc(c.d)}.`
    : c.t === 'nema' ? `${P(c.p)} nemá ${Dacc(c.d)}.`
    : c.t === 'nema2' ? `${P(c.p)} nemá ${Dacc(c.d)} ani ${Dacc(c.d2)}.`
    : `${Dacc(c.d)} nemá ${P(c.p)} ani ${P(c.p2)}.`;
  const each = people.every((w) => w.female) ? 'každá' : 'každý';
  const intro = `${listCz(people.map((w) => w.nom))} mají draky z obrázku – ${each} jednoho.`;
  const question = ask.kind === 'kdo' ? `Kdo má ${Dacc(ask.d)}?` : `Kterého draka má ${P(ask.p)}?`;
  const prompt = `${intro} ${clues.map(say).join(' ')} ${question}`;

  const hints = ['Nakresli si tabulku: děti a draci. Škrtej, co nejde.'];
  const ma = clues.find((c) => c.t === 'ma');
  if (ma) hints.push(`Když ${P(ma.p)} má ${Dacc(ma.d)}, nikdo jiný ${Dacc(ma.d)} mít nemůže.`);
  else hints.push('Každý drak patří jen jednomu dítěti. Komu zbývá jen jeden drak?');

  // Vysvětlení: kroky úvahy, které k odpovědi vedou (i s důvody), jinak celé
  // rozdělení.
  const idx = stepOf(ask);
  let explain: string;
  if (idx >= 0) {
    const need = new Set<number>();
    const visit = (i: number) => {
      if (need.has(i)) return;
      need.add(i);
      steps[i].deps.forEach(visit);
    };
    visit(idx);
    const reason = (s: DragonStep): string => {
      const parts: string[] = [];
      if (s.by === 'p') {
        const excl = s.why.filter(([, q]) => q < 0).map(([d]) => Dacc(d));
        if (excl.length) parts.push(`${P(s.p)} nemá ${listCz(excl, 'ani')}`);
        for (const [d, q] of s.why) if (q >= 0) parts.push(`${Dacc(d)} už má ${P(q)}`);
      } else {
        const excl = s.why.filter(([, x]) => x < 0).map(([q]) => P(q));
        if (excl.length) parts.push(`${Dacc(s.d)} nemá ${listCz(excl, 'ani')}`);
        for (const [q, x] of s.why) if (x >= 0) parts.push(`${P(q)} už má ${Dacc(x)}`);
      }
      const then = s.by === 'p' ? `${P(s.p)} má ${Dacc(s.d)}` : `${Dacc(s.d)} má ${P(s.p)}`;
      return `${listCz(parts)}, takže ${then}.`;
    };
    explain = [...need].sort((a, b) => a - b).map((i) => reason(steps[i])).join(' ');
  } else {
    const all = people.map((_, p) => (p === 0 ? `${P(p)} má ${Dacc(owner[p])}` : `${P(p)} ${Dacc(owner[p])}`));
    explain = `Všechna vodítka platí jen pro jedno rozdělení: ${listCz(all)}.`;
  }

  const clueKey = clues
    .map((c) => (c.t === 'nema2' ? `x${c.p}${c.d}${c.d2}` : c.t === 'nikdo2' ? `y${c.d}${c.p}${c.p2}` : `${c.t === 'ma' ? 'm' : 'n'}${c.p}${c.d}`))
    .join('');
  const key = `draci-${castKey(people)}-${castKey(dragons)}-${clueKey}-${ask.kind === 'kdo' ? `d${ask.d}` : `p${ask.p}`}`;
  const visual = castCards(dragons);
  const correct = ask.kind === 'kdo' ? P(ansP) : Dacc(ansD);
  const others = ask.kind === 'kdo' ? people.filter((_, i) => i !== ansP).map((w) => w.nom) : dragons.filter((_, i) => i !== ansD).map((w) => w.acc!);
  const difficulty = Math.max(-0.5, Math.min(0.5, (clues.length - 2) * 0.15 + (idx === -1 ? 0.3 : idx * 0.1) - (n === 2 ? 0.3 : 0)));
  const spec: ChoiceSpec = { key, prompt, visual, correct, wrong: others, hints, explain, difficulty };
  return spec;
}

// ---------------------------------------------------------------------------
// Zasedací pořádek: lavička (vedle sebe) a čtvercový stůl

type SeatClue =
  | { t: 'vlevo' | 'vpravo' | 'uprostred' | 'kraj' | 'nekraj'; a: number }
  | { t: 'vedle' | 'nevedle'; a: number; b: number }
  | { t: 'misto'; a: number; k: number };

function seatHolds(c: SeatClue, pos: number[], n: number): boolean {
  const p = pos[c.a];
  switch (c.t) {
    case 'vlevo':
      return p === 0;
    case 'vpravo':
      return p === n - 1;
    case 'uprostred':
      return p * 2 === n - 1;
    case 'kraj':
      return p === 0 || p === n - 1;
    case 'nekraj':
      return p !== 0 && p !== n - 1;
    case 'vedle':
      return Math.abs(p - pos[c.b]) === 1;
    case 'nevedle':
      return Math.abs(p - pos[c.b]) !== 1;
    case 'misto':
      return p === c.k;
  }
}

type BenchQ = 'uprostred' | 'vlevo' | 'vpravo' | 'druhe' | 'order';

function benchAttempt(level: Level, rng: Rng): Spec | null {
  const n = level <= 2 ? 3 : level === 3 ? rng.pick([3, 3, 4]) : level === 6 ? 5 : 4;
  const dragonsCast = rng.chance(0.4);
  const cast = pickSome(rng, dragonsCast ? DRAGONS : KIDS, n, (w) => !!w.gen);
  const seat = rng.shuffle(Array.from({ length: n }, (_, i) => i)); // seat[i] = místo účastníka i (0 = úplně vlevo)

  let q: BenchQ;
  if (level <= 2) q = rng.pick(['uprostred', 'vlevo', 'vpravo'] as const);
  else if (level === 3) q = n === 3 ? 'order' : rng.pick(['vlevo', 'vpravo'] as const);
  else if (level === 4) q = rng.pick(['order', 'order', 'druhe'] as const);
  else q = 'order';

  const pool: SeatClue[] = [];
  for (let a = 0; a < n; a++) {
    const p = seat[a];
    if (p === 0) pool.push({ t: 'vlevo', a });
    if (p === n - 1) pool.push({ t: 'vpravo', a });
    if (n % 2 === 1 && p * 2 === n - 1) pool.push({ t: 'uprostred', a });
    if (p === 0 || p === n - 1) pool.push({ t: 'kraj', a });
    else pool.push({ t: 'nekraj', a });
    if (n >= 4 && p > 0 && p < n - 1 && p * 2 !== n - 1) pool.push({ t: 'misto', a, k: p });
    for (let b = a + 1; b < n; b++) {
      const [s, o] = rng.chance(0.5) ? [a, b] : [b, a];
      pool.push({ t: Math.abs(p - seat[b]) === 1 ? 'vedle' : 'nevedle', a: s, b: o });
    }
  }
  const absolute = (c: SeatClue) => c.t === 'vlevo' || c.t === 'vpravo' || c.t === 'uprostred' || c.t === 'misto';
  const allowed = (c: SeatClue) => {
    if (level === 1) return absolute(c);
    if (level === 5 || level === 6) return c.t !== 'misto' && c.t !== 'uprostred';
    return true;
  };
  const arrangements = permutations(n);
  const fits = (cl: SeatClue[]) => arrangements.filter((pos) => cl.every((c) => seatHolds(c, pos, n)));

  let clues: SeatClue[] = [];
  for (const c of rng.shuffle(pool.filter(allowed))) {
    clues.push(c);
    if (fits(clues).length === 1) break;
  }
  if (fits(clues).length !== 1) return null;
  for (const c of rng.shuffle(clues)) {
    const without = clues.filter((x) => x !== c);
    if (fits(without).length === 1) clues = without;
  }
  const absCount = clues.filter(absolute).length;
  if (level === 2 && (absCount !== 1 || clues.length !== 2)) return null;
  if (level >= 5 && absCount > 1) return null;
  if (clues.length > n) return null;

  // Otázka nesmí být zodpovězená přímo vodítkem.
  const askedPos = q === 'uprostred' || q === 'druhe' ? 1 : q === 'vlevo' ? 0 : q === 'vpravo' ? n - 1 : -1;
  const ansI = askedPos >= 0 ? seat.indexOf(askedPos) : -1;
  if (ansI >= 0 && clues.some((c) => new Set(fits([c]).map((pos) => pos.indexOf(askedPos))).size === 1)) return null;
  if (level === 1 && clues.length !== 2) return null;

  const N = (i: number) => cast[i].nom;
  const G = (i: number) => cast[i].gen!;
  const say = (c: SeatClue) => {
    switch (c.t) {
      case 'vlevo':
        return `${N(c.a)} sedí úplně vlevo.`;
      case 'vpravo':
        return `${N(c.a)} sedí úplně vpravo.`;
      case 'uprostred':
        return `${N(c.a)} sedí uprostřed.`;
      case 'kraj':
        return `${N(c.a)} sedí na kraji.`;
      case 'nekraj':
        return `${N(c.a)} nesedí na kraji.`;
      case 'vedle':
        return `${N(c.a)} sedí vedle ${G(c.b)}.`;
      case 'nevedle':
        return `${N(c.a)} nesedí vedle ${G(c.b)}.`;
      case 'misto':
        return `${N(c.a)} sedí na ${ORDINAL_LOC[c.k]} místě zleva.`;
    }
  };
  const count = ['tři', 'čtyři', 'pět'][n - 3];
  const intro = dragonsCast
    ? `Na skále sedí vedle sebe ${count} ${n === 5 ? 'draků' : 'draci'} z obrázku.`
    : `Na lavičce sedí vedle sebe ${count} ${n === 5 ? 'dětí' : 'děti'} z obrázku.`;
  const question =
    q === 'order' ? `Seřaď ${dragonsCast ? 'draky' : 'děti'} tak, jak sedí zleva doprava.`
    : q === 'uprostred' ? 'Kdo sedí uprostřed?'
    : q === 'vlevo' ? 'Kdo sedí úplně vlevo?'
    : q === 'vpravo' ? 'Kdo sedí úplně vpravo?'
    : 'Kdo sedí na druhém místě zleva?';
  const prompt = `${intro} ${clues.map(say).join(' ')} ${question}`;

  const leftToRight = Array.from({ length: n }, (_, p) => N(seat.indexOf(p)));
  const hints = [`Nakresli si ${n === 5 ? 'pět míst' : `${count} místa`} vedle sebe a zkoušej, kam kdo patří.`];
  if (clues.some((c) => c.t === 'nevedle' || c.t === 'nekraj')) hints.push('Vodítko s „ne“ také pomáhá: řekne ti, kam někdo patřit nemůže.');
  else hints.push('Začni vodítkem, které říká přesné místo.');
  const explain =
    q === 'order'
      ? 'Jen v tomhle pořadí platí všechna vodítka zároveň. Zkus je po jednom ověřit.'
      : `Všechna vodítka platí jen pro jedno pořadí zleva: ${listCz(leftToRight)}.`;
  const ix = alphaIndex(cast);
  const key = `lavicka-${castKey([...cast].sort(byName))}-${clues.map((c) => seatClueKey(c, (i) => ix(cast[i]))).join('')}-${q}`;
  const visual = castCards(cast);
  const difficulty = Math.max(-0.5, Math.min(0.5, (clues.length - 2) * 0.15 + (n - 3) * 0.2 - absCount * 0.1));
  if (q === 'order') {
    const spec: OrderSpec = { kind: 'order', key, prompt, visual, correct: leftToRight, hints, explain, difficulty };
    return spec;
  }
  const spec: ChoiceSpec = {
    key,
    prompt,
    visual,
    correct: N(ansI),
    wrong: cast.filter((_, i) => i !== ansI).map((w) => w.nom),
    hints,
    explain,
    difficulty,
  };
  return spec;
}

function seatClueKey(c: SeatClue, ix: (i: number) => number): string {
  if (c.t === 'vedle' || c.t === 'nevedle') return `${c.t === 'vedle' ? 'v' : 'w'}${ix(c.a)}${ix(c.b)}`;
  if (c.t === 'misto') return `k${ix(c.a)}${c.k}`;
  return `${c.t[0]}${c.t === 'nekraj' ? 'n' : ''}${ix(c.a)}`;
}

/** Čtvercový stůl: čtyři děti, na každé straně jedno. */
function tableAttempt(level: Level, rng: Rng): Spec | null {
  const cast = pickSome(rng, KIDS, 4, (w) => !!w.gen && !!w.dat);
  const seat = rng.shuffle([0, 1, 2, 3]); // místa kolem stolu dokola
  const opp = (i: number) => seat.indexOf((seat[i] + 2) % 4);
  const N = (i: number) => cast[i].nom;
  const G = (i: number) => cast[i].gen!;
  const D = (i: number) => cast[i].dat!;
  const a = 0;
  const b = opp(0);
  const others = [1, 2, 3].filter((i) => i !== b);
  const intro = 'Kolem čtvercového stolu sedí čtyři děti z obrázku, na každé straně jedno.';
  let clues: string[];
  let explain: string;
  let variant: string;
  const form = level === 4 ? 'naproti' : rng.pick(['nevedle', 'dvakrat'] as const);
  // U „dvakrát vedle“ je c ten, kdo sedí vedle obou; jinak jen pevné pořadí.
  const [c, d] = form === 'dvakrat' ? rng.shuffle(others) : [...others].sort((x, y) => byName(cast[x], cast[y]));
  if (form === 'naproti') {
    clues = [`${N(a)} sedí naproti ${D(b)}.`];
    explain = `${N(a)} a ${N(b)} sedí naproti sobě. Zbývající dva, ${N(c)} a ${N(d)}, tedy také sedí naproti sobě.`;
    variant = 'n';
  } else if (form === 'nevedle') {
    clues = [`${N(a)} nesedí vedle ${G(b)}.`];
    explain = `U čtvercového stolu sedí naproti ten, kdo nesedí vedle. ${N(a)} tedy sedí naproti ${D(b)} a ${N(c)} naproti ${D(d)}.`;
    variant = 'w';
  } else {
    clues = [`${N(c)} sedí vedle ${G(a)}.`, `${N(c)} sedí vedle ${G(b)}.`];
    explain = `${N(c)} sedí vedle ${G(a)} i vedle ${G(b)}, takže naproti ${D(c)} sedí ${N(d)}. Zbylí dva, ${N(a)} a ${N(b)}, sedí naproti sobě.`;
    variant = 'v';
  }
  // Otázka na někoho, o kom vodítko přímo neříká, kdo sedí naproti.
  const askI = form === 'dvakrat' ? rng.pick([a, b]) : rng.pick([c, d]);
  const ansI = opp(askI);
  const prompt = `${intro} ${clues.join(' ')} Kdo sedí naproti ${D(askI)}?`;
  const hints = ['Nakresli si čtverec a ke každé straně jedno místo.', 'Každý má dva sousedy a naproti sobě jednoho člověka.'];
  const ix = alphaIndex(cast);
  const I = (i: number) => ix(cast[i]);
  const clueCode = form === 'dvakrat' ? `v${I(c)}${I(a)}v${I(c)}${I(b)}` : `${variant}${I(a)}${I(b)}`;
  const key = `stul-${castKey([...cast].sort(byName))}-${clueCode}-${I(askI)}`;
  const spec: ChoiceSpec = {
    key,
    prompt,
    visual: castCards(cast),
    correct: N(ansI),
    wrong: cast.filter((_, i) => i !== ansI && i !== askI).map((w) => w.nom),
    hints,
    explain,
    difficulty: form === 'naproti' ? 0 : 0.3,
  };
  return spec;
}

// ---------------------------------------------------------------------------
// Ručně psané úlohy

const YES_NO = ['Ano', 'Ne', 'Nedá se poznat'];

const num = (key: string, prompt: string, correct: number, hints: string[], explain: string, extra: Partial<NumberSpec> = {}): NumberSpec => ({
  kind: 'number',
  key,
  prompt,
  correct,
  hints,
  explain,
  ...extra,
});

const ch = (key: string, prompt: string, correct: string, wrong: string[], hints: string[], explain: string, extra: Partial<ChoiceSpec> = {}): ChoiceSpec => ({
  key,
  prompt,
  correct,
  wrong,
  hints,
  explain,
  ...extra,
});

const yn = (key: string, prompt: string, correct: 0 | 1 | 2, hints: string[], explain: string, extra: Partial<FixedSpec> = {}): FixedSpec => ({
  kind: 'fixed',
  key,
  prompt,
  options: YES_NO,
  correct,
  hints,
  explain,
  ...extra,
});

// --- Dny v týdnu -----------------------------------------------------------

const DAYS_L2: Spec[] = [
  ch('den-po-pozitri', 'Dnes je pondělí. Jaký den bude pozítří?', 'Středa', ['Úterý', 'Čtvrtek', 'Neděle'],
    ['Pozítří znamená za dva dny.'], 'Zítra bude úterý a pozítří středa.'),
  ch('den-pa-vcera', 'Dnes je pátek. Jaký den byl včera?', 'Čtvrtek', ['Sobota', 'Středa', 'Neděle'],
    ['Včera je den před dneškem.'], 'Den před pátkem je čtvrtek.'),
  ch('den-ne-zitra', 'Dnes je neděle. Jaký den bude zítra?', 'Pondělí', ['Sobota', 'Úterý', 'Pátek'],
    ['Co přijde, když skončí týden?'], 'Po neděli začíná nový týden pondělím.'),
  ch('den-vcera-st', 'Včera byla středa. Jaký den je dnes?', 'Čtvrtek', ['Úterý', 'Pátek', 'Středa'],
    ['Dnes je den po včerejšku.'], 'Den po středě je čtvrtek.'),
  ch('den-zitra-so', 'Zítra bude sobota. Jaký den je dnes?', 'Pátek', ['Neděle', 'Čtvrtek', 'Sobota'],
    ['Dnes je den před zítřkem.'], 'Den před sobotou je pátek.'),
];

const DAYS_L3: Spec[] = [
  ch('den-vcera-so-zitra', 'Včera byla sobota. Jaký den bude zítra?', 'Pondělí', ['Neděle', 'Úterý', 'Sobota'],
    ['Nejdřív zjisti, jaký den je dnes.'], 'Včera byla sobota, dnes je neděle, a zítra tedy bude pondělí.'),
  ch('den-predevcirem-ut', 'Předevčírem bylo úterý. Jaký den je dnes?', 'Čtvrtek', ['Středa', 'Pátek', 'Pondělí'],
    ['Předevčírem znamená před dvěma dny.'], 'Předevčírem bylo úterý, včera středa a dnes je čtvrtek.'),
  ch('den-pozitri-pa', 'Pozítří bude pátek. Jaký den je dnes?', 'Středa', ['Čtvrtek', 'Úterý', 'Neděle'],
    ['Pozítří je za dva dny. Počítej od pátku zpátky.'], 'Dnes je středa, zítra bude čtvrtek a pozítří pátek.'),
];

const DAYS_L4: Spec[] = [
  ch('den-pozitri-ne-vcera', 'Pozítří bude neděle. Jaký den byl včera?', 'Čtvrtek', ['Pátek', 'Sobota', 'Středa'],
    ['Nejdřív zjisti, jaký den je dnes.'], 'Když bude pozítří neděle, dnes je pátek. Včera tedy byl čtvrtek.'),
  ch('den-za3-so-predevcirem', 'Za tři dny bude sobota. Jaký den byl předevčírem?', 'Pondělí', ['Úterý', 'Středa', 'Neděle'],
    ['Nejdřív zjisti, jaký den je dnes.', 'Předevčírem znamená před dvěma dny.'], 'Za tři dny bude sobota, takže dnes je středa. Předevčírem bylo pondělí.'),
  ch('den-vcera-po-ctvrtku', 'Včera byl den po čtvrtku. Jaký den bude zítra?', 'Neděle', ['Sobota', 'Pátek', 'Pondělí'],
    ['Který den je po čtvrtku?', 'Pak zjisti, jaký den je dnes.'], 'Den po čtvrtku je pátek. Včera byl pátek, dnes je sobota a zítra bude neděle.'),
];

const DAYS_L5: Spec[] = [
  ch('den-predevcirem-pred-nedeli', 'Předevčírem byl den před nedělí. Jaký den bude pozítří?', 'Středa', ['Úterý', 'Čtvrtek', 'Pondělí'],
    ['Který den je před nedělí?', 'Pak zjisti, jaký den je dnes.'], 'Den před nedělí je sobota. Předevčírem byla sobota, takže dnes je pondělí a pozítří bude středa.'),
  ch('den-st-za10', 'Dnes je středa. Jaký den bude za 10 dní?', 'Sobota', ['Pátek', 'Neděle', 'Středa'],
    ['Za 7 dní bude zase středa.'], 'Za 7 dní bude zase středa a o 3 dny později sobota.'),
  ch('den-po-pred15', 'Dnes je pondělí. Jaký den byl před 15 dny?', 'Neděle', ['Pondělí', 'Sobota', 'Úterý'],
    ['Před 14 dny, tedy přesně před dvěma týdny, byl stejný den jako dnes.'], 'Před 14 dny bylo také pondělí a o den dřív neděle.'),
];

// --- Fronty, střihy, plot, rodina a chytáky -------------------------------

const QUEUE_L3: Spec[] = [
  num('fronta-3-3', 'Runa stojí ve frontě na zmrzlinu. Je třetí zepředu a zároveň třetí zezadu. Kolik dětí stojí ve frontě?', 5,
    ['Nakresli si frontu: Runu, děti před ní a děti za ní.', 'Kolik dětí stojí před Runou a kolik za ní?'],
    'Před Runou stojí 2 děti a za ní také 2. Spolu s Runou je to 2 + 1 + 2 = 5 dětí.'),
  num('fronta-4-2', 'Leif je ve frontě čtvrtý zepředu a druhý zezadu. Kolik dětí je ve frontě?', 5,
    ['Nakresli si frontu.', 'Kolik dětí stojí před Leifem a kolik za ním?'],
    'Před Leifem stojí 3 děti a za ním 1. Spolu s Leifem je to 3 + 1 + 1 = 5 dětí.'),
  num('fronta-2-2', 'Draci letí v řadě za sebou. Blesk letí druhý zepředu a zároveň druhý zezadu. Kolik draků letí?', 3,
    ['Kolik draků letí před Bleskem a kolik za ním?'],
    'Před Bleskem letí 1 drak a za ním také 1. Spolu s Bleskem jsou to 3 draci.'),
];

const QUEUE_L4: Spec[] = [
  num('fronta-5-5', 'Ivar stojí v řadě pátý zepředu a zároveň pátý zezadu. Kolik dětí stojí v řadě?', 9,
    ['Kolik dětí stojí před Ivarem a kolik za ním?'],
    'Před Ivarem stojí 4 děti a za ním také 4. Spolu s Ivarem je to 4 + 1 + 4 = 9 dětí.'),
  num('fronta-3-6', 'Alva stojí v řadě třetí zepředu a šestá zezadu. Kolik dětí stojí v řadě?', 8,
    ['Kolik dětí stojí před Alvou a kolik za ní?', 'Nezapomeň započítat i Alvu.'],
    'Před Alvou stojí 2 děti a za ní 5. Spolu s Alvou je to 2 + 1 + 5 = 8 dětí.'),
];

const MISC_L2: Spec[] = [
  num('cislo-3', 'Myslím si číslo od 1 do 10. Není větší než 3 a není menší než 3. Které to je?', 3,
    ['Která čísla nejsou větší než 3? A která z nich nejsou menší než 3?'],
    'Číslo, které není větší ani menší než 3, je právě číslo 3.'),
  num('cislo-7', 'Myslím si číslo od 1 do 10. Je větší než 6 a menší než 8. Které to je?', 7,
    ['Vypiš si čísla větší než 6.'], 'Mezi 6 a 8 leží jen číslo 7.'),
  num('cislo-9', 'Myslím si číslo od 1 do 10. Je větší než 7, ale není to 8 ani 10. Které to je?', 9,
    ['Vypiš si čísla od 1 do 10, která jsou větší než 7.'], 'Větší než 7 jsou 8, 9 a 10. Když 8 a 10 škrtneš, zbude 9.'),
];

const MISC_L3: Spec[] = [
  num('stuha-4', 'Kolikrát musíš přestřihnout stuhu, abys měla 4 kousky?', 3,
    ['Nakresli si stuhu a čárky tam, kde střihneš.'],
    'Jeden střih udělá 2 kousky a každý další přidá jeden. Na 4 kousky stačí 3 střihy.'),
  num('sloupky-5', 'Na rovné cestě stojí v řadě 5 sloupků. Mezi každými dvěma sousedními je natažený provázek. Kolik je provázků?', 4,
    ['Nakresli si sloupky jako čárky a provázky mezi ně.'],
    'Provázky jsou jen mezi sloupky. Mezi 5 sloupky jsou 4 mezery, a tedy 4 provázky.'),
  num('sestry-bratr', 'Leif má dvě sestry a jednoho bratra. Kolik dětí je v jejich rodině?', 4,
    ['Nezapomeň započítat Leifa.'], 'Leif, jeho dvě sestry a bratr – to jsou 4 děti.'),
  num('jablka-vezmes', 'V krabici jsou 3 jablka. Vezmeš si 2. Kolik jablek máš ty?', 2,
    ['Čti pozorně: kolik jich máš ty, ne kolik jich zůstalo v krabici.'],
    'Máš ta 2 jablka, která sis vzala. V krabici zůstalo jedno.'),
  num('vek-az', 'Leifovi je 7 let a Runě 4 roky. Kolik let bude Runě, až bude Leifovi 10?', 7,
    ['O kolik let je Leif starší než Runa?'],
    'Leif je o 3 roky starší a ten rozdíl se nemění. Až mu bude 10, Runě bude 10 − 3 = 7 let.'),
  num('cislo-14', 'Myslím si číslo od 1 do 20. Je větší než 12, menší než 16 a je sudé. Které to je?', 14,
    ['Vypiš si čísla mezi 12 a 16.'], 'Mezi 12 a 16 jsou čísla 13, 14 a 15. Sudé je jen 14.'),
  num('cislo-15', 'Myslím si číslo od 1 do 20. Je liché, větší než 14 a menší než 17. Které to je?', 15,
    ['Vypiš si čísla mezi 14 a 17.'], 'Mezi 14 a 17 jsou čísla 15 a 16. Liché je jen 15.'),
  num('cislo-20', 'Myslím si číslo od 1 do 30. Končí nulou, je větší než 15 a menší než 25. Které to je?', 20,
    ['Která čísla do 30 končí nulou?'], 'Nulou končí 10, 20 a 30. Mezi 15 a 25 leží jen 20.'),
];

const MISC_L4: Spec[] = [
  num('plot-10', 'Rovný plot je dlouhý 10 metrů. Sloupky stojí na začátku, na konci a každé 2 metry. Kolik je sloupků?', 6,
    ['Nakresli si to: sloupek na 0 metrech, na 2 metrech…'],
    'Sloupky stojí na 0, 2, 4, 6, 8 a 10 metrech. Je jich 6 – o jeden víc než mezer mezi nimi.'),
  num('kmen-5', 'Táta rozřezává kmen na 5 špalků. Jeden řez mu trvá 2 minuty. Kolik minut bude řezat?', 8,
    ['Kolik řezů je potřeba na 5 kusů?'], 'Na 5 kusů stačí 4 řezy. 4 × 2 = 8 minut.', { unit: 'min' }),
  num('schody-3', 'Leif bydlí ve 3. patře. Z přízemí do 1. patra vede 10 schodů a mezi dalšími patry také. Kolik schodů vyjde z přízemí domů?', 30,
    ['Kolik schodů je z přízemí do 1. patra? A do 2. patra?'],
    'Do 1. patra je 10 schodů, do 2. patra 20 a do 3. patra 30.'),
  num('runa-bratri', 'Runa má tři bratry. Každý z bratrů má jednu sestru. Kolik dětí je v rodině?', 4,
    ['Kdo je ta jedna sestra?'], 'Ta jedna sestra je Runa. V rodině jsou 3 bratři a Runa, tedy 4 děti.'),
  num('vek-rozdil', 'Leif je o 3 roky starší než Runa. O kolik let bude Leif starší než Runa za 5 let?', 3,
    ['Kolik let přibude Leifovi a kolik Runě?'], 'Oba zestárnou o stejný počet let, takže rozdíl zůstane 3 roky.', { unit: 'roky' }),
  num('cislo-22', 'Myslím si sudé dvojmístné číslo menší než 30. Obě jeho číslice jsou stejné. Které to je?', 22,
    ['Která dvojmístná čísla mají obě číslice stejné?'], 'Dvojmístná čísla menší než 30 se dvěma stejnými číslicemi jsou jen 11 a 22. Sudé je jen 22.'),
  num('cislo-35', 'Myslím si číslo od 1 do 50. Je v násobilce 5 i v násobilce 7. Které to je?', 35,
    ['Vypiš si násobilku 7 a hledej čísla končící 0 nebo 5.'], '35 = 5 × 7, takže je v obou násobilkách. Žádné jiné číslo do 50 tam není.'),
  num('cislo-24', 'Myslím si číslo od 1 do 30. Je v násobilce 4 i v násobilce 6 a je větší než 15. Které to je?', 24,
    ['Která čísla jsou v násobilce 4 i 6?'], 'V obou násobilkách jsou 12 a 24. Větší než 15 je jen 24.'),
];

const MISC_L5: Spec[] = [
  num('tata-dcery', 'Tatínek má 4 dcery. Každá z nich má jednoho bratra. Kolik má tatínek dětí?', 5,
    ['Mají všechny dcery stejného bratra?'], 'Všechny dcery mají stejného bratra. Tatínek má 4 dcery a 1 syna, tedy 5 dětí.'),
  num('mesice-28', 'Kolik měsíců v roce má aspoň 28 dní?', 12,
    ['Který měsíc je nejkratší? Kolik má dní?'], 'Aspoň 28 dní má každý měsíc, i únor. Je to tedy všech 12 měsíců.'),
  num('cislo-36', 'Myslím si číslo od 1 do 50. Je v násobilce 4 i v násobilce 9. Které to je?', 36,
    ['Projdi násobilku 9 a hledej čísla, která jsou i v násobilce 4.'], '36 = 4 × 9, takže je v obou násobilkách. Žádné jiné číslo do 50 tam není.'),
  num('cislo-45', 'Myslím si číslo z násobilky 9. Je liché a leží mezi 30 a 60. Které to je?', 45,
    ['Vypiš si násobilku 9 a škrtej.'], 'Mezi 30 a 60 jsou v násobilce 9 čísla 36, 45 a 54. Liché je jen 45.'),
];

const MISC_L6: Spec[] = [
  num('tri-draci-jablka', 'Tři draci snědí tři jablka za tři minuty. Za kolik minut sní šest draků šest jablek?', 3,
    ['Kolik jablek sní jeden drak za tři minuty?'],
    'Každý drak sní jedno jablko za tři minuty. Šest draků sní šest jablek naráz, tedy také za tři minuty.', { unit: 'min' }),
  num('snek', 'Šnek leze na zídku vysokou 5 metrů. Každý den vyleze o 3 metry, každou noc sklouzne o 2 metry. Kolikátý den bude nahoře?', 3,
    ['Kde bude šnek ráno po první noci?', 'Pozor: když se dostane nahoru, už nesklouzne.'],
    'Po první noci je ve výšce 1 m, po druhé ve 2 m. Třetí den vyleze o 3 m až na 5 m a je nahoře.'),
  ch('mince-3', 'Mám dvě mince a dohromady 3 Kč. Jedna z nich není dvoukoruna. Jaké mince mám?', 'Korunu a dvoukorunu',
    ['Dvě koruny', 'Korunu a pětikorunu', 'Takové mince nejsou'],
    ['Která dvojice mincí dá dohromady 3 Kč?', 'Věta říká „jedna není“. Neříká „žádná není“.'],
    'Jedna mince dvoukoruna není – je to koruna. Ta druhá je dvoukoruna, jinak by to nedalo 3 Kč.'),
];

// --- Když…, tak… ------------------------------------------------------------

interface IfCtx {
  key: string;
  rule: string;
  pYes: string;
  pNo: string;
  qYes: string;
  qNo: string;
  askP: string;
  askQ: string;
  mp: string;
  mt: string;
  ac: string;
  da: string;
}

const IFS: IfCtx[] = [
  {
    key: 'destnik',
    rule: 'Když prší, Leif si vždycky vezme ven deštník.',
    pYes: 'Venku právě prší.', pNo: 'Venku právě neprší.',
    qYes: 'Leif jde ven s deštníkem.', qNo: 'Leif jde ven bez deštníku.',
    askP: 'Prší venku?', askQ: 'Vezme si Leif deštník?',
    mp: 'Když prší, Leif si deštník vezme vždycky – a venku právě prší.',
    mt: 'Kdyby pršelo, Leif by si deštník vzal. Jde bez něj, takže neprší.',
    ac: 'Deštník si Leif mohl vzít i z jiného důvodu, třeba proto, že je zataženo. Pravidlo neříká, že si ho bere jen, když prší.',
    da: 'Pravidlo říká jen, co Leif dělá, když prší. Když neprší, deštník si vzít může, ale nemusí.',
  },
  {
    key: 'plavani',
    rule: 'Když je sobota, Knut jde vždycky plavat.',
    pYes: 'Dnes je sobota.', pNo: 'Dnes není sobota.',
    qYes: 'Knut dnes šel plavat.', qNo: 'Knut dnes plavat nepůjde.',
    askP: 'Je dnes sobota?', askQ: 'Půjde dnes Knut plavat?',
    mp: 'V sobotu jde Knut plavat vždycky – a dnes je sobota.',
    mt: 'Kdyby byla sobota, Knut by šel plavat. Nepůjde, takže sobota není.',
    ac: 'Plavat může Knut chodit i v jiné dny. Pravidlo mluví jen o sobotách.',
    da: 'Pravidlo říká jen, co Knut dělá v sobotu. V jiné dny plavat jít může, ale nemusí.',
  },
  {
    key: 'palacinky',
    rule: 'Když Runa přinese ze školy jedničku, mají doma k večeři vždycky palačinky.',
    pYes: 'Runa dnes přinesla jedničku.', pNo: 'Runa dnes jedničku nepřinesla.',
    qYes: 'Dnes mají k večeři palačinky.', qNo: 'Dnes k večeři palačinky nemají.',
    askP: 'Přinesla Runa dnes jedničku?', askQ: 'Budou mít dnes k večeři palačinky?',
    mp: 'Za jedničku jsou palačinky vždycky – a Runa dnes jedničku přinesla.',
    mt: 'Kdyby Runa přinesla jedničku, byly by palačinky. Nejsou, takže jedničku nepřinesla.',
    ac: 'Palačinky můžou mít i z jiného důvodu, třeba proto, že na ně měli chuť.',
    da: 'Pravidlo neříká, co se stane bez jedničky. Palačinky být můžou, ale nemusí.',
  },
  {
    key: 'ryba',
    rule: 'Když drak Blesk dostane rybu, vždycky radostně zamává křídly.',
    pYes: 'Blesk dnes dostal rybu.', pNo: 'Blesk dnes rybu nedostal.',
    qYes: 'Blesk dnes radostně zamával křídly.', qNo: 'Blesk dnes křídly nezamával.',
    askP: 'Dostal dnes Blesk rybu?', askQ: 'Zamával dnes Blesk radostně křídly?',
    mp: 'Za rybu Blesk zamává vždycky – a dnes ji dostal.',
    mt: 'Kdyby Blesk dostal rybu, zamával by křídly. Nezamával, takže rybu nedostal.',
    ac: 'Blesk mohl mávat radostí i z jiného důvodu, třeba když uviděl svou jezdkyni.',
    da: 'Pravidlo říká jen, co Blesk udělá, když dostane rybu. Jinak mávat může, ale nemusí.',
  },
  {
    key: 'rohliky',
    rule: 'Když Ivar jede do města, vždycky koupí rohlíky.',
    pYes: 'Ivar dnes jel do města.', pNo: 'Ivar dnes do města nejel.',
    qYes: 'Ivar dnes koupil rohlíky.', qNo: 'Ivar dnes rohlíky nekoupil.',
    askP: 'Jel dnes Ivar do města?', askQ: 'Koupil dnes Ivar rohlíky?',
    mp: 'Ve městě Ivar kupuje rohlíky vždycky – a dnes tam jel.',
    mt: 'Kdyby Ivar jel do města, koupil by rohlíky. Nekoupil, takže do města nejel.',
    ac: 'Rohlíky mohl Ivar koupit i jinde, třeba v obchodě ve vesnici.',
    da: 'Pravidlo říká jen, co Ivar dělá ve městě. Rohlíky mohl koupit i jinde, ale nemusel.',
  },
  {
    key: 'tanec',
    rule: 'Když Alva zpívá, její dračice Duha vždycky tancuje.',
    pYes: 'Alva zrovna zpívá.', pNo: 'Alva zrovna nezpívá.',
    qYes: 'Duha zrovna tancuje.', qNo: 'Duha zrovna netancuje.',
    askP: 'Zpívá zrovna Alva?', askQ: 'Tancuje zrovna Duha?',
    mp: 'Když Alva zpívá, Duha tancuje vždycky – a Alva zrovna zpívá.',
    mt: 'Kdyby Alva zpívala, Duha by tancovala. Netancuje, takže Alva nezpívá.',
    ac: 'Duha může tancovat i jindy, třeba když hraje hudba z rádia.',
    da: 'Pravidlo říká jen, co Duha dělá, když Alva zpívá. Jindy tancovat může, ale nemusí.',
  },
  {
    key: 'zvonek',
    rule: 'Když zazvoní zvonek, děti vždycky jdou do třídy.',
    pYes: 'Zvonek právě zazvonil.', pNo: 'Zvonek nezazvonil.',
    qYes: 'Děti právě jdou do třídy.', qNo: 'Děti do třídy nejdou.',
    askP: 'Zazvonil právě zvonek?', askQ: 'Jdou děti do třídy?',
    mp: 'Po zvonění jdou děti do třídy vždycky – a zvonek právě zazvonil.',
    mt: 'Kdyby zvonek zazvonil, děti by šly do třídy. Nejdou, takže nezazvonil.',
    ac: 'Děti můžou jít do třídy i bez zvonění, třeba když je zavolá paní učitelka.',
    da: 'Pravidlo říká jen, co děti dělají po zvonění. Do třídy můžou jít i bez něj, ale nemusí.',
  },
  {
    key: 'fletna',
    rule: 'Když Maja hraje na flétnu, její pes vždycky začne výt.',
    pYes: 'Maja právě hraje na flétnu.', pNo: 'Maja zrovna na flétnu nehraje.',
    qYes: 'Majin pes právě vyje.', qNo: 'Majin pes nevyje.',
    askP: 'Hraje Maja na flétnu?', askQ: 'Vyje Majin pes?',
    mp: 'Při flétně pes vyje vždycky – a Maja právě hraje.',
    mt: 'Kdyby Maja hrála na flétnu, pes by vyl. Nevyje, takže nehraje.',
    ac: 'Pes může výt i z jiného důvodu, třeba když slyší sirénu.',
    da: 'Pravidlo říká jen, co pes dělá, když Maja hraje. Jindy výt může, ale nemusí.',
  },
  {
    key: 'hriste',
    rule: 'Když Erik uklidí pokoj, jde vždycky s tátou na hřiště.',
    pYes: 'Erik dnes uklidil pokoj.', pNo: 'Erik dnes pokoj neuklidil.',
    qYes: 'Erik dnes šel s tátou na hřiště.', qNo: 'Erik dnes s tátou na hřiště nepůjde.',
    askP: 'Uklidil dnes Erik pokoj?', askQ: 'Půjde dnes Erik s tátou na hřiště?',
    mp: 'Za uklizený pokoj jde Erik na hřiště vždycky – a dnes uklidil.',
    mt: 'Kdyby Erik uklidil, šel by s tátou na hřiště. Nepůjde, takže neuklidil.',
    ac: 'Na hřiště můžou jít i z jiného důvodu, třeba když je hezky.',
    da: 'Pravidlo neříká, co se stane, když Erik neuklidí. Na hřiště jít můžou, ale nemusí.',
  },
  {
    key: 'sanky',
    rule: 'Když napadne sníh, Dag vždycky vytáhne sáňky.',
    pYes: 'Dnes napadl sníh.', pNo: 'Dnes sníh nenapadl.',
    qYes: 'Dag dnes vytáhl sáňky.', qNo: 'Dag dnes sáňky nevytáhne.',
    askP: 'Napadl dnes sníh?', askQ: 'Vytáhne dnes Dag sáňky?',
    mp: 'Když napadne sníh, Dag sáňky vytáhne vždycky – a dnes napadl.',
    mt: 'Kdyby napadl sníh, Dag by vytáhl sáňky. Nevytáhne je, takže sníh nenapadl.',
    ac: 'Sáňky mohl Dag vytáhnout i z jiného důvodu, třeba aby je opravil.',
    da: 'Pravidlo říká jen, co Dag dělá, když napadne sníh. Jindy sáňky vytáhnout může, ale nemusí.',
  },
];

type Form = 'mp' | 'mt' | 'ac' | 'da';

const IF_HINTS = [
  'Přečti si pravidlo pomalu. O čem přesně mluví?',
  'Pravidlo platí jen jedním směrem: když platí první část, platí i druhá. Obráceně to platit nemusí.',
];

function ifSpec(c: IfCtx, f: Form): FixedSpec {
  const [fact, ask, correct] =
    f === 'mp' ? [c.pYes, c.askQ, 0 as const]
    : f === 'mt' ? [c.qNo, c.askP, 1 as const]
    : f === 'ac' ? [c.qYes, c.askP, 2 as const]
    : [c.pNo, c.askQ, 2 as const];
  return yn(`kdyz-${f}-${c.key}`, `${c.rule} ${fact} ${ask}`, correct, IF_HINTS, c[f], {
    difficulty: f === 'mp' ? -0.3 : f === 'mt' ? 0.1 : 0.3,
  });
}

// Úsudky se „všichni“ a „žádný“ o vymyšlených bytostech: jde jen o logiku,
// ne o to, co víme o světě.
interface Syl {
  key: string;
  all: string;
  isA: string;
  notA: string;
  hasP: string;
  notP: string;
  askA: string;
  askP: string;
  mp: string;
  mt: string;
  ac: string;
  da: string;
}

const SYLS: Syl[] = [
  {
    key: 'bublici',
    all: 'Všichni bublíci mají modré uši.',
    isA: 'Pufík je bublík.', notA: 'Pufík není bublík.',
    hasP: 'Pufík má modré uši.', notP: 'Pufík má zelené uši.',
    askA: 'Je Pufík bublík?', askP: 'Má Pufík modré uši?',
    mp: 'Pufík je bublík a všichni bublíci mají modré uši – on tedy také.',
    mt: 'Kdyby byl Pufík bublík, měl by modré uši. Má zelené, takže bublík není.',
    ac: 'Modré uši může mít i někdo, kdo bublík není. Věta mluví jen o bublících.',
    da: 'Věta neříká nic o těch, kdo bublíci nejsou. Pufík modré uši mít může, ale nemusí.',
  },
  {
    key: 'hopsalci',
    all: 'Všichni hopsálci skáčou po jedné noze.',
    isA: 'Tip je hopsálek.', notA: 'Tip není hopsálek.',
    hasP: 'Tip skáče po jedné noze.', notP: 'Tip neumí skákat po jedné noze.',
    askA: 'Je Tip hopsálek?', askP: 'Skáče Tip po jedné noze?',
    mp: 'Tip je hopsálek a všichni hopsálci skáčou po jedné noze – on tedy také.',
    mt: 'Kdyby byl Tip hopsálek, skákal by po jedné noze. Neumí to, takže hopsálek není.',
    ac: 'Po jedné noze může skákat i někdo, kdo hopsálek není. Věta mluví jen o hopsálcích.',
    da: 'Věta neříká nic o těch, kdo hopsálci nejsou. Tip po jedné noze skákat může, ale nemusí.',
  },
  {
    key: 'teckouni',
    all: 'Všichni tečkouni mají puntíkatý ocas.',
    isA: 'Bim je tečkoun.', notA: 'Bim není tečkoun.',
    hasP: 'Bim má puntíkatý ocas.', notP: 'Bim má pruhovaný ocas.',
    askA: 'Je Bim tečkoun?', askP: 'Má Bim puntíkatý ocas?',
    mp: 'Bim je tečkoun a všichni tečkouni mají puntíkatý ocas – on tedy také.',
    mt: 'Kdyby byl Bim tečkoun, měl by puntíkatý ocas. Má pruhovaný, takže tečkoun není.',
    ac: 'Puntíkatý ocas může mít i někdo, kdo tečkoun není. Věta mluví jen o tečkounech.',
    da: 'Věta neříká nic o těch, kdo tečkouni nejsou. Bim puntíkatý ocas mít může, ale nemusí.',
  },
];

const SYL_HINTS = ['O kom přesně ta první věta mluví?', 'Věta „všichni X jsou Y“ neříká, že každý, kdo je Y, je také X.'];

function sylSpec(s: Syl, f: Form): FixedSpec {
  const [fact, ask, correct] =
    f === 'mp' ? [s.isA, s.askP, 0 as const]
    : f === 'mt' ? [s.notP, s.askA, 1 as const]
    : f === 'ac' ? [s.hasP, s.askA, 2 as const]
    : [s.notA, s.askP, 2 as const];
  return yn(`vsichni-${f}-${s.key}`, `${s.all} ${fact} ${ask}`, correct, SYL_HINTS, s[f], { difficulty: f === 'mp' ? -0.2 : 0.2 });
}

const ZADNY_HINTS = ['O kom přesně ta první věta mluví?', 'Věta mluví jen o šeptálcích: žádný z nich zpívat neumí. O ostatních bytostech neříká nic.'];

const ZADNY: FixedSpec[] = [
  yn('zadny-mp-septalci', 'Žádný šeptálek neumí zpívat. Ťuk je šeptálek. Umí Ťuk zpívat?', 1, ZADNY_HINTS,
    'Žádný šeptálek zpívat neumí a Ťuk je šeptálek. Zpívat tedy neumí.'),
  yn('zadny-mt-septalci', 'Žádný šeptálek neumí zpívat. Ťuk umí zpívat. Je Ťuk šeptálek?', 1, ZADNY_HINTS,
    'Kdyby byl Ťuk šeptálek, zpívat by neuměl. Umí to, takže šeptálek není.'),
  yn('zadny-ac-septalci', 'Žádný šeptálek neumí zpívat. Ťuk neumí zpívat. Je Ťuk šeptálek?', 2, ZADNY_HINTS,
    'Zpívat neumí ani spousta jiných bytostí. Z toho, že Ťuk nezpívá, se nepozná, jestli je šeptálek.'),
  yn('zadny-da-septalci', 'Žádný šeptálek neumí zpívat. Ťuk není šeptálek. Umí Ťuk zpívat?', 2, ZADNY_HINTS,
    'Věta mluví jen o šeptálcích. Ťuk šeptálek není, a tak zpívat umět může, ale nemusí.'),
  // Měsíček, ne Kapka: u vodní dračice by dítě mohlo usoudit, že plavat umí.
  yn('nekteri-draci', 'Někteří draci umí plavat pod vodou. Měsíček je drak. Umí Měsíček plavat pod vodou?', 2,
    ['O kom přesně ta první věta mluví?', 'Znamená „někteří“ totéž co „všichni“?'],
    '„Někteří“ neznamená „všichni“. Měsíček může být mezi draky, kteří to umí, ale také nemusí.'),
];

// Řetěz dvou pravidel.
const CHAIN = 'Když fouká vítr, Runa jde pouštět draka. Když jde Runa pouštět draka, Leif jde s ní.';
const LANTERN = 'Když drak Blesk kýchne, vyletí mu z nosu jiskra. Když vyletí jiskra, rozsvítí se lucerna.';
const CHAIN_HINTS = ['Rozlož si to na dva kroky: co plyne z prvního pravidla a co z druhého?', 'Každé pravidlo platí jen jedním směrem.'];

const CHAINS: FixedSpec[] = [
  yn('retez-mp-vitr', `${CHAIN} Dnes fouká vítr. Půjde Leif pouštět draka?`, 0, CHAIN_HINTS,
    'Fouká vítr, takže Runa jde pouštět draka. A když jde Runa, jde s ní i Leif.'),
  yn('retez-mt-vitr', `${CHAIN} Leif dnes pouštět draka nešel. Foukal dnes vítr?`, 1, CHAIN_HINTS,
    'Kdyby foukal vítr, šla by Runa, a s ní i Leif. Leif nešel, takže Runa nešla, a tak vítr nefoukal.'),
  yn('retez-ac-vitr', `${CHAIN} Leif dnes šel pouštět draka. Foukal dnes vítr?`, 2, CHAIN_HINTS,
    'Leif mohl jít pouštět draka i z jiného důvodu, třeba s kamarády. Pravidla neříkají, že chodí jen s Runou.'),
  yn('retez-da-vitr', `${CHAIN} Dnes nefouká vítr. Půjde Runa pouštět draka?`, 2, CHAIN_HINTS,
    'Pravidlo říká jen, co Runa dělá, když fouká. Když nefouká, jít může, ale nemusí.'),
  yn('retez-mp-lucerna', `${LANTERN} Blesk právě kýchl. Rozsvítí se lucerna?`, 0, CHAIN_HINTS,
    'Blesk kýchl, takže mu vyletěla jiskra. A když vyletí jiskra, lucerna se rozsvítí.'),
  yn('retez-mt-lucerna', `${LANTERN} Lucerna se nerozsvítila. Kýchl Blesk?`, 1, CHAIN_HINTS,
    'Kdyby Blesk kýchl, vyletěla by jiskra a lucerna by svítila. Nesvítí, takže nekýchl.'),
  yn('retez-ac-lucerna', `${LANTERN} Lucerna se rozsvítila. Kýchl Blesk?`, 2, CHAIN_HINTS,
    'Lucernu mohl rozsvítit i někdo jiný, třeba sirkou. Pravidla neříkají, že se rozsvítí jen po kýchnutí.'),
];

// --- Poctivci a lháři ------------------------------------------------------

// Že na ostrově žijí JEN poctivci a lháři, musí stát v zadání: jinak by
// „Knut není lhář“ neznamenalo „Knut vždycky mluví pravdu“.
const KK_RULE = 'Poctivci vždycky mluví pravdu, lháři vždycky lžou.';
const KK = `Na ostrově žijí jen poctivci a lháři. ${KK_RULE}`;
const KK_HINTS = ['Zkus postupně obě možnosti: co kdyby mluvil pravdu? A co kdyby lhal?'];
const KK2 = (a: string, b: string) => `${a} a ${b} žijí na ostrově, kde jsou jen poctivci a lháři. ${KK_RULE}`;

const KNIGHTS_L5: Spec[] = [
  ch('kk-ivar-drak', `${KK} Ivar je lhář a má jednoho draka. Říká: „Můj drak je zelený.“ Co víme jistě?`, 'Drak není zelený',
    ['Drak je zelený', 'Drak je modrý', 'Ivar nemá draka'], ['Lhář vždycky lže. Může být jeho věta pravdivá?'],
    'Ivar lže, takže jeho věta neplatí: drak zelený není. Jakou barvu opravdu má, ale nevíme.'),
  ch('kk-sigrid-leif', `${KK2('Sigrid', 'Leif')} Sigrid patří k poctivcům a říká: „Leif je lhář.“ Co víme o Leifovi?`, 'Vždycky lže',
    ['Vždycky mluví pravdu', 'Nedá se to poznat', 'Někdy lže, někdy ne'], ['Může Sigrid lhát?'],
    'Sigrid mluví vždycky pravdu, takže Leif opravdu je lhář.'),
  ch('kk-dag-knut', `${KK2('Dag', 'Knut')} Dag patří k lhářům a říká: „Knut je lhář.“ Co víme o Knutovi?`, 'Vždycky mluví pravdu',
    ['Vždycky lže', 'Nedá se to poznat', 'Někdy lže, někdy ne'], ['Dag lže. Co tedy platí doopravdy?'],
    'Dag lže, takže Knut lhář není. Na ostrově jsou jen poctivci a lháři, a tak je Knut poctivec.'),
  ch('kk-tom-anna', `${KK2('Tom', 'Anna')} Tom patří k lhářům a říká: „Anna je lhářka.“ Co víme o Anně?`, 'Vždycky mluví pravdu',
    ['Vždycky lže', 'Nedá se to poznat', 'Někdy lže, někdy ne'], ['Tom lže. Co tedy platí doopravdy?'],
    'Tom lže, takže Anna lhářka není. Na ostrově jsou jen poctivci a lháři, a tak je Anna poctivá a mluví pravdu.'),
  ch('kk-jsem-lhar', `${KK} Může někdo z nich říct: „Jsem lhář“?`, 'Ne, nikdo',
    ['Ano, poctivec', 'Ano, lhář', 'Ano, kdokoli'], ['Zkus to za poctivce: mluvil by pravdu?', 'A co lhář: lhal by?'],
    'Poctivec by tou větou lhal a lhář by mluvil pravdu. Ani jeden z nich to tedy říct nemůže.'),
  ch('kk-jsem-poctivec', `${KK} Kdo z nich může říct: „Jsem poctivec“?`, 'Poctivec i lhář',
    ['Jen poctivec', 'Jen lhář', 'Nikdo'], ['Zkus to za poctivce a pak za lháře.'],
    'Poctivec tou větou mluví pravdu a lhář lže. Říct to tedy můžou oba.'),
  yn('kk-anna-utery', `${KK} Anna patří k lhářům a říká: „Dnes je úterý.“ Je dnes úterý?`, 1, ['Anna vždycky lže.'],
    'Anna vždycky lže, takže úterý není.'),
  yn('kk-petr-prselo', `${KK} Petr patří k poctivcům a říká: „Včera pršelo.“ Pršelo včera?`, 0, ['Petr vždycky mluví pravdu.'],
    'Petr vždycky mluví pravdu, takže včera opravdu pršelo.'),
];

const KNIGHTS_L6: Spec[] = [
  ch('kk-freja-leif', `${KK2('Freja', 'Leif')} Freja říká: „Leif je lhář.“ Leif říká: „Oba jsme poctivci.“ Kdo z nich je lhář?`, 'Jen Leif',
    ['Jen Freja', 'Oba', 'Ani jeden'], ['Zkus, co by se stalo, kdyby Leif mluvil pravdu.'],
    'Kdyby Leif mluvil pravdu, byla by poctivá i Freja. Jenže ta o něm říká, že je lhář – spor. Leif tedy lže a Freja mluví pravdu.'),
  ch('kk-tom-anna-aspon', `${KK2('Tom', 'Anna')} Tom říká: „Aspoň jeden z nás je lhář.“ Kdo z nich je lhář?`, 'Jen Anna',
    ['Jen Tom', 'Oba', 'Ani jeden'], KK_HINTS,
    'Kdyby Tom lhal, nebyl by lhářem ani jeden z nich – jenže on sám by lhářem byl. Tom tedy mluví pravdu a lhářka je Anna.'),
  ch('kk-erik-runa-oba', `${KK2('Erik', 'Runa')} Erik říká: „Oba jsme lháři.“ Kdo z nich mluví pravdu?`, 'Jen Runa',
    ['Jen Erik', 'Oba', 'Ani jeden'], KK_HINTS,
    'Kdyby Erik mluvil pravdu, byl by sám lhář – to nejde. Erik tedy lže, a tak nejsou lháři oba: Runa mluví pravdu.'),
  ch('kk-knut-alva-o-alve', `${KK2('Knut', 'Alva')} Knut říká: „Oba patříme ke stejné skupině.“ Co víme jistě o Alvě?`, 'Mluví pravdu',
    ['Lže', 'Nedá se to poznat', 'Mluví pravdu jen někdy'], KK_HINTS,
    'Když Knut mluví pravdu, je Alva poctivá jako on. Když lže, patří každý jinam – a Alva je zase poctivá. Alva tedy mluví pravdu.'),
  ch('kk-knut-alva-o-knutovi', `${KK2('Knut', 'Alva')} Knut říká: „Oba patříme ke stejné skupině.“ Co víme jistě o Knutovi?`, 'Nedá se to poznat',
    ['Mluví pravdu', 'Lže', 'Mluví pravdu jen někdy'], KK_HINTS,
    'Knut to může říct jako poctivec (a poctivá je i Alva) i jako lhář (Alva je poctivá, on ne). Kým je, se poznat nedá.'),
  ch('kk-leif-runa-kolik', `${KK2('Leif', 'Runa')} Leif říká: „Runa je lhářka.“ Runa říká: „Leif je lhář.“ Kolik z nich je lhářů?`, 'Právě jeden',
    ['Oba', 'Ani jeden', 'Nedá se to poznat'], KK_HINTS,
    'Kdyby mluvili pravdu oba, byli by oba lháři – to nejde. Kdyby lhali oba, byli by oba poctiví – také nejde. Lže tedy právě jeden, jen nevíme který.'),
  ch('kk-troje', `Anna, Leif a Erik žijí na ostrově, kde jsou jen poctivci a lháři. ${KK_RULE} Anna říká: „Leif je lhář.“ Leif říká: „Erik je lhář.“ Erik říká: „Anna i Leif jsou lháři.“ Kdo mluví pravdu?`, 'Jen Leif',
    ['Jen Anna', 'Jen Erik', 'Anna a Erik'], ['Zkus, co by se stalo, kdyby Erik mluvil pravdu.'],
    'Kdyby Erik mluvil pravdu, lhali by Anna i Leif. Jenže když Anna lže, Leif lhář není – spor. Erik tedy lže a Leif, který to o něm říká, mluví pravdu. Anna o Leifovi lže.'),
];

// --- Kombinace ---------------------------------------------------------------

const COMB_L5: Spec[] = [
  num('komb-tricka', 'Runa má 3 trička a 2 sukně. Vezme si jedno tričko a jednu sukni. Kolika různými způsoby se může obléct?', 6,
    ['Ke každému tričku zkus každou sukni.', 'Kolik možností je s prvním tričkem?'], 'Ke každému ze 3 triček se hodí 2 sukně: 3 × 2 = 6.'),
  num('komb-zmrzlina', 'Ve stánku mají 4 druhy zmrzliny a 2 druhy kornoutů. Kolik různých kornoutů s jedním kopečkem si můžeš koupit?', 8,
    ['Kolik možností je s první zmrzlinou?'], 'Každou ze 4 zmrzlin můžeš dát do 2 kornoutů: 4 × 2 = 8.'),
  num('komb-sedla', 'Drak si vybírá sedlo a deku. Sedla jsou 3 a deky také 3. Kolik různých dvojic sedlo a deka může mít?', 9,
    ['Ke každému sedlu zkus každou deku.'], 'Ke každému ze 3 sedel se hodí 3 deky: 3 × 3 = 9.'),
  num('komb-cepice', 'Leif má 2 čepice, 2 šály a 2 páry rukavic. Vezme si jednu čepici, jednu šálu a jeden pár rukavic. Kolika různými způsoby se může obléct?', 8,
    ['Kolik je dvojic čepice a šála?', 'A kolik párů rukavic se hodí ke každé dvojici?'], 'Čepice a šály dají 2 × 2 = 4 dvojice a ke každé jsou 2 páry rukavic: 4 × 2 = 8.'),
  num('komb-cesty', 'Z vesnice do přístavu vedou 3 cesty. Z přístavu k majáku vedou 2 cesty. Kolika různými cestami dojdeš z vesnice k majáku přes přístav?', 6,
    ['Nakresli si vesnici, přístav a maják a cesty mezi nimi.'], 'Na každou ze 3 cest do přístavu můžeš navázat 2 cesty k majáku: 3 × 2 = 6.'),
  num('komb-svacina', 'Freja si ke svačině vybere jeden chleba ze 2 druhů a jedno ovoce ze 3 druhů. Kolik různých svačin může mít?', 6,
    ['Ke každému chlebu zkus každé ovoce.'], 'Ke každému ze 2 chlebů se hodí 3 druhy ovoce: 2 × 3 = 6.'),
  num('komb-cisla-bez', 'Kolik různých dvojmístných čísel složíš z číslic 1, 2 a 3, když se číslice nesmí opakovat?', 6,
    ['Vypiš si čísla, která začínají jedničkou. A pak dvojkou…'], 'Jsou to 12, 13, 21, 23, 31 a 32 – celkem 6. Na první místo máš 3 možnosti a na druhé 2: 3 × 2 = 6.'),
  num('komb-cisla-s', 'Kolik různých dvojmístných čísel složíš z číslic 1, 2 a 3, když se číslice smí opakovat?', 9,
    ['Nezapomeň na čísla jako 11.'], 'Na každé místo máš 3 možnosti: 3 × 3 = 9 (11, 12, 13, 21, 22, 23, 31, 32, 33).'),
  num('komb-karticky', 'Na stole leží 3 různé kartičky. Kolika způsoby je můžeš položit do řady?', 6,
    ['Kolik kartiček může být první? A kolik pak druhá?'], 'Na první místo 3 možnosti, na druhé 2 a na třetí 1: 3 × 2 × 1 = 6.'),
];

const COMB_L6: Spec[] = [
  num('komb-ruce4', 'Čtyři kamarádi si podají ruce – každý s každým jednou. Kolikrát si podají ruce?', 6,
    ['Kolikrát podá ruku první kamarád? A kolik podání zbývá druhému?'], 'První podá ruku 3 kamarádům, druhý ještě 2, třetí 1: 3 + 2 + 1 = 6.'),
  num('komb-draci5', 'Pět draků se zdraví – každý s každým jednou. Kolik pozdravů to bude?', 10,
    ['Kolikrát pozdraví první drak?'], 'První drak pozdraví 4 draky, druhý ještě 3, pak 2 a 1: 4 + 3 + 2 + 1 = 10.'),
  num('komb-rada4', 'Kolika způsoby se mohou 4 děti postavit do řady?', 24,
    ['Kolik dětí může stát první? A kolik pak druhé?'], 'Na první místo 4 možnosti, pak 3, 2 a 1: 4 × 3 × 2 × 1 = 24.'),
  num('komb-vylet', 'Tove může vzít na výlet 2 z 5 kamarádek. Kolik má možností, koho vzít?', 10,
    ['Vypiš si dvojice: s první kamarádkou, pak s druhou…', 'Dvojice „Anna a Alva“ je stejná jako „Alva a Anna“.'],
    'S první kamarádkou jsou 4 dvojice, s druhou ještě 3 nové, pak 2 a 1: 4 + 3 + 2 + 1 = 10.'),
  num('komb-vlajka', 'Vlajka má 3 vodorovné pruhy. Máš 3 barvy a každou použiješ na jeden pruh. Kolik různých vlajek vybarvíš?', 6,
    ['Kolik barev můžeš dát na horní pruh? A kolik pak na prostřední?'], 'Na horní pruh 3 barvy, na prostřední 2 a na spodní zbude 1: 3 × 2 × 1 = 6.'),
  num('komb-trojmistna', 'Kolik trojmístných čísel složíš z číslic 1, 2 a 3, když se žádná číslice neopakuje?', 6,
    ['Vypiš si čísla, která začínají jedničkou.'], 'Jsou to 123, 132, 213, 231, 312 a 321 – celkem 6.'),
  num('komb-nula', 'Kolik trojmístných čísel složíš z číslic 0, 1 a 2, když se žádná číslice neopakuje?', 4,
    ['Může trojmístné číslo začínat nulou?'], 'Nula nemůže být na začátku. Zbývají 102, 120, 201 a 210 – celkem 4.'),
  num('komb-turnaj', 'Na turnaji hraje každý tým s každým jeden zápas. Týmy jsou 4. Kolik zápasů se odehraje?', 6,
    ['Kolik zápasů odehraje první tým?'], 'První tým hraje 3 zápasy, druhý ještě 2 nové, třetí 1: 3 + 2 + 1 = 6.'),
];

// --- Holubníkový princip ---------------------------------------------------

const BAD_LUCK = 'Představ si největší smůlu: co vytáhneš, když se ti to bude co nejdéle nedařit?';

const PIGEON_L6: Spec[] = [
  num('holub-stejne-2barvy', 'V šuplíku je 6 červených a 6 modrých ponožek. Je tma. Kolik ponožek musíš vytáhnout, abys měla jistě dvě ponožky stejné barvy?', 3,
    [BAD_LUCK], 'Po dvou ponožkách můžeš mít červenou a modrou. Třetí už barvu zopakuje, takže stačí 3.'),
  num('holub-stejne-3barvy', 'V šuplíku je 5 červených, 5 modrých a 5 zelených ponožek. Je tma. Kolik jich musíš vytáhnout, abys měla jistě dvě ponožky stejné barvy?', 4,
    [BAD_LUCK], 'Při smůle vytáhneš nejdřív tři různé barvy. Čtvrtá ponožka už barvu zopakuje.'),
  num('holub-cervene2', 'V šuplíku je 5 červených a 3 modré ponožky. Je tma. Kolik jich musíš vytáhnout, abys měla jistě dvě červené?', 5,
    [BAD_LUCK], 'Při smůle vytáhneš nejdřív všechny 3 modré. Pak potřebuješ ještě 2 červené: 3 + 2 = 5.'),
  num('holub-modra1', 'V šuplíku je 5 červených a 3 modré ponožky. Je tma. Kolik jich musíš vytáhnout, abys měla jistě aspoň jednu modrou?', 6,
    [BAD_LUCK], 'Při smůle vytáhneš nejdřív všech 5 červených. Šestá ponožka už je určitě modrá.'),
  num('holub-kulicky3', 'V pytlíku jsou 4 žluté a 4 zelené kuličky. Taháš poslepu. Kolik jich musíš vytáhnout, abys měla jistě 3 kuličky stejné barvy?', 5,
    [BAD_LUCK], 'Při smůle máš po 4 kuličkách 2 žluté a 2 zelené. Pátá už udělá trojici.'),
  num('holub-rukavice', 'V krabici jsou 4 levé a 4 pravé rukavice, všechny stejné barvy. Je tma. Kolik jich musíš vytáhnout, abys měla jistě levou i pravou?', 5,
    [BAD_LUCK], 'Při smůle vytáhneš nejdřív všechny 4 levé (nebo 4 pravé). Pátá je určitě na druhou ruku.'),
  num('holub-bonbony', 'V misce je 6 jahodových a 4 citronové bonbony. Bereš poslepu. Kolik jich musíš vzít, abys měla jistě aspoň jeden od každé příchutě?', 7,
    [BAD_LUCK], 'Při smůle vezmeš nejdřív všech 6 jahodových. Sedmý je určitě citronový.'),
  num('holub-narozeniny', 'Kolik nejméně dětí musí být ve skupině, aby dvě z nich měly jistě narozeniny ve stejném měsíci?', 13,
    ['Kolik je v roce měsíců?'], 'Měsíců je 12. Dvanáct dětí může mít narozeniny každé v jiném měsíci, ale třinácté už měsíc s někým sdílí.'),
  num('holub-pary', 'V šuplíku je 10 bílých a 10 černých ponožek. Je tma. Kolik jich musíš vytáhnout, abys měla jistě dva páry? Pár jsou dvě ponožky stejné barvy.', 5,
    [BAD_LUCK, 'Kolik párů je ve 3 bílých a 1 černé ponožce?'], 'Ze 4 ponožek můžeš mít 3 bílé a 1 černou – to je jen jeden pár. Z 5 ponožek máš vždycky dva páry.'),
];

// ---------------------------------------------------------------------------
// Sestavení úrovní

const BANK: Partial<Record<Level, Spec[]>> = {
  2: [...DAYS_L2, ...MISC_L2],
  3: [...DAYS_L3, ...QUEUE_L3, ...MISC_L3],
  4: [...IFS.flatMap((c) => [ifSpec(c, 'mp'), ifSpec(c, 'mt')]), ...DAYS_L4, ...QUEUE_L4, ...MISC_L4],
  5: [
    ...IFS.flatMap((c) => [ifSpec(c, 'ac'), ifSpec(c, 'da')]),
    ...IFS.slice(0, 4).flatMap((c) => [ifSpec(c, 'mp'), ifSpec(c, 'mt')]),
    ...KNIGHTS_L5,
    ...COMB_L5,
    ...DAYS_L5,
    ...MISC_L5,
  ],
  6: [
    ...SYLS.flatMap((s) => (['mp', 'mt', 'ac', 'da'] as const).map((f) => sylSpec(s, f))),
    ...ZADNY,
    ...CHAINS,
    ...KNIGHTS_L6,
    ...COMB_L6,
    ...PIGEON_L6,
    ...MISC_L6,
  ],
};

type Attempt = (level: Level, rng: Rng) => Spec | null;

const GENERATORS: Record<Level, Attempt[]> = {
  1: [orderingAttempt, orderingAttempt, dragonsAttempt, benchAttempt],
  2: [orderingAttempt, dragonsAttempt, benchAttempt],
  3: [orderingAttempt, dragonsAttempt, benchAttempt],
  4: [orderingAttempt, dragonsAttempt, benchAttempt, tableAttempt],
  5: [orderingAttempt, dragonsAttempt, benchAttempt, tableAttempt],
  6: [orderingAttempt, orderingAttempt, benchAttempt],
};

/** Nejdřív se vybere druh hádanky, pak se zkouší, dokud se nepovede –
 *  druhy, které se povedou snáz, tak nepřevládnou. */
function generator(level: Level) {
  return (rng: Rng): Spec => {
    const kinds = GENERATORS[level];
    const first = rng.int(0, kinds.length - 1);
    for (let k = 0; k < kinds.length; k++) {
      const attempt = kinds[(first + k) % kinds.length];
      for (let i = 0; i < 400; i++) {
        const spec = attempt(level, rng);
        if (spec) return spec;
      }
    }
    throw new Error(`zahady.logika: úloha úrovně ${level} se nepovedla`);
  };
}

export const LOGIKA_BANKS = BANK;
export const LOGIKA_GEN: Partial<Record<Level, (rng: Rng) => Spec>> = {
  1: generator(1),
  2: generator(2),
  3: generator(3),
  4: generator(4),
  5: generator(5),
  6: generator(6),
};
