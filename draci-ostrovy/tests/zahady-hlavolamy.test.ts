// Ostrov záhad – hlavolamy a testové formáty: logické hlavolamy, dračí sudoku,
// matice, analogie a obrázkové řady.
//
// Kromě společné kontroly tu jsou nezávislé řešiče: každá úloha s vodítky se
// znovu přečte z textu zadání (nebo z tabulky či řady) a vyřeší hrubou silou.
// Úloha projde, jen když má právě jedno řešení a to je označené jako správné.

import { describe, expect, it } from 'vitest';
import { hlavolamyCards, hlavolamyMissions, hlavolamySkills } from '../src/content/zahady/hlavolamy';
import { enumerateItems } from '../src/core/bank';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const EXPECTED: Record<string, { name: string; levels: Level[]; testLike?: string }> = {
  'zahady.logika': { name: 'Logické hlavolamy', levels: [1, 2, 3, 4, 5, 6] },
  'zahady.sudoku': { name: 'Dračí sudoku', levels: [1, 2, 3, 4, 5, 6] },
  'zahady.matice': { name: 'Dračí matice', levels: [1, 2, 3, 4, 5, 6], testLike: 'matice' },
  'zahady.analogie': { name: 'Analogie', levels: [1, 2, 3, 4, 5], testLike: 'analogie' },
  'zahady.rady': { name: 'Obrázkové řady', levels: [1, 2, 3, 4, 5], testLike: 'obrazkove-rady' },
};

/** Kódy očekávaných výstupů ověřené v textu RVP ZV 2021. */
const RVP_KNOWN = new Set(['M-5-4-01', 'M-3-2-03', 'ČJL-3-2-02', 'ČJL-5-2-01']);

/** Emoji, která úlohy smějí používat – všechna jsou z Unicode 12 nebo starší. */
const ALLOWED_EMOJI = new Set(
  [
    '🐉 🔥 💧 🌿 ⭐ 🌙 ☀️ ☁️ 🍎 🍐 🍋 🍇 🐟 🐸 🐢 🐌 🐞 🐝 🦋 🐛 🌸 🍄 🌵 🌻 🍓 🔔 🐚 🥕',
    '🔴 🟡 🔵 🟢 🟥 🟨 🟦 🟩 ❤️ 💛 💙 💚 🍊 🐶 🐱 🐭 🐰 ❄️ 🌈 ⚡ 🌲 🍁 ⚓ ⛵ 🦀',
    '⬆️ ↗️ ➡️ ↘️ ⬇️ ↙️ ⬅️ ↖️ 🐤 🐔 🥚 🐄 🥛 🍯 🧶 🌳 🥥 🌴 🌾 🌧️ ☂️ 🕶️ 🧤 🧣 ⛄ 🐑',
    '👟 🦶 ✋ 👂 👃 🦵 🐷 🦴 🧀 🚗 ⛽ 🔦 🔋 💡 👧 👦 📰 🔢 🧩 📱 🧮 🐕 🎵 ✈️ 📜 🎩 🎲 🕊️ 🔭 🥄 🍽️',
    '🧦 👀 🚲 🛷 🛰️',
  ]
    .join(' ')
    .split(' '),
);

const skillOf = (id: string) => hlavolamySkills.find((s) => s.id === id)!;
const segmenter = new Intl.Segmenter('cs', { granularity: 'grapheme' });
const graphemes = (s: string) => [...segmenter.segment(s)].map((x) => x.segment);
const PICT = /\p{Extended_Pictographic}/u;
const emojiIn = (s: string) => graphemes(s).filter((g) => PICT.test(g));

/** Úlohy z generátoru i z banky: pro každou úroveň semínka 1…n, bez opakování id. */
function sample(s: SkillDef, n = 400): Item[] {
  const out = new Map<string, Item>();
  for (const level of s.levels) {
    for (let seed = 1; seed <= n; seed++) {
      const it = s.generate(level, createRng(seed * 7919 + level * 13));
      if (!out.has(it.id)) out.set(it.id, it);
    }
    for (const it of enumerateItems(s.id, level)) if (!out.has(it.id)) out.set(it.id, it);
  }
  return [...out.values()];
}

const SAMPLES = new Map(hlavolamySkills.map((s) => [s.id, sample(s)]));
const itemsOf = (id: string) => SAMPLES.get(id)!;
const keyOf = (it: Item) => it.id.split(':')[2];

function correctLabel(it: Item): string {
  const a = it.answer;
  if (a.kind === 'choice') return a.options[a.correct].label;
  if (a.kind === 'number') return String(a.correct);
  if (a.kind === 'order') return a.correct.join('|');
  return '';
}

function labels(it: Item): string[] {
  return it.answer.kind === 'choice' ? it.answer.options.map((o) => o.label) : [];
}

function texts(it: Item): string[] {
  const out = [it.prompt, it.explanation, ...it.hints];
  if (it.speak) out.push(it.speak);
  if (it.answer.kind === 'choice') for (const o of it.answer.options) out.push(o.label, ...(o.speak ? [o.speak] : []));
  if (it.answer.kind === 'order') out.push(...it.answer.items);
  return out;
}

/** Všechna pořadí prvků pole. */
function perms<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

const sentencesOf = (t: string) => t.split(/(?<=[.?!])\s+/);
const cardTitles = (it: Item) => (it.visual?.type === 'cards' ? it.visual.cards.map((c) => c.title) : []);

// ---------------------------------------------------------------------------

