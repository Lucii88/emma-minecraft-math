// Vynálezecká dílna – umělá inteligence a digitální svět: AI, nebo ne?, Nauč
// stroj z příkladů, Oprav Hugina a Soukromí a bezpečí online. Kromě společné
// kontroly úloh test nezávisle přepočítává fakta a řešitelnost: tabulku
// zařízení s AI, pravdivost a počty v Huginových tvrzeních, pravidla silných
// hesel a hlavně to, že nálepky na kartách a čísla v tabulkách vedou
// u „Nauč stroj“ k jediné odpovědi.

import { describe, expect, it } from 'vitest';
import { digitalniCards, digitalniMissions, digitalniSkills } from '../src/content/dilna/digitalni';
import { enumerateItems } from '../src/core/bank';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const EXPECTED_LEVELS: Record<string, Level[]> = {
  'dilna.ai': [1, 2, 3, 4],
  'dilna.stroj': [2, 3, 4, 5, 6],
  'dilna.hugin': [1, 2, 3, 4, 5],
  'dilna.soukromi': [1, 2, 3, 4],
};

const EXPECTED_ABILITY: Record<string, string> = {
  'dilna.ai': 'znalosti',
  'dilna.stroj': 'usuzovani',
  'dilna.hugin': 'usuzovani',
  'dilna.soukromi': 'znalosti',
};

/** Kódy očekávaných výstupů ověřené v plném textu RVP ZV 2021. */
const RVP_KNOWN = new Set([
  'ČJS-3-3-03', 'ČJS-3-4-02', 'ČJS-3-4-03', 'ČJS-3-5-02', 'ČJS-3-5-03', 'ČJS-5-4-06',
  'I-5-1-01', 'I-5-1-02', 'I-5-1-03', 'I-5-2-04', 'I-5-3-01', 'I-5-4-02', 'I-5-4-03',
]);

const skill = (id: string): SkillDef => digitalniSkills.find((s) => s.id === id)!;
const itemsOf = (s: SkillDef): Item[] => s.levels.flatMap((l) => enumerateItems(s.id, l));
const keyOf = (item: Item) => item.id.split(':')[2];
const lower = (s: string) => s.toLocaleLowerCase('cs');

function correctLabel(item: Item): string {
  if (item.answer.kind !== 'choice') throw new Error(`${item.id}: čekám výběr`);
  return item.answer.options[item.answer.correct].label;
}

function optionLabels(item: Item): string[] {
  if (item.answer.kind !== 'choice') throw new Error(`${item.id}: čekám výběr`);
  return item.answer.options.map((o) => o.label);
}

function texts(item: Item): string[] {
  const out = [item.prompt, item.explanation, ...item.hints];
  if (item.speak) out.push(item.speak);
  if (item.answer.kind === 'choice') for (const o of item.answer.options) out.push(o.label, ...(o.speak ? [o.speak] : []));
  if (item.answer.kind === 'order') out.push(...item.answer.correct);
  const v = item.visual;
  if (v?.type === 'cards') for (const c of v.cards) out.push(c.title, ...(c.lines ?? []), ...(c.tag ? [c.tag] : []));
  if (v?.type === 'steps') out.push(...v.steps, ...(v.title ? [v.title] : []));
  return out;
}

/** Stálá tlačítka (fixed) poznáme podle toho, že se jejich pořadí nemění. */
const FIXED_SETS = [
  ['Používá AI', 'Nepoužívá AI'],
  ['Pravda', 'Nepravda'],
  ['Poznává', 'Tvoří'],
  ['Hugin má pravdu', 'Hugin se plete'],
  ['Soukromé', 'Můžu napsat'],
  ['Silné', 'Slabé'],
  ['Bezpečné', 'Není bezpečné'],
  ['Potřebuje', 'Nepotřebuje'],
];
const isFixedItem = (item: Item) =>
  item.answer.kind === 'choice' &&
  (/:(trid|nn|remiza|soucet|tri|kde-vypocet|kde-postup)-/.test(item.id) ||
    FIXED_SETS.some((set) => JSON.stringify(optionLabels(item)) === JSON.stringify(set)));

const allItems = digitalniSkills.flatMap(itemsOf);

/** Text bez značek {ženský|mužský}. */
const unmarked = (t: string) => t.replace(/\{[^{}|]*\|[^{}|]*\}/g, '');
/** Ženský tvar o hráči bez značky: „jsi vyhrála“, „bys ověřila“, „máš ráda“, „dcera“. */
const FEMININE_ONLY = /(^|[^\p{L}])(dcer\p{L}*|\p{L}+la (jsi|bys)|(jsi|a?bys|kdybys)( \p{L}+){0,3} \p{L}+la|máš ráda|chodíš sama)([^\p{L}]|$)/u;

// ---------------------------------------------------------------------------

