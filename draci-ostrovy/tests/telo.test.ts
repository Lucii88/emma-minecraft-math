import { describe, expect, it } from 'vitest';
import { enumerateItems, skills } from '../src/content/telo';
import { capitalize } from '../src/core/czech';
import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef } from '../src/core/types';
import { BODY_REGIONS } from '../src/core/types';
import { sweepSkill, validateItem } from './validate';

const EXPECTED_LEVELS: Record<string, Level[]> = {
  'telo.mapa': [1, 2, 3, 4],
  'telo.organy': [2, 3, 4, 5],
  'telo.smysly': [1, 2, 3],
  'telo.kostra': [2, 3, 4, 5],
  'telo.zdravi': [1, 2, 3, 4],
  'telo.bezpeci': [1, 2, 3, 4, 5],
  'telo.zivot': [3, 4, 5],
  'telo.fakt-pohadka': [1, 2, 3],
};

/** Tísňová čísla v Česku – nezávislá tabulka pro kontrolu obsahu. */
const TISNOVE: Record<string, string> = {
  zachranka: '155',
  hasici: '150',
  policie: '158',
  mestska: '156',
  evropske: '112',
};

/** Jak musí vypadat správná odpověď na otázku „kdo se ozve na čísle…“. */
const SLUZBA_LABEL: Record<string, RegExp> = {
  zachranka: /^záchranka$/i,
  hasici: /^hasiči$/i,
  policie: /^policie české republiky$/i,
  mestska: /^městská policie$/i,
  evropske: /hasiče, záchranku i policii/i,
};

const OUTSIDE = BODY_REGIONS.outside as Record<string, string>;
const INSIDE = BODY_REGIONS.inside as Record<string, string>;

function itemsOf(skill: SkillDef): Item[] {
  return skill.levels.flatMap((level) => enumerateItems(skill.id, level));
}

function correctLabel(item: Item): string | null {
  return item.answer.kind === 'choice' ? item.answer.options[item.answer.correct].label : null;
}

function texts(item: Item): string[] {
  const out = [item.prompt, item.explanation, ...item.hints];
  if (item.speak) out.push(item.speak);
  if (item.answer.kind === 'choice') {
    for (const o of item.answer.options) out.push(o.label, ...(o.speak ? [o.speak] : []));
  }
  return out;
}

const allItems = skills.flatMap(itemsOf);