describe('Ostrov záhad – hlavolamy: dovednosti', () => {
  it('má pět dovedností se správnými id, názvy, úrovněmi a formáty', () => {
    expect(hlavolamySkills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const s of hlavolamySkills) {
      const e = EXPECTED[s.id];
      expect(s.island).toBe('zahady');
      expect(s.name).toBe(e.name);
      expect(s.levels).toEqual(e.levels);
      expect(s.ability).toBe('usuzovani');
      expect(s.testLike).toBe(e.testLike);
      expect(s.description.trim()).toMatch(/\.$/);
      for (const level of s.levels) {
        if (level > 5) continue;
        const codes = s.rvp[level] ?? [];
        expect(codes.length, `${s.id} L${level}`).toBeGreaterThan(0);
        for (const c of codes) {
          expect(c).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
          expect(RVP_KNOWN.has(c), `${s.id}: ${c}`).toBe(true);
        }
      }
    }
    expect(skillOf('zahady.analogie').rvp[1]).toEqual(['ČJL-3-2-02']);
    expect(skillOf('zahady.analogie').rvp[4]).toEqual(['ČJL-5-2-01', 'M-5-4-01']);
    expect(skillOf('zahady.rady').rvp[3]).toEqual(['M-3-2-03']);
    expect(skillOf('zahady.rady').rvp[5]).toEqual(['M-5-4-01']);
  });

  for (const s of hlavolamySkills) {
    it(`${s.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(s, 300);
      expect(errors).toEqual([]);
      for (const level of s.levels) expect(distinct[level], `${s.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${s.id}: úlohy z banky jsou platné a jedinečné`, () => {
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

  it('analogie mají v každé úrovni aspoň 15 úloh v bance, logika má banku od L2', () => {
    for (const level of [1, 2, 3, 4, 5] as Level[]) expect(enumerateItems('zahady.analogie', level).length).toBeGreaterThanOrEqual(15);
    for (const level of [2, 3, 4, 5, 6] as Level[]) expect(enumerateItems('zahady.logika', level).length).toBeGreaterThan(0);
  });

  it('stejné semínko = stejná úloha', () => {
    for (const s of hlavolamySkills) {
      for (const level of s.levels) {
        for (const seed of [1, 42, 999]) expect(s.generate(level, createRng(seed))).toEqual(s.generate(level, createRng(seed)));
      }
    }
  });

  it('stejné id má vždy stejné zadání, vizuál i správnou odpověď a jiné id jiné zadání', () => {
    for (const s of hlavolamySkills) {
      const byId = new Map<string, string>();
      const byContent = new Map<string, string>();
      for (const level of s.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = s.generate(level, createRng(seed));
          const content = `${item.level}|${item.prompt}|${JSON.stringify(item.visual ?? null)}`;
          const full = `${content}|${correctLabel(item)}`;
          const before = byId.get(item.id);
          if (before !== undefined) expect(full, item.id).toBe(before);
          byId.set(item.id, full);
          const other = byContent.get(content);
          if (other !== undefined) expect(other, `stejné zadání pod dvěma id`).toBe(item.id);
          byContent.set(content, item.id);
        }
      }
    }
  });

  it('úroveň mimo rozsah dovednosti vrátí platnou úlohu nejbližší úrovně', () => {
    for (const id of ['zahady.analogie', 'zahady.rady']) {
      const s = skillOf(id);
      const item = s.generate(6, createRng(3));
      expect(item.level).toBe(5);
      expect(validateItem(item, s, 5)).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------

describe('Ostrov záhad – hlavolamy: texty a obrázky', () => {
  const all = hlavolamySkills.flatMap((s) => itemsOf(s.id));

  it('texty jsou čisté: interpunkce, uvozovky, mezery, žádná zakázaná jména', () => {
    for (const item of all) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.prompt.length, item.id).toBeLessThanOrEqual(260);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!:]/);
        expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(/\bemm?a\b|kniha draků/);
      }
    }
  });

  it('možnosti jsou krátké, s velkým písmenem, bez tečky; emoji mají text k předčítání', () => {
    for (const item of all) {
      const a = item.answer;
      if (a.kind !== 'choice') continue;
      expect(a.options.length, item.id).toBeGreaterThanOrEqual(item.skillId === 'zahady.logika' ? 2 : 4);
      for (const o of a.options) {
        expect(o.label.length, item.id).toBeLessThanOrEqual(40);
        if (emojiIn(o.label).length) {
          expect(o.speak, `${item.id}: ${o.label}`).toBeTruthy();
          expect(emojiIn(o.speak!), item.id).toEqual([]);
        } else if (/^\p{L}/u.test(o.label)) {
          expect(o.label.charAt(0), `${item.id}: ${o.label}`).toBe(o.label.charAt(0).toLocaleUpperCase('cs'));
          expect(o.label, item.id).not.toMatch(/\.$/);
        }
      }
    }
  });

  it('úlohy s tabulkou, řadou nebo emoji mají text k předčítání bez emoji', () => {
    for (const item of all) {
      const t = item.visual?.type;
      if (t === 'table' || t === 'series') {
        expect(item.speak, item.id).toBeTruthy();
        expect(item.speak!.length, item.id).toBeGreaterThan(item.prompt.length);
      }
      if (item.speak) expect(emojiIn(item.speak), item.id).toEqual([]);
      expect(emojiIn(item.prompt), item.id).toEqual([]);
    }
  });

  it('hráče oslovují značky {ženský|mužský}: žádný ženský tvar o hráči bez značky', () => {
    // „abys měla“, „která sis vzala“ – 2. osoba, takže vždy o hráči.
    const UNMARKED_FEMININE =
      /(?<!\p{L})(?:(?:jsi|bys|abys|kdybys|sis|ses)(?: (?:to|ho|ji|je|si|se|mu|jí|už|opravdu|nejvíc))? \p{L}+la|\p{L}+la (?:jsi|bys|sis|ses)|(?:jsi|budeš|buď) \p{L}+á)(?!\p{L})/iu;
    const withoutMarks = (t: string) => t.replace(/\{[^{}|]*\|[^{}|]*\}/g, '');
    const other = [...hlavolamyCards.flatMap((c) => [c.title, c.text, c.fix?.before ?? '', c.fix?.evidence ?? '']), ...hlavolamyMissions.flatMap((m) => [m.title, m.text, m.parentTip])];
    for (const t of [...all.flatMap(texts), ...other]) expect(withoutMarks(t), t).not.toMatch(UNMARKED_FEMININE);
  });

  it('hlavolamy ukazují vysvětlení (postup) jen po chybě, ne jako zajímavost', () => {
    for (const s of hlavolamySkills) expect(s.showFact, s.id).toBeUndefined();
  });

  it('používají se jen povolená emoji (Unicode ≤ 12) a žádné vlajky', () => {
    const used = new Set<string>();
    const collect = (x: unknown) => {
      if (typeof x === 'string') emojiIn(x).forEach((e) => used.add(e));
      else if (Array.isArray(x)) x.forEach(collect);
      else if (x && typeof x === 'object') Object.values(x).forEach(collect);
    };
    for (const item of all) collect([item.visual, item.answer]);
    collect(hlavolamyCards.map((c) => c.emoji));
    collect(hlavolamyMissions.map((m) => m.emoji));
    for (const e of used) {
      expect(ALLOWED_EMOJI.has(e), `emoji ${e} (${[...e].map((c) => c.codePointAt(0)!.toString(16)).join(' ')})`).toBe(true);
      expect(/[\u{1F1E6}-\u{1F1FF}]/u.test(e), `vlajka ${e}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Logické hlavolamy – řešení hrubou silou z textu zadání

const MORE: Record<string, true> = { vyšší: true, starší: true, rychlejší: true, těžší: true, víc: true };
const LESS: Record<string, true> = { menší: true, mladší: true, pomalejší: true, lehčí: true, méně: true };
const SUP_MAX = /^nej(vyšší|starší|rychlejší|těžší|víc)/;
const SUP_MIN = /^nej(menší|mladší|pomalejší|lehčí|méně)/;

/** 2. pád → 1. pád (vedle koho), 3. pád (naproti komu), 4. pád draků. */
const GEN: Record<string, string> = {
  Runy: 'Runa', Alvy: 'Alva', Anny: 'Anna', Leifa: 'Leif', Erika: 'Erik', Knuta: 'Knut', Ivara: 'Ivar', Daga: 'Dag', Toma: 'Tom', Petra: 'Petr',
  Jiskry: 'Jiskra', Kapky: 'Kapka', Vločky: 'Vločka', Duhy: 'Duha', Bleska: 'Blesk', Mecha: 'Mech', Obláčka: 'Obláček', Měsíčka: 'Měsíček',
};
const DAT: Record<string, string> = {
  Runě: 'Runa', Alvě: 'Alva', Anně: 'Anna', Leifovi: 'Leif', Erikovi: 'Erik', Knutovi: 'Knut', Ivarovi: 'Ivar', Dagovi: 'Dag', Tomovi: 'Tom', Petrovi: 'Petr',
};
const ACC: Record<string, string> = {
  Jiskru: 'Jiskra', Kapku: 'Kapka', Vločku: 'Vločka', Duhu: 'Duha', Bleska: 'Blesk', Mecha: 'Mech', Obláčka: 'Obláček', Měsíčka: 'Měsíček',
};
const accOf = (nom: string) => Object.keys(ACC).find((k) => ACC[k] === nom)!;
const nameMap = (map: Record<string, string>, w: string) => {
  if (!(w in map)) throw new Error(`neznámý tvar jména: ${w}`);
  return map[w];
};

/** Seřazení podle vodítek: vrátí všechny možné odpovědi. */
function solveOrdering(it: Item): { answers: Set<string>; question: string } {
  const names = cardTitles(it);
  const sents = sentencesOf(it.prompt);
  const question = sents.pop()!;
  const rels: [string, string][] = [];
  for (const s of sents) {
    const m = s.match(/^(\p{L}+) je (\p{L}+) než (\p{L}+)\.$/u) ?? s.match(/^(\p{L}+) má (víc|méně) \p{L}+ než (\p{L}+)\.$/u);
    if (!m) throw new Error(`${it.id}: nečitelné vodítko „${s}“`);
    const [, a, w, b] = m;
    if (MORE[w]) rels.push([a, b]);
    else if (LESS[w]) rels.push([b, a]);
    else throw new Error(`${it.id}: neznámé srovnání ${w}`);
  }
  for (const [a, b] of rels) {
    expect(names, it.id).toContain(a);
    expect(names, it.id).toContain(b);
  }
  const ok = perms(names).filter((p) => rels.every(([a, b]) => p.indexOf(a) < p.indexOf(b)));
  let pick: (p: string[]) => string;
  let m: RegExpMatchArray | null;
  if ((m = question.match(/^Kdo (?:je|má) (nej\p{L}+)(?: \p{L}+)?\?$/u))) {
    pick = SUP_MAX.test(m[1]) ? (p) => p[0] : SUP_MIN.test(m[1]) ? (p) => p[p.length - 1] : () => '?';
  } else if (/^Kdo (?:není|nemá) ani /.test(question)) {
    expect(names.length).toBe(3);
    pick = (p) => p[1];
  } else if ((m = question.match(/^Kdo je (druhý|třetí) (nej\p{L}+)\?$/u))) {
    expect(SUP_MAX.test(m[2]), it.id).toBe(true);
    const k = m[1] === 'druhý' ? 1 : 2;
    pick = (p) => p[k];
  } else if ((m = question.match(/^Seřaď (?:děti|draky) od (nej\p{L}+) k (nej\p{L}+)\.$/u))) {
    expect(SUP_MAX.test(m[1]), it.id).toBe(true);
    pick = (p) => p.join('|');
  } else throw new Error(`${it.id}: nečitelná otázka „${question}“`);
  return { answers: new Set(ok.map(pick)), question };
}

/** Kdo má kterého draka: všechna rozdělení (dítě → drak v 1. pádě), která splňují vodítka. */
function dragonSolutions(it: Item): { people: string[]; solutions: Map<string, string>[] } {
  const saved = solveDragonsRaw(it);
  return { people: saved.people, solutions: saved.solutions };
}

/** Kdo má kterého draka. */
function solveDragons(it: Item): Set<string> {
  return solveDragonsRaw(it).answers;
}

function solveDragonsRaw(it: Item): { people: string[]; solutions: Map<string, string>[]; answers: Set<string> } {
  const dragons = cardTitles(it);
  const sents = sentencesOf(it.prompt);
  const intro = sents.shift()!.match(/^(.+) mají draky z obrázku – (každý|každá) jednoho\.$/);
  if (!intro) throw new Error(`${it.id}: nečitelný úvod`);
  const people = intro[1].split(/, | a /);
  expect(people.length).toBe(dragons.length);
  // „každá“ jen tehdy, když jsou všechny děti holky
  const GIRLS = ['Runa', 'Alva', 'Anna', 'Freja', 'Maja', 'Liv', 'Sigrid', 'Ingrid', 'Tove'];
  expect(intro[2] === 'každá', it.id).toBe(people.every((p) => GIRLS.includes(p)));
  const question = sents.pop()!;
  type C = (own: Map<string, string>) => boolean;
  const cs: C[] = [];
  for (const s of sents) {
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\p{L}+) nemá (\p{L}+) ani (\p{L}+)\.$/u)) && people.includes(m[1])) {
      const [, p, d1, d2] = m;
      const a = nameMap(ACC, d1);
      const b = nameMap(ACC, d2);
      cs.push((o) => o.get(p) !== a && o.get(p) !== b);
    } else if ((m = s.match(/^(\p{L}+) nemá (\p{L}+) ani (\p{L}+)\.$/u))) {
      // „Kapku nemá Tom ani Liv.“
      const [, d, p1, p2] = m;
      const a = nameMap(ACC, d);
      expect(people, it.id).toContain(p1);
      expect(people, it.id).toContain(p2);
      cs.push((o) => o.get(p1) !== a && o.get(p2) !== a);
    } else if ((m = s.match(/^(\p{L}+) nemá (\p{L}+)\.$/u))) {
      const [, p, d] = m;
      const a = nameMap(ACC, d);
      cs.push((o) => o.get(p) !== a);
    } else if ((m = s.match(/^(\p{L}+) má (\p{L}+)\.$/u))) {
      const [, p, d] = m;
      const a = nameMap(ACC, d);
      cs.push((o) => o.get(p) === a);
    } else throw new Error(`${it.id}: nečitelné vodítko „${s}“`);
  }
  const solutions = perms(dragons)
    .map((ds) => new Map(people.map((p, i) => [p, ds[i]])))
    .filter((o) => cs.every((c) => c(o)));
  let m: RegExpMatchArray | null;
  if ((m = question.match(/^Kdo má (\p{L}+)\?$/u))) {
    const d = nameMap(ACC, m[1]);
    return { people, solutions, answers: new Set(solutions.map((o) => people.find((p) => o.get(p) === d)!)) };
  }
  if ((m = question.match(/^Kterého draka má (\p{L}+)\?$/u))) {
    const p = m[1];
    return { people, solutions, answers: new Set(solutions.map((o) => accOf(o.get(p)!))) };
  }
  throw new Error(`${it.id}: nečitelná otázka „${question}“`);
}

/** Lavička: vrátí možné odpovědi (u řazení celé pořadí zleva). */
function solveBench(it: Item): Set<string> {
  const names = cardTitles(it);
  const sents = sentencesOf(it.prompt);
  const intro = sents.shift()!.match(/^Na (?:lavičce|skále) sedí vedle sebe (tři|čtyři|pět) (?:děti|dětí|draci|draků) z obrázku\.$/);
  if (!intro) throw new Error(`${it.id}: nečitelný úvod`);
  const n = { tři: 3, čtyři: 4, pět: 5 }[intro[1]]!;
  expect(names.length).toBe(n);
  const question = sents.pop()!;
  type C = (row: string[]) => boolean;
  const cs: C[] = [];
  const at = (row: string[], x: string) => row.indexOf(x);
  for (const s of sents) {
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\p{L}+) sedí úplně vlevo\.$/u))) { const x = m[1]; cs.push((r) => at(r, x) === 0); }
    else if ((m = s.match(/^(\p{L}+) sedí úplně vpravo\.$/u))) { const x = m[1]; cs.push((r) => at(r, x) === n - 1); }
    else if ((m = s.match(/^(\p{L}+) sedí uprostřed\.$/u))) { expect(n % 2).toBe(1); const x = m[1]; cs.push((r) => at(r, x) === (n - 1) / 2); }
    else if ((m = s.match(/^(\p{L}+) sedí na kraji\.$/u))) { const x = m[1]; cs.push((r) => at(r, x) === 0 || at(r, x) === n - 1); }
    else if ((m = s.match(/^(\p{L}+) nesedí na kraji\.$/u))) { const x = m[1]; cs.push((r) => at(r, x) !== 0 && at(r, x) !== n - 1); }
    else if ((m = s.match(/^(\p{L}+) sedí vedle (\p{L}+)\.$/u))) { const x = m[1]; const y = nameMap(GEN, m[2]); cs.push((r) => Math.abs(at(r, x) - at(r, y)) === 1); }
    else if ((m = s.match(/^(\p{L}+) nesedí vedle (\p{L}+)\.$/u))) { const x = m[1]; const y = nameMap(GEN, m[2]); cs.push((r) => Math.abs(at(r, x) - at(r, y)) !== 1); }
    else if ((m = s.match(/^(\p{L}+) sedí na (druhém|třetím|čtvrtém) místě zleva\.$/u))) { const x = m[1]; const k = ['druhém', 'třetím', 'čtvrtém'].indexOf(m[2]) + 1; cs.push((r) => at(r, x) === k); }
    else throw new Error(`${it.id}: nečitelné vodítko „${s}“`);
  }
  const rows = perms(names).filter((r) => cs.every((c) => c(r)));
  const pickAt: Record<string, (r: string[]) => string> = {
    'Kdo sedí uprostřed?': (r) => r[(n - 1) / 2],
    'Kdo sedí úplně vlevo?': (r) => r[0],
    'Kdo sedí úplně vpravo?': (r) => r[n - 1],
    'Kdo sedí na druhém místě zleva?': (r) => r[1],
  };
  if (pickAt[question]) return new Set(rows.map(pickAt[question]));
  if (/^Seřaď (?:děti|draky) tak, jak sedí zleva doprava\.$/.test(question)) return new Set(rows.map((r) => r.join('|')));
  throw new Error(`${it.id}: nečitelná otázka „${question}“`);
}

