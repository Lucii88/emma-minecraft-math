// Obrázkové řady: opakující se vzory (AB, ABB, ABC…), rostoucí počty,
// otáčející se šipky, zrcadlové řady, dvě řady zamíchané do sebe a řady, kde
// se zvlášť mění barva a zvlášť tvar. Každý opakující se vzor je v řadě
// vidět aspoň dvakrát celý, aby pravidlo bylo jednoznačné.

import type { ChoiceSpec, Spec } from '../../core/bank';
import type { Rng } from '../../core/rng';
import type { ChoiceOption, Level } from '../../core/types';
import { ORDINAL_LOC, countWords, hardAdj, rep, type Noun } from './hlavolamy-spolecne';

interface Sym {
  e: string;
  noun: Noun;
}

const S = (e: string, g: Noun['g'], one: string, few: string): Sym => ({ e, noun: { g, one, few } });

/** Sady obrázků. Všechny obrázky jsou jednotlivé kusy, dají se i počítat. */
const SETS: Record<string, Sym[]> = {
  ovoce: [S('🍎', 'n', 'jablko', 'jablka'), S('🍐', 'f', 'hruška', 'hrušky'), S('🍋', 'm', 'citron', 'citrony'), S('🍓', 'f', 'jahoda', 'jahody'), S('🍊', 'm', 'pomeranč', 'pomeranče')],
  zvirata: [S('🐶', 'm', 'pes', 'psi'), S('🐱', 'f', 'kočka', 'kočky'), S('🐭', 'f', 'myš', 'myši'), S('🐰', 'm', 'králík', 'králíci'), S('🐸', 'f', 'žába', 'žáby')],
  pocasi: [S('☀️', 'n', 'slunce', 'slunce'), S('☁️', 'm', 'mrak', 'mraky'), S('❄️', 'f', 'vločka', 'vločky'), S('🌈', 'f', 'duha', 'duhy'), S('⚡', 'm', 'blesk', 'blesky')],
  draci: [S('🐉', 'm', 'drak', 'draci'), S('🔥', 'm', 'oheň', 'ohně'), S('💧', 'f', 'kapka', 'kapky'), S('⭐', 'f', 'hvězda', 'hvězdy'), S('🌙', 'm', 'měsíc', 'měsíce')],
  priroda: [S('🌸', 'm', 'kvítek', 'kvítky'), S('🍄', 'f', 'houba', 'houby'), S('🌲', 'm', 'strom', 'stromy'), S('🍁', 'm', 'list', 'listy'), S('🐞', 'f', 'beruška', 'berušky')],
  more: [S('🐟', 'f', 'ryba', 'ryby'), S('🐚', 'f', 'mušle', 'mušle'), S('⚓', 'f', 'kotva', 'kotvy'), S('⛵', 'f', 'plachetnice', 'plachetnice'), S('🦀', 'm', 'krab', 'krabi')],
};
const SET_KEYS = Object.keys(SETS);

/** Šipky po směru hodinových ručiček, začíná se nahoru. */
const ARROWS: { e: string; name: string }[] = [
  { e: '⬆️', name: 'šipka nahoru' },
  { e: '↗️', name: 'šipka šikmo nahoru doprava' },
  { e: '➡️', name: 'šipka doprava' },
  { e: '↘️', name: 'šipka šikmo dolů doprava' },
  { e: '⬇️', name: 'šipka dolů' },
  { e: '↙️', name: 'šipka šikmo dolů doleva' },
  { e: '⬅️', name: 'šipka doleva' },
  { e: '↖️', name: 'šipka šikmo nahoru doleva' },
];

const SHAPE_EMOJI: string[][] = [
  ['🔴', '🟡', '🔵', '🟢'],
  ['🟥', '🟨', '🟦', '🟩'],
  ['❤️', '💛', '💙', '💚'],
];
const SHAPE_NOUN: Noun[] = [
  { g: 'n', one: 'kolečko', few: 'kolečka' },
  { g: 'm', one: 'čtvereček', few: 'čtverečky' },
  { g: 'n', one: 'srdíčko', few: 'srdíčka' },
];
const COLOR_STEM = ['červen', 'žlut', 'modr', 'zelen'];
const COLOR_WORD = ['červená', 'žlutá', 'modrá', 'zelená'];

/** Položka řady: obrázek a kolikrát je v políčku. */
interface Tok {
  e: string;
  name: string;
  /** Kód pro klíč (a–z a počet). */
  code: string;
}