describe('Ostrov těla – dovednosti', () => {
  it('má všech osm dovedností se správnými id, ostrovem a úrovněmi', () => {
    expect(skills.map((s) => s.id).sort()).toEqual(Object.keys(EXPECTED_LEVELS).sort());
    for (const skill of skills) {
      expect(skill.island).toBe('telo');
      expect(skill.levels).toEqual(EXPECTED_LEVELS[skill.id]);
      expect(skill.name.trim()).not.toBe('');
      expect(skill.description.trim()).toMatch(/\.$/);
      for (const level of skill.levels) {
        const codes = skill.rvp[level] ?? [];
        expect(codes.length, `${skill.id} L${level} RVP`).toBeGreaterThan(0);
        for (const code of codes) expect(code).toMatch(/^(ČJS|ČJL)-[35]-\d-0\d$/);
      }
    }
  });

  for (const skill of skills) {
    it(`${skill.id}: sweep bez chyb a aspoň 15 různých úloh na úroveň`, () => {
      const { errors, distinct } = sweepSkill(skill, 300);
      expect(errors).toEqual([]);
      for (const level of skill.levels) {
        expect(distinct[level], `${skill.id} L${level}`).toBeGreaterThanOrEqual(15);
      }
    });

    it(`${skill.id}: každá otázka z banky je platná a jedinečná`, () => {
      for (const level of skill.levels) {
        const items = enumerateItems(skill.id, level);
        expect(items.length, `${skill.id} L${level}`).toBeGreaterThanOrEqual(15);
        for (const item of items) expect(validateItem(item, skill, level)).toEqual([]);
        const ids = items.map((i) => i.id);
        expect(new Set(ids).size, `duplicitní klíče v ${skill.id} L${level}`).toBe(ids.length);
        const prompts = items.map((i) => `${i.prompt}|${JSON.stringify(i.visual ?? null)}`);
        expect(new Set(prompts).size, `duplicitní zadání v ${skill.id} L${level}`).toBe(prompts.length);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const skill of skills) {
      for (const level of skill.levels) {
        expect(skill.generate(level, createRng(42))).toEqual(skill.generate(level, createRng(42)));
      }
    }
  });

  it('id je podle obsahu: stejné id má vždy stejné zadání i správnou odpověď', () => {
    const seen = new Map<string, string>();
    for (const skill of skills) {
      for (const level of skill.levels) {
        for (let seed = 1; seed <= 400; seed++) {
          const item = skill.generate(level, createRng(seed));
          const a = item.answer;
          const answer = a.kind === 'choice' ? a.options[a.correct].label : a.kind === 'tap' ? a.correct : '';
          const content = `${item.prompt}|${JSON.stringify(item.visual ?? null)}|${answer}`;
          const before = seen.get(item.id);
          if (before !== undefined) expect(content, item.id).toBe(before);
          seen.set(item.id, content);
        }
      }
    }
  });

  it('úroveň mimo rozsah dovednosti vrátí platnou úlohu s požadovanou úrovní', () => {
    for (const skill of skills) {
      const item = skill.generate(6, createRng(7));
      expect(item.id.startsWith(`${skill.id}:6:`)).toBe(true);
      expect(item.level).toBe(6);
    }
  });
});

describe('Ostrov těla – mapa těla', () => {
  const mapItems = allItems.filter((i) => i.visual?.type === 'body');

  it('klepací úlohy mají oblast z režimu své mapy a nic nezvýrazňují', () => {
    const taps = allItems.filter((i) => i.answer.kind === 'tap');
    expect(taps.length).toBeGreaterThan(50);
    for (const item of taps) {
      const v = item.visual;
      if (v?.type !== 'body' || item.answer.kind !== 'tap') throw new Error(`${item.id}: chybí mapa těla`);
      const regions = v.mode === 'outside' ? OUTSIDE : INSIDE;
      expect(item.answer.correct in regions, `${item.id}: ${item.answer.correct} není v režimu ${v.mode}`).toBe(true);
      expect(v.highlight, `${item.id}: zvýraznění by prozradilo odpověď`).toBeUndefined();
    }
  });

  it('otázky „Co je zvýrazněné?“ zvýrazňují oblast svého režimu a správně ji pojmenují', () => {
    const highlighted = mapItems.filter((i) => i.visual?.type === 'body' && i.visual.highlight);
    expect(highlighted.length).toBeGreaterThanOrEqual(30);
    for (const item of highlighted) {
      if (item.visual?.type !== 'body' || !item.visual.highlight) continue;
      const { mode, highlight } = item.visual;
      const regions = mode === 'outside' ? OUTSIDE : INSIDE;
      expect(highlight in regions, `${item.id}: ${highlight} není v režimu ${mode}`).toBe(true);
      const label = correctLabel(item)!;
      expect(label.startsWith(capitalize(regions[highlight])), `${item.id}: ${label}`).toBe(true);
    }
  });

  it('všechny oblasti mapy se v úlohách objevují', () => {
    const used = new Set<string>();
    for (const item of mapItems) {
      if (item.answer.kind === 'tap') used.add(item.answer.correct);
      if (item.visual?.type === 'body' && item.visual.highlight) used.add(item.visual.highlight);
    }
    for (const r of [...Object.keys(OUTSIDE), ...Object.keys(INSIDE)]) expect(used.has(r), r).toBe(true);
  });
});

describe('Ostrov těla – tísňová čísla', () => {
  const bezpeci = skills.find((s) => s.id === 'telo.bezpeci')!;
  const items = itemsOf(bezpeci);

  it('otázky „které číslo?“ mají správné číslo podle tabulky a 112 nikdy jako chybnou možnost', () => {
    const covered = new Set<string>();
    for (const item of items) {
      const m = item.id.match(/:tisnove-(\w+)-/);
      if (!m) continue;
      const service = m[1];
      expect(service in TISNOVE, `${item.id}: neznámá služba`).toBe(true);
      expect(correctLabel(item), item.id).toBe(TISNOVE[service]);
      covered.add(TISNOVE[service]);
      if (item.answer.kind !== 'choice') throw new Error(`${item.id}: čekám výběr`);
      const labels = item.answer.options.map((o) => o.label);
      for (const l of labels) expect(Object.values(TISNOVE), `${item.id}: ${l}`).toContain(l);
      if (service !== 'evropske') expect(labels, `${item.id}: 112 platí vždycky`).not.toContain('112');
      if (service === 'policie' && !/České republiky/.test(item.prompt)) {
        expect(labels, `${item.id}: 156 je také policie`).not.toContain('156');
      }
    }
    expect([...covered].sort()).toEqual(['112', '150', '155', '156', '158']);
  });

  it('otázky „kdo se ozve na čísle…?“ odpovídají tabulce', () => {
    const covered = new Set<string>();
    for (const item of items) {
      const m = item.id.match(/:sluzba-(\w+)-(\d{3})$/);
      if (!m) continue;
      const [, service, number] = m;
      expect(TISNOVE[service], item.id).toBe(number);
      expect(item.prompt, item.id).toContain(number);
      expect(correctLabel(item), item.id).toMatch(SLUZBA_LABEL[service]);
      covered.add(number);
    }
    expect([...covered].sort()).toEqual(['112', '150', '155', '156', '158']);
  });

  it('čísla zmíněná v textech celého ostrova sedí ke službám', () => {
    // \w v JS nezná česká písmena, proto \p{L}.
    const service = '(městsk\\p{L}+ polici\\p{L}+|záchrann\\p{L}+ služb\\p{L}+|záchrank\\p{L}+|hasič\\p{L}*|polici\\p{L}+(?: České republiky)?)';
    const patterns = [
      new RegExp(`${service}\\s+(?:má|mají)\\s+číslo\\s+(\\d{3})`, 'giu'),
      new RegExp(`${service}\\s+–\\s+(?:číslo\\s+)?(\\d{3})`, 'giu'),
      new RegExp(`${service}\\s+na\\s+(?:čísle\\s+)?(\\d{3})`, 'giu'),
      new RegExp(`na\\s+(?:čísle\\s+)?(\\d{3})\\s+(?:je|jsou)\\s+${service}`, 'giu'),
    ];
    const keyOf = (word: string): string => {
      const w = word.toLocaleLowerCase('cs');
      if (w.startsWith('městsk')) return 'mestska';
      if (w.startsWith('záchran')) return 'zachranka';
      if (w.startsWith('hasič')) return 'hasici';
      return 'policie';
    };
    let checked = 0;
    for (const item of allItems) {
      for (const t of texts(item)) {
        patterns.forEach((re, i) => {
          for (const m of t.matchAll(re)) {
            const [word, number] = i === 3 ? [m[2], m[1]] : [m[1], m[2]];
            expect(number, `${item.id}: „${m[0]}“`).toBe(TISNOVE[keyOf(word)]);
            checked++;
          }
        });
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});

describe('Ostrov těla – Fakt, nebo pohádka?', () => {
  const skill = skills.find((s) => s.id === 'telo.fakt-pohadka')!;

  it('každá úloha má přesně tlačítka Fakt a Pohádka a vysvětlení odpovídá odpovědi', () => {
    for (const level of skill.levels) {
      const items = enumerateItems(skill.id, level);
      let facts = 0;
      for (const item of items) {
        if (item.answer.kind !== 'choice') throw new Error(`${item.id}: čekám výběr`);
        expect(item.answer.options.map((o) => o.label)).toEqual(['Fakt', 'Pohádka']);
        const isFact = item.answer.correct === 0;
        if (isFact) facts++;
        expect(item.explanation.startsWith(isFact ? 'Fakt.' : 'Pohádka'), item.id).toBe(true);
        expect(item.prompt).toMatch(/^„.+[.!]“ Je to fakt, nebo pohádka\?$/);
      }
      const share = facts / items.length;
      expect(share, `L${level}: podíl faktů`).toBeGreaterThanOrEqual(0.4);
      expect(share, `L${level}: podíl faktů`).toBeLessThanOrEqual(0.6);
    }
  });
});

describe('Ostrov těla – texty', () => {
  it('výběr má 3–4 možnosti (kromě Fakt/Pohádka)', () => {
    for (const item of allItems) {
      if (item.answer.kind !== 'choice' || item.skillId === 'telo.fakt-pohadka') continue;
      expect(item.answer.options.length, item.id).toBeGreaterThanOrEqual(3);
      expect(item.answer.options.length, item.id).toBeLessThanOrEqual(4);
    }
  });

  it('nápověda ani zadání neobsahují přímo správnou odpověď', () => {
    for (const item of allItems) {
      const label = correctLabel(item);
      if (!label || item.skillId === 'telo.fakt-pohadka') continue;
      const needle = label.toLocaleLowerCase('cs');
      for (const t of [item.prompt, ...item.hints]) {
        expect(t.toLocaleLowerCase('cs').includes(needle), `${item.id}: „${t}“ prozrazuje „${label}“`).toBe(false);
      }
    }
  });

  it('texty jsou čisté: interpunkce, uvozovky, žádné zakázané názvy', () => {
    for (const item of allItems) {
      expect(item.prompt, item.id).toMatch(/[.?!]$/);
      expect(item.explanation, item.id).toMatch(/[.!]$/);
      expect(item.hints.length, item.id).toBeGreaterThanOrEqual(1);
      for (const h of item.hints) expect(h, item.id).toMatch(/[.?!…]$/);
      for (const t of texts(item)) {
        expect(t, item.id).not.toMatch(/\s{2,}|^\s|\s$/);
        expect(t, item.id).not.toMatch(/["']/);
        expect(t, item.id).not.toMatch(/\s[,.?!]/);
        expect(t.toLocaleLowerCase('cs'), item.id).not.toMatch(/kniha draků|emma/);
      }
    }
  });
});
