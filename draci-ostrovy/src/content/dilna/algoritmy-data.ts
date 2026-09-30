// Data a grafy: sloupcové grafy (čeho je nejvíc a nejméně, kolik, dohromady,
// o kolik víc), čárkovací tabulky, třídění karet podle vlastností, tabulky
// s více sloupci a otázky, na které graf odpovědět neumí. Hodnoty sloupců
// jsou vždy navzájem různé, takže „nejvíc“ i „nejméně“ má jedinou odpověď.

import { bankSkill, type Spec } from '../../core/bank';
import { capitalize, count, type Forms } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { KnowledgeCard, Visual } from '../../core/types';
import { joinA } from './algoritmy-mrizka';

const ID = 'dilna.data';

type DataLevel = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Témata grafů

interface Cat {
  code: string;
  label: string;
  emoji: string;
  /** Tvar do otázky: „psa“, „bouřku“, „u skály“, „Mlžném“, „Freja“. */
  form: string;
  /** Ženský rod (jména dětí). */
  f?: boolean;
}

interface Topic {
  code: string;
  intro: (level: DataLevel) => string;
  title: string;
  unit: string;
  noun: Forms;
  cats: Cat[];
  max: string;
  min: string;
  value: (c: Cat) => string;
  sum2: (a: Cat, b: Cat) => string;
  diff: (a: Cat, b: Cat) => string;
  total?: string;
  times?: (a: Cat, b: Cat) => string;
  fair?: string;
  /** Otázky, na které graf odpoví. */
  can: string[];
  /** Otázky, na které graf odpovědět neumí. */
  cannot: string[];
}

const cat = (code: string, label: string, emoji: string, form: string, f?: boolean): Cat => ({ code, label, emoji, form, ...(f ? { f } : {}) });

