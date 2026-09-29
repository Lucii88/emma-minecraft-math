// Ostrov světa: platnost a jednoznačnost úloh, fakta proti nezávislým
// tabulkám (měsíce, planety, hlavní města, sousedé) a řešitelnost map.

import { describe, expect, it } from 'vitest';
import { cards, missions, skills } from '../src/content/svet';
import { MAP_POOLS, MISTA } from '../src/content/svet/mapa';
import { buildItem, enumerateItems } from '../src/core/bank';
import { fly } from '../src/core/grid';
import { createRng } from '../src/core/rng';
import type { Cell, Item, Level, Move, SkillDef, Visual } from '../src/core/types';
import { sweepSkill, validateCards, validateItem, validateMissions } from './validate';

const EXPECTED: Record<string, { levels: Level[]; ability: string; testLike?: string; rvp: Partial<Record<Level, string[]>> }> = {
  'svet.obdobi': {
    levels: [1, 2, 3, 4],
    ability: 'znalosti',
    testLike: 'vedomosti',
    rvp: { 1: ['ČJS-3-4-01', 'ČJS-3-3-01'], 2: ['ČJS-3-4-01', 'ČJS-3-3-01'], 3: ['ČJS-3-4-01', 'ČJS-3-3-01'], 4: ['ČJS-5-4-02'] },
  },
  'svet.zvirata': {
    levels: [1, 2, 3, 4, 5],
    ability: 'znalosti',
    testLike: 'vedomosti',
    rvp: { 1: ['ČJS-3-4-02'], 2: ['ČJS-3-4-02'], 3: ['ČJS-3-4-02'], 4: ['ČJS-5-4-04'], 5: ['ČJS-5-4-04'] },
  },
  'svet.rostliny': {
    levels: [1, 2, 3, 4],
    ability: 'znalosti',
    testLike: 'vedomosti',
    rvp: { 1: ['ČJS-3-4-02'], 2: ['ČJS-3-4-02'], 3: ['ČJS-3-4-02'], 4: ['ČJS-5-4-04'] },
  },
  'svet.retezce': {
    levels: [2, 3, 4, 5],
    ability: 'usuzovani',
    rvp: { 2: ['ČJS-3-4-02'], 3: ['ČJS-3-4-02'], 4: ['ČJS-5-4-01', 'ČJS-5-4-03'], 5: ['ČJS-5-4-01', 'ČJS-5-4-03'] },
  },
  'svet.pokusy': {
    levels: [1, 2, 3, 4, 5],
    ability: 'usuzovani',
    rvp: { 1: ['ČJS-3-4-03'], 2: ['ČJS-3-4-03'], 3: ['ČJS-3-4-03'], 4: ['ČJS-5-4-06'], 5: ['ČJS-5-4-06'] },
  },
  'svet.vesmir': {
    levels: [2, 3, 4, 5, 6],
    ability: 'znalosti',
    testLike: 'vedomosti',
    rvp: { 2: ['ČJS-3-4-01'], 3: ['ČJS-5-4-02'], 4: ['ČJS-5-4-02'], 5: ['ČJS-5-4-02'] },
  },
  'svet.mapa': {
    levels: [1, 2, 3, 4, 5],
    ability: 'prostorove',
    rvp: { 1: ['ČJS-3-1-01'], 2: ['ČJS-3-1-01'], 3: ['ČJS-3-1-01'], 4: ['ČJS-5-1-02', 'ČJS-5-1-03'], 5: ['ČJS-5-1-02', 'ČJS-5-1-03'] },
  },
  'svet.cesko': {
    levels: [2, 3, 4, 5],
    ability: 'znalosti',
    testLike: 'vedomosti',
    rvp: { 2: ['ČJS-3-1-02'], 3: ['ČJS-3-1-02'], 4: ['ČJS-5-1-03', 'ČJS-5-1-06'], 5: ['ČJS-5-1-03', 'ČJS-5-1-06'] },
  },
};

/** Úlohy z bank (každá jednou). */
const bankItems = (skill: SkillDef): Item[] => skill.levels.flatMap((level) => enumerateItems(skill.id, level));

