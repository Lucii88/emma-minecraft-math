// Rozsvítí se? Obvod s baterkou, žárovkami, vypínači a dráty – která
// žárovka svítí a proč. Proud teče jen v uzavřeném kruhu; za sebou má
// jednu společnou cestu, vedle sebe každá žárovka svou; drát vedle žárovky
// ji přemostí (proud jde raději drátem).

import { bankSkill, type ChoiceSpec, type FixedSpec, type NumberSpec, type Spec } from '../../core/bank';
import { BULB_NAME, batteryShorted, bulbsOf, litBulbs, whyBulb } from '../../core/circuit';
import { count } from '../../core/czech';
import type { Rng } from '../../core/rng';
import type { BulbColor, CircuitPart } from '../../core/types';
import { bulb, explainNet, gap, netKey, par, randomNet, ser, sw, wire, type NetOptions } from './common';

const ZAROVKA = ['žárovka', 'žárovky', 'žárovek'] as const;
const DOT: Record<BulbColor, string> = { r: '🔴', b: '🔵', g: '🟢', y: '🟡' };
const RULE = 'Proud teče jen dokola: z baterky přes žárovku a zase zpátky do baterky.';

const circuit = (...nets: CircuitPart[]) => ({ type: 'circuit' as const, nets, ...(nets.length > 1 ? { labels: nets.map((_, i) => 'ABC'[i]) } : {}) });
const colorOption = (b: BulbColor) => ({ label: `${DOT[b]} ${BULB_NAME[b].nom}`, speak: BULB_NAME[b].nom });

// ---------------------------------------------------------------------------
// Úroveň 1: jedna žárovka

/** Součástky do kruhu s jednou žárovkou; nejvýš jedna z nich kruh přeruší. */
const GOOD: CircuitPart[] = [wire, sw('A', true)];
const BAD: CircuitPart[] = [gap, sw('A', false), bulb('y', true)];

function oneBulb(rng: Rng): CircuitPart {
  const bad = rng.chance(0.55) ? rng.pick(BAD) : null;
  const parts: CircuitPart[] = [bad?.t === 'bulb' ? bad : bulb('y')];
  if (bad && bad.t !== 'bulb') parts.push(bad);
  const size = 1 + rng.int(1, 2);
  while (parts.length < size) parts.push(rng.pick(GOOD));
  // Vypínače pojmenovat A, B v pořadí kresby.
  let n = 0;
  return ser(...rng.shuffle(parts).map((p) => (p.t === 'switch' ? { ...p, id: 'AB'[n++] } : p)));
}

/** Co v obvodu s jednou žárovkou přerušilo kruh: „vypnutý vypínač A“. */
function brokenAt(net: CircuitPart): string {
  const w = whyBulb(net, 'y');
  if (w.lit) return '';
  if (w.why === 'broken') return 'prasklá žárovka';
  if (w.why === 'open' && w.cause.t === 'switch') return `vypnutý vypínač ${w.cause.id}`;
  return 'přerušený drát';
}

function shinesSpec(rng: Rng): FixedSpec {
  const net = oneBulb(rng);
  const lit = litBulbs(net).length > 0;
  return {
    kind: 'fixed',
    key: `sviti-${netKey(net)}`,
    prompt: 'Připojíme baterku. Rozsvítí se žárovka?',
    visual: circuit(net),
    options: ['Svítí', 'Nesvítí'],
    correct: lit ? 0 : 1,
    hints: [RULE, 'Projeď kruh prstem od plusu baterky. Nenarazíš na mezeru?'],
    explain: explainNet(net),
  };
}

const WHY_OPTIONS = { switch: 'Vypínač je vypnutý.', gap: 'Drát je přerušený.', bulb: 'Žárovka je prasklá.' } as const;