const TOPICS: Record<string, Topic> = {
  zvirata: {
    code: 'zvirata',
    intro: (l) => (l >= 4 ? 'Děti z celé školy hlasovaly o nejoblíbenější zvíře.' : 'Děti ve třídě hlasovaly o nejoblíbenější zvíře.'),
    title: 'Nejoblíbenější zvíře',
    unit: 'dětí',
    noun: ['dítě', 'děti', 'dětí'],
    cats: [
      cat('pes', 'Pes', '🐶', 'psa'),
      cat('kocka', 'Kočka', '🐱', 'kočku'),
      cat('kralik', 'Králík', '🐰', 'králíka'),
      cat('kun', 'Kůň', '🐴', 'koně'),
      cat('krecek', 'Křeček', '🐹', 'křečka'),
      cat('zelva', 'Želva', '🐢', 'želvu'),
    ],
    max: 'Které zvíře vybralo nejvíc dětí?',
    min: 'Které zvíře vybralo nejméně dětí?',
    value: (c) => `Kolik dětí vybralo ${c.form}?`,
    sum2: (a, b) => `Kolik dětí vybralo ${a.form} nebo ${b.form}?`,
    diff: (a, b) => `O kolik víc dětí vybralo ${a.form} než ${b.form}?`,
    total: 'Kolik dětí hlasovalo?',
    times: (a, b) => `Kolikrát víc dětí vybralo ${a.form} než ${b.form}?`,
    can: ['Které zvíře vybralo nejvíc dětí?', 'Které zvíře vybralo nejméně dětí?', 'Kolik dětí hlasovalo?'],
    cannot: ['Kolik dětí má doma psa?', 'Které zvíře vybral Erik?', 'Proč mají děti rády kočky?', 'Kolik je ve škole učitelů?'],
  },
  pocasi: {
    code: 'pocasi',
    intro: (l) => (l === 1 ? 'Freja si týden zapisovala počasí.' : l === 2 ? 'Freja si dva týdny zapisovala počasí.' : 'Freja si celý duben zapisovala počasí.'),
    title: 'Počasí',
    unit: 'dní',
    noun: ['den', 'dny', 'dní'],
    // Každý den má jeden záznam. Otázky se ptají na záznamy („kolik dní si
    // zapsala déšť“), ne na počasí samo: při bouřce taky prší a při dešti je
    // zataženo, takže „Kolik dní pršelo?“ by mělo dvě rozumné odpovědi.
    cats: [
      cat('dest', 'Déšť', '🌧️', 'déšť'),
      cat('slunecno', 'Slunečno', '☀️', 'slunečno'),
      cat('polojasno', 'Polojasno', '⛅', 'polojasno'),
      cat('zatazeno', 'Zataženo', '☁️', 'zataženo'),
      cat('bourka', 'Bouřka', '⛈️', 'bouřku'),
      cat('snih', 'Sníh', '❄️', 'sníh'),
    ],
    max: 'Jaké počasí si zapsala nejčastěji?',
    min: 'Jaké počasí si zapsala nejméně často?',
    value: (c) => `Kolik dní si zapsala ${c.form}?`,
    sum2: (a, b) => `Kolik dní si zapsala ${a.form} nebo ${b.form}?`,
    diff: (a, b) => `O kolik víc dní si zapsala ${a.form} než ${b.form}?`,
    can: ['Jaké počasí si zapsala nejčastěji?', 'Jaké počasí si zapsala nejméně často?', 'Kolik dní si Freja zapisovala počasí?'],
    cannot: ['Jaká byla teplota v pondělí?', 'Pršelo ve středu?', 'Jaké počasí bude zítra?', 'Kolik vody napršelo?'],
  },
  vajicka: {
    code: 'vajicka',
    intro: () => 'Dračí jezdci spočítali vajíčka v hnízdech.',
    title: 'Vajíčka v hnízdech',
    unit: 'vajíček',
    noun: ['vajíčko', 'vajíčka', 'vajíček'],
    cats: [
      cat('skala', 'U skály', '⛰️', 'u skály'),
      cat('jezero', 'U jezera', '🌊', 'u jezera'),
      cat('strom', 'Na stromě', '🌳', 'na stromě'),
      cat('trava', 'V trávě', '🌾', 'v trávě'),
      cat('sopka', 'U sopky', '🌋', 'u sopky'),
      cat('plaz', 'Na pláži', '🏖️', 'na pláži'),
    ],
    max: 'Ve kterém hnízdě je nejvíc vajíček?',
    min: 'Ve kterém hnízdě je nejméně vajíček?',
    value: (c) => `Kolik vajíček je v hnízdě ${c.form}?`,
    sum2: (a, b) => `Kolik vajíček je dohromady v hnízdech ${a.form} a ${b.form}?`,
    diff: (a, b) => `O kolik víc vajíček je v hnízdě ${a.form} než ${b.form}?`,
    total: 'Kolik vajíček je ve všech hnízdech dohromady?',
    can: ['Ve kterém hnízdě je nejvíc vajíček?', 'Ve kterém hnízdě je nejméně vajíček?', 'Kolik vajíček je ve všech hnízdech?'],
    cannot: ['Kdy se dráčci vylíhnou?', 'Jakou barvu mají vajíčka?', 'Kolik vajíček bylo v hnízdech loni?'],
  },
  jablka: {
    code: 'jablka',
    intro: () => 'Děti sbíraly jablka do košíků.',
    title: 'Nasbíraná jablka',
    unit: 'jablek',
    noun: ['jablko', 'jablka', 'jablek'],
    cats: [
      cat('freja', 'Freja', '👧', 'Freja', true),
      cat('erik', 'Erik', '👦', 'Erik'),
      cat('sigrid', 'Sigrid', '👧', 'Sigrid', true),
      cat('leif', 'Leif', '👦', 'Leif'),
      cat('maja', 'Maja', '👧', 'Maja', true),
      cat('knut', 'Knut', '👦', 'Knut'),
    ],
    max: 'Kdo nasbíral nejvíc jablek?',
    min: 'Kdo nasbíral nejméně jablek?',
    value: (c) => `Kolik jablek nasbíral${c.f ? 'a' : ''} ${c.label}?`,
    sum2: (a, b) => `Kolik jablek nasbíral${a.f && b.f ? 'y' : 'i'} ${a.label} a ${b.label} dohromady?`,
    diff: (a, b) => `O kolik víc jablek nasbíral${a.f ? 'a' : ''} ${a.label} než ${b.label}?`,
    total: 'Kolik jablek nasbíraly děti dohromady?',
    times: (a, b) => `Kolikrát víc jablek nasbíral${a.f ? 'a' : ''} ${a.label} než ${b.label}?`,
    fair: 'Děti chtějí všechna jablka rozdělit rovným dílem. Kolik jablek dostane každé dítě?',
    can: ['Kdo nasbíral nejvíc jablek?', 'Kdo nasbíral nejméně jablek?', 'Kolik jablek nasbíraly děti dohromady?'],
    cannot: ['Kdo sbíral jablka nejrychleji?', 'Kolik jablek bylo červených?', 'Kolik jablek zůstalo na stromě?', 'Kdo má jablka nejraději?'],
  },
  draci: {
    code: 'draci',
    intro: () => 'Strážci ostrovů spočítali draky.',
    title: 'Draci na ostrovech',
    unit: 'draků',
    noun: ['drak', 'draci', 'draků'],
    cats: [
      cat('mlzny', 'Mlžný', '🌫️', 'Mlžném'),
      cat('skalnaty', 'Skalnatý', '⛰️', 'Skalnatém'),
      cat('ledovy', 'Ledový', '❄️', 'Ledovém'),
      cat('zeleny', 'Zelený', '🌲', 'Zeleném'),
      cat('ohnivy', 'Ohnivý', '🌋', 'Ohnivém'),
      cat('pisecny', 'Písečný', '🏖️', 'Písečném'),
    ],
    max: 'Na kterém ostrově žije nejvíc draků?',
    min: 'Na kterém ostrově žije nejméně draků?',
    value: (c) => `Kolik draků žije na ${c.form} ostrově?`,
    sum2: (a, b) => `Kolik draků žije dohromady na ${a.form} a ${b.form} ostrově?`,
    diff: (a, b) => `O kolik víc draků žije na ${a.form} ostrově než na ${b.form}?`,
    total: 'Kolik draků žije na všech ostrovech dohromady?',
    times: (a, b) => `Kolikrát víc draků žije na ${a.form} ostrově než na ${b.form}?`,
    fair: 'Strážci chtějí draky rozdělit na ostrovy rovným dílem. Kolik draků by bylo na každém ostrově?',
    can: ['Na kterém ostrově žije nejvíc draků?', 'Na kterém ostrově žije nejméně draků?', 'Kolik draků žije na všech ostrovech?'],
    cannot: ['Který ostrov je největší?', 'Kolik draků umí plavat?', 'Kolik lidí žije na ostrovech?'],
  },
};

// ---------------------------------------------------------------------------
// Sloupcové grafy

interface Chart {
  topic: Topic;
  cats: Cat[];
  values: number[];
}

/** k různých čísel z [lo, hi] s krokem `step`; `sum` = požadovaný součet. */
function distinctValues(rng: Rng, k: number, lo: number, hi: number, step: number, sum?: number): number[] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const pool = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);
    const values = rng.shuffle(pool).slice(0, k);
    if (sum === undefined || values.reduce((a, b) => a + b, 0) === sum) return values;
    // Dorovnání posledního čísla na požadovaný součet.
    const rest = sum - values.slice(0, -1).reduce((a, b) => a + b, 0);
    if (rest >= lo && rest <= hi && !values.slice(0, -1).includes(rest)) return [...values.slice(0, -1), rest];
  }
  throw new Error(`${ID}: nepodařilo se vybrat hodnoty`);
}