function symTok(set: string, i: number, n = 1): Tok {
  const s = SETS[set][i];
  return { e: rep(s.e, n), name: n === 1 ? s.noun.one : countWords(n, s.noun), code: `${String.fromCharCode(97 + i)}${n}` };
}

function symName(set: string, i: number): string {
  return SETS[set][i].noun.one;
}

function arrowTok(i: number): Tok {
  const a = ARROWS[((i % 8) + 8) % 8];
  return { e: a.e, name: a.name, code: `s${((i % 8) + 8) % 8}` };
}

function shapeTok(shape: number, color: number): Tok {
  return {
    e: SHAPE_EMOJI[shape][color],
    name: countWords(1, SHAPE_NOUN[shape], hardAdj(COLOR_STEM[color])).replace(/^jed(en|na|no) /, ''),
    code: `t${shape}${color}`,
  };
}

const opt = (t: Tok): ChoiceOption => ({ label: t.e, speak: t.name });

interface Draft {
  kind: string;
  set: string;
  seq: Tok[];
  ask: number;
  wrong: Tok[];
  hints: string[];
  explain: string;
  difficulty: number;
}

// ---------------------------------------------------------------------------
// Typy řad

/** Opakující se vzor. `pattern` = indexy obrázků v jedné periodě. */
function periodic(rng: Rng, patterns: number[][], opts: { middle?: boolean; minPeriods?: number } = {}): Draft | null {
  const set = rng.pick(SET_KEYS);
  const shape = rng.pick(patterns);
  const distinct = Math.max(...shape) + 1;
  const pick = rng.shuffle(SETS[set].map((_, i) => i)).slice(0, distinct);
  const pattern = shape.map((k) => pick[k]);
  const p = pattern.length;
  const periods = opts.minPeriods ?? 2;
  // Otazník na konci, nebo (od L3, u krátkých vzorů) v první periodě – pak
  // za ním musí následovat ještě dvě celé periody.
  const middle = !!opts.middle && p <= 3 && rng.chance(0.5);
  const total = middle ? 3 * p : p * periods + 1;
  const seqIdx = Array.from({ length: total }, (_, i) => pattern[i % p]);
  const ask = middle ? rng.int(0, p - 1) : total - 1;
  // Viditelné položky musí stále obsahovat dvě celé periody za sebou.
  const visible = seqIdx.map((v, i) => (i === ask ? -1 : v));
  if (!hasTwoFullPeriods(visible, p)) return null;
  if (minimalPeriod(visible) !== p) return null;
  const answer = seqIdx[ask];
  const others = SETS[set].map((_, i) => i).filter((i) => i !== answer);
  const inPattern = others.filter((i) => pattern.includes(i));
  const outside = rng.shuffle(others.filter((i) => !pattern.includes(i)));
  const wrong = [...inPattern, ...outside].slice(0, 3);
  const names = pattern.map((i) => symName(set, i));
  return {
    kind: 'vzor',
    set,
    seq: seqIdx.map((i) => symTok(set, i)),
    ask,
    wrong: wrong.map((i) => symTok(set, i)),
    hints: ['Která část řady se pořád opakuje?', `Opakuje se skupina ${p === 2 ? 'dvou' : p === 3 ? 'tří' : 'čtyř'} obrázků. Vyťukej si ji prstem.`],
    explain: `Pořád se opakuje: ${names.join(', ')}. Na otazník patří ${symName(set, answer)}.`,
    difficulty: (p - 3) * 0.2 + (ask !== total - 1 ? 0.2 : 0),
  };
}

/** Lze z viditelných položek (−1 = otazník) vyčíst dvě celé periody za sebou? */
function hasTwoFullPeriods(visible: number[], p: number): boolean {
  for (let s = 0; s + 2 * p <= visible.length; s++) {
    if (visible.slice(s, s + 2 * p).every((v) => v >= 0)) return true;
  }
  return false;
}

/** Nejmenší perioda, se kterou jsou viditelné položky v souladu. */
function minimalPeriod(visible: number[]): number {
  for (let q = 1; q < visible.length; q++) {
    let ok = true;
    for (let i = 0; i < visible.length && ok; i++) {
      for (let j = i + q; j < visible.length && ok; j += q) {
        if (visible[i] >= 0 && visible[j] >= 0 && visible[i] !== visible[j]) ok = false;
      }
    }
    if (ok) return q;
  }
  return visible.length;
}