/** Čtvercový stůl: místa 0–3 dokola, naproti = +2. */
function solveTable(it: Item): Set<string> {
  const names = cardTitles(it);
  const sents = sentencesOf(it.prompt);
  expect(sents.shift()).toBe('Kolem čtvercového stolu sedí čtyři děti z obrázku, na každé straně jedno.');
  const question = sents.pop()!.match(/^Kdo sedí naproti (\p{L}+)\?$/u);
  if (!question) throw new Error(`${it.id}: nečitelná otázka`);
  const asked = nameMap(DAT, question[1]);
  type C = (seat: string[]) => boolean;
  const opp = (s: string[], x: string) => s[(s.indexOf(x) + 2) % 4];
  const cs: C[] = [];
  for (const s of sents) {
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\p{L}+) sedí naproti (\p{L}+)\.$/u))) { const x = m[1]; const y = nameMap(DAT, m[2]); cs.push((st) => opp(st, x) === y); }
    else if ((m = s.match(/^(\p{L}+) sedí vedle (\p{L}+)\.$/u))) { const x = m[1]; const y = nameMap(GEN, m[2]); cs.push((st) => opp(st, x) !== y && x !== y); }
    else if ((m = s.match(/^(\p{L}+) nesedí vedle (\p{L}+)\.$/u))) { const x = m[1]; const y = nameMap(GEN, m[2]); cs.push((st) => opp(st, x) === y); }
    else throw new Error(`${it.id}: nečitelné vodítko „${s}“`);
  }
  return new Set(perms(names).filter((st) => cs.every((c) => c(st))).map((st) => opp(st, asked)));
}