/** Různé úlohy z generátoru (přes mnoho semínek, každé id jednou). */
function generatedItems(skill: SkillDef, seeds = 600): Item[] {
  const byId = new Map<string, Item>();
  for (const level of skill.levels) {
    for (let seed = 1; seed <= seeds; seed++) {
      const item = skill.generate(level, createRng(seed * 104729 + level));
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

const ALL: Item[] = (() => {
  const byId = new Map<string, Item>();
  for (const skill of skills) for (const item of [...bankItems(skill), ...generatedItems(skill)]) if (!byId.has(item.id)) byId.set(item.id, item);
  return [...byId.values()];
})();

function correctLabel(item: Item): string | null {
  return item.answer.kind === 'choice' ? item.answer.options[item.answer.correct].label : null;
}

/** Správná odpověď jako text (kvůli kontrole „stejné id = stejná úloha“). */
function answerKey(item: Item): string {
  const a = item.answer;
  switch (a.kind) {
    case 'choice':
      return a.options[a.correct].label;
    case 'number':
      return String(a.correct);
    case 'order':
      return a.correct.join('|');
    case 'program':
      return `${a.maxSteps}|${JSON.stringify(a.collect ?? [])}`;
    default:
      return '';
  }
}

/** Obsah úlohy pro kontrolu duplicit: zadání, vizuál a u seřazování množina položek. */
function contentKey(item: Item): string {
  const extra = item.answer.kind === 'order' ? [...item.answer.correct].sort().join('|') : '';
  return `${item.prompt}|${JSON.stringify(item.visual ?? null)}|${extra}`;
}

function texts(item: Item): string[] {
  const out = [item.prompt, item.explanation, ...item.hints];
  if (item.speak) out.push(item.speak);
  if (item.answer.kind === 'choice') for (const o of item.answer.options) out.push(o.label, ...(o.speak ? [o.speak] : []));
  if (item.answer.kind === 'order') out.push(...item.answer.correct);
  const v = item.visual;
  if (v?.type === 'cards') for (const c of v.cards) out.push(c.title, ...(c.lines ?? []), ...(c.tag ? [c.tag] : []));
  if (v?.type === 'steps') out.push(...v.steps, ...(v.title ? [v.title] : []));
  if (v?.type === 'grid') for (const p of v.places ?? []) out.push(p.name);
  if (v?.type === 'bars') out.push(...v.bars.map((b) => b.label), ...(v.title ? [v.title] : []));
  if (v?.type === 'table') out.push(...v.cells.filter((c): c is string => typeof c === 'string'));
  return out;
}

describe('Ostrov světa – dovednosti', () => {
  it('má všech osm dovedností se správnými id, úrovněmi, typem myšlení a kódy RVP', () => {
    expect(skills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const skill of skills) {
      const e = EXPECTED[skill.id];
      expect(skill.island).toBe('svet');
      expect(skill.levels, skill.id).toEqual(e.levels);
      expect(skill.ability, skill.id).toBe(e.ability);
      expect(skill.testLike, skill.id).toBe(e.testLike);
      expect(skill.name.trim()).not.toBe('');
      expect(skill.description.trim(), skill.id).toMatch(/\.$/);
      expect(skill.rvp, skill.id).toEqual(e.rvp);
      for (const level of skill.levels) {
        if (level > 5) continue;
        const codes = skill.rvp[level] ?? [];
        expect(codes.length, `${skill.id} L${level}`).toBeGreaterThan(0);
        for (const code of codes) expect(code).toMatch(/^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/);
      }
    }
  });

  for (const skill of skills) {
    it(`${skill.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(skill, 300);
      expect(errors).toEqual([]);
      for (const level of skill.levels) expect(distinct[level], `${skill.id} L${level}`).toBeGreaterThanOrEqual(15);
    });

    it(`${skill.id}: úlohy z banky jsou platné, klíče i zadání jedinečné`, () => {
      for (const level of skill.levels) {
        const items = enumerateItems(skill.id, level);
        for (const item of items) expect(validateItem(item, skill, level)).toEqual([]);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size, `duplicitní klíče v ${skill.id} L${level}`).toBe(ids.length);
        const contents = items.map(contentKey);
        expect(new Set(contents).size, `duplicitní zadání v ${skill.id} L${level}`).toBe(contents.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const skill of skills) {
      for (const level of skill.levels) {
        for (const seed of [1, 42, 777]) {
          expect(skill.generate(level, createRng(seed))).toEqual(skill.generate(level, createRng(seed)));
        }
      }
    }
  });

  it('id je podle obsahu: stejné id má vždy stejné zadání, vizuál i správnou odpověď', () => {
    const seen = new Map<string, string>();
    for (const skill of skills) {
      for (const level of skill.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = skill.generate(level, createRng(seed));
          const content = `${item.prompt}|${JSON.stringify(item.visual ?? null)}|${answerKey(item)}`;
          const before = seen.get(item.id);
          if (before !== undefined) expect(content, item.id).toBe(before);
          seen.set(item.id, content);
        }
      }
    }
  });

  it('v jedné úrovni se neopakuje stejné zadání se stejným vizuálem pod jiným id', () => {
    const owner = new Map<string, string>();
    for (const item of ALL) {
      const key = `${item.skillId}:${item.level}|${contentKey(item)}`;
      const before = owner.get(key);
      if (before !== undefined) expect(item.id, `stejné zadání jako ${before}`).toBe(before);
      owner.set(key, item.id);
    }
  });

  it('úroveň mimo rozsah dovednosti vrátí úlohu nejbližší úrovně', () => {
    for (const skill of skills) {
      const low = skill.generate(1, createRng(5));
      const high = skill.generate(6, createRng(5));
      expect(low.level).toBe(skill.levels[0]);
      expect(high.level).toBe(skill.levels[skill.levels.length - 1]);
    }
  });
});

describe('Ostrov světa – karty a mise', () => {
  it('karty projdou kontrolou, jsou u každé dovednosti a aspoň čtyři jsou opravené stránky', () => {
    expect(validateCards(cards, skills)).toEqual([]);
    for (const skill of skills) {
      const n = cards.filter((c) => c.skillId === skill.id).length;
      expect(n, skill.id).toBeGreaterThanOrEqual(2);
      expect(n, skill.id).toBeLessThanOrEqual(4);
    }
    expect(cards.filter((c) => c.fix).length).toBeGreaterThanOrEqual(4);
    expect(cards.length).toBeGreaterThanOrEqual(20);
  });

  it('mise projdou kontrolou a je jich 4–6', () => {
    expect(validateMissions(missions, 'svet')).toEqual([]);
    expect(missions.length).toBeGreaterThanOrEqual(4);
    expect(missions.length).toBeLessThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Texty

/** Emoji, která jsme ověřili (Unicode ≤ 12, bez vlajek). */
const ALLOWED_EMOJI = new Set([
  // zvířata
  '🐋', '🐬', '🐄', '🐟', '🦉', '🐧', '🦇', '🦆', '🐝', '🐞', '🕷', '🦋', '🐊', '🐢', '🦎', '🐸', '🐔', '🐕', '🐈', '🐇',
  '🐘', '🦒', '🦓', '🐒', '🐻', '🐺', '🐁', '🐿', '🦔', '🐍', '🐜', '🐌', '🦗', '🦂', '🦀', '🐙', '🦑', '🐦', '🥚', '🐑',
  '🦊', '🦌', '🐖', '🐐', '🐎', '🐛', '🦅', '🦢', '🐓', '🐤', '🦟', '🐭', '🐹', '🦡', '🦦',
  // rostliny a jídlo
  '🌲', '🌳', '🌷', '🌻', '🌼', '🌾', '🍄', '🌱', '🍁', '🍂', '🌰', '🍎', '🍐', '🍒', '🍓', '🍇', '🍋', '🍊', '🍌', '🥕',
  '🥔', '🧅', '🧄', '🥦', '🥬', '🌿', '☘', '🍀', '🌵', '🌸', '🌹',
  // mapa a místa
  '🏰', '⛵', '🏠', '⛲', '⚓', '⛪', '🏫', '🌉', '⛰', '🎣', '⛺', '💧', '⚒', '🏪', '🏡', '🚉', '📫', '🛏', '🚪', '🧸',
  '📚', '🪑', '🎹', '📺', '🛁', '🧭', '🚲', '⚽', '🎸', '🎨',
  // vesmír a počasí
  '🌞', '☀', '🌙', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '⭐', '🌟', '🪐', '🚀', '🔭', '🌍', '🌎', '🌏', '☄',
  '❄', '🌧', '⛈', '🌈', '🌡', '☁', '🌊',
  // pokusy a měření
  '🧲', '🧊', '🧂', '⚖', '⏱', '📏', '🥄', '🔩', '📎', '🕯', '🥛', '🧪', '🔬', '⚗',
  // ostatní
  '🎵', '🦁', '📜', '🗺', '🏔', '🌋', '🗻', '🏞', '🌐',
]);

/** Všechny řetězce v objektu (rekurzivně). */
function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out));
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out));
  return out;
}

function emojiIn(s: string): string[] {
  return [...s.matchAll(/\p{Extended_Pictographic}/gu)].map((m) => m[0]).concat([...s.matchAll(/[\u{1F1E6}-\u{1F1FF}]/gu)].map((m) => m[0]));
}

/** Slovesa a slova, která na ostrov nepatří (potravní vztahy jen „živí se“). */
const HARSH = new RegExp(
  '(?<!\\p{L})(' +
    [
      'zabít', 'zabil\\p{L}*', 'zabij\\p{L}*', 'zabíj\\p{L}*', 'sežer\\p{L}*', 'sežr\\p{L}*', 'žere', 'žerou', 'umř\\p{L}*', 'umír\\p{L}*',
      'mrtv\\p{L}*', 'smrt\\p{L}*', 'krev', 'krv\\p{L}*', 'válk\\p{L}*', 'válč\\p{L}*', 'loví', 'lovit', 'ulov\\p{L}*', 'lovec', 'lovci',
      'kořist\\p{L}*', 'chytá', 'chytí', 'trhá', 'roztrh\\p{L}*',
    ].join('|') +
    ')(?!\\p{L})',
  'iu',
);

describe('Ostrov světa – texty', () => {
  it('máme dost úloh na kontrolu', () => {
    expect(ALL.length).toBeGreaterThan(600);
  });

  it('texty jsou čisté: interpunkce, uvozovky, mezery', () => {
    for (const item of ALL) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        // Mezera před čárkou či tečkou je chyba; „15 : 3“ a „1 : 100 000“ je dělení a měřítko.
        expect(t, item.id).not.toMatch(/\s[,.?!;]|\s:(?!\s)/);
        expect(t, item.id).not.toMatch(/(?<!\p{L})[Ee]mm?a(?!\p{L})/u);
        expect(t, item.id).not.toMatch(/ - /);
      }
    }
  });

  it('žádná drsná slova – potravní vztahy jen „živí se“ a „je potravou“', () => {
    const all = [...ALL.flatMap(texts), ...strings(cards), ...strings(missions)];
    for (const t of all) expect(t).not.toMatch(HARSH);
  });

  it('hráčku oslovujeme v ženském rodě', () => {
    const all = [...ALL.flatMap(texts), ...strings(cards), ...strings(missions)];
    for (const t of all) {
      // „zkusil jsi“, „jsi viděl“, „jsi si jistý“ – mužský rod v oslovení
      expect(t).not.toMatch(/(?<!\p{L})\p{L}+[^a\s]l (jsi|ses|sis)(?!\p{L})/u);
      expect(t).not.toMatch(/(?<!\p{L})(jsi|ses|sis) \p{L}+[^a\s]l(?!\p{L})/u);
      expect(t).not.toMatch(/(?<!\p{L})jsi (si )?(jistý|připravený|sám|hotový)(?!\p{L})/u);
    }
  });

  it('emoji jen z ověřeného seznamu (Unicode ≤ 12), žádné vlajky', () => {
    const all = [...ALL.flatMap((i) => strings(i)), ...strings(cards), ...strings(missions)];
    for (const t of all) for (const e of emojiIn(t)) expect(ALLOWED_EMOJI.has(e), `${e} v „${t}“`).toBe(true);
  });

  it('možnosti: 3–4 (dvě jen u stálých dvojic), krátké, s velkým písmenem, bez opakování', () => {
    for (const item of ALL) {
      if (item.answer.kind !== 'choice') continue;
      const labels = item.answer.options.map((o) => o.label);
      if (labels.length < 3) expect(labels.length, `${item.id}: ${labels.join(' | ')}`).toBe(2);
      for (const l of labels) {
        expect(l.length, `${item.id}: ${l}`).toBeLessThanOrEqual(40);
        expect(l, item.id).toMatch(/^[\p{Lu}0-9−]/u);
        if (l.length <= 18) expect(l, item.id).not.toMatch(/\.$/);
      }
    }
  });

  it('zadání ani nápověda neprozradí správnou odpověď', () => {
    const lower = (s: string) => s.toLocaleLowerCase('cs');
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /** Celé slovo nebo slovní spojení (ne kus jiného slova: „červen“ × „červencem“). */
    const hasWord = (text: string, word: string) => new RegExp(`(?<!\\p{L})${escape(lower(word))}(?!\\p{L})`, 'u').test(lower(text));
    for (const item of ALL) {
      const label = correctLabel(item);
      if (!label || item.answer.kind !== 'choice') continue;
      const labels = item.answer.options.map((o) => o.label);
      // Otázky typu „Plave, nebo se potopí?“ jmenují všechny možnosti.
      if (labels.every((l) => hasWord(item.prompt, l.split(' ')[0]))) continue;
      for (const t of [item.prompt, ...item.hints]) {
        expect(hasWord(t, label), `${item.id}: „${t}“ prozrazuje „${label}“`).toBe(false);
      }
    }
  });

  it('seřazovací položky jsou krátké a různé', () => {
    for (const item of ALL) {
      if (item.answer.kind !== 'order') continue;
      expect(new Set(item.answer.correct).size, item.id).toBe(item.answer.correct.length);
      for (const x of item.answer.correct) expect(x.length, item.id).toBeLessThanOrEqual(40);
    }
  });
});


// ---------------------------------------------------------------------------
// Fakta proti nezávislým tabulkám (tabulky jsou napsané znovu, ne převzaté
// z obsahu, aby test zachytil překlep v obsahu)

const skillOf = (id: string): SkillDef => skills.find((x) => x.id === id)!;
function itemsOf(id: string, seeds = 3000): Item[] {
  const sk = skillOf(id);
  const byId = new Map<string, Item>();
  for (const it of [...bankItems(sk), ...generatedItems(sk, seeds)]) if (!byId.has(it.id)) byId.set(it.id, it);
  return [...byId.values()];
}
const keyOf = (item: Item) => item.id.split(':')[2];
const labelsOf = (item: Item) => (item.answer.kind === 'choice' ? item.answer.options.map((o) => o.label) : []);
const wrongOf = (item: Item) => labelsOf(item).filter((l) => l !== correctLabel(item));
const lc = (x: string) => x.toLocaleLowerCase('cs');
const cap = (x: string) => x.charAt(0).toLocaleUpperCase('cs') + x.slice(1);
const slugify = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const numberOf = (item: Item) => (item.answer.kind === 'number' ? item.answer.correct : NaN);

const MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Měsíce celé v ročním období (podle kalendáře i meteorologů) a měsíce, kterých se období aspoň dotýká. */
const SEASON_FULL: Record<string, string[]> = { jaro: ['duben', 'květen'], leto: ['červenec', 'srpen'], podzim: ['říjen', 'listopad'], zima: ['leden', 'únor'] };
const SEASON_TOUCH: Record<string, string[]> = {
  jaro: ['březen', 'duben', 'květen', 'červen'],
  leto: ['červen', 'červenec', 'srpen', 'září'],
  podzim: ['září', 'říjen', 'listopad', 'prosinec'],
  zima: ['prosinec', 'leden', 'únor', 'březen'],
};

describe('Ostrov světa – fakta: roční období a měsíce', () => {
  const items = itemsOf('svet.obdobi');

  it('měsíc po a před, řady měsíců a počty dní sedí s kalendářem', () => {
    const seen = { po: 0, rada: 0, dni: 0 };
    for (const item of items) {
      const key = keyOf(item);
      const m = key.match(/^(po|pred)-(.+)$/);
      if (m && item.level === 2) {
        const i = MONTHS.findIndex((x) => slugify(x) === m[2]);
        expect(i, item.id).toBeGreaterThanOrEqual(0);
        expect(correctLabel(item), item.id).toBe(cap(MONTHS[m[1] === 'po' ? (i + 1) % 12 : (i + 11) % 12]));
        for (const l of labelsOf(item)) expect(MONTHS.map(cap), item.id).toContain(l);
        seen.po++;
      }
      const r = key.match(/^rada-([\d-]+)$/);
      if (r && item.answer.kind === 'order') {
        expect(item.answer.correct, item.id).toEqual(r[1].split('-').map((n) => cap(MONTHS[Number(n) - 1])));
        const pos = item.answer.correct.map((x) => MONTHS.indexOf(lc(x)));
        expect([...pos].sort((a, b) => a - b), item.id).toEqual(pos);
        seen.rada++;
      }
      const d = key.match(/^dni-(.+)$/);
      if (d && item.level === 3) {
        const i = MONTHS.findIndex((x) => slugify(x) === d[1]);
        expect(item.prompt, item.id).toContain(MONTHS[i]);
        expect(correctLabel(item), item.id).toBe(`${MONTH_DAYS[i]} dní`);
        seen.dni++;
      }
    }
    expect(seen.po).toBe(24);
    expect(seen.rada).toBeGreaterThan(100);
    expect(seen.dni).toBe(11);
  });

  it('měsíc „celý letní“ apod. patří do období celý a chybné možnosti se ho ani nedotýkají', () => {
    const map: Record<string, string> = { 'mesic-leto': 'leto', 'mesic-zima': 'zima', 'mesic-podzim': 'podzim', 'mesic-jaro': 'jaro' };
    for (const [key, season] of Object.entries(map)) {
      const item = items.find((i) => keyOf(i) === key)!;
      expect(SEASON_FULL[season], key).toContain(lc(correctLabel(item)!));
      for (const l of wrongOf(item)) expect(SEASON_TOUCH[season], `${key}: ${l}`).not.toContain(lc(l));
    }
  });

  it('roční období, slunovraty a délka dne jdou ve správném pořadí', () => {
    const cycle = ['Jaro', 'Léto', 'Podzim', 'Zima'];
    const orders = items.filter((i) => i.answer.kind === 'order' && i.answer.correct.every((x) => cycle.includes(x)));
    expect(orders.length).toBe(3);
    for (const item of orders) {
      if (item.answer.kind !== 'order') continue;
      const start = cycle.indexOf(item.answer.correct[0]);
      expect(item.answer.correct, item.id).toEqual(cycle.map((_, i) => cycle[(start + i) % 4]));
      expect(lc(item.prompt), item.id).toContain(lc(item.answer.correct[0]).slice(0, 3));
    }
    // Délka dne v Praze (hodiny) – nezávisle podle tabulek východů a západů Slunce.
    const DAY: Record<string, number> = { '21. prosince': 8.1, '1. února': 9.2, '21. března': 12.2, '1. května': 14.7, '21. června': 16.3, '1. srpna': 15.2, '23. září': 12.1, '1. listopadu': 9.7 };
    for (const key of ['den-roste', 'den-klesa']) {
      const item = items.find((i) => keyOf(i) === key)!;
      if (item.answer.kind !== 'order') throw new Error(key);
      const hours = item.answer.correct.map((d) => DAY[d]);
      const sorted = [...hours].sort((a, b) => (key === 'den-roste' ? a - b : b - a));
      expect(hours, key).toEqual(sorted);
    }
  });
});

const PLANETS = ['Merkur', 'Venuše', 'Země', 'Mars', 'Jupiter', 'Saturn', 'Uran', 'Neptun'];
const MOON = ['Nov', 'Dorůstající srpek', 'První čtvrť', 'Úplněk', 'Poslední čtvrť', 'Couvající srpek'];

describe('Ostrov světa – fakta: vesmír', () => {
  const items = itemsOf('svet.vesmir');

  it('planety jsou vždy v pořadí od Slunce', () => {
    const seen = { rada: 0, poradi: 0, mezi: 0 };
    for (const item of items) {
      const key = keyOf(item);
      if (item.answer.kind === 'order' && item.answer.correct.every((x) => PLANETS.includes(x))) {
        const pos = item.answer.correct.map((x) => PLANETS.indexOf(x));
        expect([...pos].sort((a, b) => a - b), item.id).toEqual(pos);
        seen.rada++;
      }
      const n = key.match(/^poradi-(\d)$/);
      if (n) {
        expect(correctLabel(item), item.id).toBe(PLANETS[Number(n[1]) - 1]);
        seen.poradi++;
      }
      const mz = key.match(/^mezi-(.+)$/);
      if (mz) {
        const i = PLANETS.findIndex((x) => slugify(x) === mz[1]);
        expect(correctLabel(item), item.id).toBe(PLANETS[i]);
        // V zadání jsou oba sousedé (v 7. pádě začínají stejně jako v 1. pádě).
        expect(item.prompt, item.id).toContain(PLANETS[i - 1].slice(0, 3));
        expect(item.prompt, item.id).toContain(PLANETS[i + 1].slice(0, 3));
        for (const l of wrongOf(item)) expect(Math.abs(PLANETS.indexOf(l) - i), `${item.id}: ${l}`).toBeGreaterThan(1);
        seen.mezi++;
      }
    }
    expect(seen.rada).toBeGreaterThan(100);
    expect(seen.poradi).toBe(8);
    expect(seen.mezi).toBe(12); // šest planet uprostřed, na L3 i L4
    const pocet = items.find((i) => keyOf(i) === 'pocet-planet')!;
    expect(numberOf(pocet)).toBe(PLANETS.length);
  });

  it('fáze Měsíce jdou za sebou od novu', () => {
    const orders = items.filter((i) => i.answer.kind === 'order' && i.answer.correct.every((x) => MOON.includes(x)));
    expect(orders.length).toBe(2);
    for (const item of orders) {
      if (item.answer.kind !== 'order') continue;
      const pos = item.answer.correct.map((x) => MOON.indexOf(x));
      expect(pos[0], item.id).toBe(0);
      expect([...pos].sort((a, b) => a - b), item.id).toEqual(pos);
    }
  });

  it('Pluto je od roku 2006 trpasličí planeta a nikde není správnou odpovědí jako planeta', () => {
    const pluto = cards.find((c) => c.id === 'svet.vesmir.pluto')!;
    expect(pluto.text).toMatch(/2006/);
    expect(pluto.text).toMatch(/trpasličí/);
    for (const item of items) expect(correctLabel(item), item.id).not.toBe('Pluto');
    expect(correctLabel(items.find((i) => keyOf(i) === 'pluto')!)).toBe('Trpasličí planetou');
  });
});

/** Hlavní města – nezávislá tabulka. */
const CAPITALS: Record<string, string> = {
  Německo: 'Berlín', Polsko: 'Varšava', Slovensko: 'Bratislava', Rakousko: 'Vídeň', Norsko: 'Oslo', Švédsko: 'Stockholm',
  Dánsko: 'Kodaň', Island: 'Reykjavík', Finsko: 'Helsinky', Francie: 'Paříž', Itálie: 'Řím', Maďarsko: 'Budapešť',
  Španělsko: 'Madrid', 'Spojené království': 'Londýn', Portugalsko: 'Lisabon', Řecko: 'Atény', Nizozemsko: 'Amsterdam',
  Belgie: 'Brusel', Irsko: 'Dublin', Švýcarsko: 'Bern', Chorvatsko: 'Záhřeb', Slovinsko: 'Lublaň', Rumunsko: 'Bukurešť',
  Bulharsko: 'Sofie', Litva: 'Vilnius', Lotyšsko: 'Riga', Estonsko: 'Tallinn',
};
const NEIGHBORS = ['Německo', 'Polsko', 'Slovensko', 'Rakousko'];
const NEIGHBOR_DIR: Record<string, string> = { 'soused-sever': 'Polsko', 'soused-jih': 'Rakousko', 'soused-vychod': 'Slovensko', 'soused-zapad': 'Německo' };
const KRAJE: Record<string, string> = {
  'Jihočeského kraje': 'České Budějovice', 'Plzeňského kraje': 'Plzeň', 'Karlovarského kraje': 'Karlovy Vary',
  'Ústeckého kraje': 'Ústí nad Labem', 'Libereckého kraje': 'Liberec', 'Královéhradeckého kraje': 'Hradec Králové',
  'Pardubického kraje': 'Pardubice', 'kraje Vysočina': 'Jihlava', 'Jihomoravského kraje': 'Brno',
  'Olomouckého kraje': 'Olomouc', 'Zlínského kraje': 'Zlín', 'Moravskoslezského kraje': 'Ostrava',
};
const PEAKS: Record<string, string> = {
  Sněžka: 'V Krkonoších', Praděd: 'V Jeseníkách', 'Lysá hora': 'V Beskydech', Radhošť: 'V Beskydech',
  Klínovec: 'V Krušných horách', Plechý: 'Na Šumavě', Boubín: 'Na Šumavě',
};

describe('Ostrov světa – fakta: Česko a Evropa', () => {
  const items = itemsOf('svet.cesko');

  it('hlavní města a státy odpovídají tabulce', () => {
    const seen = { mesto: new Set<string>(), stat: new Set<string>() };
    for (const item of items) {
      const key = keyOf(item);
      const m = key.match(/^mesto-(.+)$/);
      if (m) {
        const country = Object.keys(CAPITALS).find((c) => slugify(c) === m[1])!;
        expect(country, item.id).toBeDefined();
        expect(item.prompt, item.id).toMatch(/^Jak se jmenuje hlavní město /);
        expect(correctLabel(item), item.id).toBe(CAPITALS[country]);
        for (const l of wrongOf(item)) {
          expect(Object.values(CAPITALS), `${item.id}: ${l}`).toContain(l);
          expect(l).not.toBe(CAPITALS[country]);
        }
        seen.mesto.add(country);
      }
      const st = key.match(/^stat-(.+)$/);
      if (st) {
        const capital = Object.values(CAPITALS).find((c) => slugify(c) === st[1])!;
        expect(item.prompt, item.id).toContain(capital);
        expect(CAPITALS[correctLabel(item)!], item.id).toBe(capital);
        for (const l of wrongOf(item)) expect(CAPITALS[l], `${item.id}: ${l}`).not.toBe(capital);
        seen.stat.add(capital);
      }
    }
    expect(seen.mesto.size).toBe(Object.keys(CAPITALS).length);
    expect(seen.stat.size).toBe(Object.keys(CAPITALS).length);
    expect(correctLabel(items.find((i) => keyOf(i) === 'praha')!)).toBe('Praha');
  });

  it('sousedé Česka odpovídají tabulce', () => {
    let checked = 0;
    for (const item of items) {
      const key = keyOf(item);
      const m = key.match(/^soused-(.+)$/);
      if (m && !NEIGHBOR_DIR[key]) {
        const country = Object.keys(CAPITALS).find((c) => slugify(c) === m[1])!;
        expect(item.prompt, item.id).toMatch(/^Sousedí Česko se? /);
        expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(NEIGHBORS.includes(country) ? 0 : 1);
        checked++;
      }
      if (NEIGHBOR_DIR[key]) {
        expect(correctLabel(item), item.id).toBe(NEIGHBOR_DIR[key]);
        for (const l of wrongOf(item)) expect(l).not.toBe(NEIGHBOR_DIR[key]);
        checked++;
      }
    }
    expect(checked).toBe(13 + 4);
    const soused = items.find((i) => keyOf(i) === 'soused')!;
    expect(NEIGHBORS).toContain(correctLabel(soused));
    for (const l of wrongOf(soused)) expect(NEIGHBORS).not.toContain(l);
    expect(numberOf(items.find((i) => keyOf(i) === 'sousede-pocet')!)).toBe(NEIGHBORS.length);
  });

  it('krajská města a hory odpovídají tabulce', () => {
    const kraje = new Set<string>();
    const hory = new Set<string>();
    for (const item of items) {
      const key = keyOf(item);
      if (key.startsWith('kraj-') && key !== 'kraj-co') {
        const kraj = Object.keys(KRAJE).find((k) => item.prompt.endsWith(`${k}?`))!;
        expect(kraj, item.id).toBeDefined();
        expect(correctLabel(item), item.id).toBe(KRAJE[kraj]);
        for (const l of wrongOf(item)) expect(Object.values(KRAJE)).toContain(l);
        kraje.add(kraj);
      }
      if (key.startsWith('hora-')) {
        const peak = Object.keys(PEAKS).find((p) => item.prompt.endsWith(` ${p}?`))!;
        expect(peak, item.id).toBeDefined();
        expect(correctLabel(item), item.id).toBe(PEAKS[peak]);
        for (const l of wrongOf(item)) expect(l).not.toBe(PEAKS[peak]);
        hory.add(peak);
      }
    }
    expect(kraje.size).toBe(Object.keys(KRAJE).length);
    expect(hory.size).toBe(Object.keys(PEAKS).length);
    expect(numberOf(items.find((i) => keyOf(i) === 'kraje')!)).toBe(14);
  });

  it('vlajka je popsaná slovy správně a nikde není emoji vlajky', () => {
    const vlajka = items.find((i) => keyOf(i) === 'vlajka')!;
    expect(correctLabel(vlajka)).toMatch(/bílý.*červený.*modrý klín/i);
    for (const item of items) for (const t of texts(item)) expect(t, item.id).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]|🏁|🚩|🎌|🏴|🏳/u);
  });
});

/** Skupiny zvířat – nezávislá tabulka. */
const GROUP: Record<string, string> = {
  pes: 'Savci', kráva: 'Savci', kůň: 'Savci', veverka: 'Savci', ježek: 'Savci', velryba: 'Savci', delfín: 'Savci', kosatka: 'Savci',
  netopýr: 'Savci', vydra: 'Savci', lachtan: 'Savci', slepice: 'Ptáci', kos: 'Ptáci', kachna: 'Ptáci', sova: 'Ptáci', pštros: 'Ptáci',
  kapr: 'Ryby', štika: 'Ryby', pstruh: 'Ryby', 'mořský koník': 'Ryby', úhoř: 'Ryby', žába: 'Obojživelníci', ropucha: 'Obojživelníci',
  čolek: 'Obojživelníci', mlok: 'Obojživelníci', ještěrka: 'Plazi', užovka: 'Plazi', želva: 'Plazi', krokodýl: 'Plazi', slepýš: 'Plazi',
  včela: 'Hmyz', motýl: 'Hmyz', beruška: 'Hmyz', mravenec: 'Hmyz', kobylka: 'Hmyz', vážka: 'Hmyz', čmelák: 'Hmyz', komár: 'Hmyz',
  pavouk: 'Pavoukovci', klíště: 'Pavoukovci', štír: 'Pavoukovci', sekáč: 'Pavoukovci',
};
const VERTEBRATE: Record<string, boolean> = {
  kapr: true, žába: true, ještěrka: true, vrabec: true, delfín: true, užovka: true, netopýr: true,
  pavouk: false, hlemýžď: false, žížala: false, včela: false, chobotnice: false, rak: false, medúza: false, klíště: false,
};

describe('Ostrov světa – fakta: zvířata a rostliny', () => {
  it('skupiny zvířat a obratlovci odpovídají tabulce', () => {
    const items = itemsOf('svet.zvirata');
    const seen = { skupina: 0, obratel: 0 };
    for (const item of items) {
      const key = keyOf(item);
      const m = key.match(/^skupina-(.+)$/);
      if (m) {
        const animal = Object.keys(GROUP).find((a) => slugify(a) === m[1])!;
        expect(animal, item.id).toBeDefined();
        expect(correctLabel(item), item.id).toBe(GROUP[animal]);
        seen.skupina++;
      }
      const o = key.match(/^obratel-(.+)$/);
      if (o) {
        const animal = Object.keys(VERTEBRATE).find((a) => slugify(a) === o[1])!;
        expect(item.answer.kind === 'choice' && item.answer.correct, item.id).toBe(VERTEBRATE[animal] ? 0 : 1);
        seen.obratel++;
      }
    }
    expect(seen.skupina).toBe(Object.keys(GROUP).length);
    expect(seen.obratel).toBe(Object.keys(VERTEBRATE).length);
  });

  it('ovoce × zelenina, strom × keř × bylina a jedlé části rostlin odpovídají tabulce', () => {
    const OVOCE = ['jablko', 'hruška', 'švestka', 'třešeň', 'meruňka', 'broskev', 'pomeranč', 'banán', 'citron', 'hroznové víno', 'malina', 'jahoda'];
    const ZELENINA = ['mrkev', 'petržel', 'cibule', 'česnek', 'salát', 'zelí', 'kedluben', 'ředkvička', 'špenát', 'celer', 'květák', 'pórek'];
    const DRUH: Record<string, string> = {
      dub: 'Strom', buk: 'Strom', lípa: 'Strom', bříza: 'Strom', javor: 'Strom', smrk: 'Strom', borovice: 'Strom', jedle: 'Strom',
      modřín: 'Strom', jabloň: 'Strom', rybíz: 'Keř', angrešt: 'Keř', líska: 'Keř', 'šípková růže': 'Keř', pampeliška: 'Bylina',
      sedmikráska: 'Bylina', kopretina: 'Bylina', mák: 'Bylina', tulipán: 'Bylina', sněženka: 'Bylina', kopřiva: 'Bylina',
      heřmánek: 'Bylina', jahodník: 'Bylina',
    };
    const CAST: Record<string, string> = {
      mrkve: 'Kořen', salátu: 'Listy', špenátu: 'Listy', zelí: 'Listy', jabloně: 'Plod', rajčete: 'Plod',
      okurky: 'Plod', papriky: 'Plod', hrášku: 'Semena', brokolice: 'Květy', květáku: 'Květy', kedlubnu: 'Stonek', chřestu: 'Stonek',
    };
    const items = itemsOf('svet.rostliny');
    const seen = { ovoce: 0, druh: 0, cast: 0 };
    for (const item of items) {
      const key = keyOf(item);
      const ov = key.match(/^ovoce-(.+)$/);
      if (ov) {
        const isOvoce = OVOCE.some((x) => slugify(x) === ov[1]);
        const isZel = ZELENINA.some((x) => slugify(x) === ov[1]);
        expect(isOvoce !== isZel, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(isOvoce ? 'Ovoce' : 'Zelenina');
        seen.ovoce++;
      }
      const dr = key.match(/^druh-(.+)$/);
      if (dr) {
        const plant = Object.keys(DRUH).find((x) => slugify(x) === dr[1])!;
        expect(correctLabel(item), item.id).toBe(DRUH[plant]);
        seen.druh++;
      }
      const ca = key.match(/^cast-(.+)$/);
      if (ca) {
        const food = Object.keys(CAST).find((x) => slugify(x) === ca[1])!;
        expect(item.prompt, item.id).toContain(`u ${food}?`);
        expect(correctLabel(item), item.id).toBe(CAST[food]);
        seen.cast++;
      }
    }
    expect(seen.ovoce).toBe(OVOCE.length + ZELENINA.length);
    expect(seen.druh).toBe(Object.keys(DRUH).length);
    expect(seen.cast).toBe(Object.keys(CAST).length);
  });
});

describe('Ostrov světa – fakta: pokusy a potravní řetězce', () => {
  it('plave × potopí se, magnet, rozpouštění a jednotky odpovídají tabulce', () => {
    const FLOATS: Record<string, boolean> = {
      korek: true, 'dřevěnou kostku': true, 'plastový míček': true, jablko: true, pírko: true, 'pingpongový míček': true,
      'gumovou kachničku': true, kamínek: false, 'železný hřebík': false, klíč: false, 'skleněnou kuličku': false,
      'kovovou lžičku': false, 'kuličku z plastelíny': false, minci: false, 'dřevěnou tužku': true, svíčku: true, 'kostku ledu': true,
      'zavřenou prázdnou láhev': true, 'kousek polystyrenu': true, bramboru: false,
      'gumu na gumování': false, 'kuličku hroznového vína': false, 'kovový šroubek': false,
    };
    /** Magnet přitahuje železo a ocel, jiné kovy ne. */
    const magnetic = (thing: string) => /železn|ocel|víčko od sklenice/.test(thing);
    const DISSOLVES: Record<string, boolean> = {
      cukr: true, sul: true, 'kostka-cukru': true, pisek: false, kaminky: false, ryze: false, med: true, olej: false,
      koralky: false, piliny: false, 'sul-tepla': true, 'pisek-tepla': false,
    };
    const UNIT_KIND: Record<string, string> = {
      'V milimetrech': 'délka', 'V centimetrech': 'délka', 'V metrech': 'délka', 'V kilometrech': 'délka', 'V gramech': 'hmotnost',
      'V kilogramech': 'hmotnost', 'V mililitrech': 'objem', 'V litrech': 'objem', 'Ve stupních Celsia': 'teplota',
      'V sekundách': 'čas', 'V minutách': 'čas', 'V hodinách': 'čas',
    };
    const items = itemsOf('svet.pokusy');
    const seen = { plave: 0, magnet: 0, rozpusti: 0, jednotka: 0 };
    for (const item of items) {
      const key = keyOf(item);
      if (key.startsWith('plave-')) {
        const thing = item.prompt.match(/^Pustíš do vody (.+)\. Bude plavat/)![1];
        expect(thing in FLOATS, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(FLOATS[thing] ? 'Bude plavat' : 'Potopí se');
        seen.plave++;
      }
      if (key.startsWith('magnet-') && key !== 'magnet-co' && key !== 'magnet-papir' && key !== 'magnet-hlinik') {
        const thing = item.prompt.match(/^Přitáhne magnet (.+)\?$/)![1];
        expect(correctLabel(item), item.id).toBe(magnetic(thing) ? 'Ano, přitáhne' : 'Ne, nepřitáhne');
        seen.magnet++;
      }
      const rz = key.match(/^rozpusti-(.+)$/);
      if (rz) {
        expect(rz[1] in DISSOLVES, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(DISSOLVES[rz[1]] ? 'Ano, rozpustí se' : 'Ne, nerozpustí se');
        seen.rozpusti++;
      }
      if (key.startsWith('jednotka-')) {
        const kind = UNIT_KIND[correctLabel(item)!];
        expect(kind, item.id).toBeDefined();
        for (const l of wrongOf(item)) expect(UNIT_KIND[l], `${item.id}: ${l}`).not.toBe(kind);
        seen.jednotka++;
      }
    }
    expect(seen.plave).toBe(Object.keys(FLOATS).length + 1); // kamínek je v obou úrovních
    // L1: 10 věcí (bez „papír“, jeho klíč magnet-papir test přeskakuje), L3: 7 věcí.
    expect(seen.magnet).toBeGreaterThanOrEqual(16);
    expect(seen.rozpusti).toBe(Object.keys(DISSOLVES).length);
    expect(seen.jednotka).toBe(14);
  });

  it('grafy z pokusů: odpověď se dá spočítat ze sloupců', () => {
    let checked = 0;
    for (const item of itemsOf('svet.pokusy', 6000)) {
      const v = item.visual;
      if (v?.type !== 'bars') continue;
      const vals = v.bars.map((b) => b.value);
      const key = keyOf(item);
      const n = numberOf(item);
      const day = key.match(/-den-(\d)$/);
      if (day) expect(n, item.id).toBe(vals[Number(day[1])]);
      else if (key.endsWith('-rust')) expect(n, item.id).toBe(vals[vals.length - 1] - vals[0]);
      else if (key.endsWith('-prumer')) expect(n * vals.length, item.id).toBe(vals.reduce((a, b) => a + b, 0));
      else if (key.endsWith('-rozdil')) expect(n, item.id).toBe(Math.max(...vals) - Math.min(...vals));
      else throw new Error(`${item.id}: neznámý graf`);
      expect(vals.every((x) => x >= 0), item.id).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('býložravci, masožravci a všežravci odpovídají tabulce a řetězce začínají rostlinou', () => {
    const DIET: Record<string, string> = {
      kráva: 'Býložravec', koza: 'Býložravec', ovce: 'Býložravec', kůň: 'Býložravec', zajíc: 'Býložravec', srna: 'Býložravec',
      bobr: 'Býložravec', slon: 'Býložravec', žirafa: 'Býložravec', housenka: 'Býložravec', vlk: 'Masožravec', rys: 'Masožravec',
      sova: 'Masožravec', orel: 'Masožravec', štika: 'Masožravec', lev: 'Masožravec', tygr: 'Masožravec', krokodýl: 'Masožravec',
      čáp: 'Masožravec', medvěd: 'Všežravec', 'divoké prase': 'Všežravec', jezevec: 'Všežravec', potkan: 'Všežravec', vrána: 'Všežravec',
    };
    const PLANTS = ['Tráva', 'Semínka', 'Listy', 'Řasy', 'Rostliny', 'Spadané listí', 'Žaludy'];
    const items = itemsOf('svet.retezce');
    let diet = 0;
    let chains = 0;
    for (const item of items) {
      const key = keyOf(item);
      const d = key.match(/^strava-(.+)$/);
      if (d) {
        const animal = Object.keys(DIET).find((a) => slugify(a) === d[1])!;
        expect(correctLabel(item), item.id).toBe(DIET[animal]);
        diet++;
      }
      const steps = item.visual?.type === 'steps' ? item.visual.steps : item.answer.kind === 'order' && key.startsWith('rada-') ? item.answer.correct : null;
      if (!steps) continue;
      expect(PLANTS, item.id).toContain(steps[0]);
      for (const x of steps.slice(1)) expect(PLANTS, `${item.id}: ${x}`).not.toContain(x);
      if (key.startsWith('bylozravec-')) expect(correctLabel(item), item.id).toBe(steps[1]);
      if (key.startsWith('potrava-')) {
        const i = steps.indexOf(correctLabel(item)!);
        expect(i, item.id).toBeGreaterThanOrEqual(0);
        expect(i, item.id).toBeLessThan(steps.length - 1);
      }
      if (key.startsWith('zmizi-') || key.startsWith('prostredni-')) {
        const label = correctLabel(item)!;
        expect(label, item.id).toMatch(/ by přibylo$/);
        expect(wrongOf(item), item.id).toContain(label.replace(/ by přibylo$/, ' by ubylo'));
      }
      chains++;
    }
    expect(diet).toBe(Object.keys(DIET).length);
    expect(chains).toBeGreaterThan(30);
  });
});

// ---------------------------------------------------------------------------
// Mapy: každá otázka nad mřížkou a každý program jsou jednoznačné a řešitelné

type Grid = Extract<Visual, { type: 'grid' }>;
type GPlace = NonNullable<Grid['places']>[number];
const DIR: Record<string, Cell> = { sever: { x: 0, y: -1 }, jih: { x: 0, y: 1 }, vychod: { x: 1, y: 0 }, zapad: { x: -1, y: 0 } };
const FIRST: Record<string, string> = { s: 'sever', j: 'jih', v: 'vychod', z: 'zapad' };
const PLAN_DIR: Record<string, string> = { vpravo: 'vychod', vlevo: 'zapad', nad: 'sever', pod: 'jih' };
const DIR_LABEL: Record<string, string> = { sever: 'Na sever', jih: 'Na jih', vychod: 'Na východ', zapad: 'Na západ' };
const WORD: Record<string, string> = { sever: 'na sever', jih: 'na jih', vychod: 'na východ', zapad: 'na západ' };

/** Leží místo aspoň trochu ve směru (i šikmo)? */
const loosely = (from: Cell, p: Cell, d: string) => (DIR[d].x !== 0 ? Math.sign(p.x - from.x) === DIR[d].x : Math.sign(p.y - from.y) === DIR[d].y);

function placeNamed(v: Grid, name: string): GPlace {
  const found = (v.places ?? []).filter((p) => p.name === name);
  expect(found.length, name).toBe(1);
  return found[0];
}
const placeOf = (v: Grid, id: string) => placeNamed(v, MISTA[id].name);
const placeAt = (v: Grid, c: Cell) => (v.places ?? []).find((p) => p.x === c.x && p.y === c.y);
const placeByLabel = (v: Grid, label: string) => placeNamed(v, (v.places ?? []).find((p) => cap(p.name) === label)?.name ?? label);
const isRock = (v: Grid, c: Cell) => (v.rocks ?? []).some((r) => r.x === c.x && r.y === c.y);
const insideGrid = (v: Grid, c: Cell) => c.x >= 0 && c.y >= 0 && c.x < v.cols && c.y < v.rows;

/** Nejkratší let po mřížce (vlastní BFS, nezávislý na obsahu). */
function bfs(v: Grid, a: Cell, b: Cell): number {
  const dist = new Map<string, number>([[`${a.x},${a.y}`, 0]]);
  const queue: Cell[] = [a];
  while (queue.length) {
    const c = queue.shift()!;
    const dc = dist.get(`${c.x},${c.y}`)!;
    if (c.x === b.x && c.y === b.y) return dc;
    for (const d of Object.values(DIR)) {
      const n = { x: c.x + d.x, y: c.y + d.y };
      if (!insideGrid(v, n) || isRock(v, n) || dist.has(`${n.x},${n.y}`)) continue;
      dist.set(`${n.x},${n.y}`, dc + 1);
      queue.push(n);
    }
  }
  return -1;
}

/** Proletí úseky („v2“ = 2 políčka na východ) a vrátí cílové políčko; cesta musí být na mapě a bez skal. */
function flySegments(v: Grid, from: Cell, segs: string[]): Cell {
  let c = { ...from };
  for (const seg of segs) {
    const d = DIR[FIRST[seg[0]]];
    for (let i = 0; i < Number(seg.slice(1)); i++) {
      c = { x: c.x + d.x, y: c.y + d.y };
      expect(insideGrid(v, c) && !isRock(v, c), `úsek ${seg}`).toBe(true);
    }
  }
  return c;
}

const MAP_LEVEL: Record<string, Level> = {
  vedle: 1, planLet: 1, primo: 2, smer: 2, nej: 2, let: 2, trasa: 3, kroky: 3, prvni: 3, vejce: 3, sikmo: 4, oprava: 4, trasa3: 4, km: 5,
};

describe('Ostrov světa – mapy', () => {
  const mapa = skillOf('svet.mapa');
  const all: Item[] = [];
  for (const [pool, makers] of Object.entries(MAP_POOLS)) {
    makers.forEach((make, i) => {
      const rng = createRng(1000 + i);
      all.push(buildItem(mapa.id, MAP_LEVEL[pool], make(rng), rng));
    });
  }

  it('všechny úlohy nad mapou projdou kontrolou a klíče se neopakují', () => {
    expect(all.length).toBeGreaterThan(2000);
    for (const item of all) expect(validateItem(item, mapa, item.level), item.id).toEqual([]);
    const ids = all.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of all) {
      const v = item.visual as Grid;
      const names = (v.places ?? []).map((p) => p.name);
      expect(new Set(names).size, item.id).toBe(names.length);
      if (item.level >= 2) expect(v.compass, item.id).toBe(true);
      else expect(v.compass, item.id).toBeUndefined();
    }
  });

  it('otázky „co je hned vedle“, „přímo na východ“ a „kterým směrem“ mají právě jednu správnou odpověď', () => {
    for (const item of all) {
      const v = item.visual as Grid;
      const k = keyOf(item).split('-');
      if (k[0] === 'vedle') {
        const [, , fromId, word] = k;
        const d = PLAN_DIR[word];
        const from = placeOf(v, fromId);
        const target = placeAt(v, { x: from.x + DIR[d].x, y: from.y + DIR[d].y })!;
        expect(correctLabel(item), item.id).toBe(cap(target.name));
        for (const l of wrongOf(item)) expect(loosely(from, placeByLabel(v, l), d), `${item.id}: ${l}`).toBe(false);
      }
      if (k[0] === 'primo') {
        // „Přímo na východ od X“ = ve stejném řádku napravo. Takové místo je jen jedno
        // a chybné možnosti na východ neleží vůbec, ani šikmo.
        const [, d, , fromId] = k;
        const from = placeOf(v, fromId);
        const ray = (v.places ?? []).filter((p) => (DIR[d].x !== 0 ? p.y === from.y : p.x === from.x) && loosely(from, p, d));
        expect(ray.length, item.id).toBe(1);
        expect(correctLabel(item), item.id).toBe(cap(ray[0].name));
        expect(item.prompt, item.id).toContain(WORD[d]);
        for (const l of wrongOf(item)) expect(loosely(from, placeByLabel(v, l), d), `${item.id}: ${l}`).toBe(false);
      }
      if (k[0] === 'smer') {
        const [, , aId, bId] = k;
        const a = placeOf(v, aId);
        const b = placeOf(v, bId);
        expect(a.x === b.x || a.y === b.y, item.id).toBe(true);
        const d = a.x === b.x ? (a.y < b.y ? 'sever' : 'jih') : a.x > b.x ? 'vychod' : 'zapad';
        expect(correctLabel(item), item.id).toBe(DIR_LABEL[d]);
      }
      if (k[0] === 'sikmo') {
        const [, , aId, bId] = k;
        const a = placeOf(v, aId);
        const b = placeOf(v, bId);
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        expect(Math.abs(dx) === Math.abs(dy) && dx !== 0, item.id).toBe(true);
        expect(correctLabel(item), item.id).toBe(`Na ${dy < 0 ? 'sever' : 'jih'}o${dx > 0 ? 'východ' : 'západ'}`);
      }
      if (k[0] === 'nej') {
        const [, d] = k;
        const score = (p: GPlace) => p.x * DIR[d].x + p.y * DIR[d].y;
        const best = Math.max(...(v.places ?? []).map(score));
        const top = (v.places ?? []).filter((p) => score(p) === best);
        expect(top.length, item.id).toBe(1);
        expect(correctLabel(item), item.id).toBe(cap(top[0].name));
      }
    }
  });

  it('lety po úsecích, kroky a „nad čím proletí jako první“ sedí s mapou', () => {
    for (const item of all) {
      const v = item.visual as Grid;
      const k = keyOf(item).split('-');
      if (k[0] === 'trasa' || k[0] === 'trasa3') {
        const [, , fromId, ...segs] = k;
        const from = placeOf(v, fromId);
        expect(v.dragon, item.id).toEqual({ x: from.x, y: from.y });
        for (const seg of segs) expect(item.prompt, item.id).toContain(WORD[FIRST[seg[0]]]);
        const end = flySegments(v, from, segs);
        const target = placeAt(v, end)!;
        expect(target, item.id).toBeDefined();
        expect(correctLabel(item), item.id).toBe(cap(target.name));
      }
      if (k[0] === 'kroky') {
        const [, , aId, bId] = k;
        const a = placeOf(v, aId);
        const b = placeOf(v, bId);
        expect(a.x === b.x || a.y === b.y, item.id).toBe(true);
        const n = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        expect(numberOf(item), item.id).toBe(n);
        expect(bfs(v, a, b), `${item.id}: rovná cesta bez skal`).toBe(n);
      }
      if (k[0] === 'prvni') {
        const [, d, , fromId] = k;
        const from = placeOf(v, fromId);
        let c: Cell = { x: from.x, y: from.y };
        let first: GPlace | undefined;
        while (!first) {
          c = { x: c.x + DIR[d].x, y: c.y + DIR[d].y };
          expect(insideGrid(v, c) && !isRock(v, c), item.id).toBe(true);
          first = placeAt(v, c);
        }
        expect(correctLabel(item), item.id).toBe(cap(first.name));
      }
      if (k[0] === 'km1' || k[0] === 'km2') {
        const [, , aId, bId] = k;
        const per = k[0] === 'km1' ? 1 : 2;
        expect(numberOf(item), item.id).toBe(bfs(v, placeOf(v, aId), placeOf(v, bId)) * per);
      }
    }
  });

  it('programy: drak startuje u místa ze zadání, cíl je u druhého místa a oprava opravdu spletla východ se západem', () => {
    let checked = 0;
    for (const item of all) {
      if (item.answer.kind !== 'program') continue;
      const v = item.visual as Grid;
      const k = keyOf(item).split('-');
      const [aId, bId] = k[0] === 'plan' ? [k[3], k[4]] : [k[2], k[3]];
      const a = placeOf(v, aId);
      const b = placeOf(v, bId);
      expect(v.dragon, item.id).toEqual({ x: a.x, y: a.y });
      expect(v.goal, item.id).toEqual({ x: b.x, y: b.y });
      expect(item.prompt, item.id).toContain(`od ${MISTA[aId].gen} ${MISTA[bId].dat}`);
      if (k[0] === 'vejce') expect(item.answer.collect?.length, item.id).toBe(1);
      if (k[0] === 'oprava') {
        const world = { cols: v.cols, rows: v.rows, dragon: v.dragon!, goal: v.goal!, rocks: v.rocks };
        const mirrored = v.path!.map((m): Move => (m === 'R' ? 'L' : m === 'L' ? 'R' : m));
        expect(fly(world, v.path!).ok, item.id).toBe(false);
        expect(fly(world, mirrored).ok, item.id).toBe(true);
        expect(mirrored.length, item.id).toBeLessThanOrEqual(item.answer.maxSteps);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('měřítko: kilometry a centimetry sedí s čísly v zadání', () => {
    let checked = 0;
    for (const item of itemsOf('svet.mapa', 4000)) {
      if (!keyOf(item).startsWith('meritko-') || item.answer.kind !== 'number') continue;
      const [, per] = item.prompt.match(/1 cm jako (\d+) km/)!.map(Number);
      const cm = item.prompt.match(/měří na mapě (\d+) cm/);
      const km = item.prompt.match(/dlouhá (\d+) km/);
      if (cm) expect(item.answer.correct, item.id).toBe(Number(cm[1]) * per);
      else expect(item.answer.correct * per, item.id).toBe(Number(km![1]));
      checked++;
    }
    expect(checked).toBeGreaterThan(15);
  });
});

// ---------------------------------------------------------------------------
// Hraniční případy z korektury: nesmí se vrátit (fakta, která doma nebo podle
// odborníků dopadají jinak, a úlohy, kde by chytré dítě mělo pravdu i jinak).

describe('Ostrov světa – hraniční případy', () => {
  /** Mnoho vygenerovaných úloh (i opakovaně stejné id s jinými možnostmi). */
  function many(id: string, level: Level, seeds = 1500): Item[] {
    const sk = skillOf(id);
    return Array.from({ length: seeds }, (_, s) => sk.generate(level, createRng(s * 7919 + 13)));
  }

  it('pokusy: žádný ořech, zlato, stříbro ani konzerva a tekutiny se neměří „váhou“ jako chybou', () => {
    const items = itemsOf('svet.pokusy');
    for (const item of items) {
      if (keyOf(item).startsWith('plave-')) expect(item.prompt, item.id).not.toMatch(/ořech/);
      if (keyOf(item).startsWith('magnet-')) expect(item.prompt, item.id).not.toMatch(/zlat|stříbr|konzerv/);
    }
    for (const item of many('svet.pokusy', 1)) {
      if (/meridlo-(hrnek|mleko)$/.test(item.id)) expect(wrongOf(item), item.id).not.toContain('Váhou');
    }
    for (const item of many('svet.pokusy', 2).concat(many('svet.pokusy', 3))) {
      if (keyOf(item).startsWith('jednotka-') && / (kolik|jak) /.test(item.prompt)) expect(item.prompt, item.id).toMatch(/změříš, (kolik|jak) /);
    }
  });

  it('rostliny: jedlé části, které se jedí také, nejsou chybnou možností a ředkvička chybí', () => {
    const also: Record<string, string[]> = { brokolice: ['Stonek'], kvetaku: ['Stonek'], rajcete: ['Semena'], okurky: ['Semena'], hrasku: ['Plod'] };
    let checked = 0;
    for (const item of many('svet.rostliny', 3)) {
      const m = keyOf(item).match(/^cast-(.+)$/);
      if (!m) continue;
      expect(m[1], item.id).not.toBe('redkvicky');
      for (const x of also[m[1]] ?? []) expect(wrongOf(item), item.id).not.toContain(x);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('řetězce: čáp v řetězci není (živí se i kobylkami) a kobylka není „býložravec“', () => {
    for (const item of itemsOf('svet.retezce')) {
      const v = item.visual;
      if (v?.type === 'steps') expect(v.steps, item.id).not.toContain('Čáp');
      if (keyOf(item).startsWith('bylozravec-')) expect(correctLabel(item), item.id).not.toBe('Kobylka');
    }
  });

  it('zvířata a roční období: „co nepatří“ říká, podle čeho třídit, a medvěd není příklad zimního spánku', () => {
    for (const item of itemsOf('svet.zvirata')) {
      if (keyOf(item).startsWith('lichy-')) expect(item.prompt, item.id).toMatch(/savci, ptáci nebo hmyz|Obratlovci, nebo bezobratlí/);
    }
    const obdobi = itemsOf('svet.obdobi');
    const ne = obdobi.find((i) => keyOf(i) === 'zimni-spanek-ne')!;
    expect(labelsOf(ne)).not.toContain('Medvěd');
    const jinovatka = obdobi.find((i) => keyOf(i) === 'jinovatka')!;
    expect(jinovatka.prompt).toMatch(/mlhy/);
  });
});
