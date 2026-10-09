// Školní ostrov: angličtina jen pro hráče, kterému ho rodič zapne.

import { describe, expect, it } from 'vitest';
import { ISLANDS, SKILLS, cardsFor, islandsFor, missionsFor } from '../src/content';
import { missions, skills } from '../src/content/skola';
import { CURRENT_UNITS, LETTER_CZ, NAMES, WORDS } from '../src/content/skola/ucivo';
import { buildDemo } from '../src/core/demo';
import { availableIslands, nextItem, planDay } from '../src/core/planner';
import { buildRadar } from '../src/core/radar';
import { createRng } from '../src/core/rng';
import { letterName, spellOut } from '../src/core/speech';
import { defaultProfile, type Profile } from '../src/core/storage';
import type { Item } from '../src/core/types';
import { spellMatches } from '../src/ui/components/Answers';
import { sweepSkill, validateMissions } from './validate';

const withSchool = (): Profile => {
  const p = defaultProfile();
  return { ...p, settings: { ...p.settings, schoolIsland: true } };
};

const CZECH = /[áčďéěíňóřšťúůýž]/i;

describe('viditelnost', () => {
  it('bez zapnutí ostrov nikdo nevidí – mapa, plánovač, kniha, ukázka', () => {
    const p = defaultProfile();
    expect(islandsFor(p.settings).map((i) => i.id)).not.toContain('skola');
    expect(availableIslands(p)).not.toContain('skola');
    expect(availableIslands()).not.toContain('skola');
    expect(missionsFor(p.settings).some((m) => m.island === 'skola')).toBe(false);
    expect(cardsFor(p.settings).length).toBe(cardsFor(undefined).length);
    for (let day = 0; day < 30; day++) expect(planDay(p).every((m) => m.island !== 'skola')).toBe(true);
    const demo = buildDemo(1, Date.UTC(2026, 9, 1));
    expect(demo.events.some((e) => e.island === 'skola')).toBe(false);
  });

  it('po zapnutí je první misí Dnešního letu angličtina a radar ji ukáže zvlášť', () => {
    const p = withSchool();
    expect(availableIslands(p)).toContain('skola');
    for (let day = 0; day < 20; day++) {
      const plan = planDay(p);
      expect(plan[0].island).toBe('skola');
      expect(plan[0].skillIds.length).toBeGreaterThanOrEqual(1);
      expect(plan[0].skillIds.length).toBeLessThanOrEqual(2);
      for (let i = 0; i < plan[0].count; i++) {
        const item = nextItem(p, plan[0], i, day * 100 + i);
        expect(plan[0].skillIds).toContain(item.skillId);
      }
    }
    const r = buildRadar(p, []);
    expect(r.islands.map((i) => i.island.id)).not.toContain('skola');
    expect(r.extra.map((i) => i.island.id)).toEqual(['skola']);
  });

  it('ostrov je „na přání“ a má popisky úrovní místo ročníků', () => {
    const island = ISLANDS.find((i) => i.id === 'skola')!;
    expect(island.optIn).toBe(true);
    expect(island.available).toBe(true);
    for (const s of skills) for (const l of s.levels) expect(island.levelNames?.[l], `${s.id} L${l}`).toBeTruthy();
  });
});

describe('obsah', () => {
  it('všechny dovednosti projdou kontrolou a mají dost různých úloh', () => {
    for (const s of skills) {
      const { errors, distinct } = sweepSkill(s, 400);
      expect(errors, s.id).toEqual([]);
      for (const l of s.levels) expect(distinct[l], `${s.id} L${l}`).toBeGreaterThanOrEqual(8);
    }
    expect(SKILLS.filter((s) => s.island === 'skola').length).toBe(skills.length);
  });

  it('angličtina v odpovědích a poslechu je bez české diakritiky, čeština v zadání', () => {
    const englishAnswers = ['skola.slovicka', 'skola.ja-me', 'skola.kde', 'skola.tohle', 'skola.rozhovor', 'skola.abeceda'];
    for (const s of skills) {
      for (const l of s.levels) {
        for (let seed = 1; seed <= 150; seed++) {
          const item: Item = s.generate(l, createRng(seed));
          const a = item.answer;
          if (englishAnswers.includes(s.id) && a.kind === 'choice') {
            for (const o of a.options) expect(CZECH.test(o.label), `${item.id}: ${o.label}`).toBe(false);
          }
          if (a.kind === 'letters') expect(a.correct).toMatch(/^[a-z]+$/);
          expect(item.prompt, item.id).not.toMatch(/\b(the|is|are)\b/);
        }
      }
    }
  });

  it('slovní zásoba: unikátní, malá písmena, česky vyplněná, aktuální lekce existuje', () => {
    const ens = WORDS.map((w) => w.en);
    expect(new Set(ens).size).toBe(ens.length);
    for (const w of WORDS) {
      expect(w.en, w.en).toMatch(/^[a-z]+( [a-z]+)?$/);
      expect(w.cs.trim(), w.en).not.toBe('');
      if (w.topic === 'barvy') expect(w.color, w.en).toMatch(/^#[0-9a-f]{6}$/);
      if (w.unit) expect(w.level, w.en).toBeLessThanOrEqual(2);
    }
    for (const u of CURRENT_UNITS) expect(WORDS.some((w) => w.unit === u), u).toBe(true);
    for (const n of NAMES) expect(n).toMatch(/^[A-Z][a-z]+$/);
  });

  it('názvy písmen: každé písmeno má anglický i český název, hláskování je čitelné', () => {
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(LETTER_CZ[c], c).toBeTruthy();
      expect(letterName(c), c).not.toBe(c);
    }
    expect(spellOut('bag')).toBe('bee, ay, gee');
    expect(spellOut('Lucy')).toBe('ell, you, see, why');
    expect(letterName('z')).toBe('zed');
  });

  it('psaní: velikost písmen nevadí, povolené tvary platí, překlep ne', () => {
    expect(spellMatches('lucy', 'Lucy')).toBe(true);
    expect(spellMatches(' Grey ', 'grey')).toBe(true);
    expect(spellMatches('gray', 'grey', ['gray'])).toBe(true);
    expect(spellMatches('pencil  case', 'pencil case')).toBe(true);
    expect(spellMatches('gery', 'grey', ['gray'])).toBe(false);
  });

  it('společné mise projdou kontrolou', () => {
    expect(validateMissions(missions, 'skola')).toEqual([]);
    expect(missions.length).toBeGreaterThanOrEqual(3);
  });
});