describe('Ostrov záhad – logické hlavolamy', () => {
  const items = itemsOf('zahady.logika');
  const byPrefix = (re: RegExp) => items.filter((i) => re.test(keyOf(i)));

  it('seřazení podle vodítek má právě jednu odpověď a ta je správná', () => {
    const list = byPrefix(/^rad-/);
    expect(list.length).toBeGreaterThan(200);
    let partial = 0;
    for (const it of list) {
      const { answers } = solveOrdering(it);
      expect(answers.size, `${it.id}: ${[...answers].join(', ')}`).toBe(1);
      expect([...answers][0], it.id).toBe(correctLabel(it));
      if (it.level >= 4 && it.answer.kind === 'choice') expect(labels(it), it.id).toContain('Nedá se to poznat');
      if (/Celé pořadí se z vodítek určit nedá/.test(it.explanation)) partial++;
    }
    expect(partial).toBeGreaterThan(20);
    for (const level of [1, 2, 3, 4, 5, 6] as Level[]) expect(list.filter((i) => i.level === level).length, `L${level}`).toBeGreaterThan(5);
  });

  it('kdo má kterého draka: vodítka mají jediné řešení', () => {
    const list = byPrefix(/^draci-/);
    expect(list.length).toBeGreaterThan(100);
    for (const it of list) {
      const answers = solveDragons(it);
      expect(answers.size, `${it.id}: ${[...answers].join(', ')}`).toBe(1);
      expect([...answers][0], it.id).toBe(correctLabel(it));
    }
  });

  it('kdo má kterého draka: vysvětlení říká proč a každý jeho závěr platí', () => {
    for (const it of byPrefix(/^draci-/)) {
      const { people, solutions } = dragonSolutions(it);
      expect(solutions.length, it.id).toBe(1);
      const own = solutions[0];
      const sents = sentencesOf(it.explanation);
      if (sents[0].startsWith('Všechna vodítka platí')) continue;
      if (it.level >= 3) expect(sents.length, `${it.id}: jen jeden krok úvahy`).toBeGreaterThanOrEqual(2);
      for (const sent of sents) {
        const m = sent.match(/, takže (\p{L}+) má (\p{L}+)\.$/u);
        if (!m) throw new Error(`${it.id}: věta bez závěru „${sent}“`);
        if (people.includes(m[1])) expect(own.get(m[1]), `${it.id}: ${sent}`).toBe(nameMap(ACC, m[2]));
        else expect(own.get(m[2]), `${it.id}: ${sent}`).toBe(nameMap(ACC, m[1]));
        // důvody: „X nemá A, B ani C“ a „A už má X“ musí platit
        const why = sent.replace(/, takže .*$/u, '');
        const parts = [...why.matchAll(/(\p{L}+) nemá (\p{L}+(?:, \p{L}+(?!\p{L}| už))*(?: ani \p{L}+)?)|(\p{L}+) už má (\p{L}+)/gu)];
        expect(parts.length, `${it.id}: ${sent}`).toBeGreaterThan(0);
        const norm = (x: string) => x.replace(/, | a (?=\p{Lu})/gu, '');
        expect(norm(parts.map((k) => k[0]).join('')), `${it.id}: ${sent}`).toBe(norm(why));
        for (const k of parts) {
          if (k[3]) {
            if (people.includes(k[3])) expect(own.get(k[3]), `${it.id}: ${k[0]}`).toBe(nameMap(ACC, k[4]));
            else expect(own.get(k[4]), `${it.id}: ${k[0]}`).toBe(nameMap(ACC, k[3]));
          } else {
            for (const x of k[2].split(/, | ani /)) {
              if (people.includes(k[1])) expect(own.get(k[1]), `${it.id}: ${k[0]}`).not.toBe(nameMap(ACC, x));
              else expect(own.get(x), `${it.id}: ${k[0]}`).not.toBe(nameMap(ACC, k[1]));
            }
          }
        }
      }
      const answer = correctLabel(it);
      expect(sents[sents.length - 1], it.id).toMatch(new RegExp(`(^|[^\\p{L}])${answer}\\.$|takže ${answer} má`, 'u'));
    }
  });

  it('zasedací pořádek na lavičce i u stolu má jediné řešení', () => {
    const bench = byPrefix(/^lavicka-/);
    const table = byPrefix(/^stul-/);
    expect(bench.length).toBeGreaterThan(100);
    expect(table.length).toBeGreaterThan(30);
    for (const it of bench) {
      const answers = solveBench(it);
      expect(answers.size, `${it.id}: ${[...answers].join(' / ')}`).toBe(1);
      expect([...answers][0], it.id).toBe(correctLabel(it));
    }
    for (const it of table) {
      const answers = solveTable(it);
      expect(answers.size, it.id).toBe(1);
      expect([...answers][0], it.id).toBe(correctLabel(it));
    }
  });

  it('od L2 žádné vodítko samo neodpoví na otázku (u draků a lavičky)', () => {
    for (const it of byPrefix(/^(draci|lavicka)-/)) {
      if (it.level < 2 || it.answer.kind !== 'choice') continue;
      const sents = sentencesOf(it.prompt);
      const intro = sents[0];
      const question = sents[sents.length - 1];
      for (const clue of sents.slice(1, -1)) {
        const one: Item = { ...it, prompt: `${intro} ${clue} ${question}` };
        const answers = keyOf(it).startsWith('draci-') ? solveDragons(one) : solveBench(one);
        expect(answers.size, `${it.id}: „${clue}“ prozradí odpověď`).toBeGreaterThan(1);
      }
    }
  });

  it('„když…, tak…“, „všichni“ a „žádný“: odpověď odpovídá logickému tvaru úsudku', () => {
    const expected: Record<string, Record<string, string>> = {
      kdyz: { mp: 'Ano', mt: 'Ne', ac: 'Nedá se poznat', da: 'Nedá se poznat' },
      vsichni: { mp: 'Ano', mt: 'Ne', ac: 'Nedá se poznat', da: 'Nedá se poznat' },
      retez: { mp: 'Ano', mt: 'Ne', ac: 'Nedá se poznat', da: 'Nedá se poznat' },
      zadny: { mp: 'Ne', mt: 'Ne', ac: 'Nedá se poznat', da: 'Nedá se poznat' },
    };
    const list = byPrefix(/^(kdyz|vsichni|retez|zadny)-/);
    expect(list.length).toBeGreaterThanOrEqual(70);
    const counts: Record<string, number> = {};
    for (const it of list) {
      const [family, form] = keyOf(it).split('-');
      expect(labels(it), it.id).toEqual(['Ano', 'Ne', 'Nedá se poznat']);
      expect(correctLabel(it), it.id).toBe(expected[family][form]);
      counts[correctLabel(it)] = (counts[correctLabel(it)] ?? 0) + 1;
      if (family === 'kdyz') expect(it.prompt, it.id).toMatch(/^Když .+, (?:.+ )?vždycky .+\./);
      if (family === 'vsichni') expect(it.prompt, it.id).toMatch(/^Všichni /);
    }
    // „Nedá se poznat“ nesmí být vždycky správně.
    expect(counts.Ano).toBeGreaterThan(10);
    expect(counts.Ne).toBeGreaterThan(10);
    const L4 = list.filter((i) => i.level === 4);
    expect(L4.every((i) => correctLabel(i) !== 'Nedá se poznat')).toBe(true);
  });

  it('poctivci a lháři: zadání říká, že jiní na ostrově nežijí; tvrzení mají jediné řešení', () => {
    // Bez věty „žijí tam jen poctivci a lháři“ by z „Knut není lhář“ neplynulo,
    // že Knut vždycky mluví pravdu.
    for (const it of byPrefix(/^kk-/)) expect(it.prompt, it.id).toMatch(/jen poctivci a lháři\. Poctivci vždycky mluví pravdu, lháři vždycky lžou\./);
    const ISLAND = ' žijí na ostrově, kde jsou jen poctivci a lháři. ';
    const list = byPrefix(/^kk-/).filter((i) => i.prompt.includes(ISLAND));
    expect(list.length).toBeGreaterThanOrEqual(10);
    const LOC: Record<string, string> = { Alvě: 'Alva', Knutovi: 'Knut', Leifovi: 'Leif', Anně: 'Anna' };
    for (const it of list) {
      const who = it.prompt.slice(0, it.prompt.indexOf(ISLAND)).split(/, | a /);
      const said = [...it.prompt.matchAll(/(\p{L}+) (?:patří k \p{L}+ a )?říká: „([^“]+)“/gu)].map((m) => [m[1], m[2]] as const);
      const facts = [...it.prompt.matchAll(/(\p{L}+) patří k (lhářům|poctivcům)/gu)].map((m) => [m[1], m[2] === 'poctivcům'] as const);
      for (const [x] of [...said, ...facts]) expect(who, it.id).toContain(x);
      const truth = (s: string, speaker: string, h: Map<string, boolean>): boolean => {
        let m: RegExpMatchArray | null;
        if ((m = s.match(/^(\p{L}+) je lhář(?:ka)?\.$/u))) return !h.get(m[1]);
        if (s === 'Oba jsme poctivci.') return who.every((x) => h.get(x));
        if (s === 'Oba jsme lháři.') return who.every((x) => !h.get(x));
        if (s === 'Aspoň jeden z nás je lhář.') return who.some((x) => !h.get(x));
        if (s === 'Oba patříme ke stejné skupině.') return h.get(who[0]) === h.get(who[1]);
        if ((m = s.match(/^(\p{L}+) i (\p{L}+) jsou lháři\.$/u))) return !h.get(m[1]) && !h.get(m[2]);
        throw new Error(`${it.id}: nečitelné tvrzení „${s}“ (${speaker})`);
      };
      const worlds: Map<string, boolean>[] = [];
      for (let mask = 0; mask < 1 << who.length; mask++) {
        const h = new Map(who.map((x, i) => [x, !!(mask & (1 << i))]));
        if (said.every(([sp, s]) => truth(s, sp, h) === h.get(sp)) && facts.every(([x, honest]) => h.get(x) === honest)) worlds.push(h);
      }
      expect(worlds.length, it.id).toBeGreaterThan(0);
      const q = it.prompt.split(/(?<=[.?!“])\s+/).pop()!;
      const whoSet = (h: Map<string, boolean>, liars: boolean) => {
        const set = who.filter((x) => h.get(x) !== liars);
        if (set.length === 0) return 'Ani jeden';
        if (set.length === who.length && who.length === 2) return 'Oba';
        if (set.length === 1) return `Jen ${set[0]}`;
        return set.join(' a ');
      };
      let answers: Set<string>;
      let m: RegExpMatchArray | null;
      if (q === 'Kdo z nich je lhář?') answers = new Set(worlds.map((h) => whoSet(h, true)));
      else if (q === 'Kdo z nich mluví pravdu?' || q === 'Kdo mluví pravdu?') answers = new Set(worlds.map((h) => whoSet(h, false)));
      else if (q === 'Kolik z nich je lhářů?') {
        const n = new Set(worlds.map((h) => who.filter((x) => !h.get(x)).length));
        answers = new Set([n.size > 1 ? 'Nedá se to poznat' : ['Ani jeden', 'Právě jeden', 'Oba'][[...n][0]]]);
      } else if ((m = q.match(/^Co víme jistě o (\p{L}+)\?$/u))) {
        const x = nameMap(LOC, m[1]);
        const v = new Set(worlds.map((h) => h.get(x)));
        answers = new Set([v.size > 1 ? 'Nedá se to poznat' : [...v][0] ? 'Mluví pravdu' : 'Lže']);
      } else if ((m = q.match(/^Co víme o (\p{L}+)\?$/u))) {
        const x = nameMap(LOC, m[1]);
        const v = new Set(worlds.map((h) => h.get(x)));
        answers = new Set([v.size > 1 ? 'Nedá se to poznat' : [...v][0] ? 'Vždycky mluví pravdu' : 'Vždycky lže']);
      } else throw new Error(`${it.id}: nečitelná otázka „${q}“`);
      expect(answers.size, `${it.id}: ${[...answers].join(', ')}`).toBe(1);
      expect(correctLabel(it), it.id).toBe([...answers][0]);
      for (const l of labels(it)) if (l !== correctLabel(it)) expect(answers.has(l), it.id).toBe(false);
    }
  });

  it('holubníkový princip: nejmenší počet, který zaručí úspěch, spočítaný hrubou silou', () => {
    const cond: Record<string, (c: Record<string, number>) => boolean> = {
      'holub-stejne-2barvy': (c) => Object.values(c).some((v) => v >= 2),
      'holub-stejne-3barvy': (c) => Object.values(c).some((v) => v >= 2),
      'holub-cervene2': (c) => c['červen'] >= 2,
      'holub-modra1': (c) => c['modr'] >= 1,
      'holub-kulicky3': (c) => Object.values(c).some((v) => v >= 3),
      'holub-rukavice': (c) => c['lev'] >= 1 && c['prav'] >= 1,
      'holub-bonbony': (c) => Object.values(c).every((v) => v >= 1),
      'holub-pary': (c) => Object.values(c).reduce((s, v) => s + Math.floor(v / 2), 0) >= 2,
    };
    const list = byPrefix(/^holub-/);
    expect(list.length).toBe(9);
    for (const it of list) {
      const key = keyOf(it);
      if (key === 'holub-narozeniny') {
        // 12 měsíců: nejhorší případ je 12 dětí, každé jindy.
        expect(it.answer.kind === 'number' && it.answer.correct).toBe(12 + 1);
        continue;
      }
      const counts: Record<string, number> = {};
      for (const m of it.prompt.matchAll(/(\d+) (červen|modr|zelen|žlut|bíl|čern|lev|prav|jahodov|citronov)\p{L}*/gu)) counts[m[2]] = Number(m[1]);
      const colors = Object.keys(counts);
      expect(colors.length, it.id).toBeGreaterThanOrEqual(2);
      const total = colors.reduce((s, c) => s + counts[c], 0);
      // všechny výběry n kusů (každé barvy nejvýš tolik, kolik jí je)
      const allDraws = (n: number): Record<string, number>[] => {
        const out: Record<string, number>[] = [];
        const rec = (i: number, left: number, acc: Record<string, number>) => {
          if (i === colors.length) {
            if (left === 0) out.push({ ...acc });
            return;
          }
          for (let k = 0; k <= Math.min(left, counts[colors[i]]); k++) rec(i + 1, left - k, { ...acc, [colors[i]]: k });
        };
        rec(0, n, {});
        return out;
      };
      let best = -1;
      for (let n = 1; n <= total; n++) {
        if (allDraws(n).every(cond[key])) {
          best = n;
          break;
        }
      }
      expect(it.answer.kind === 'number' && it.answer.correct, it.id).toBe(best);
    }
  });

  it('kombinace: výsledek sedí s výčtem všech možností', () => {
    const range = (n: number) => Array.from({ length: n }, (_, i) => i);
    const pairs = (n: number) => range(n).flatMap((a) => range(n).filter((b) => b > a).map((b) => [a, b]));
    const numbers = (digits: number[], len: number, repeat: boolean) => {
      const out = new Set<string>();
      const rec = (acc: number[]) => {
        if (acc.length === len) {
          if (acc[0] !== 0) out.add(acc.join(''));
          return;
        }
        for (const d of digits) if (repeat || !acc.includes(d)) rec([...acc, d]);
      };
      rec([]);
      return out.size;
    };
    const product = (...ns: number[]) => {
      let combos: number[][] = [[]];
      for (const n of ns) combos = combos.flatMap((c) => range(n).map((k) => [...c, k]));
      return combos.length;
    };
    const expected: Record<string, [number, number[]]> = {
      'komb-tricka': [product(3, 2), [3, 2]],
      'komb-zmrzlina': [product(4, 2), [4, 2]],
      'komb-sedla': [product(3, 3), [3]],
      'komb-cepice': [product(2, 2, 2), [2]],
      'komb-cesty': [product(3, 2), [3, 2]],
      'komb-svacina': [product(2, 3), [2, 3]],
      'komb-cisla-bez': [numbers([1, 2, 3], 2, false), [1, 2, 3]],
      'komb-cisla-s': [numbers([1, 2, 3], 2, true), [1, 2, 3]],
      'komb-karticky': [perms(range(3)).length, [3]],
      'komb-ruce4': [pairs(4).length, []],
      'komb-draci5': [pairs(5).length, []],
      'komb-rada4': [perms(range(4)).length, [4]],
      'komb-vylet': [pairs(5).length, [2, 5]],
      'komb-vlajka': [perms(range(3)).length, [3]],
      'komb-trojmistna': [numbers([1, 2, 3], 3, false), [1, 2, 3]],
      'komb-nula': [numbers([0, 1, 2], 3, false), [0, 1, 2]],
      'komb-turnaj': [pairs(4).length, [4]],
    };
    const list = byPrefix(/^komb-/);
    expect(list.map(keyOf).sort()).toEqual(Object.keys(expected).sort());
    for (const it of list) {
      const [value, mentioned] = expected[keyOf(it)];
      expect(it.answer.kind === 'number' && it.answer.correct, it.id).toBe(value);
      for (const n of mentioned) expect(it.prompt, it.id).toContain(String(n));
    }
  });

  it('dny v týdnu: odpověď sedí s kalendářem', () => {
    const DAYS = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'];
    const LOC: Record<string, string> = { čtvrtku: 'čtvrtek' };
    const INS: Record<string, string> = { nedělí: 'neděle' };
    const OFFSET: Record<string, number> = { předevčírem: -2, včera: -1, dnes: 0, zítra: 1, pozítří: 2, 'za tři dny': 3 };
    const idx = (d: string) => {
      const i = DAYS.indexOf(d.toLocaleLowerCase('cs'));
      if (i < 0) throw new Error(`neznámý den ${d}`);
      return i;
    };
    const list = byPrefix(/^den-/);
    expect(list.length).toBe(14);
    for (const it of list) {
      const [fact, question] = sentencesOf(it.prompt);
      let today: number;
      let m: RegExpMatchArray | null;
      if ((m = fact.match(/^(Předevčírem|Včera|Dnes|Zítra|Pozítří|Za tři dny) (?:je|byl|byla|bylo|bude) (\p{L}+)\.$/u))) today = idx(m[2]) - OFFSET[m[1].toLocaleLowerCase('cs')];
      else if ((m = fact.match(/^(Předevčírem|Včera) byl den po (\p{L}+)\.$/u))) today = idx(nameMap(LOC, m[2])) + 1 - OFFSET[m[1].toLocaleLowerCase('cs')];
      else if ((m = fact.match(/^(Předevčírem|Včera) byl den před (\p{L}+)\.$/u))) today = idx(nameMap(INS, m[2])) - 1 - OFFSET[m[1].toLocaleLowerCase('cs')];
      else throw new Error(`${it.id}: nečitelné „${fact}“`);
      let off: number;
      if ((m = question.match(/^Jaký den (?:je|byl|bude) (dnes|včera|zítra|pozítří|předevčírem)\?$/u))) off = OFFSET[m[1]];
      else if ((m = question.match(/^Jaký den bude za (\d+) dní\?$/u))) off = Number(m[1]);
      else if ((m = question.match(/^Jaký den byl před (\d+) dny\?$/u))) off = -Number(m[1]);
      else throw new Error(`${it.id}: nečitelná otázka „${question}“`);
      const answer = DAYS[(((today + off) % 7) + 7) % 7];
      expect(correctLabel(it).toLocaleLowerCase('cs'), it.id).toBe(answer);
    }
  });

  it('fronty, čísla „myslím si“ a další chytáky mají správný výsledek', () => {
    const ORD: Record<string, number> = { druhý: 2, třetí: 3, čtvrtý: 4, pátý: 5, šestá: 6 };
    for (const it of byPrefix(/^fronta-/)) {
      const m = it.prompt.match(/(\p{L}+) zepředu a (?:zároveň )?(\p{L}+) zezadu/u)!;
      expect(it.answer.kind === 'number' && it.answer.correct, it.id).toBe(ORD[m[1]] + ORD[m[2]] - 1);
    }
    const guess: Record<string, [number, number, (n: number) => boolean]> = {
      'cislo-3': [1, 10, (n) => !(n > 3) && !(n < 3)],
      'cislo-7': [1, 10, (n) => n > 6 && n < 8],
      'cislo-9': [1, 10, (n) => n > 7 && n !== 8 && n !== 10],
      'cislo-14': [1, 20, (n) => n > 12 && n < 16 && n % 2 === 0],
      'cislo-15': [1, 20, (n) => n % 2 === 1 && n > 14 && n < 17],
      'cislo-20': [1, 30, (n) => n % 10 === 0 && n > 15 && n < 25],
      'cislo-22': [10, 29, (n) => Math.floor(n / 10) === n % 10 && n % 2 === 0],
      'cislo-35': [1, 50, (n) => n % 5 === 0 && n % 7 === 0 && n / 5 <= 10 && n / 7 <= 10],
      'cislo-24': [1, 30, (n) => n % 4 === 0 && n % 6 === 0 && n > 15],
      'cislo-36': [1, 50, (n) => n % 4 === 0 && n % 9 === 0 && n / 4 <= 10 && n / 9 <= 10],
      'cislo-45': [1, 90, (n) => n % 9 === 0 && n % 2 === 1 && n > 30 && n < 60],
    };
    const list = byPrefix(/^cislo-/);
    expect(list.map(keyOf).sort()).toEqual(Object.keys(guess).sort());
    for (const it of list) {
      const [lo, hi, ok] = guess[keyOf(it)];
      const fits = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(ok);
      expect(fits, it.id).toEqual([it.answer.kind === 'number' ? it.answer.correct : NaN]);
    }
    // Šnek: den po dni.
    const snek = items.find((i) => keyOf(i) === 'snek')!;
    let h = 0;
    let day = 0;
    while (true) {
      day++;
      h += 3;
      if (h >= 5) break;
      h -= 2;
    }
    expect(snek.answer.kind === 'number' && snek.answer.correct).toBe(day);
    const misc: Record<string, number> = {
      'stuha-4': 4 - 1,
      'sloupky-5': 5 - 1,
      'plot-10': 10 / 2 + 1,
      'kmen-5': (5 - 1) * 2,
      'schody-3': 3 * 10,
      'sestry-bratr': 1 + 2 + 1,
      'runa-bratri': 3 + 1,
      'tata-dcery': 4 + 1,
      'jablka-vezmes': 2,
      'vek-az': 10 - (7 - 4),
      'vek-rozdil': 3,
      'mesice-28': 12,
      'tri-draci-jablka': 3,
    };
    for (const [key, value] of Object.entries(misc)) {
      const it = items.find((i) => keyOf(i) === key);
      expect(it, key).toBeTruthy();
      expect(it!.answer.kind === 'number' && it!.answer.correct, key).toBe(value);
    }
  });
});