function whySpec(rng: Rng): ChoiceSpec {
  let net = oneBulb(rng);
  for (let i = 0; i < 50 && litBulbs(net).length > 0; i++) net = oneBulb(rng);
  if (litBulbs(net).length > 0) net = ser(bulb('y'), gap);
  const w = whyBulb(net, 'y');
  const cause = w.lit ? 'gap' : w.why === 'broken' ? 'bulb' : w.why === 'open' && w.cause.t === 'switch' ? 'switch' : 'gap';
  return {
    key: `proc-${netKey(net)}`,
    prompt: 'Proč žárovka nesvítí?',
    visual: circuit(net),
    correct: WHY_OPTIONS[cause],
    wrong: [...Object.values(WHY_OPTIONS).filter((o) => o !== WHY_OPTIONS[cause]), 'Baterka je otočená obráceně.'],
    hints: [RULE, 'Najdi místo, kde se kruh přerušil.'],
    explain: `${explainNet(net)} Žárovce je jedno, kterým směrem baterka stojí – svítí oběma směry.`,
  };
}

function whichCircuitSpec(rng: Rng): FixedSpec {
  for (let attempt = 0; attempt < 100; attempt++) {
    const nets = [oneBulb(rng), oneBulb(rng), oneBulb(rng)];
    const lit = nets.map((n) => litBulbs(n).length > 0);
    if (lit.filter(Boolean).length !== 1) continue;
    if (new Set(nets.map(netKey)).size < 3) continue;
    const correct = lit.indexOf(true);
    return {
      kind: 'fixed',
      key: `ktery-${nets.map(netKey).join('-')}`,
      prompt: 'Ve kterém obvodu svítí žárovka?',
      visual: circuit(...nets),
      options: ['A', 'B', 'C'],
      correct,
      hints: [RULE, 'Ve dvou obvodech je kruh někde přerušený. Kde?'],
      explain: `Svítí obvod ${'ABC'[correct]}: kruh je celý. ${nets
        .map((n, i) => (i === correct ? '' : `V obvodu ${'ABC'[i]} je ${brokenAt(n)}.`))
        .filter(Boolean)
        .join(' ')}`,
    };
  }
  return { kind: 'fixed', key: 'ktery-zaloha', prompt: 'Ve kterém obvodu svítí žárovka?', visual: circuit(ser(bulb('y'), gap), ser(bulb('y'), sw('A', true)), ser(bulb('y'), sw('A', false))), options: ['A', 'B', 'C'], correct: 1, hints: [RULE], explain: 'Svítí obvod B: kruh je celý. V obvodu A je přerušený drát, v obvodu C vypnutý vypínač.' };
}

// ---------------------------------------------------------------------------
// Úroveň 2: dvě žárovky za sebou a vedle sebe

function twoBulbs(rng: Rng): CircuitPart {
  const [x, y] = rng.shuffle<BulbColor>(['r', 'b', 'g', 'y']);
  const broken = rng.chance(0.5) ? rng.int(0, 1) : -1;
  const a = bulb(x, broken === 0);
  const b = bulb(y, broken === 1);
  const extra = rng.chance(0.5) ? [sw('A', rng.chance(0.7))] : [];
  return rng.chance(0.5) ? ser(a, b, ...extra) : ser(...extra, par(a, b));
}

function howManySpec(net: CircuitPart, prefix: string): NumberSpec {
  const n = litBulbs(net).length;
  return {
    kind: 'number',
    key: `${prefix}-${netKey(net)}`,
    prompt: 'Kolik žárovek svítí?',
    visual: circuit(net),
    correct: n,
    hints: [RULE, bulbsOf(net).length > 1 ? 'Vezmi žárovky jednu po druhé: dokáže k ní proud doběhnout a zase se vrátit?' : 'Projeď kruh prstem.'],
    explain: n === 0 ? explainNet(net) : explainNet(net).replace(/^Svítí ([^.]*)\./, `Svítí ${count(n, ZAROVKA)}: $1.`),
  };
}

/** Na kterou žárovku se ptát: ne na prasklou (ta nesvítí, to je vidět). */
function askAbout(net: CircuitPart, rng: Rng): BulbColor {
  const whole = bulbsOf(net).filter((b) => {
    const w = whyBulb(net, b);
    return w.lit || w.why !== 'broken';
  });
  return rng.pick(whole.length ? whole : bulbsOf(net));
}