/** Rostoucí počet: A, AA, AAA, ? (u L4 se střídají dva obrázky). */
function growing(rng: Rng, alternate: boolean): Draft {
  const set = rng.pick(SET_KEYS);
  const [a, b] = rng.shuffle(SETS[set].map((_, i) => i)).slice(0, 2);
  const obj = (k: number) => (alternate && k % 2 === 1 ? b : a);
  const seq = [1, 2, 3, 4].map((n, k) => symTok(set, obj(k), n));
  const ans = obj(3);
  const wrong = alternate ? [symTok(set, a, 4), symTok(set, ans, 3), symTok(set, ans, 2)] : [symTok(set, a, 3), symTok(set, a, 2), symTok(set, a, 1)];
  return {
    kind: alternate ? 'rust2' : 'rust',
    set,
    seq,
    ask: 3,
    wrong,
    hints: ['Kolik obrázků je v každém políčku?', alternate ? 'Sleduj zvlášť, kolik obrázků přibývá a jak se střídají.' : 'O kolik obrázků pokaždé přibude?'],
    explain: alternate
      ? `Pokaždé přibude jeden obrázek a obrázky se střídají: ${symName(set, a)}, ${symName(set, b)}. Na otazník patří ${countWords(4, SETS[set][ans].noun)}.`
      : `V každém dalším políčku přibude ${countWords(1, SETS[set][a].noun)}. Na otazník patří ${countWords(4, SETS[set][ans].noun)}.`,
    difficulty: alternate ? 0.2 : -0.2,
  };
}

/** Počty dokola: A, AA, AAA, A, AA, AAA, … */
function countCycle(rng: Rng): Draft | null {
  const set = rng.pick(SET_KEYS);
  const a = rng.int(0, SETS[set].length - 1);
  const counts = rng.chance(0.5) ? [1, 2, 3] : [3, 2, 1];
  // Otazník hned po dvou celých periodách; někdy za ním ještě jedno políčko.
  const total = rng.chance(0.5) ? 7 : 8;
  const seq = Array.from({ length: total }, (_, i) => symTok(set, a, counts[i % 3]));
  const ask = 6;
  const n = counts[ask % 3];
  const wrong = [1, 2, 3, 4].filter((k) => k !== n).map((k) => symTok(set, a, k));
  return {
    kind: 'pocty',
    set,
    seq,
    ask,
    wrong,
    hints: ['Kolik obrázků je v každém políčku?', 'Počty se opakují pořád dokola.'],
    explain: `Počty se opakují dokola: ${counts.join(', ')}. Na otazník patří ${countWords(n, SETS[set][a].noun)}.`,
    difficulty: 0,
  };
}

/** Otáčející se šipka: krok 2 = čtvrt otáčky, krok 1 = osmina. */
function rotating(rng: Rng, step: number, visibleCount: number): Draft {
  const start = rng.int(0, 7);
  const dir = rng.chance(0.5) ? 1 : -1;
  const d = dir * step;
  const seqIdx = Array.from({ length: visibleCount + 1 }, (_, i) => start + i * d);
  const ask = visibleCount;
  const ans = seqIdx[ask];
  const wrong = [ans - d, ans + d, ans + 4].map(arrowTok);
  const turn = step === 2 ? 'o čtvrt otáčky' : 'o osminu otáčky';
  const way = dir === 1 ? 'po směru hodinových ručiček' : 'proti směru hodinových ručiček';
  return {
    kind: `sipky${step}`,
    set: 'sipky',
    seq: seqIdx.map(arrowTok),
    ask,
    wrong,
    hints: ['Sleduj, kam šipka míří a jak se otáčí.', 'O kolik se šipka pokaždé otočí? Po směru hodinových ručiček, nebo proti?'],
    explain: `Šipka se pokaždé otočí ${turn} ${way}. Na otazník patří ${arrowTok(ans).name}.`,
    difficulty: step === 1 ? 0.3 : 0,
  };
}