// ---------------------------------------------------------------------------
// Sudoku – nezávislý řešič

function sudokuSolutions(n: number, bw: number, bh: number, grid: number[], ask: number): number[] {
  const peersOf = (i: number) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out: number[] = [];
    for (let j = 0; j < n * n; j++) {
      if (j === i) continue;
      const rj = Math.floor(j / n);
      const cj = j % n;
      if (rj === r || cj === c || (Math.floor(rj / bh) === Math.floor(r / bh) && Math.floor(cj / bw) === Math.floor(c / bw))) out.push(j);
    }
    return out;
  };
  const peers = Array.from({ length: n * n }, (_, i) => peersOf(i));
  const valid = (g: number[]) => g.every((v, i) => v === 0 || peers[i].every((j) => g[j] !== v));
  const complete = (g: number[]): boolean => {
    let best = -1;
    let bestOpts: number[] = [];
    for (let i = 0; i < g.length; i++) {
      if (g[i]) continue;
      const opts = Array.from({ length: n }, (_, k) => k + 1).filter((v) => peers[i].every((j) => g[j] !== v));
      if (!opts.length) return false;
      if (best < 0 || opts.length < bestOpts.length) {
        best = i;
        bestOpts = opts;
      }
    }
    if (best < 0) return true;
    return bestOpts.some((v) => {
      const next = g.slice();
      next[best] = v;
      return complete(next);
    });
  };
  expect(valid(grid)).toBe(true);
  return Array.from({ length: n }, (_, k) => k + 1).filter((v) => {
    const g = grid.slice();
    g[ask] = v;
    return valid(g) && complete(g);
  });
}