function doesItShineSpec(net: CircuitPart, b: BulbColor): FixedSpec {
  const lit = litBulbs(net).includes(b);
  return {
    kind: 'fixed',
    key: `sviti-${b}-${netKey(net)}`,
    prompt: `Svítí ${BULB_NAME[b].nom} žárovka?`,
    visual: circuit(net),
    options: ['Svítí', 'Nesvítí'],
    correct: lit ? 0 : 1,
    hints: [RULE, 'Za sebou mají žárovky jednu společnou cestu, vedle sebe každá svou.'],
    explain: explainNet(net),
  };
}

function fixItSpec(rng: Rng): ChoiceSpec {
  const n = rng.int(2, 3);
  const off = rng.int(0, n - 1);
  const sws = Array.from({ length: n }, (_, i) => sw('ABC'[i], i !== off));
  const parts = rng.shuffle<CircuitPart>([bulb('y'), ...sws]);
  const net = ser(...parts);
  const id = 'ABC'[off];
  return {
    key: `oprav-${netKey(net)}`,
    prompt: 'Co musíš udělat, aby se žárovka rozsvítila?',
    visual: circuit(net),
    correct: `Zapnout vypínač ${id}`,
    wrong: [...'ABC'.slice(0, n).split('').filter((x) => x !== id).map((x) => `Vypnout vypínač ${x}`), 'Otočit baterku', 'Nic, už svítí'],
    hints: [RULE, 'Vypínače jsou za sebou: zapnuté musí být všechny.'],
    explain: `Vypínač ${id} je vypnutý a kruh přerušuje. Když ho zapneš, proud oběhne celý kruh a žárovka se rozsvítí.`,
  };
}

// ---------------------------------------------------------------------------
// Úroveň 3–5: náhodné obvody

const OPTS: Record<3 | 4 | 5, NetOptions> = {
  3: { bulbs: [2, 3], switches: [0, 2], depth: 1, broken: true },
  4: { bulbs: [2, 3], switches: [0, 3], depth: 2, broken: true, bypass: true },
  5: { bulbs: [3, 4], switches: [1, 3], depth: 2, broken: true, bypass: true, gaps: true },
};

/** Obvod s přemostěnou žárovkou (úroveň 4–5 ho chce aspoň v polovině úloh). */
const hasBypassNow = (net: CircuitPart) => bulbsOf(net).some((b) => {
  const w = whyBulb(net, b);
  return !w.lit && w.why === 'bypass';
});

function netFor(level: 3 | 4 | 5, rng: Rng): CircuitPart {
  const wantBypass = level >= 4 && rng.chance(0.5);
  for (let attempt = 0; attempt < 500; attempt++) {
    const net = randomNet(rng, OPTS[level]);
    if (!net || batteryShorted(net)) continue;
    if (wantBypass && !hasBypassNow(net)) continue;
    // Ne všechno zhasnuté a ne všechno svítící – ať je o čem přemýšlet.
    const lit = litBulbs(net).length;
    if (lit === 0 && rng.chance(0.7)) continue;
    if (lit === bulbsOf(net).length && rng.chance(0.7)) continue;
    return net;
  }
  return ser(bulb('r'), par(bulb('b'), wire), sw('A', true));
}

function whichSpec(net: CircuitPart, lit: boolean): ChoiceSpec | null {
  const all = bulbsOf(net);
  const on = litBulbs(net);
  const pick = lit ? on : all.filter((b) => !on.includes(b));
  if (pick.length !== 1) return null;
  return {
    key: `${lit ? 'ktera' : 'nesviti'}-${netKey(net)}`,
    prompt: lit ? 'Která žárovka svítí?' : 'Která žárovka nesvítí?',
    visual: circuit(net),
    correct: colorOption(pick[0]),
    wrong: all.filter((b) => b !== pick[0]).map(colorOption),
    hints: [RULE, 'Vezmi žárovky jednu po druhé. Nevede vedle některé drát?'],
    explain: explainNet(net),
  };
}