/** Zrcadlová řada A B C D C B A (otazník mimo střed). */
function mirror(rng: Rng): Draft | null {
  const set = rng.pick(SET_KEYS);
  // Sedm položek: kromě dvojice s otazníkem jsou vidět ještě dvě celé
  // zrcadlové dvojice, takže souměrnost je dobře poznat.
  const pick = rng.shuffle(SETS[set].map((_, i) => i)).slice(0, 4);
  const seqIdx = [...pick, ...pick.slice(0, -1).reverse()];
  const n = seqIdx.length;
  const mid = (n - 1) / 2;
  const ask = rng.pick(Array.from({ length: n }, (_, i) => i).filter((i) => i !== mid));
  const visible = seqIdx.map((v, i) => (i === ask ? -1 : v));
  if (minimalPeriod(visible) * 2 <= visible.length) return null; // aby nešlo o obyčejné opakování
  const ans = seqIdx[ask];
  const wrong = SETS[set].map((_, i) => i).filter((i) => i !== ans).sort((x, y) => Number(!pick.includes(x)) - Number(!pick.includes(y))).slice(0, 3);
  const mirrorPos = n - 1 - ask;
  const mirrorText = mirrorPos < ask ? `na ${ORDINAL_LOC[mirrorPos]} místě zleva` : `na ${ORDINAL_LOC[n - 1 - mirrorPos]} místě zprava`;
  return {
    kind: 'zrcadlo',
    set,
    seq: seqIdx.map((i) => symTok(set, i)),
    ask,
    wrong: wrong.map((i) => symTok(set, i)),
    hints: ['Přečti si řadu zleva a pak zprava.', 'Řada je souměrná jako v zrcadle. Co je na stejném místě z druhé strany?'],
    explain: `Řada je stejná zleva i zprava, jako v zrcadle. Na otazník patří ${symName(set, ans)}, stejně jako ${mirrorText}.`,
    difficulty: 0.2,
  };
}

/** Dvě řady zamíchané do sebe: na lichých místech jedna, na sudých druhá.
 *  Každá má 4 položky; otazník je vždy v té, která není obyčejné střídání. */
type Sub = 'ab' | 'rust' | 'sipky1' | 'sipky2';

function interleaved(rng: Rng, level: Level): Draft | null {
  const set = rng.pick(SET_KEYS);
  const [a, b, c, d] = rng.shuffle(SETS[set].map((_, i) => i)).slice(0, 4);
  const [odd, even]: [Sub, Sub] =
    level <= 4
      ? ['ab', rng.pick(['sipky2', 'rust'] as const)]
      : rng.pick([['ab', 'sipky1'], ['rust', 'sipky2'], ['sipky2', 'rust'], ['ab', 'rust'], ['rust', 'ab'], ['sipky1', 'ab']] as [Sub, Sub][]);
  const start = rng.int(0, 7);
  const dir = rng.chance(0.5) ? 1 : -1;
  const tokOf = (kind: Sub, syms: [number, number], k: number): Tok =>
    kind === 'ab' ? symTok(set, syms[k % 2])
    : kind === 'rust' ? symTok(set, syms[0], k + 1)
    : arrowTok(start + dir * (kind === 'sipky1' ? 1 : 2) * k);
  const oddSyms: [number, number] = [a, b];
  const evenSyms: [number, number] = [c, d];
  const seq: Tok[] = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? tokOf(odd, oddSyms, i / 2) : tokOf(even, evenSyms, (i - 1) / 2)));
  const askOdd = even === 'ab' ? true : odd === 'ab' ? false : rng.chance(0.5);
  const ask = askOdd ? 6 : 7;
  const kind = askOdd ? odd : even;
  const syms = askOdd ? oddSyms : evenSyms;
  const ans = seq[ask];
  let wrong: Tok[];
  if (kind === 'rust') {
    const other = (askOdd ? evenSyms : oddSyms)[0];
    wrong = [symTok(set, syms[0], 3), symTok(set, syms[0], 2), symTok(set, other, 4)];
  } else {
    const step = dir * (kind === 'sipky1' ? 1 : 2);
    wrong = [arrowTok(start + step * 2), arrowTok(start + step * 4), arrowTok(start + step * 3 + 4)];
  }
  if (new Set([ans.e, ...wrong.map((t) => t.e)]).size !== 4) return null;
  const desc = (k: Sub, sy: [number, number]) =>
    k === 'ab' ? `se střídá ${symName(set, sy[0])} a ${symName(set, sy[1])}`
    : k === 'rust' ? `pokaždé přibude ${countWords(1, SETS[set][sy[0]].noun)}`
    : `se šipka otáčí ${k === 'sipky2' ? 'o čtvrt otáčky' : 'o osminu otáčky'} ${dir === 1 ? 'po směru' : 'proti směru'} hodinových ručiček`;
  return {
    kind: `dve-${odd}-${even}`,
    set,
    seq,
    ask,
    wrong,
    hints: ['Nejsou to dvě řady zamíchané do sebe?', 'Sleduj zvlášť obrázky na 1., 3., 5. místě a zvlášť na 2., 4., 6. místě.'],
    explain: `Na lichých místech ${desc(odd, oddSyms)}, na sudých ${desc(even, evenSyms)}. Na otazník patří ${ans.name}.`,
    difficulty: level >= 5 ? 0.3 : 0.1,
  };
}