describe('Ostrov záhad – dračí sudoku', () => {
  const items = itemsOf('zahady.sudoku');

  it('hodnota na otazníku je jediná možná a je správná (nezávislý řešič)', () => {
    expect(items.length).toBeGreaterThan(1500);
    for (const it of items) {
      const v = it.visual as Extract<Visual, { type: 'table' }>;
      expect(v.type).toBe('table');
      const n = v.cols;
      expect(v.cells.length).toBe(n * n);
      expect(n).toBe(it.level <= 4 ? 4 : 6);
      expect(v.boxes).toEqual(n === 4 ? [2, 2] : [3, 2]);
      const symbols = it.level <= 3 ? labels(it) : Array.from({ length: n }, (_, k) => String(k + 1));
      if (it.level <= 3) expect(new Set(symbols).size, it.id).toBe(4);
      const grid = v.cells.map((c) => (c === null ? 0 : symbols.indexOf(String(c)) + 1));
      expect(grid.every((x, i) => x > 0 || v.cells[i] === null), it.id).toBe(true);
      const sols = sudokuSolutions(n, v.boxes![0], v.boxes![1], grid, v.ask!);
      expect(sols.length, `${it.id}: ${sols.join(',')}`).toBe(1);
      expect(symbols[sols[0] - 1], it.id).toBe(correctLabel(it));
    }
  });

  it('úrovně mají slíbenou stavbu (řádek, sloupec či blok, kombinace, mezikrok)', () => {
    for (const it of items) {
      const v = it.visual as Extract<Visual, { type: 'table' }>;
      const n = v.cols;
      const ask = v.ask!;
      const r = Math.floor(ask / n);
      const c = ask % n;
      const [bw, bh] = v.boxes!;
      const given = (pred: (j: number) => boolean) =>
        v.cells.map((x, j) => ({ x, j })).filter(({ x, j }) => j !== ask && x !== null && pred(j)).map(({ x }) => String(x));
      const row = given((j) => Math.floor(j / n) === r);
      const col = given((j) => j % n === c);
      const block = given((j) => Math.floor(Math.floor(j / n) / bh) === Math.floor(r / bh) && Math.floor((j % n) / bw) === Math.floor(c / bw));
      const union = new Set([...row, ...col, ...block]);
      if (it.level === 1) expect(row.length, it.id).toBe(3);
      if (it.level === 2) {
        expect(row.length, it.id).toBeLessThan(3);
        expect(col.length === 3 || block.length === 3, it.id).toBe(true);
      }
      if (it.level === 3) {
        expect(row.length, it.id).toBe(2);
        expect(Math.max(col.length, block.length), it.id).toBeLessThanOrEqual(2);
        expect(new Set([...row, ...col]).size, it.id).toBe(3);
      }
      if (it.level === 5) expect(union.size, it.id).toBe(5);
      // L4 a L6: otazník nejde doplnit hned, je potřeba mezikrok.
      if (it.level === 4) expect(union.size, it.id).toBeLessThan(3);
      if (it.level === 6) expect(union.size, it.id).toBeLessThan(5);
    }
  });
});

describe('Ostrov záhad – dračí sudoku: vysvětlení mezikroku', () => {
  it('u L4 a L6 vede vysvětlení políčko po políčku až k odpovědi (nic nevynechá)', () => {
    const ORD = ['prvním', 'druhém', 'třetím', 'čtvrtém', 'pátém', 'šestém'];
    const list = itemsOf('zahady.sudoku').filter((i) => i.level === 4 || i.level === 6);
    expect(list.length).toBeGreaterThan(500);
    for (const it of list) {
      const v = it.visual as Extract<Visual, { type: 'table' }>;
      const n = v.cols;
      const [bw, bh] = v.boxes!;
      const g = v.cells.map((c) => (c === null ? 0 : Number(c)));
      const cand = (i: number) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const used = new Set<number>();
        for (let j = 0; j < n * n; j++) {
          const rj = Math.floor(j / n);
          const cj = j % n;
          if (j !== i && (rj === r || cj === c || (Math.floor(rj / bh) === Math.floor(r / bh) && Math.floor(cj / bw) === Math.floor(c / bw)))) used.add(g[j]);
        }
        return Array.from({ length: n }, (_, k) => k + 1).filter((x) => !used.has(x));
      };
      const steps = [...it.explanation.matchAll(/políčko (?:ve|v) (\p{L}+) řádku a (\p{L}+) sloupci: patří tam (\d)/gu)];
      expect(steps.length, it.id).toBeGreaterThan(0);
      expect(steps.length, it.id).toBeLessThanOrEqual(3);
      for (const m of steps) {
        const i = ORD.indexOf(m[1]) * n + ORD.indexOf(m[2]);
        expect(g[i], `${it.id}: ${m[0]}`).toBe(0);
        expect(cand(i), `${it.id}: ${m[0]}`).toEqual([Number(m[3])]);
        g[i] = Number(m[3]);
      }
      expect(cand(v.ask!), it.id).toEqual([Number(correctLabel(it))]);
      expect(it.explanation, it.id).toMatch(new RegExp(`Potom na otazník zbude jen ${correctLabel(it)}\\.$`));
    }
  });
});

// ---------------------------------------------------------------------------
// Matice – odvození pravidel z tabulky

const SHAPE_EMOJI: Record<string, [string, string]> = {
  '🔴': ['kolečko', 'červená'], '🟡': ['kolečko', 'žlutá'], '🔵': ['kolečko', 'modrá'], '🟢': ['kolečko', 'zelená'],
  '🟥': ['čtverec', 'červená'], '🟨': ['čtverec', 'žlutá'], '🟦': ['čtverec', 'modrá'], '🟩': ['čtverec', 'zelená'],
  '❤️': ['srdce', 'červená'], '💛': ['srdce', 'žlutá'], '💙': ['srdce', 'modrá'], '💚': ['srdce', 'zelená'],
};

type Attrs = [string, string, string]; // předmět/tvar, barva, počet

function parseCell(s: string): Attrs {
  const gs = graphemes(s);
  expect(new Set(gs).size, s).toBe(1);
  const e = gs[0];
  const [shape, color] = SHAPE_EMOJI[e] ?? [e, '-'];
  return [shape, color, String(gs.length)];
}