function randomSpec(level: 3 | 4 | 5, rng: Rng): Spec {
  const net = netFor(level, rng);
  const r = rng.next();
  if (r < 0.4) return howManySpec(net, 'kolik');
  const which = whichSpec(net, r < 0.7);
  if (which) return which;
  return doesItShineSpec(net, askAbout(net, rng));
}

// ---------------------------------------------------------------------------
// Ručně psané úlohy: zkrat a Vánoce

const SHORT_BANK: Spec[] = [
  {
    key: 'zkrat-drat-vedle-baterky',
    prompt: 'Drak přidal drát, který vede od baterky rovnou zpátky do baterky. Co se stane?',
    visual: circuit(par(ser(bulb('r'), bulb('b')), wire)),
    correct: 'Nic nesvítí a baterka se zahřívá.',
    wrong: ['Obě žárovky svítí jasněji.', 'Svítí jen červená.', 'Nic se nestane, svítí dál.'],
    hints: [RULE, 'Proud si vždycky najde cestu, kde mu nic nestojí v cestě.'],
    explain: 'To je zkrat: proud jde jen drátem, kolem žárovek. Žádná nesvítí a baterka se zahřívá a rychle vybije. Zkrat se nedělá ani s baterkou.',
  },
  {
    key: 'retez-za-sebou',
    prompt: 'Na vánočním řetězu jsou žárovky za sebou. Jedna praskne. Co se stane?',
    visual: circuit(ser(bulb('r'), bulb('b', true), bulb('g'))),
    correct: 'Zhasnou všechny.',
    wrong: ['Zhasne jen ta prasklá.', 'Ostatní budou svítit jasněji.'],
    hints: [RULE, 'Za sebou mají všechny žárovky jednu společnou cestu.'],
    explain: 'Za sebou mají žárovky jednu cestu. Prasklá žárovka kruh přeruší, a tak zhasnou všechny.',
  },
  {
    key: 'retez-vedle-sebe',
    prompt: 'Tady jsou žárovky vedle sebe. Jedna praskne. Co se stane?',
    visual: circuit(par(bulb('r'), bulb('b', true), bulb('g'))),
    correct: 'Ostatní svítí dál.',
    wrong: ['Zhasnou všechny.', 'Zhasne i baterka.'],
    hints: [RULE, 'Vedle sebe má každá žárovka svou vlastní cestu.'],
    explain: 'Vedle sebe má každá žárovka svou cestu. Prasklá přeruší jen tu svou, ostatní svítí dál. Tak jsou zapojená světla doma.',
  },
];

export const FALLBACK_NET = ser(bulb('r'), par(bulb('b'), wire), sw('A', true));

export const obvodSkill = bankSkill({
  id: 'blesky.obvod',
  island: 'blesky',
  name: 'Rozsvítí se?',
  description: 'Čte obrázek obvodu: pozná uzavřený a přerušený kruh, zapojení za sebou a vedle sebe, prasklou žárovku, drát, který žárovku přemostí, a zkrat.',
  rvp: {
    1: ['ČJS-3-4-03'],
    2: ['ČJS-3-4-03'],
    3: ['ČJS-3-4-03'],
    4: ['ČJS-5-4-06', 'I-5-1-03'],
    5: ['ČJS-5-4-06', 'I-5-1-03'],
  },
  ability: 'usuzovani',
  banks: { 4: SHORT_BANK },
  genShare: 0.8,
  gen: {
    1: (rng) => (rng.chance(0.4) ? shinesSpec(rng) : rng.chance(0.5) ? whySpec(rng) : whichCircuitSpec(rng)),
    2: (rng) => {
      const r = rng.next();
      if (r < 0.35) return howManySpec(twoBulbs(rng), 'dve');
      if (r < 0.7) {
        const net = twoBulbs(rng);
        return doesItShineSpec(net, askAbout(net, rng));
      }
      return fixItSpec(rng);
    },
    3: (rng) => randomSpec(3, rng),
    4: (rng) => randomSpec(4, rng),
    5: (rng) => randomSpec(5, rng),
  },
});