const POCASI_DAYS: Record<DataLevel, number> = { 1: 7, 2: 14, 3: 30, 4: 30, 5: 30 };

interface ChartCfg {
  n: [number, number];
  lo: number;
  hi: number;
  step: number;
  topics: string[];
}

const CHART: Record<DataLevel, ChartCfg> = {
  1: { n: [3, 3], lo: 1, hi: 8, step: 1, topics: ['zvirata', 'pocasi', 'vajicka', 'jablka', 'draci'] },
  2: { n: [4, 4], lo: 1, hi: 12, step: 1, topics: ['zvirata', 'pocasi', 'vajicka', 'jablka', 'draci'] },
  3: { n: [5, 5], lo: 2, hi: 20, step: 1, topics: ['zvirata', 'pocasi', 'vajicka', 'jablka', 'draci'] },
  4: { n: [5, 6], lo: 5, hi: 60, step: 5, topics: ['zvirata', 'jablka', 'draci'] },
  5: { n: [6, 6], lo: 10, hi: 100, step: 5, topics: ['zvirata', 'jablka', 'draci'] },
};

function randomChart(level: DataLevel, rng: Rng, topicCode?: string): Chart {
  const cfg = CHART[level];
  const topic = TOPICS[topicCode ?? rng.pick(cfg.topics)];
  const k = rng.int(...cfg.n);
  let cats: Cat[];
  let values: number[];
  if (topic.code === 'pocasi') {
    // Déšť je v grafu vždycky (kvůli otázce „Pršelo ve středu?“).
    cats = [topic.cats[0], ...rng.shuffle(topic.cats.slice(1)).slice(0, k - 1)];
    const days = POCASI_DAYS[level];
    values = distinctValues(rng, k, 1, Math.min(days - 1, 15), 1, days);
  } else {
    cats = rng.shuffle(topic.cats).slice(0, k);
    values = distinctValues(rng, k, cfg.lo, cfg.hi, cfg.step);
  }
  // Sloupce jdou v pevném pořadí tématu, takže stejný graf vypadá vždy stejně.
  const order = cats.map((c) => topic.cats.indexOf(c)).map((idx, i) => ({ idx, i })).sort((a, b) => a.idx - b.idx);
  return { topic, cats: order.map((o) => cats[o.i]), values: order.map((o) => values[o.i]) };
}

const chartKey = (c: Chart) => `${c.topic.code}-${c.cats.map((x, i) => `${x.code}${c.values[i]}`).join('')}`;