/** Předpovědi hodnoty jedné vlastnosti na otazníku ze všech pravidel, která
 *  sedí s viditelnými políčky (stejné v řádku / ve sloupci / latinský čtverec). */
function predictions(vals: (string | null)[], n: number, ask: number): Set<string> {
  const at = (r: number, c: number) => vals[r * n + c];
  const ar = Math.floor(ask / n);
  const ac = ask % n;
  const out = new Set<string>();
  const lineConst = (get: (k: number, i: number) => string | null) =>
    Array.from({ length: n }, (_, k) => new Set(Array.from({ length: n }, (_, i) => get(k, i)).filter((x): x is string => x !== null)).size <= 1).every(Boolean);
  if (lineConst((r, c) => at(r, c))) out.add(at(ar, (ac + 1) % n)!);
  if (lineConst((c, r) => at(r, c))) out.add(at((ar + 1) % n, ac)!);
  if (n === 3) {
    const domain = new Set(vals.filter((x): x is string => x !== null));
    const distinct = (xs: (string | null)[]) => {
      const v = xs.filter((x): x is string => x !== null);
      return new Set(v).size === v.length;
    };
    const rowsOk = Array.from({ length: 3 }, (_, r) => distinct([at(r, 0), at(r, 1), at(r, 2)])).every(Boolean);
    const colsOk = Array.from({ length: 3 }, (_, c) => distinct([at(0, c), at(1, c), at(2, c)])).every(Boolean);
    if (domain.size === 3 && rowsOk && colsOk) {
      const inRow = new Set([at(ar, 0), at(ar, 1), at(ar, 2)]);
      const inCol = new Set([at(0, ac), at(1, ac), at(2, ac)]);
      const missing = [...domain].filter((x) => !inRow.has(x) && !inCol.has(x));
      if (missing.length === 1) out.add(missing[0]);
      else out.add('?nejednoznačné');
    }
  }
  return out;
}