/** Zvlášť se mění barva (po třech) a zvlášť tvar (po dvou), nebo naopak. */
function twoAttributes(rng: Rng): Draft | null {
  const colors = rng.shuffle([0, 1, 2, 3]);
  const shapes = rng.shuffle([0, 1, 2]);
  const colorPeriod = rng.chance(0.5) ? 3 : 2;
  const shapePeriod = colorPeriod === 3 ? 2 : 3;
  const total = 7;
  const seq = Array.from({ length: total }, (_, i) => shapeTok(shapes[i % shapePeriod], colors[i % colorPeriod]));
  const ask = rng.chance(0.6) ? total - 1 : rng.int(4, total - 2);
  const cAns = colors[ask % colorPeriod];
  const sAns = shapes[ask % shapePeriod];
  const otherColors = colors.filter((c) => c !== cAns);
  const otherShapes = shapes.filter((s) => s !== sAns);
  const wrong = [shapeTok(sAns, otherColors[0]), shapeTok(sAns, otherColors[1]), shapeTok(otherShapes[0], cAns)];
  const colorCycle = colors.slice(0, colorPeriod).map((c) => COLOR_WORD[c]);
  const shapeCycle = shapes.slice(0, shapePeriod).map((sh) => SHAPE_NOUN[sh].one);
  return {
    kind: `barvy${colorPeriod}`,
    set: 'tvary',
    seq,
    ask,
    wrong,
    hints: ['Sleduj zvlášť barvu a zvlášť tvar.', `Barvy se opakují po ${colorPeriod === 3 ? 'třech' : 'dvou'}, tvary po ${shapePeriod === 3 ? 'třech' : 'dvou'}.`],
    explain: `Barvy se opakují dokola: ${colorCycle.join(', ')}. Tvary zvlášť: ${shapeCycle.join(', ')}. Na otazník patří ${shapeTok(sAns, cAns).name}.`,
    difficulty: 0.4,
  };
}

// ---------------------------------------------------------------------------
// Úrovně

const AB = [0, 1];
const ABB = [0, 1, 1];
const AAB = [0, 0, 1];
const ABC = [0, 1, 2];
const AABB = [0, 0, 1, 1];
const ABCD = [0, 1, 2, 3];
const ABCB = [0, 1, 2, 1];
const ABAC = [0, 1, 0, 2];

type Maker = (rng: Rng) => Draft | null;

const MAKERS: Partial<Record<Level, Maker[]>> = {
  1: [(r) => periodic(r, [AB], { minPeriods: 3 }), (r) => periodic(r, [ABB, AAB])],
  2: [(r) => periodic(r, [ABC]), (r) => periodic(r, [AABB, ABB, AAB]), (r) => growing(r, false)],
  3: [(r) => periodic(r, [ABCD, ABCB, ABC], { middle: true }), (r) => rotating(r, 2, 5), countCycle],
  4: [(r) => rotating(r, 1, 6), mirror, (r) => interleaved(r, 4), (r) => growing(r, true), (r) => periodic(r, [ABAC, ABCB, AABB], { middle: true })],
  5: [(r) => interleaved(r, 5), twoAttributes, mirror, (r) => rotating(r, 1, 6)],
};

function toSpec(d: Draft): Spec {
  const items = d.seq.map((t, i) => (i === d.ask ? null : t.e));
  const prompt = 'Najdi pravidlo řady. Co patří na otazník?';
  const spoken = d.seq.map((t, i) => (i === d.ask ? 'otazník' : t.name)).join(', ');
  const spec: ChoiceSpec = {
    key: `${d.kind}-${d.set}-${d.seq.map((t) => t.code).join('')}-${d.ask}`,
    prompt,
    speak: `Řada: ${spoken}. ${prompt}`,
    visual: { type: 'series', items },
    correct: opt(d.seq[d.ask]),
    wrong: d.wrong.map(opt),
    hints: d.hints,
    explain: d.explain,
    difficulty: Math.max(-0.5, Math.min(0.5, d.difficulty)),
  };
  return spec;
}

function generator(level: Level) {
  return (rng: Rng): Spec => {
    for (let i = 0; i < 200; i++) {
      const d = rng.pick(MAKERS[level]!)(rng);
      if (d) return toSpec(d);
    }
    throw new Error(`zahady.rady: úloha úrovně ${level} se nepovedla`);
  };
}

export const RADY_GEN: Partial<Record<Level, (rng: Rng) => Spec>> = {
  1: generator(1),
  2: generator(2),
  3: generator(3),
  4: generator(4),
  5: generator(5),
};