function barsOf(c: Chart): Visual {
  return {
    type: 'bars',
    title: c.topic.title,
    unit: c.topic.unit,
    bars: c.cats.map((x, i) => ({ label: x.label, value: c.values[i], emoji: x.emoji })),
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Jednoduchý hash textu (FNV-1a). */
function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Question = 'max' | 'min' | 'value' | 'sum2' | 'diff' | 'total' | 'range' | 'above' | 'fair' | 'times' | 'cannot';

const QUESTIONS: Record<DataLevel, Question[]> = {
  1: ['max', 'min', 'value'],
  2: ['max', 'min', 'value', 'sum2', 'diff', 'total'],
  3: ['sum2', 'diff', 'total', 'range', 'above'],
  4: ['diff', 'total', 'range', 'sum2', 'cannot'],
  5: ['total', 'fair', 'times', 'cannot', 'range'],
};

/** Otázka ke grafu. Vrací null, když se k danému grafu nehodí. */
function chartQuestion(level: DataLevel, q: Question, rng: Rng): Spec | null {
  // Otázky „na co graf neodpoví“ stojí na malém grafu z kteréhokoli tématu.
  const chartLevel: DataLevel = q === 'cannot' ? 3 : level;
  const topicCode = q === 'fair' ? rng.pick(['jablka', 'draci']) : q === 'cannot' ? rng.pick(Object.keys(TOPICS)) : undefined;
  const chart = randomChart(chartLevel, rng, topicCode);
  const { topic, cats, values } = chart;
  const intro = topic.intro(chartLevel);
  const key = `graf-${chartKey(chart)}`;
  const visual = barsOf(chart);
  const n = (v: number) => count(v, topic.noun);
  const labels = cats.map((c) => c.label);
  const hi = values.indexOf(Math.max(...values));
  const lo = values.indexOf(Math.min(...values));

  switch (q) {
    case 'max':
    case 'min': {
      const idx = q === 'max' ? hi : lo;
      return {
        key: `${key}-${q}`,
        prompt: `${intro} ${q === 'max' ? topic.max : topic.min}`,
        visual,
        correct: labels[idx],
        wrong: labels.filter((_, i) => i !== idx),
        hints: [q === 'max' ? 'Najdi nejvyšší sloupec.' : 'Najdi nejnižší sloupec.'],
        explain: `${q === 'max' ? 'Nejvyšší' : 'Nejnižší'} je sloupec „${labels[idx]}“: ${n(values[idx])}.`,
        difficulty: level === 1 ? -0.2 : -0.3,
      };
    }
    case 'value': {
      const i = rng.int(0, cats.length - 1);
      return {
        kind: 'number',
        key: `${key}-kolik-${cats[i].code}`,
        prompt: `${intro} ${topic.value(cats[i])}`,
        visual,
        correct: values[i],
        hints: [`Najdi sloupec „${labels[i]}“.`, 'Podívej se, kam až sloupec sahá.'],
        explain: `Sloupec „${labels[i]}“ sahá k číslu ${values[i]}.`,
        difficulty: 0,
      };
    }
    case 'sum2': {
      const [i, j] = rng.shuffle(cats.map((_, x) => x)).slice(0, 2).sort((a, b) => a - b);
      return {
        kind: 'number',
        key: `${key}-dohromady-${cats[i].code}-${cats[j].code}`,
        prompt: `${intro} ${topic.sum2(cats[i], cats[j])}`,
        visual,
        correct: values[i] + values[j],
        hints: ['Najdi oba sloupce a jejich čísla sečti.'],
        explain: `${labels[i]}: ${n(values[i])}. ${labels[j]}: ${n(values[j])}. Dohromady ${values[i]} + ${values[j]} = ${values[i] + values[j]}.`,
        difficulty: 0.1,
      };
    }
    case 'diff': {
      const [x, y] = rng.shuffle(cats.map((_, i) => i)).slice(0, 2);
      const [i, j] = values[x] > values[y] ? [x, y] : [y, x];
      return {
        kind: 'number',
        key: `${key}-rozdil-${cats[i].code}-${cats[j].code}`,
        prompt: `${intro} ${topic.diff(cats[i], cats[j])}`,
        visual,
        correct: values[i] - values[j],
        hints: ['Najdi oba sloupce.', 'Od většího čísla odečti menší.'],
        explain: `${labels[i]}: ${n(values[i])}. ${labels[j]}: ${n(values[j])}. Rozdíl je ${values[i]} − ${values[j]} = ${values[i] - values[j]}.`,
        difficulty: 0.2,
      };
    }
    case 'total': {
      if (!topic.total) return null;
      return {
        kind: 'number',
        key: `${key}-celkem`,
        prompt: `${intro} ${topic.total}`,
        visual,
        correct: sum(values),
        hints: ['Sečti čísla všech sloupců.', 'Sčítej postupně, sloupec po sloupci.'],
        explain: `${values.join(' + ')} = ${sum(values)}.`,
        difficulty: 0.2,
      };
    }
    case 'range':
      return {
        kind: 'number',
        key: `${key}-rozpeti`,
        prompt: `${intro} O kolik je nejvyšší sloupec vyšší než nejnižší?`,
        visual,
        correct: values[hi] - values[lo],
        hints: ['Najdi nejvyšší a nejnižší sloupec.', 'Od většího čísla odečti menší.'],
        explain: `Nejvyšší je sloupec „${labels[hi]}“ (${values[hi]}), nejnižší „${labels[lo]}“ (${values[lo]}). Rozdíl je ${values[hi]} − ${values[lo]} = ${values[hi] - values[lo]}.`,
        difficulty: 0.3,
      };
    case 'above': {
      // Hranice, která se nerovná žádné hodnotě, a aspoň jeden sloupec nad ní i pod ní.
      const sorted = [...values].sort((a, b) => a - b);
      const cut = rng.int(1, sorted.length - 1);
      const t = sorted[cut - 1] + 1 < sorted[cut] ? rng.int(sorted[cut - 1] + 1, sorted[cut] - 1) : null;
      if (t === null) return null;
      const above = values.filter((v) => v > t).length;
      const aboveCats = cats.filter((_, i) => values[i] > t).map((c) => c.label);
      return {
        kind: 'number',
        key: `${key}-nad-${t}`,
        prompt: `${intro} Kolik sloupců ukazuje víc než ${t}?`,
        visual,
        correct: above,
        hints: [`Najdi na grafu číslo ${t}.`, `Počítej jen sloupce, které jsou vyšší než ${t}.`],
        explain: above === 1 ? `Víc než ${t} ukazuje jen sloupec „${aboveCats[0]}“.` : `Víc než ${t} ukazují sloupce ${joinA(aboveCats.map((l) => `„${l}“`))}. ${above <= 4 ? 'To jsou' : 'To je'} ${count(above, ['sloupec', 'sloupce', 'sloupců'])}.`,
        difficulty: 0.3,
      };
    }
    case 'fair': {
      if (!topic.fair || sum(values) % values.length !== 0) return null;
      const each = sum(values) / values.length;
      return {
        kind: 'number',
        key: `${key}-rovnym-dilem`,
        prompt: `${intro} ${topic.fair}`,
        visual,
        correct: each,
        hints: ['Nejdřív všechno sečti.', `Pak součet vyděl počtem sloupců: ${values.length}.`],
        explain: `Dohromady je to ${values.join(' + ')} = ${sum(values)}. Když se to rozdělí na ${count(values.length, ['stejný díl', 'stejné díly', 'stejných dílů'])}, vyjde ${sum(values)} : ${values.length} = ${each}.`,
        difficulty: 0.4,
      };
    }
    case 'times': {
      if (!topic.times) return null;
      const pairs: [number, number][] = [];
      values.forEach((a, i) => values.forEach((b, j) => {
        if (i !== j && a % b === 0 && a / b >= 2 && a / b <= 5) pairs.push([i, j]);
      }));
      if (!pairs.length) return null;
      const [i, j] = rng.pick(pairs);
      return {
        kind: 'number',
        key: `${key}-krat-${cats[i].code}-${cats[j].code}`,
        prompt: `${intro} ${topic.times(cats[i], cats[j])}`,
        visual,
        correct: values[i] / values[j],
        hints: ['Najdi oba sloupce.', `Kolikrát se ${values[j]} vejde do ${values[i]}?`],
        explain: `${labels[i]}: ${n(values[i])}. ${labels[j]}: ${n(values[j])}. ${values[i]} : ${values[j]} = ${values[i] / values[j]}.`,
        difficulty: 0.3,
      };
    }
    case 'cannot': {
      // Otázka je daná grafem, aby stejný graf neměl dvě různá zadání se stejným textem.
      const idx = hashOf(chartKey(chart)) % topic.cannot.length;
      const dynamic = rng.pick(cats);
      const can = [...topic.can, topic.value(dynamic)];
      return {
        key: `${key}-neodpovi-${idx}`,
        prompt: `${intro} Na kterou otázku graf neodpoví?`,
        visual,
        correct: topic.cannot[idx],
        wrong: can,
        hints: ['U každé otázky si řekni, jestli odpověď najdeš v grafu.', 'Graf ukazuje jen to, co se spočítalo.'],
        explain: `Graf ukazuje jen počty v jednotlivých sloupcích. Odpověď na otázku „${topic.cannot[idx]}“ v něm nenajdeš.`,
        difficulty: 0.2,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Čárkovací tabulky (L1–L2)

/** Čárky po pětkách: 7 = „||||| ||“. */
export const tally = (n: number) => [...Array(Math.floor(n / 5)).fill('|||||'), ...(n % 5 ? ['|'.repeat(n % 5)] : [])].join(' ');

interface Bird {
  code: string;
  label: string;
  /** 2. pád množného čísla: „sýkorek“. */
  gen: string;
}

const BIRDS: Bird[] = [
  { code: 'sykorka', label: 'Sýkorka', gen: 'sýkorek' },
  { code: 'vrabec', label: 'Vrabec', gen: 'vrabců' },
  { code: 'kos', label: 'Kos', gen: 'kosů' },
  { code: 'hyl', label: 'Hýl', gen: 'hýlů' },
  { code: 'strakapoud', label: 'Strakapoud', gen: 'strakapoudů' },
  { code: 'holub', label: 'Holub', gen: 'holubů' },
];

function tallyQuestion(level: 1 | 2, rng: Rng): Spec {
  const k = level === 1 ? 3 : 4;
  const chosen = rng.shuffle(BIRDS).slice(0, k);
  const birds = BIRDS.filter((b) => chosen.includes(b));
  const values = distinctValues(rng, k, 1, level === 1 ? 9 : 14, 1);
  const visual: Visual = {
    type: 'table',
    cols: 2,
    head: 'row',
    cells: ['Pták', 'Čárky', ...birds.flatMap((b, i) => [b.label, tally(values[i])])],
  };
  const key = `carky-${birds.map((b, i) => `${b.code}${values[i]}`).join('')}`;
  const intro = 'Maja čárkovala ptáky, kteří přiletěli na krmítko. Každá čárka je jeden pták.';
  const speakTail = ' Spočítej čárky v tabulce.';
  const qs = level === 1 ? ['kolik', 'max'] : ['kolik', 'celkem', 'rozdil'];
  const q = rng.pick(qs);
  const hints = ['Čárky jsou po pěti, pětky se počítají rychle: 5, 10, 15…'];
  if (q === 'max') {
    const hi = values.indexOf(Math.max(...values));
    const prompt = `${intro} Který pták přiletěl nejčastěji?`;
    return {
      key: `${key}-max`,
      prompt,
      speak: prompt + speakTail,
      visual,
      correct: birds[hi].label,
      wrong: birds.filter((_, i) => i !== hi).map((b) => b.label),
      hints: ['Hledej řádek s nejvíc čárkami.', ...hints],
      explain: `Nejvíc čárek má řádek „${birds[hi].label}“: ${values[hi]}.`,
      difficulty: -0.2,
    };
  }
  if (q === 'kolik') {
    const i = rng.int(0, k - 1);
    const prompt = `${intro} Kolik ${birds[i].gen} přiletělo?`;
    return {
      kind: 'number',
      key: `${key}-kolik-${birds[i].code}`,
      prompt,
      speak: prompt + speakTail,
      visual,
      correct: values[i],
      hints: [`Najdi řádek „${birds[i].label}“.`, ...hints],
      explain: `V řádku „${birds[i].label}“ ${values[i] >= 2 && values[i] <= 4 ? 'jsou' : 'je'} ${count(values[i], ['čárka', 'čárky', 'čárek'])}.`,
      difficulty: values[i] >= 5 ? 0.2 : -0.2,
    };
  }
  if (q === 'celkem') {
    const prompt = `${intro} Kolik ptáků přiletělo celkem?`;
    return {
      kind: 'number',
      key: `${key}-celkem`,
      prompt,
      speak: prompt + speakTail,
      visual,
      correct: sum(values),
      hints: ['Spočítej čárky v každém řádku a pak je sečti.', ...hints],
      explain: `${values.join(' + ')} = ${sum(values)}.`,
      difficulty: 0.3,
    };
  }
  const [x, y] = rng.shuffle(birds.map((_, i) => i)).slice(0, 2);
  const [i, j] = values[x] > values[y] ? [x, y] : [y, x];
  const prompt = `${intro} O kolik víc ${birds[i].gen} než ${birds[j].gen} přiletělo?`;
  return {
    kind: 'number',
    key: `${key}-rozdil-${birds[i].code}-${birds[j].code}`,
    prompt,
    speak: prompt + speakTail,
    visual,
    correct: values[i] - values[j],
    hints: ['Spočítej čárky v obou řádcích.', 'Od většího čísla odečti menší.'],
    explain: `${birds[i].label}: ${values[i]}, ${birds[j].label}: ${values[j]}. Rozdíl je ${values[i]} − ${values[j]} = ${values[i] - values[j]}.`,
    difficulty: 0.3,
  };
}

// ---------------------------------------------------------------------------
// Třídění karet s draky (L2–L3)

const DRAGON_NAMES = ['Runa', 'Knut', 'Liv', 'Ivar', 'Tove', 'Dag', 'Alva', 'Bo'];

interface Color {
  code: string;
  nom: string;
  acc: string;
  group: string;
  /** „zelených draků“ */
  gen: string;
}

const COLORS: Color[] = [
  { code: 'z', nom: 'zelená', acc: 'zelenou', group: 'Zelení', gen: 'zelených' },
  { code: 'm', nom: 'modrá', acc: 'modrou', group: 'Modří', gen: 'modrých' },
  { code: 'c', nom: 'červená', acc: 'červenou', group: 'Červení', gen: 'červených' },
];

const BREATH = [
  { code: 'o', text: 'oheň' },
  { code: 'l', text: 'led' },
];

interface DragonCard {
  name: number;
  color: Color;
  breath: (typeof BREATH)[number];
}

function cardsQuestion(level: 2 | 3, rng: Rng): Spec | null {
  const k = rng.int(4, 6);
  const names = rng.shuffle(DRAGON_NAMES.map((_, i) => i)).slice(0, k).sort((a, b) => a - b);
  const deck: DragonCard[] = names.map((name) => ({ name, color: rng.pick(COLORS), breath: rng.pick(BREATH) }));
  const visual: Visual = {
    type: 'cards',
    cards: deck.map((d) => ({ emoji: '🐉', title: DRAGON_NAMES[d.name], lines: [`Barva: ${d.color.nom}`, `Chrlí ${d.breath.text}`] })),
  };
  const key = `karty-${deck.map((d) => `${d.name}${d.color.code}${d.breath.code}`).join('')}`;
  const intro = 'Na kartách jsou draci z dračí stáje.';
  const kind = level === 2 ? rng.pick(['barva', 'dech']) : rng.pick(['oboji', 'skupina']);
  if (kind === 'barva') {
    const color = rng.pick(deck).color;
    const hits = deck.filter((d) => d.color === color);
    return {
      kind: 'number',
      key: `${key}-barva-${color.code}`,
      prompt: `${intro} Kolik draků má ${color.acc} barvu?`,
      visual,
      correct: hits.length,
      hints: ['Projdi karty jednu po druhé.', `Počítej jen karty, kde je napsáno: Barva: ${color.nom}.`],
      explain: `${capitalize(color.acc)} barvu ${hits.length === 1 ? 'má jen' : 'mají'} ${joinA(hits.map((d) => DRAGON_NAMES[d.name]))}.`,
      difficulty: -0.1,
    };
  }
  if (kind === 'dech') {
    const breath = rng.pick(deck).breath;
    const hits = deck.filter((d) => d.breath === breath);
    return {
      kind: 'number',
      key: `${key}-dech-${breath.code}`,
      prompt: `${intro} Kolik draků chrlí ${breath.text}?`,
      visual,
      correct: hits.length,
      hints: ['Projdi karty jednu po druhé.', `Počítej jen karty, kde je napsáno: Chrlí ${breath.text}.`],
      explain: `${capitalize(breath.text)} chrlí ${hits.length === 1 ? 'jen ' : ''}${joinA(hits.map((d) => DRAGON_NAMES[d.name]))}.`,
      difficulty: 0,
    };
  }
  if (kind === 'oboji') {
    const pick = rng.pick(deck);
    const sameColor = deck.filter((d) => d.color === pick.color);
    const hits = sameColor.filter((d) => d.breath === pick.breath);
    // Obě vlastnosti musí hrát roli: ne všichni draci té barvy chrlí totéž
    // a ne všichni, kdo chrlí totéž, mají tu barvu.
    if (!hits.length || hits.length === sameColor.length || hits.length === deck.filter((d) => d.breath === pick.breath).length) return null;
    return {
      kind: 'number',
      key: `${key}-oboji-${pick.color.code}${pick.breath.code}`,
      prompt: `${intro} Kolik draků má ${pick.color.acc} barvu a zároveň chrlí ${pick.breath.text}?`,
      visual,
      correct: hits.length,
      hints: ['Musí platit obě věci najednou.', `Nejdřív najdi draky, kteří mají ${pick.color.acc} barvu.`],
      explain: `${capitalize(pick.color.acc)} barvu mají ${joinA(sameColor.map((d) => DRAGON_NAMES[d.name]))}. Z nich chrlí ${pick.breath.text} ${hits.length === 1 ? 'jen ' : ''}${joinA(hits.map((d) => DRAGON_NAMES[d.name]))}.`,
      difficulty: 0.2,
    };
  }
  // Největší skupina podle barvy (jediná).
  const sizes = COLORS.map((c) => deck.filter((d) => d.color === c).length);
  const best = Math.max(...sizes);
  if (sizes.filter((s) => s === best).length !== 1) return null;
  const idx = sizes.indexOf(best);
  return {
    key: `${key}-skupina`,
    prompt: `${intro} Roztřiď draky podle barvy. Která skupina bude největší?`,
    visual,
    correct: COLORS[idx].group,
    wrong: COLORS.filter((_, i) => i !== idx).map((c) => c.group),
    hints: ['Spočítej draky každé barvy zvlášť.'],
    explain: `Počty: ${COLORS.map((c, i) => `${c.group} ${sizes[i]}`).join(', ')}. Nejvíc je ${COLORS[idx].gen} draků.`,
    difficulty: 0.1,
  };
}

// ---------------------------------------------------------------------------
// Tabulky s více sloupci (L4–L5)

const DAYS = [
  { short: 'Po', in: 'v pondělí', In: 'V pondělí' },
  { short: 'Út', in: 'v úterý', In: 'V úterý' },
  { short: 'St', in: 've středu', In: 'Ve středu' },
  { short: 'Čt', in: 've čtvrtek', In: 'Ve čtvrtek' },
  { short: 'Pá', in: 'v pátek', In: 'V pátek' },
];

const KIDS = TOPICS.jablka.cats;

/** Jablka za tři dny: řádky = děti, sloupce = dny. L5 přidá sloupec Celkem a jedno prázdné políčko. */
function applesTable(level: 4 | 5, rng: Rng): Spec | null {
  const kids = rng.shuffle(KIDS).slice(0, rng.int(3, 4)).sort((a, b) => KIDS.indexOf(a) - KIDS.indexOf(b));
  const days = DAYS.slice(0, 3);
  const hi = level === 4 ? 9 : 15;
  const grid = kids.map(() => days.map(() => rng.int(1, hi)));
  const rowSums = grid.map(sum);
  const colSums = days.map((_, d) => sum(grid.map((r) => r[d])));
  const withTotal = level === 5;
  const cols = withTotal ? 5 : 4;
  const head = ['Jméno', ...days.map((d) => d.short), ...(withTotal ? ['Celkem'] : [])];
  const body = kids.flatMap((kid, r) => [kid.label, ...grid[r], ...(withTotal ? [rowSums[r]] : [])]);
  const cells: (string | number | null)[] = [...head, ...body];
  const baseKey = `tabulka-${kids.map((k, r) => `${k.code}${grid[r].join('-')}`).join('-')}`;
  const intro = 'Děti tři dny sbíraly jablka.';

  if (level === 5 && rng.chance(0.5)) {
    // Jedno políčko chybí: dopočítá se z řádku (součet v Celkem).
    const r = rng.int(0, kids.length - 1);
    const c = rng.int(1, 4);
    const index = cols * (r + 1) + c;
    const answer = cells[index] as number;
    const hidden = cells.map((x, i) => (i === index ? null : x));
    return {
      kind: 'number',
      key: `${baseKey}-chybi-${r}-${c}`,
      prompt: `${intro} V tabulce jedno číslo chybí. Jaké číslo tam patří?`,
      visual: { type: 'table', cols, head: 'row', cells: hidden, ask: index },
      correct: answer,
      hints: ['Sloupec „Celkem“ je součet jablek za všechny tři dny.', 'Použij ostatní čísla v tom řádku.'],
      explain: c === 4
        ? `Celkem je součet: ${grid[r].join(' + ')} = ${rowSums[r]}.`
        : `Celkem je ${rowSums[r]}. Od toho odečti ostatní dny: ${rowSums[r]} − ${grid[r].filter((_, d) => d !== c - 1).join(' − ')} = ${answer}.`,
      difficulty: 0.4,
    };
  }

  const visual: Visual = { type: 'table', cols, head: 'row', cells };
  // Se sloupcem Celkem by součet řádku (i kdo má nejvíc) šel jen přečíst.
  const questions: ('radek' | 'sloupec' | 'kdo' | 'den')[] = withTotal ? ['sloupec', 'den'] : ['radek', 'sloupec', 'kdo', 'den'];
  const q = rng.pick(questions);
  if (q === 'radek') {
    const r = rng.int(0, kids.length - 1);
    const kid = kids[r];
    return {
      kind: 'number',
      key: `${baseKey}-radek-${kid.code}`,
      prompt: `${intro} Kolik jablek nasbíral${kid.f ? 'a' : ''} ${kid.label} za všechny tři dny?`,
      visual,
      correct: rowSums[r],
      hints: [`Najdi řádek „${kid.label}“.`, 'Sečti čísla v celém řádku.'],
      explain: `${grid[r].join(' + ')} = ${rowSums[r]}.`,
      difficulty: 0,
    };
  }
  if (q === 'sloupec') {
    const d = rng.int(0, days.length - 1);
    return {
      kind: 'number',
      key: `${baseKey}-sloupec-${d}`,
      prompt: `${intro} Kolik jablek nasbíraly všechny děti dohromady ${days[d].in}?`,
      visual,
      correct: colSums[d],
      hints: [`Najdi sloupec „${days[d].short}“.`, 'Sečti čísla v celém sloupci.'],
      explain: `${grid.map((row) => row[d]).join(' + ')} = ${colSums[d]}.`,
      difficulty: 0.1,
    };
  }
  if (q === 'kdo') {
    const best = Math.max(...rowSums);
    if (rowSums.filter((s) => s === best).length !== 1) return null;
    const r = rowSums.indexOf(best);
    return {
      key: `${baseKey}-kdo`,
      prompt: `${intro} Kdo nasbíral za tři dny nejvíc jablek?`,
      visual,
      correct: kids[r].label,
      wrong: kids.filter((_, i) => i !== r).map((k) => k.label),
      hints: ['Sečti každý řádek zvlášť.', 'Porovnej součty.'],
      explain: `Součty: ${kids.map((k, i) => `${k.label} ${rowSums[i]}`).join(', ')}. Nejvíc má ${kids[r].label}.`,
      difficulty: 0.3,
    };
  }
  const best = Math.max(...colSums);
  if (colSums.filter((s) => s === best).length !== 1) return null;
  const d = colSums.indexOf(best);
  return {
    key: `${baseKey}-den`,
    prompt: `${intro} Ve který den nasbíraly děti nejvíc jablek?`,
    visual,
    correct: days[d].In,
    wrong: days.filter((_, i) => i !== d).map((x) => x.In),
    hints: ['Sečti každý sloupec zvlášť.', 'Porovnej součty.'],
    explain: `Součty: ${days.map((x, i) => `${x.short} ${colSums[i]}`).join(', ')}. Nejvíc jablek bylo ${days[d].in}.`,
    difficulty: 0.3,
  };
}

const STUPEN: Forms = ['stupeň', 'stupně', 'stupňů'];

/** Teploty ráno, v poledne a večer (L4–L5). */
function temperatureTable(level: 4 | 5, rng: Rng): Spec | null {
  const days = DAYS.slice(0, rng.int(3, 5));
  const rows = days.map(() => {
    const morning = rng.int(2, 12);
    const noon = morning + rng.int(2, 10);
    const evening = rng.int(morning, noon - 1);
    return [morning, noon, evening];
  });
  const cells: (string | number | null)[] = ['Den', 'Ráno', 'Poledne', 'Večer', ...days.flatMap((d, i) => [d.short, ...rows[i]])];
  const visual: Visual = { type: 'table', cols: 4, head: 'row', cells };
  const baseKey = `teploty-${rows.map((r) => r.join('-')).join('-')}`;
  const intro = 'Leif měřil venku teplotu ve stupních.';
  const warm = rows.map((r) => r[1] - r[0]);
  const q = level === 4 ? rng.pick(['oteplilo', 'poledne'] as const) : rng.pick(['nejvic', 'poledne', 'oteplilo'] as const);
  if (q === 'oteplilo') {
    const i = rng.int(0, days.length - 1);
    return {
      kind: 'number',
      key: `${baseKey}-oteplilo-${i}`,
      prompt: `${intro} O kolik stupňů se ${days[i].in} oteplilo od rána do poledne?`,
      visual,
      correct: warm[i],
      hints: [`Najdi řádek „${days[i].short}“.`, 'Od polední teploty odečti ranní.'],
      explain: `${days[i].In} bylo ráno ${rows[i][0]} a v poledne ${count(rows[i][1], STUPEN)}: ${rows[i][1]} − ${rows[i][0]} = ${warm[i]}.`,
      difficulty: 0.1,
    };
  }
  if (q === 'poledne') {
    const noons = rows.map((r) => r[1]);
    const best = Math.max(...noons);
    if (noons.filter((x) => x === best).length !== 1) return null;
    const i = noons.indexOf(best);
    return {
      key: `${baseKey}-poledne`,
      prompt: `${intro} Ve který den bylo v poledne nejtepleji?`,
      visual,
      correct: days[i].In,
      wrong: days.filter((_, j) => j !== i).map((d) => d.In),
      hints: ['Dívej se jen do sloupce „Poledne“.', 'Najdi největší číslo.'],
      explain: `Ve sloupci „Poledne“ je největší číslo ${best}, a to ${days[i].in}.`,
      difficulty: -0.1,
    };
  }
  const best = Math.max(...warm);
  if (warm.filter((x) => x === best).length !== 1) return null;
  const i = warm.indexOf(best);
  return {
    key: `${baseKey}-nejvic`,
    prompt: `${intro} Ve který den se od rána do poledne oteplilo nejvíc?`,
    visual,
    correct: days[i].In,
    wrong: days.filter((_, j) => j !== i).map((d) => d.In),
    hints: ['U každého dne odečti ranní teplotu od polední.', 'Porovnej rozdíly.'],
    explain: `Oteplení: ${days.map((d, j) => `${d.short} ${warm[j]}`).join(', ')}. Nejvíc ${days[i].in}: o ${count(best, STUPEN)}.`,
    difficulty: 0.4,
  };
}

// ---------------------------------------------------------------------------

/** Podíl druhů úloh podle úrovně: čárky, karty, tabulky, jinak graf. */
const MIX: Record<DataLevel, { tally: number; cards: number; table: number }> = {
  1: { tally: 0.3, cards: 0, table: 0 },
  2: { tally: 0.25, cards: 0.25, table: 0 },
  3: { tally: 0, cards: 0.35, table: 0 },
  4: { tally: 0, cards: 0, table: 0.45 },
  5: { tally: 0, cards: 0, table: 0.45 },
};

function generate(level: DataLevel, rng: Rng): Spec {
  const mix = MIX[level];
  for (let attempt = 0; attempt < 200; attempt++) {
    const r = rng.next();
    let spec: Spec | null;
    if (r < mix.tally) spec = tallyQuestion(level as 1 | 2, rng);
    else if (r < mix.tally + mix.cards) spec = cardsQuestion(level as 2 | 3, rng);
    else if (r < mix.tally + mix.cards + mix.table) spec = rng.chance(0.6) ? applesTable(level as 4 | 5, rng) : temperatureTable(level as 4 | 5, rng);
    else spec = chartQuestion(level, rng.pick(QUESTIONS[level]), rng);
    if (spec) return spec;
  }
  // Pojistka: otázka na nejvyšší sloupec má vždy jedinou odpověď.
  return chartQuestion(level, 'max', rng)!;
}

export const dataSkill = bankSkill({
  id: ID,
  island: 'dilna',
  name: 'Data a grafy',
  description: 'Čte sloupcové grafy, čárkovací a obyčejné tabulky, třídí karty podle vlastností a pozná, na co data odpovědět neumějí.',
  rvp: {
    1: ['I-5-1-01'],
    2: ['I-5-1-01'],
    3: ['I-5-1-01'],
    4: ['I-5-1-03', 'M-5-2-02'],
    5: ['I-5-1-03', 'M-5-2-02'],
  },
  ability: 'usuzovani',
  gen: {
    1: (rng) => generate(1, rng),
    2: (rng) => generate(2, rng),
    3: (rng) => generate(3, rng),
    4: (rng) => generate(4, rng),
    5: (rng) => generate(5, rng),
  },
});

export const dataCards: KnowledgeCard[] = [
  {
    id: `${ID}.carky`,
    skillId: ID,
    level: 1,
    emoji: '✏️',
    title: 'Čárky po pěti',
    text: 'Když se něco rychle počítá, dělají se čárky. Po čtyřech čárkách se pátá často nakreslí napříč – z hotových pětek se pak výsledek sečte mnohem rychleji.',
  },
  {
    id: `${ID}.klementinum`,
    skillId: ID,
    level: 3,
    emoji: '🌡️',
    title: 'Měření, které trvá přes 250 let',
    text: 'V pražském Klementinu se teplota vzduchu měří každý den už od roku 1775. Díky tak dlouhé řadě měření vědci vidí, jak se teploty v Praze za tu dobu měnily.',
  },
  {
    id: `${ID}.osa`,
    skillId: ID,
    level: 5,
    emoji: '📊',
    title: 'Pozor na začátek osy',
    text: 'Když svislá osa sloupcového grafu nezačíná nulou, vypadá malý rozdíl jako obrovský. Než graf posoudíš, podívej se na čísla na ose.',
  },
];
