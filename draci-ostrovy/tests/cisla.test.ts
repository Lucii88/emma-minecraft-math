import { describe, expect, it } from 'vitest';
import { skills } from '../src/content/cisla';
import { createRng } from '../src/core/rng';
import { sweepSkill } from './validate';

describe('Ostrov čísel', () => {
  for (const skill of skills) {
    it(`${skill.id}: úlohy jsou platné a pestré`, () => {
      const { errors, distinct } = sweepSkill(skill, 400);
      expect(errors).toEqual([]);
      for (const level of skill.levels) {
        expect(distinct[level], `${skill.id} L${level}`).toBeGreaterThanOrEqual(12);
      }
    });
  }

  it('stejné semínko = stejná úloha', () => {
    for (const skill of skills) {
      for (const level of skill.levels) {
        const a = skill.generate(level, createRng(42));
        const b = skill.generate(level, createRng(42));
        expect(a).toEqual(b);
      }
    }
  });

  it('číselné odpovědi odpovídají zadání u příkladů', () => {
    const add = skills.find((s) => s.id === 'cisla.scitani')!;
    for (let seed = 1; seed < 500; seed++) {
      for (const level of add.levels) {
        const item = add.generate(level, createRng(seed));
        const m = item.prompt.match(/^([\d\s ]+) ([+−]) ([\d\s ]+) = \?$/);
        if (!m || item.answer.kind !== 'number') continue;
        const a = Number(m[1].replace(/\s/g, ''));
        const b = Number(m[3].replace(/\s/g, ''));
        expect(item.answer.correct).toBe(m[2] === '+' ? a + b : a - b);
      }
    }
  });
});