describe('Dílna, digitální svět – dovednosti', () => {
  it('má čtyři dovednosti se správnými id, ostrovem, úrovněmi a typem myšlení', () => {
    expect(digitalniSkills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED_LEVELS).sort());
    for (const s of digitalniSkills) {
      expect(s.island).toBe('dilna');
      expect(s.levels, s.id).toEqual(EXPECTED_LEVELS[s.id]);
      expect(s.ability, s.id).toBe(EXPECTED_ABILITY[s.id]);
      expect(s.name.trim()).not.toBe('');
      expect(s.description.trim(), s.id).toMatch(/\.$/);
      expect(s.open ?? false).toBe(false);
    }
  });

  it('každá úroveň do L5 má skutečný kód RVP (L1–L3 z 1. období, vyšší z 2. období)', () => {
    for (const s of digitalniSkills) {
      for (const [lv, codes] of Object.entries(s.rvp)) {
        expect(s.levels, `${s.id}: RVP pro úroveň ${lv}`).toContain(Number(lv));
        for (const c of codes ?? []) {
          expect(c).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
          expect(RVP_KNOWN.has(c), `${s.id}: neznámý kód ${c}`).toBe(true);
          expect(c.split('-')[1], `${s.id} L${lv}: ${c}`).toBe(Number(lv) <= 3 ? '3' : '5');
        }
      }
      for (const l of s.levels) if (l <= 5) expect(s.rvp[l]?.length ?? 0, `${s.id} L${l}`).toBeGreaterThan(0);
    }
  });

  for (const s of digitalniSkills) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 300);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: každá úloha z banky je platná a jedinečná`, () => {
      for (const level of s.levels) {
        const items = enumerateItems(s.id, level);
        expect(items.length, `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
        for (const item of items) expect(validateItem(item, s, level)).toEqual([]);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size, `duplicitní klíče v ${s.id} L${level}`).toBe(ids.length);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${s.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const s of digitalniSkills) {
      for (const level of s.levels) expect(s.generate(level, createRng(42))).toEqual(s.generate(level, createRng(42)));
    }
  });

  it('stejné id má vždy stejné zadání, vizuál i správnou odpověď', () => {
    const seen = new Map<string, string>();
    for (const s of digitalniSkills) {
      for (const level of s.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const a = item.answer;
          const answer =
            a.kind === 'choice' ? a.options[a.correct].label : a.kind === 'number' ? String(a.correct) : a.kind === 'order' ? a.correct.join('|') : '';
          const content = `${item.prompt}|${JSON.stringify(item.visual ?? null)}|${answer}`;
          const before = seen.get(item.id);
          if (before !== undefined) expect(content, item.id).toBe(before);
          seen.set(item.id, content);
        }
      }
    }
  });

  it('zajímavost po správné odpovědi mají znalostní dovednosti, třídění strojem (postup) ne', () => {
    const SHOW_FACT: Record<string, boolean> = { 'dilna.ai': true, 'dilna.stroj': false, 'dilna.hugin': true, 'dilna.soukromi': true };
    for (const s of digitalniSkills) expect(s.showFact ?? false, s.id).toBe(SHOW_FACT[s.id]);
    // Zajímavost se ukazuje i po správné odpovědi: nezačíná hodnocením tvrzení.
    for (const s of digitalniSkills.filter((x) => x.showFact)) {
      for (const item of itemsOf(s)) expect(item.explanation, item.id).not.toMatch(/^(Opravdu|To není|Je to naopak|Ano|Ne)(?![\p{L}])/u);
    }
  });

  it('úroveň mimo rozsah dá úlohu nejbližší úrovně', () => {
    expect(skill('dilna.ai').generate(6, createRng(1)).level).toBe(4);
    expect(skill('dilna.stroj').generate(1, createRng(1)).level).toBe(2);
    expect(skill('dilna.hugin').generate(6, createRng(1)).level).toBe(5);
    expect(skill('dilna.soukromi').generate(5, createRng(1)).level).toBe(4);
  });
});

// ---------------------------------------------------------------------------

