// Kontrola celého registru: všechny ostrovy a dovednosti pohromadě a jejich
// napojení na plánovač a rodičovský radar. Testy jednotlivých ostrovů hlídají
// obsah do hloubky, tady jde o to, aby do sebe všechno zapadalo.

import { describe, expect, it } from 'vitest';
import { CARDS, ISLANDS, MISSIONS, SKILLS, SKILL_BY_ID } from '../src/content';
import { ABILITY_LABELS, buildRadar } from '../src/core/radar';
import { createRng } from '../src/core/rng';
import { missionForSkill, nextItem, planDay } from '../src/core/planner';
import { defaultProfile } from '../src/core/storage';
import { TEST_LIKE_LABELS } from '../src/core/types';
import { sweepSkill, validateCards, validateMissions } from './validate';

const RVP_CODE = /^[A-ZČŠŽ]{1,4}-[35]-\d-\d{2}$/;

describe('registr ostrovů a dovedností', () => {
  it('každý dostupný ostrov má dovednosti a každá dovednost svůj ostrov', () => {
    const available = ISLANDS.filter((i) => i.available).map((i) => i.id);
    expect(available.length).toBeGreaterThanOrEqual(1);
    for (const id of available) expect(SKILLS.some((s) => s.island === id), id).toBe(true);
    for (const s of SKILLS) expect(available, s.id).toContain(s.island);
  });

  it('id dovedností jsou unikátní a začínají názvem ostrova', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SKILLS) expect(s.id.startsWith(`${s.island}.`), s.id).toBe(true);
    expect(Object.keys(SKILL_BY_ID).length).toBe(SKILLS.length);
  });

  it('názvy dovedností se v rámci ostrova neopakují', () => {
    for (const island of ISLANDS) {
      const names = SKILLS.filter((s) => s.island === island.id).map((s) => s.name);
      expect(new Set(names).size, island.id).toBe(names.length);
    }
  });

  it('úrovně, kódy RVP, typ myšlení a testové formáty jsou platné', () => {
    for (const s of SKILLS) {
      expect(s.levels.length, s.id).toBeGreaterThan(0);
      expect([...s.levels].sort((a, b) => a - b), s.id).toEqual(s.levels);
      expect(new Set(s.levels).size, s.id).toBe(s.levels.length);
      for (const l of s.levels) expect(l >= 1 && l <= 6, `${s.id} L${l}`).toBe(true);
      for (const [lv, codes] of Object.entries(s.rvp)) {
        expect(s.levels, `${s.id}: RVP pro úroveň ${lv}, kterou nemá`).toContain(Number(lv));
        for (const c of codes ?? []) expect(c, s.id).toMatch(RVP_CODE);
      }
      for (const l of s.levels) {
        if (l <= 5) expect(s.rvp[l]?.length ?? 0, `${s.id} L${l}: chybí kód RVP`).toBeGreaterThan(0);
      }
      expect(Object.keys(ABILITY_LABELS), s.id).toContain(s.ability);
      if (s.testLike) expect(Object.keys(TEST_LIKE_LABELS), s.id).toContain(s.testLike);
      expect(s.name.trim(), s.id).not.toBe('');
      expect(s.description.trim(), s.id).not.toBe('');
    }
  });

  it('všechny úlohy všech ostrovů projdou společnou kontrolou', () => {
    const errors = SKILLS.flatMap((s) => sweepSkill(s, 120).errors);
    expect(errors).toEqual([]);
  });

  it('karty znalostí a společné mise projdou kontrolou a jejich id se neopakují', () => {
    expect(validateCards(CARDS, SKILLS)).toEqual([]);
    for (const island of ISLANDS) {
      expect(validateMissions(MISSIONS.filter((m) => m.island === island.id), island.id)).toEqual([]);
    }
    const ids = [...CARDS.map((c) => c.id), ...MISSIONS.map((m) => m.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stejné semínko dá u každé dovednosti stejnou úlohu', () => {
    for (const s of SKILLS) {
      for (const level of s.levels) {
        expect(s.generate(level, createRng(7)), `${s.id} L${level}`).toEqual(s.generate(level, createRng(7)));
      }
    }
  });
});

describe('napojení na plánovač a radar', () => {
  it('Dnešní let má tři mise a z každé se dají brát úlohy', () => {
    const profile = defaultProfile();
    for (let day = 0; day < 30; day++) {
      const missions = planDay(profile);
      expect(missions.map((m) => m.kind)).toEqual(['growth', 'review', 'choice']);
      for (const m of missions) {
        if (m.kind === 'choice') continue; // ostrov vybírá dítě
        for (let i = 0; i < m.count; i++) {
          const item = nextItem(profile, m, i, day * 1000 + i);
          expect(m.skillIds, item.id).toContain(item.skillId);
        }
      }
    }
  });

  it('každá dovednost se dá spustit z ostrova, i jako Bouřkový let', () => {
    const profile = defaultProfile();
    for (const s of SKILLS) {
      const kinds = s.open ? (['free'] as const) : (['free', 'brave'] as const);
      for (const kind of kinds) {
        const m = missionForSkill(s, kind);
        const item = nextItem(profile, m, 0, 11);
        expect(item.skillId).toBe(s.id);
      }
    }
  });

  it('radar zvládne prázdný profil se všemi ostrovy', () => {
    const r = buildRadar(defaultProfile(), []);
    expect(r.islands.map((i) => i.island.id)).toEqual(ISLANDS.filter((i) => i.available).map((i) => i.id));
    expect(r.totals.answers).toBe(0);
  });
});