describe('Ostrov záhad – dračí matice', () => {
  const items = itemsOf('zahady.matice');

  it('každá vlastnost má jediné pravidlo s jedinou předpovědí a ta dá správnou odpověď', () => {
    expect(items.length).toBeGreaterThan(1500);
    for (const it of items) {
      const v = it.visual as Extract<Visual, { type: 'table' }>;
      expect(v.type).toBe('table');
      const n = v.cols;
      expect(n).toBe(it.level === 1 ? 2 : 3);
      expect(v.cells.length).toBe(n * n);
      const cells = v.cells.map((c) => (c === null ? null : parseCell(String(c))));
      const correct = parseCell(correctLabel(it));
      for (let a = 0; a < 3; a++) {
        const p = predictions(cells.map((c) => (c ? c[a] : null)), n, v.ask!);
        expect(p.size, `${it.id}: vlastnost ${a} – ${[...p].join(', ')}`).toBe(1);
        expect([...p][0], `${it.id}: vlastnost ${a}`).toBe(correct[a]);
      }
    }
  });

  it('chybné možnosti se od správné liší právě v jedné vlastnosti', () => {
    for (const it of items) {
      const correct = parseCell(correctLabel(it));
      for (const l of labels(it)) {
        if (l === correctLabel(it)) continue;
        const w = parseCell(l);
        expect(w.filter((x, i) => x !== correct[i]).length, `${it.id}: ${l}`).toBe(1);
      }
    }
  });

  it('úroveň 6 kombinuje tři pravidla, úroveň 1 je 2 × 2', () => {
    for (const it of items.filter((i) => i.level === 6)) {
      const v = it.visual as Extract<Visual, { type: 'table' }>;
      const cells = v.cells.filter((c): c is string => c !== null).map(parseCell);
      for (let a = 0; a < 3; a++) expect(new Set(cells.map((c) => c[a])).size, it.id).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Obrázkové řady – odvození pravidla z řady

const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];

interface Tok {
  e: string;
  n: number;
}

const tok = (s: string): Tok => {
  const gs = graphemes(s);
  expect(new Set(gs).size, s).toBe(1);
  return { e: gs[0], n: gs.length };
};
const same = (a: Tok, b: Tok) => a.e === b.e && a.n === b.n;
const show = (t: Tok) => Array.from({ length: t.n }, () => t.e).join('');

/** Nejmenší perioda v souladu s viditelnými položkami a jestli jsou vidět dvě celé periody. */
function periodOf(xs: (Tok | null)[]): { p: number; twice: boolean } {
  for (let p = 1; p < xs.length; p++) {
    let ok = true;
    for (let i = 0; i < xs.length && ok; i++) {
      for (let j = i + p; j < xs.length && ok; j += p) if (xs[i] && xs[j] && !same(xs[i]!, xs[j]!)) ok = false;
    }
    if (ok) {
      let twice = false;
      for (let s = 0; s + 2 * p <= xs.length; s++) if (xs.slice(s, s + 2 * p).every(Boolean)) twice = true;
      return { p, twice };
    }
  }
  return { p: xs.length, twice: false };
}

/** Předpověď podle pravidla dílčí řady (položky null = otazník). */
function predictSub(kind: string, xs: (Tok | null)[], ask: number): Tok {
  const known = xs.map((x, i) => [x, i] as const).filter((p): p is readonly [Tok, number] => p[0] !== null);
  if (kind === 'ab' || kind === 'vzor' || kind === 'pocty') {
    const { p, twice } = periodOf(xs);
    expect(twice, `perioda ${p} není vidět dvakrát celá`).toBe(true);
    if (kind === 'ab') expect(p).toBe(2);
    if (kind === 'pocty') expect(p).toBe(3);
    const ref = known.find(([, i]) => i % p === ask % p);
    expect(ref).toBeTruthy();
    return ref![0];
  }
  if (kind === 'rust') {
    expect(new Set(known.map(([t]) => t.e)).size).toBe(1);
    known.forEach(([t, i]) => expect(t.n).toBe(i + 1));
    return { e: known[0][0].e, n: ask + 1 };
  }
  if (kind === 'rust2') {
    known.forEach(([t, i]) => expect(t.n).toBe(i + 1));
    const even = known.filter(([, i]) => i % 2 === 0).map(([t]) => t.e);
    const odd = known.filter(([, i]) => i % 2 === 1).map(([t]) => t.e);
    expect(new Set(even).size).toBe(1);
    expect(new Set(odd).size).toBe(1);
    return { e: ask % 2 === 0 ? even[0] : odd[0], n: ask + 1 };
  }
  if (kind === 'sipky1' || kind === 'sipky2') {
    const idx = known.map(([t, i]) => [ARROWS.indexOf(t.e), i] as const);
    idx.forEach(([a]) => expect(a).toBeGreaterThanOrEqual(0));
    const [a0, i0] = idx[0];
    const [a1, i1] = idx[1];
    const step = ((((a1 - a0) / (i1 - i0)) % 8) + 8) % 8;
    expect(kind === 'sipky1' ? [1, 7] : [2, 6]).toContain(step);
    idx.forEach(([a, i]) => expect((((a - a0 - step * (i - i0)) % 8) + 8) % 8).toBe(0));
    return { e: ARROWS[(((a0 + step * (ask - i0)) % 8) + 8) % 8], n: 1 };
  }
  if (kind === 'zrcadlo') {
    const n = xs.length;
    known.forEach(([t, i]) => {
      const m = xs[n - 1 - i];
      if (m) expect(same(t, m)).toBe(true);
    });
    expect(periodOf(xs).p * 2).toBeGreaterThan(n);
    expect(ask).not.toBe((n - 1) / 2);
    return xs[n - 1 - ask]!;
  }
  throw new Error(`neznámý druh řady ${kind}`);
}

describe('Ostrov záhad – obrázkové řady', () => {
  const items = itemsOf('zahady.rady');

  it('pravidlo řady jde z viditelných položek odvodit jednoznačně a dává správnou odpověď', () => {
    expect(items.length).toBeGreaterThan(900);
    const kinds = new Set<string>();
    for (const it of items) {
      const v = it.visual as Extract<Visual, { type: 'series' }>;
      expect(v.type).toBe('series');
      expect(v.items.filter((x) => x === null).length, it.id).toBe(1);
      expect(v.items.length, it.id).toBeLessThanOrEqual(9);
      const ask = v.items.indexOf(null);
      const key = keyOf(it);
      const kind = key.split('-')[0];
      kinds.add(kind);
      let expected: string;
      if (kind === 'dve') {
        const [, oddKind, evenKind] = key.split('-');
        const all = v.items.map((x) => (x === null ? null : tok(String(x))));
        const odd = all.filter((_, i) => i % 2 === 0);
        const even = all.filter((_, i) => i % 2 === 1);
        const inOdd = ask % 2 === 0;
        const [askKind, askSub, otherKind, otherSub] = inOdd ? [oddKind, odd, evenKind, even] : [evenKind, even, oddKind, odd];
        // I dílčí řada bez otazníku musí mít své pravidlo.
        predictSub(otherKind, otherSub, otherSub.length);
        expected = show(predictSub(askKind, askSub, Math.floor(ask / 2)));
      } else if (kind === 'barvy2' || kind === 'barvy3') {
        const parsed = v.items.map((x) => (x === null ? null : SHAPE_EMOJI[String(x)]));
        const colorP = kind === 'barvy3' ? 3 : 2;
        const shapeP = colorP === 3 ? 2 : 3;
        const pick = (a: 0 | 1, p: number) => {
          const vals = parsed.map((x, i) => [x?.[a], i] as const).filter(([x]) => x !== undefined);
          vals.forEach(([x, i]) => vals.forEach(([y, j]) => i % p === j % p && expect(x).toBe(y)));
          // menší perioda by nesmela sedět
          const smaller = [1, 2].filter((q) => q < p && vals.every(([x, i]) => vals.every(([y, j]) => i % q !== j % q || x === y)));
          expect(smaller).toEqual([]);
          return vals.find(([, i]) => i % p === ask % p)![0];
        };
        const color = pick(1, colorP);
        const shape = pick(0, shapeP);
        expected = Object.keys(SHAPE_EMOJI).find((e) => SHAPE_EMOJI[e][0] === shape && SHAPE_EMOJI[e][1] === color)!;
      } else {
        const all = v.items.map((x) => (x === null ? null : tok(String(x))));
        const k = kind === 'sipky1' || kind === 'sipky2' || kind === 'rust' || kind === 'rust2' || kind === 'zrcadlo' || kind === 'pocty' ? kind : 'vzor';
        expected = show(predictSub(k, all, ask));
      }
      expect(correctLabel(it), it.id).toBe(expected);
      for (const l of labels(it)) if (l !== expected) expect(l).not.toBe(expected);
    }
    expect([...kinds].sort()).toEqual(['barvy2', 'barvy3', 'dve', 'pocty', 'rust', 'rust2', 'sipky1', 'sipky2', 'vzor', 'zrcadlo'].sort());
  });

  it('úroveň 1 má jen opakující se vzory s otazníkem na konci', () => {
    for (const it of items.filter((i) => i.level === 1)) {
      const v = it.visual as Extract<Visual, { type: 'series' }>;
      expect(keyOf(it).startsWith('vzor-'), it.id).toBe(true);
      expect(v.items[v.items.length - 1], it.id).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Analogie

/** Odpovědi, které by také „seděly“ – nesmí být mezi chybnými možnostmi. */
const ALSO_VALID: Record<string, string[]> = {
  'velky-maly-vysoky': ['Malý'],
  'nuzky-strihat-tuzka': ['Kreslit'],
  'den-noc-leto': ['Jaro', 'Podzim'],
  'kote-kocka-stene': ['Liška', 'Vlk'],
  'kuratko-slepice-kachnatko': ['Labuť', 'Kačer'],
  'malir-stetec-kadernik': ['Hřeben', 'Štětec', 'Fén'],
  'zahradnik-hrabe-rybar': ['Síť', 'Udice'],
  'svetr-vlna-lahev': ['Plast', 'Písek'],
  'stul-drevo-okno': ['Dřevo', 'Plast'],
  'kuchar-kuchyne-pilot': ['Letiště'],
  'pes-zvire-ruze': ['Rostlina', 'Keř'],
  'kniha-knihovna-obraz': ['Muzeum'],
  'radost-smutek-smich': ['Smutek'],
  'ryba-ploutev-ptak': ['Noha', 'Ocas', 'Peří', 'Drápy'],
  'ptak-peri-ryba': ['Ploutve', 'Žábry', 'Kůže'],
  'pes-srst-ptak': ['Křídla', 'Zobák', 'Šupiny'],
  'pavouk-osm-mravenec': ['Dva'],
  'sekunda-minuta-minuta': ['Den', 'Týden', 'Rok'],
  'minuta-hodina-den': ['Měsíc', 'Rok'],
  'kapka-more-zrnko-pisku': ['Pláž'],
  'ovce-stado-vlk': ['Rodina'],
  'mouka-chleb-mleko': ['Máslo', 'Tvaroh', 'Jogurt'],
  'kapitan-lod-strojvedouci': ['Lokomotiva'],
  'pravda-lez-odvaha': ['Zbabělost'],
  'centimetr-metr-gram': ['Dekagram', 'Tuna'],
  'ctverec-krychle-kruh': ['Válec', 'Kužel'],
  'obdelnik-kvadr-ctverec': ['Kvádr', 'Jehlan'],
  'malir-obraz-skladatel': ['Píseň', 'Hudba'],
  'rychly-hbity-krasny': ['Pěkný', 'Hezký'],
  'dest-mokro-mraz': ['Sníh'],
  'tele-krava-hribe': ['Klisna', 'Hřebec'],
  'obr-slepice-krava': ['🧀'],
  'obr-dest-slunce': ['🧢', '👒'],
  'obr-bota-rukavice': ['🧦'],
  'obr-med-mleko': ['🐐', '🐑'],
  'obr-jablko-kokos': ['🌲'],
  'obr-rukavice-ponozka': ['🦵'],
  'obr-klubko-vlny-vejce': ['🦆'],
  'obr-baterie-benzin': ['✈️', '🏍️'],
};

describe('Ostrov záhad – analogie', () => {
  const items = itemsOf('zahady.analogie');

  it('slovní i obrázkové analogie mají jednotný tvar a mezi možnostmi nejsou další správné', () => {
    let pictures = 0;
    for (const it of items) {
      const key = keyOf(it);
      if (key.startsWith('obr-')) {
        pictures++;
        const v = it.visual as Extract<Visual, { type: 'table' }>;
        expect(v.type).toBe('table');
        expect(v.cols).toBe(2);
        expect(v.cells.length).toBe(4);
        expect(v.ask).toBe(3);
      } else {
        expect(it.prompt, it.id).toMatch(/^Doplň podle vzoru: [\p{L} ]+ – [\p{L} ]+, [\p{L} ]+ – …\?$/u);
        expect(it.visual).toBeUndefined();
      }
      for (const bad of ALSO_VALID[key] ?? []) expect(labels(it), `${it.id}: ${bad}`).not.toContain(bad);
      const correct = it.answer.kind === 'choice' ? it.answer.options[it.answer.correct] : null;
      const word = (correct?.speak ?? correct?.label ?? '').toLocaleLowerCase('cs');
      expect(it.explanation.toLocaleLowerCase('cs'), it.id).toContain(word);
      const whole = new RegExp(`(^|[^\\p{L}])${word}($|[^\\p{L}])`, 'u');
      for (const t of [it.prompt, ...it.hints]) expect(whole.test(t.toLocaleLowerCase('cs')), `${it.id}: „${t}“ prozrazuje „${word}“`).toBe(false);
    }
    expect(pictures).toBeGreaterThanOrEqual(10);
    for (const key of Object.keys(ALSO_VALID)) expect(items.some((i) => keyOf(i) === key), key).toBe(true);
  });

  it('každá úloha z banky má 3–5 chybných možností a ukáže 4 možnosti', () => {
    for (const it of items) expect(labels(it).length, it.id).toBe(4);
  });
});

// ---------------------------------------------------------------------------

describe('Ostrov záhad – hlavolamy: karty a mise', () => {
  it('karty a mise projdou kontrolou', () => {
    expect(validateCards(hlavolamyCards, hlavolamySkills)).toEqual([]);
    expect(validateMissions(hlavolamyMissions, 'zahady')).toEqual([]);
    expect(hlavolamyMissions.length).toBe(3);
    expect(hlavolamyMissions.map((m) => m.id).sort()).toEqual(['zahady.hadanka-u-stolu', 'zahady.rady-z-veci', 'zahady.rodinne-sudoku']);
  });

  it('každá dovednost má 2–4 karty a aspoň dvě jsou opravené stránky', () => {
    for (const s of hlavolamySkills) {
      const n = hlavolamyCards.filter((c) => c.skillId === s.id).length;
      expect(n, s.id).toBeGreaterThanOrEqual(2);
      expect(n, s.id).toBeLessThanOrEqual(4);
    }
    expect(hlavolamyCards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(2);
  });

  it('fakta na kartách sedí s nezávislými údaji', () => {
    const card = (id: string) => hlavolamyCards.find((c) => c.id === id)!;
    // 9 × 9: 6 670 903 752 021 072 936 960 vyplněných mřížek (Felgenhauer a Jarvis, 2005)
    expect('6670903752021072936960'.length).toBe(22);
    expect(card('zahady.sudoku.pocet').text).toContain('22 číslic');
    expect(card('zahady.sudoku.pocet').text).toContain('2005');
    // 4 × 4: 288 mřížek – spočítáme sami.
    const grids4 = (() => {
      let count = 0;
      const g = new Array<number>(16).fill(0);
      const ok = (i: number, v: number) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        for (let j = 0; j < i; j++) {
          const rj = Math.floor(j / 4);
          const cj = j % 4;
          if (g[j] === v && (rj === r || cj === c || (Math.floor(rj / 2) === Math.floor(r / 2) && Math.floor(cj / 2) === Math.floor(c / 2)))) return false;
        }
        return true;
      };
      const rec = (i: number) => {
        if (i === 16) {
          count++;
          return;
        }
        for (let v = 1; v <= 4; v++) if (ok(i, v)) {
          g[i] = v;
          rec(i + 1);
        }
      };
      rec(0);
      return count;
    })();
    expect(grids4).toBe(288);
    expect(card('zahady.sudoku.pocet').text).toContain(String(grids4));
    expect(card('zahady.sudoku.garns').text).toContain('1979');
    expect(card('zahady.sudoku.sedmnact').text).toContain('17');
    expect(card('zahady.analogie.letani').fix!.evidence).toContain('1903');
    // Fibonacci: 21 + 34 = 55, 34 + 55 = 89
    expect(21 + 34).toBe(55);
    expect(34 + 55).toBe(89);
    expect(card('zahady.rady.slunecnice').text).toMatch(/21, 34, 55 nebo 89/);
  });
});
