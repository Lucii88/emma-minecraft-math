import { describe, expect, it } from 'vitest';
import { initialState, kFactor, masteredLevels, pCorrect, scoreOf, targetDifficulty, updateState, chooseLevel, levelDifficulty } from '../src/core/model';
import { SKILL_BY_ID } from '../src/content';
import { createRng } from '../src/core/rng';
import { defaultProfile } from '../src/core/storage';
import { nextItem, missionForSkill, planDay } from '../src/core/planner';

const skill = SKILL_BY_ID['cisla.scitani'];

describe('adaptivní model', () => {
  it('pravděpodobnost roste se schopností a klesá s obtížností', () => {
    expect(pCorrect(1, 0)).toBeGreaterThan(pCorrect(0, 0));
    expect(pCorrect(0, 1)).toBeLessThan(pCorrect(0, 0));
    expect(pCorrect(0, 0)).toBeCloseTo(0.5);
  });

  it('úspěch zvyšuje odhad, chyba ho snižuje, váha s počtem odpovědí klesá', () => {
    const item = skill.generate(2, createRng(1));
    const s0 = initialState(2);
    expect(updateState(s0, item, 1, 0).theta).toBeGreaterThan(s0.theta);
    expect(updateState(s0, item, 0, 0).theta).toBeLessThan(s0.theta);
    expect(kFactor(40)).toBeLessThan(kFactor(0));
  });

  it('skóre penalizuje nápovědy a další pokusy', () => {
    expect(scoreOf('first', 1, 0)).toBe(1);
    expect(scoreOf('later', 2, 0)).toBeLessThan(1);
    expect(scoreOf('later', 1, 2)).toBeLessThan(scoreOf('later', 1, 1));
    expect(scoreOf('failed', 3, 2)).toBe(0);
  });

  it('úrovně: dolní ≤ střední ≤ horní a rostou se schopností', () => {
    const lo = masteredLevels(skill, { theta: 0, n: 20, lastSeen: 0, history: [] });
    const hi = masteredLevels(skill, { theta: 3, n: 20, lastSeen: 0, history: [] });
    expect(lo.low).toBeLessThanOrEqual(lo.mid);
    expect(lo.mid).toBeLessThanOrEqual(lo.high);
    expect(hi.mid).toBeGreaterThan(lo.mid);
  });

  it('dítě, které vše řeší napoprvé, se rychle posune nahoru', () => {
    let st = initialState(2);
    for (let i = 0; i < 12; i++) {
      const L = chooseLevel(skill, targetDifficulty(st.theta, 0.72));
      st = updateState(st, skill.generate(L, createRng(i)), 1, i);
    }
    expect(masteredLevels(skill, st).mid).toBeGreaterThanOrEqual(3);
    expect(levelDifficulty(chooseLevel(skill, targetDifficulty(st.theta, 0.72)))).toBeGreaterThan(0);
  });
});

describe('plánovač', () => {
  it('Dnešní let má tři mise a první úloha odpovídá dovednosti', () => {
    const p = defaultProfile();
    const missions = planDay(p);
    expect(missions.length).toBe(3);
    const item = nextItem(p, missions[0], 0, 5);
    expect(missions[0].skillIds).toContain(item.skillId);
  });

  it('neopakuje nedávné úlohy, když to jde', () => {
    const p = defaultProfile();
    const mission = missionForSkill(SKILL_BY_ID['cisla.nasobeni']);
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      const item = nextItem({ ...p, recent: { 'cisla.nasobeni': seen } }, mission, i, 100 + i);
      expect(seen).not.toContain(item.id);
      seen.push(item.id);
    }
  });
});