describe('Dílna, digitální svět – karty a mise', () => {
  it('karty projdou kontrolou, každá dovednost má aspoň tři a aspoň dvě jsou opravené stránky', () => {
    expect(validateCards(digitalniCards, digitalniSkills)).toEqual([]);
    for (const s of digitalniSkills) expect(digitalniCards.filter((c) => c.skillId === s.id).length, s.id).toBeGreaterThanOrEqual(3);
    expect(digitalniCards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(2);
    for (const c of digitalniCards) {
      if (c.fix) {
        expect(c.fix.before, c.id).toMatch(/[.!?]$/);
        expect(c.fix.evidence, c.id).toMatch(/[.!?]$/);
      }
    }
  });

  it('mise projdou kontrolou a jsou tři až čtyři', () => {
    expect(validateMissions(digitalniMissions, 'dilna')).toEqual([]);
    expect(digitalniMissions.length).toBeGreaterThanOrEqual(3);
    expect(digitalniMissions.length).toBeLessThanOrEqual(4);
    const ids = [...digitalniMissions.map((m) => m.id), ...digitalniCards.map((c) => c.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Hugin je v kartách i misích stroj, ne kamarád s city', () => {
    const all = [...digitalniCards.map((c) => JSON.stringify(c)), ...digitalniMissions.map((m) => JSON.stringify(m))].join(' ');
    expect(all).not.toMatch(/Hugin (má|cítí) (radost|city|rád)/);
  });
});

// ---------------------------------------------------------------------------
// AI, nebo ne?

/** Nezávislá tabulka: používá věc umělou inteligenci? Jen jednoznačné případy. */
const AI_TABULKA: Record<string, boolean> = {
  'hlasovy-asistent': true,
  prekladac: true,
  obliceje: true,
  'doporucovani-videi': true,
  chatbot: true,
  'poznavani-kytek': true,
  'kresleni-podle-popisu': true,
  diktovani: true,
  'zpev-ptaku': true,
  'automaticke-titulky': true,
  rukopis: true,
  'psi-ve-fotkach': true,
  'preklad-napisu': true,
  basnicka: true,
  'seznam-pisnicek': true,
  kalkulacka: false,
  'rychlovarna-konvice': false,
  vypinac: false,
  budik: false,
  kolo: false,
  zvonek: false,
  baterka: false,
  'auticko-na-klicek': false,
  'presypaci-hodiny': false,
  'hraci-skrinka': false,
  teplomer: false,
  'svetlo-s-cidlem': false,
  'automaticke-dvere': false,
  pokladna: false,
  'dalkovy-ovladac': false,
  'kuchynska-vaha': false,
  'automat-na-piti': false,
  'zamek-na-kod': false,
  stopky: false,
};

/** Tvrzení o AI (klíč `tvrzeni-…`): pravda? */
const AI_TVRZENI: Record<string, boolean> = {
  spi: false,
  city: false,
  elektrina: true,
  'vyrobili-lide': true,
  kalkulacka: false,
  vymysli: true,
  ziva: false,
  priklady: true,
  'jista-odpoved': false,
};

/** Poznává (false), nebo tvoří (true)? */
const AI_TVORI: Record<string, boolean> = {
  obrazek: true,
  kytka: false,
  pohadka: true,
  obliceje: false,
  pisnicka: true,
  ptak: false,
  slova: false,
};

describe('AI, nebo ne?', () => {
  const items = itemsOf(skill('dilna.ai'));

  it('třídění věcí odpovídá nezávislé tabulce a pokrývá ji celou', () => {
    const covered = new Set<string>();
    for (const item of items) {
      const m = keyOf(item).match(/^zarizeni-(.+)$/);
      if (!m) continue;
      expect(m[1] in AI_TABULKA, `${item.id}: věc chybí v tabulce`).toBe(true);
      expect(optionLabels(item)).toEqual(['Používá AI', 'Nepoužívá AI']);
      expect(correctLabel(item), item.id).toBe(AI_TABULKA[m[1]] ? 'Používá AI' : 'Nepoužívá AI');
      expect(item.prompt, item.id).toMatch(/ Používá AI\?$/);
      covered.add(m[1]);
    }
    expect([...covered].sort()).toEqual(Object.keys(AI_TABULKA).sort());
  });

  it('hraniční případy (vysavač, pračka, auta, roboti) v třídění nejsou', () => {
    for (const item of items.filter((i) => keyOf(i).startsWith('zarizeni-'))) {
      expect(lower(item.prompt), item.id).not.toMatch(/vysavač|pračk|robot|(^|[^\p{L}])aut(o|a|u|em)?([^\p{L}]|$)/u);
    }
  });

  it('na každé úrovni s tříděním jsou věci s AI i bez ní', () => {
    for (const level of [1, 2] as Level[]) {
      const sorted = enumerateItems('dilna.ai', level).filter((i) => keyOf(i).startsWith('zarizeni-'));
      const ai = sorted.filter((i) => correctLabel(i) === 'Používá AI').length;
      expect(ai, `L${level}`).toBeGreaterThanOrEqual(5);
      expect(sorted.length - ai, `L${level}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('tvrzení o AI a otázky poznává × tvoří odpovídají tabulkám', () => {
    let n = 0;
    for (const item of items) {
      const t = keyOf(item).match(/^tvrzeni-(.+)$/);
      if (t) {
        expect(t[1] in AI_TVRZENI, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(AI_TVRZENI[t[1]] ? 'Pravda' : 'Nepravda');
        n++;
      }
      const p = keyOf(item).match(/^prace-(.+)$/);
      if (p) {
        expect(p[1] in AI_TVORI, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(AI_TVORI[p[1]] ? 'Tvoří' : 'Poznává');
        n++;
      }
    }
    expect(n).toBe(Object.keys(AI_TVRZENI).length + Object.keys(AI_TVORI).length);
  });

  it('AI nikde nemá city ani není kamarád místo lidí', () => {
    for (const item of items) {
      if (!/city|kamarád/.test(item.prompt)) continue;
      expect(correctLabel(item), item.id).toMatch(/^(Ne|Nepravda|S rodiči)/);
    }
  });
});

// ---------------------------------------------------------------------------
// Oprav Hugina

const PRAVDU = 'Hugin má pravdu';
const PLETE = 'Hugin se plete';
/** Každé vysvětlení musí říct, jak se to ověří. */
const JAK_OVERIT = /ověř|spočít|změř|měřen|zvaž|pozorov|pokus|podívej|zeptáš|zeptej|najdeš|vytleskáš|nakreslíš|napíšeš|atlas|kalendář|kniz|knih|učebnic|slovník|encyklopedi|mapě|teploměr|pravítk|metr|zkouš|seznam|hvězdárn|hodinách|řekneš|sečteš|zjistil|vědci/i;

/** Přepočítá kroky výpočtu („3 krát 6 je 18.“, „4 krát 4, tedy 16 nohou.“,
 *  „Od 8:45 do 9:00 je 15 minut.“, „Celkem 2 hodiny a 35 minut.“). Krok, který
 *  nejde přepočítat, je null. */
function checkSteps(steps: string[]): (boolean | null)[] {
  const ops: Record<string, (a: number, b: number) => number> = {
    plus: (a, b) => a + b, a: (a, b) => a + b, minus: (a, b) => a - b, krát: (a, b) => a * b, děleno: (a, b) => a / b,
  };
  let minutes = 0;
  return steps.map((step) => {
    const m = step.match(/(\d+)(?: \p{L}+)? (plus|minus|krát|děleno|a) (\d+)(?: \p{L}+)?(?: je|, tedy) (\d+)/u);
    if (m) return ops[m[2]](Number(m[1]), Number(m[3])) === Number(m[4]);
    const conv = step.match(/^(\d+) metr\p{L}* je (\d+) centimetr/u);
    if (conv) return Number(conv[1]) * 100 === Number(conv[2]);
    const time = step.match(/^Od (\d+):(\d+) do (\d+):(\d+) (?:je|jsou) (\d+) (minut|hodiny|hodin|hodina)/);
    if (time) {
      const [h1, m1, h2, m2, n] = time.slice(1, 6).map(Number);
      const claimed = time[6].startsWith('minut') ? n : n * 60;
      minutes += claimed;
      return h2 * 60 + m2 - (h1 * 60 + m1) === claimed;
    }
    const total = step.match(/^Celkem (\d+) hodin\p{L}* a (\d+) minut/u);
    if (total) return Number(total[1]) * 60 + Number(total[2]) === minutes;
    return null;
  });
}

describe('Oprav Hugina', () => {
  const s = skill('dilna.hugin');

  it('tvrzení mají stálá tlačítka a v každé úrovni je pravdivých 35–65 %', () => {
    for (const level of s.levels) {
      const claims = enumerateItems(s.id, level).filter((i) => keyOf(i).startsWith('tvrzeni-'));
      expect(claims.length, `L${level}`).toBeGreaterThanOrEqual(15);
      for (const c of claims) {
        expect(optionLabels(c)).toEqual([PRAVDU, PLETE]);
        expect(c.prompt, c.id).toMatch(/^Hugin říká: „.+[.!]“ Má pravdu\?$/);
      }
      const share = claims.filter((c) => correctLabel(c) === PRAVDU).length / claims.length;
      expect(share, `L${level}: podíl pravdivých`).toBeGreaterThanOrEqual(0.35);
      expect(share, `L${level}: podíl pravdivých`).toBeLessThanOrEqual(0.65);
    }
  });

  it('vysvětlení vždy říká, jak se to ověří', () => {
    for (const item of itemsOf(s)) expect(item.explanation, item.id).toMatch(JAK_OVERIT);
  });

  it('vysvětlení navazuje na tvrzení: nic nového nespadne z nebe', () => {
    const tucnaci = itemsOf(s).find((i) => keyOf(i) === 'tvrzeni-tucnaci')!;
    expect(tucnaci.explanation).toMatch(/severním pólu/);
    // Lední medvědi jsou výslovně provázaní se severním pólem.
    if (/lední medvěd/.test(tucnaci.explanation)) expect(tucnaci.explanation).toMatch(/Tam místo nich žijí lední medvědi/);
  });

  it('počty v Huginových tvrzeních sedí s tím, jestli má pravdu', () => {
    const ops: Record<string, (a: number, b: number) => number> = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b };
    let checked = 0;
    for (const item of itemsOf(s)) {
      const m = item.prompt.match(/„(\d+) ([+−×:]) (\d+) = (\d+)\.“/);
      if (!m) continue;
      const truth = ops[m[2]](Number(m[1]), Number(m[3])) === Number(m[4]);
      expect(correctLabel(item), item.id).toBe(truth ? PRAVDU : PLETE);
      expect(item.speak, `${item.id}: symboly potřebují předčítání`).toBeDefined();
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(12);
  });

  it('i výpočty ve vysvětleních jsou správně', () => {
    const ops: Record<string, (a: number, b: number) => number> = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b };
    let checked = 0;
    for (const item of itemsOf(s)) {
      for (const m of item.explanation.matchAll(/(?<![\d ]\d*[+−×:] )(\d+) ([+−×:]) (\d+) = (\d+(?: \d{3})*)(?! [+−×:])/g)) {
        expect(ops[m[2]](Number(m[1]), Number(m[3])), `${item.id}: ${m[0]}`).toBe(Number(m[4].replace(/ /g, '')));
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });

  it('„Ve kterém kroku se spletl?“ – první chybný krok výpočtu přepočítá test', () => {
    let checked = 0;
    for (const item of itemsOf(s)) {
      if (!keyOf(item).startsWith('kde-vypocet-')) continue;
      if (item.visual?.type !== 'steps') throw new Error(`${item.id}: chybí kroky`);
      const results = checkSteps(item.visual.steps);
      const first = results.findIndex((r) => r === false);
      expect(first, `${item.id}: žádný chybný krok`).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < first; i++) expect(results[i], `${item.id}: krok ${i + 1} musí být ověřitelný a správný`).toBe(true);
      expect(correctLabel(item), item.id).toBe(`${first + 1}. krok`);
      expect(optionLabels(item)).toEqual(item.visual.steps.map((_, i) => `${i + 1}. krok`));
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(8);
  });

  it('„Kde se spletl?“ má právě jednu chybnou větu a ta je mezi kroky', () => {
    for (const item of itemsOf(s)) {
      if (!/^kde-/.test(keyOf(item)) || /^kde-(vypocet|postup)-/.test(keyOf(item))) continue;
      if (item.visual?.type !== 'steps') throw new Error(`${item.id}: chybí kroky`);
      expect(item.visual.steps).toContain(correctLabel(item));
      expect([...optionLabels(item)].sort()).toEqual([...item.visual.steps].sort());
    }
  });

  it('„Jak to ověříš?“ – správně je vždy ověření, nikdy „zeptat se Hugina znovu“', () => {
    let n = 0;
    for (const item of itemsOf(s)) {
      if (!keyOf(item).startsWith('overit-')) continue;
      const c = correctLabel(item);
      expect(c, item.id).not.toMatch(/Hugin/);
      expect(c, item.id).toMatch(/Změř|Spočít|Zvážím|Podívám|Najdu|Půjdu|Zeptám se lékař|pokus|průzkum|Ověřit|Zjistit/);
      if (item.answer.kind === 'choice') n++;
    }
    expect(n).toBeGreaterThanOrEqual(15);
  });
});

// ---------------------------------------------------------------------------
// Nauč stroj z příkladů – nezávislý „stroj“ nad hotovými kartami a tabulkami

const NEJISTY = 'Stroj si není jistý';
const PODLE: Record<string, string> = {
  barva: 'Podle barvy', křídla: 'Podle křídel', ocas: 'Podle ocasu', domov: 'Podle domova', šupiny: 'Podle šupin',
  rohy: 'Podle rohů', oči: 'Podle očí', vzor: 'Podle vzoru', velikost: 'Podle velikosti', pozadí: 'Podle pozadí',
};

type CardV = Extract<Visual, { type: 'cards' }>['cards'][number];
interface Ex { attrs: string[]; values: string[]; tag: string; title: string }

function parseCard(c: CardV): Ex {
  const pairs = (c.lines ?? []).map((l) => {
    const m = l.match(/^(\p{L}+): (.+)$/u);
    if (!m) throw new Error(`řádek karty „${l}“ není „vlastnost: hodnota“`);
    return [m[1], m[2]];
  });
  return { attrs: pairs.map((p) => p[0]), values: pairs.map((p) => p[1]), tag: c.tag ?? '', title: c.title };
}

/** Řádky, ve kterých stejná hodnota znamená vždy stejnou nálepku. */
function ruleRows(ex: Ex[]): number[] {
  const n = ex[0].values.length;
  const rows: number[] = [];
  for (let a = 0; a < n; a++) {
    const map = new Map<string, Set<string>>();
    for (const e of ex) map.set(e.values[a], (map.get(e.values[a]) ?? new Set()).add(e.tag));
    if ([...map.values()].every((tags) => tags.size === 1)) rows.push(a);
  }
  return rows;
}

/** Co řekne stroj: nálepka, nebo NEJISTY (řádky si odporují nebo hodnotu nikdy neviděl). */
function machine(ex: Ex[], q: Ex): string {
  const rows = ruleRows(ex);
  const answers = rows.map((a) => ex.find((e) => e.values[a] === q.values[a])?.tag);
  if (!rows.length || answers.some((t) => t === undefined) || new Set(answers).size !== 1) return NEJISTY;
  return answers[0]!;
}

interface Tab { rows: { name: string; w: number; t: number; tag: string }[]; qw: number; qt: number }

function parseTable(item: Item): Tab {
  const v = item.visual;
  if (v?.type !== 'table') throw new Error(`${item.id}: chybí tabulka`);
  expect(v.cols).toBe(4);
  expect(v.cells.slice(0, 4)).toEqual(['Drak', 'Křídla', 'Ocas', 'Druh']);
  const rows: Tab['rows'] = [];
  let q: [number, number] | null = null;
  for (let i = 4; i < v.cells.length; i += 4) {
    const [name, w, t, tag] = v.cells.slice(i, i + 4);
    if (name === 'Nový') {
      expect(tag).toBeNull();
      expect(v.ask).toBe(i + 3);
      q = [Number(w), Number(t)];
    } else rows.push({ name: String(name), w: Number(w), t: Number(t), tag: String(tag) });
  }
  if (!q) throw new Error(`${item.id}: v tabulce chybí nový drak`);
  return { rows, qw: q[0], qt: q[1] };
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);

describe('Nauč stroj z příkladů', () => {
  const s = skill('dilna.stroj');
  const items = itemsOf(s);

  it('„Co řekne stroj?“ – nálepky v kartách vedou k jediné odpovědi', () => {
    let checked = 0;
    let unsure = 0;
    for (const item of items) {
      if (!keyOf(item).startsWith('trid-')) continue;
      const v = item.visual;
      if (v?.type !== 'cards') throw new Error(`${item.id}: chybí karty`);
      const marked = v.cards.filter((c) => c.mark);
      expect(marked.length, item.id).toBe(1);
      expect(marked[0].tag, item.id).toBe('?');
      const ex = v.cards.filter((c) => !c.mark).map(parseCard);
      const q = parseCard(marked[0]);
      for (const e of ex) expect(e.attrs, item.id).toEqual(q.attrs);
      expect(new Set(ex.map((e) => e.tag)).size, `${item.id}: příklady mají jen jednu nálepku`).toBeGreaterThanOrEqual(2);
      const expected = machine(ex, q);
      const labels = optionLabels(item);
      // Každá nálepka z příkladů je mezi tlačítky, nic navíc kromě „není jistý“.
      expect(labels.filter((l) => l !== NEJISTY).map(lower).sort(), item.id).toEqual([...new Set(ex.map((e) => e.tag))].sort());
      const got = correctLabel(item);
      expect(got === NEJISTY ? NEJISTY : lower(got), item.id).toBe(expected);
      if (expected === NEJISTY) unsure++;
      // Nový drak není kopií žádného příkladu (kromě zaujatých příkladů s jedinou vlastností).
      if (q.values.length > 1) expect(ex.some((e) => JSON.stringify(e.values) === JSON.stringify(q.values)), item.id).toBe(false);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(30);
    expect(unsure).toBeGreaterThanOrEqual(3);
  });

  it('„Co řekne stroj?“ – ani úvaha „nejpodobnější příklad“ nevede k jiné odpovědi', () => {
    // Dítě může místo řádku bez výjimky hledat příklad, který má s novým
    // drakem nejvíc shodných řádků (tak to hra učí na L5). Mezi nejpodobnějšími
    // příklady musí převažovat správná nálepka, u „není jistý“ nesmí mít
    // nejpodobnější příklady jen jednu nálepku.
    let n = 0;
    for (const item of items) {
      if (!keyOf(item).startsWith('trid-')) continue;
      const v = item.visual;
      if (v?.type !== 'cards') throw new Error(`${item.id}: chybí karty`);
      const ex = v.cards.filter((c) => !c.mark).map(parseCard);
      const q = parseCard(v.cards.find((c) => c.mark)!);
      const same = ex.map((e) => e.values.filter((x, i) => x === q.values[i]).length);
      const top = ex.filter((_, i) => same[i] === Math.max(...same)).map((e) => e.tag);
      const got = correctLabel(item);
      if (got === NEJISTY) {
        expect(new Set(top).size, `${item.id}: nejpodobnější příklady mají jen jednu nálepku`).toBeGreaterThan(1);
      } else {
        const votes = (t: string) => top.filter((x) => x === t).length;
        for (const t of new Set(top)) if (t !== lower(got)) expect(votes(lower(got)), `${item.id}: nejpodobnější je spíš ${t}`).toBeGreaterThan(votes(t));
      }
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(30);
  });

  it('L2–L3 mají jen jasné případy (bez možnosti „není jistý“)', () => {
    for (const level of [2, 3] as Level[]) {
      for (const item of enumerateItems(s.id, level)) {
        if (item.answer.kind === 'choice') expect(optionLabels(item), item.id).not.toContain(NEJISTY);
      }
    }
  });

  it('„Podle čeho se rozhoduje?“ – rozhoduje právě jeden řádek', () => {
    let n = 0;
    for (const item of items) {
      if (!keyOf(item).startsWith('podle-')) continue;
      const v = item.visual;
      if (v?.type !== 'cards') throw new Error(`${item.id}: chybí karty`);
      const ex = v.cards.map(parseCard);
      const rows = ruleRows(ex);
      expect(rows.length, item.id).toBe(1);
      expect(correctLabel(item), item.id).toBe(PODLE[ex[0].attrs[rows[0]]]);
      expect([...optionLabels(item)].sort(), item.id).toEqual(ex[0].attrs.map((a) => PODLE[a]).sort());
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(5);
  });

  it('„Který příklad má špatnou nálepku?“ – po odebrání právě jedné karty platí pravidlo', () => {
    let n = 0;
    for (const item of items) {
      if (!keyOf(item).startsWith('nesedi-')) continue;
      const v = item.visual;
      if (v?.type !== 'cards') throw new Error(`${item.id}: chybí karty`);
      const ex = v.cards.map(parseCard);
      expect(ruleRows(ex), `${item.id}: pravidlo nesmí platit pro všechny`).toEqual([]);
      const fits = ex.filter((_, i) => ruleRows(ex.filter((__, j) => j !== i)).length > 0);
      expect(fits.length, item.id).toBe(1);
      expect(correctLabel(item), item.id).toBe(fits[0].title);
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it('tabulky – nejbližší soused, remízy a tři nejbližší sedí s výpočtem', () => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.visual?.type !== 'table') continue;
      const kind = keyOf(item).match(/^(nn|remiza|soucet|tri|kdo|rozdil)-/)?.[1];
      if (!kind) throw new Error(`${item.id}: neznámý druh tabulky`);
      counts[kind] = (counts[kind] ?? 0) + 1;
      const x = parseTable(item);
      expect(x.rows.length).toBe(4);
      const d = (r: Tab['rows'][number]) => Math.abs(r.w - x.qw) + Math.abs(r.t - x.qt);
      const sorted = [...x.rows].sort((a, b) => d(a) - d(b));
      const min = d(sorted[0]);
      const nearestTags = new Set(x.rows.filter((r) => d(r) === min).map((r) => r.tag));
      expect(item.speak, `${item.id}: tabulka potřebuje předčítání`).toContain('nový drak');
      if (kind === 'nn' || kind === 'remiza' || kind === 'soucet') {
        expect(optionLabels(item)).toEqual(['Ohnivý', 'Vodní', NEJISTY]);
        expect(correctLabel(item), item.id).toBe(nearestTags.size === 1 ? cap([...nearestTags][0]) : NEJISTY);
        if (kind === 'remiza') expect(nearestTags.size, item.id).toBe(2);
        else expect(d(sorted[0]), item.id).toBeLessThan(d(sorted[1]));
      }
      if (kind === 'nn' || kind === 'kdo') {
        // Na L5 je nejbližší drak nejblíž v obou sloupcích, aby nerozhodoval způsob měření.
        const best = sorted[0];
        for (const r of x.rows) {
          expect(Math.abs(best.w - x.qw), item.id).toBeLessThanOrEqual(Math.abs(r.w - x.qw));
          expect(Math.abs(best.t - x.qt), item.id).toBeLessThanOrEqual(Math.abs(r.t - x.qt));
        }
      }
      if (kind === 'kdo') {
        expect(d(sorted[0]), item.id).toBeLessThan(d(sorted[1]));
        expect(correctLabel(item), item.id).toBe(`Drak ${sorted[0].name}`);
      }
      if (kind === 'tri') {
        expect(d(sorted[2]), `${item.id}: tři nejbližší nejsou jasně dané`).toBeLessThan(d(sorted[3]));
        const top = sorted.slice(0, 3).map((r) => r.tag);
        const major = ['ohnivý', 'vodní'].find((t) => top.filter((x) => x === t).length >= 2)!;
        expect(correctLabel(item), item.id).toBe(cap(major));
        expect(major, `${item.id}: tři nejbližší mají dopadnout jinak než jeden nejbližší`).not.toBe(sorted[0].tag);
      }
      if (kind === 'rozdil') {
        const name = item.prompt.match(/od draka ([A-D])\?/)![1];
        const r = x.rows.find((row) => row.name === name)!;
        expect(item.answer.kind === 'number' && item.answer.correct, item.id).toBe(d(r));
      }
    }
    for (const k of ['nn', 'remiza', 'soucet', 'tri', 'kdo', 'rozdil']) expect(counts[k] ?? 0, k).toBeGreaterThanOrEqual(4);
  });

  it('na L6 u součtu rozdílů někdy láká drak, který je blízko jen v jednom sloupci', () => {
    let tempting = 0;
    for (const item of enumerateItems(s.id, 6)) {
      if (!keyOf(item).startsWith('soucet-')) continue;
      const x = parseTable(item);
      const d = (r: Tab['rows'][number]) => Math.abs(r.w - x.qw) + Math.abs(r.t - x.qt);
      const best = [...x.rows].sort((a, b) => d(a) - d(b))[0];
      if (x.rows.some((r) => r.tag !== best.tag && (Math.abs(r.w - x.qw) < Math.abs(best.w - x.qw) || Math.abs(r.t - x.qt) < Math.abs(best.t - x.qt)))) tempting++;
    }
    expect(tempting).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Soukromí a bezpečí online

/** Nezávislá tabulka: co neznámému hráči nepíšeme. */
const SOUKROME: Record<string, boolean> = {
  heslo: true, pin: true, adresa: true, telefon: true, 'cesta-ze-skoly': true, skola: true, 'kde-jsi': true, prijmeni: true,
  barva: false, zvire: false, pohadka: false, jidlo: false, 'rocni-obdobi': false, 'barva-draka': false,
};

/** Potřebuje aplikace to oprávnění ke své práci? */
const OPRAVNENI: Record<string, boolean> = {
  'kalkulacka-mikrofon': false, 'videohovor-kamera': true, 'baterka-kontakty': false, 'mapa-poloha': true,
  'puzzle-mikrofon': false, 'zpev-mikrofon': true, 'budik-kamera': false, 'fotoaparat-kamera': true,
};

describe('Soukromí a bezpečí online', () => {
  const s = skill('dilna.soukromi');
  const items = itemsOf(s);

  it('soukromé údaje a oprávnění odpovídají tabulkám', () => {
    let n = 0;
    for (const item of items) {
      const u = keyOf(item).match(/^udaj-(.+)$/);
      if (u) {
        expect(u[1] in SOUKROME, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(SOUKROME[u[1]] ? 'Soukromé' : 'Můžu napsat');
        n++;
      }
      const o = keyOf(item).match(/^opravneni-(.+)$/);
      if (o) {
        expect(o[1] in OPRAVNENI, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(OPRAVNENI[o[1]] ? 'Potřebuje' : 'Nepotřebuje');
        n++;
      }
    }
    expect(n).toBe(Object.keys(SOUKROME).length + Object.keys(OPRAVNENI).length);
  });

  it('síla hesla odpovídá pravidlu: dlouhá věta je silná, krátké heslo slabé', () => {
    let n = 0;
    for (const item of items) {
      if (!keyOf(item).startsWith('heslo-') || item.answer.kind !== 'choice' || item.answer.options[0].label !== 'Silné') continue;
      const pw = item.prompt.match(/^Je heslo (\S+) silné, nebo slabé\?$/)![1];
      const strong = pw.length >= 16 && (pw.match(/\p{Lu}/gu) ?? []).length >= 3;
      const weak = pw.length <= 8;
      expect(strong || weak, `${item.id}: heslo ${pw} není jednoznačné`).toBe(true);
      expect(correctLabel(item), item.id).toBe(strong ? 'Silné' : 'Slabé');
      expect(item.speak, item.id).toBeDefined();
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(8);
    const best = items.find((i) => keyOf(i) === 'nejsilnejsi')!;
    const labels = optionLabels(best);
    expect(correctLabel(best)).toBe([...labels].sort((a, b) => b.length - a.length)[0]);
  });

  it('klidný tón bez strašení', () => {
    for (const item of items) {
      for (const t of texts(item)) expect(lower(t), item.id).not.toMatch(/smrt|zabi|krev|únos|unes|násil|vrah|strašn[ée] nebezpeč/);
    }
  });

  it('když píše neznámý člověk, neodpovídá se a řekne se to rodičům', () => {
    let n = 0;
    for (const item of items) {
      if (!/kterého neznáš|Někdo ve hře|někoho, koho neznáš/.test(item.prompt) || item.answer.kind !== 'choice') continue;
      expect(correctLabel(item), item.id).toMatch(/rodičům|Neodpovím|Není bezpečné/);
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------

describe('Dílna, digitální svět – texty', () => {
  it('výběr má 3–4 možnosti, stálá tlačítka 2–4', () => {
    for (const item of allItems) {
      if (item.answer.kind !== 'choice') continue;
      const n = item.answer.options.length;
      if (isFixedItem(item)) expect(n, item.id).toBeGreaterThanOrEqual(2);
      else expect(n, item.id).toBeGreaterThanOrEqual(3);
      expect(n, item.id).toBeLessThanOrEqual(4);
    }
  });

  it('možnosti jsou krátké, s velkým písmenem a s jednotnou interpunkcí', () => {
    for (const item of allItems) {
      if (item.answer.kind !== 'choice') continue;
      const labels = optionLabels(item);
      for (const l of labels) {
        expect(l.length, `${item.id}: „${l}“`).toBeLessThanOrEqual(40);
        expect(l, item.id).toMatch(/^[\p{Lu}\d]/u);
      }
      const ends = new Set(labels.map((l) => /[.?!]$/.test(l)));
      expect(ends.size, `${item.id}: ${labels.join(' | ')}`).toBe(1);
    }
  });

  it('nápověda ani zadání neprozrazují správnou odpověď', () => {
    for (const item of allItems) {
      if (item.answer.kind !== 'choice' || isFixedItem(item)) continue;
      const needle = lower(correctLabel(item));
      for (const t of [item.prompt, ...item.hints]) expect(lower(t).includes(needle), `${item.id}: „${t}“`).toBe(false);
    }
  });

  it('texty jsou čisté: interpunkce, české uvozovky, žádná zakázaná jména', () => {
    for (const item of allItems) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!;]/);
        expect((t.match(/„/g) ?? []).length, `${item.id}: „${t}“`).toBe((t.match(/“/g) ?? []).length);
        expect((t.match(/‚/g) ?? []).length, `${item.id}: „${t}“`).toBe((t.match(/‘/g) ?? []).length);
        expect(lower(t), item.id).not.toMatch(/(^|[^\p{L}])em+a([^\p{L}]|$)|kniha draků/u);
        expect(unmarked(t), `${item.id}: tvar o hráči bez značky rodu v „${t}“`).not.toMatch(FEMININE_ONLY);
      }
    }
  });

  it('zadání se symboly nebo tabulkou má text k předčítání bez symbolů', () => {
    for (const item of allItems) {
      if (/[+−×=]/.test(item.prompt) || item.visual?.type === 'table') {
        expect(item.speak, item.id).toBeDefined();
        expect(item.speak!, item.id).not.toMatch(/[+−×=]/);
      }
    }
  });

  it('karty a mise mají čisté texty', () => {
    for (const c of digitalniCards) {
      const all = [c.title, c.text, ...(c.fix ? [c.fix.before, c.fix.evidence] : [])];
      for (const t of all) {
        expect(t, c.id).not.toMatch(/\s{2,}|["']|\s[,.?!]/);
        expect((t.match(/„/g) ?? []).length, c.id).toBe((t.match(/“/g) ?? []).length);
      }
    }
    for (const m of digitalniMissions) {
      for (const t of [m.title, m.text, m.parentTip]) {
        expect(t, m.id).not.toMatch(/\s{2,}|["']|\s[,.?!]/);
        expect((t.match(/„/g) ?? []).length, m.id).toBe((t.match(/“/g) ?? []).length);
      }
      expect(m.text, m.id).not.toMatch(/\b(zkusil|udělal|našel) jsi\b/);
      // Oslovení hráče má obě podoby ({ověřila|ověřil}), mimo značky nezbude ženský tvar.
      for (const t of [m.text, m.parentTip]) expect(unmarked(t), m.id).not.toMatch(FEMININE_ONLY);
    }
  });
});
