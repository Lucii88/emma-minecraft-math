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
import { caps } from '../src/core/caps';
import { judgeSay, matchesSay, normSpeech, type SpeechResult } from '../src/core/saymatch';
import { downsample, encodeWav } from '../src/core/listen';
import { playableSkills } from '../src/core/planner';
import { SKILL_BY_ID } from '../src/content';
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
    expect(letterName('z')).toBe('zee');
  });

  it('psaní: velikost písmen nevadí, povolené tvary platí, překlep ne', () => {
    expect(spellMatches('lucy', 'Lucy')).toBe(true);
    expect(spellMatches(' Gray ', 'gray')).toBe(true);
    expect(spellMatches('grey', 'gray', ['grey'])).toBe(true);
    expect(spellMatches('pencil  case', 'pencil case')).toBe(true);
    expect(spellMatches('gary', 'gray', ['grey'])).toBe(false);
  });

  it('společné mise projdou kontrolou', () => {
    expect(validateMissions(missions, 'skola')).toEqual([]);
    expect(missions.length).toBeGreaterThanOrEqual(3);
  });
});

describe('mluvení s Miss Ember', () => {
  const heard = (lexical: string, extra: Partial<SpeechResult> = {}): SpeechResult => ({ status: 'ok', text: lexical, lexical, scores: null, words: [], ...extra });

  it('přepis se sjednotí: velikost písmen, interpunkce, stažené tvary, čísla, vycpávky', () => {
    expect(normSpeech("I'm SEVEN!")).toBe('i am seven');
    expect(normSpeech('It’s 7.')).toBe('it is seven');
    expect(normSpeech("um, no, I can't")).toBe('no i can not');
    expect(normSpeech('I cannot.')).toBe('i can not');
  });

  it('vzory: celá slova, * a #, kdekoli ve větě', () => {
    expect(matchesSay("I'm seven years old.", ['i am #'])).toBe(true);
    expect(matchesSay('I am 7', ['i am #'])).toBe(true);
    expect(matchesSay('Me seven.', ['i am #'])).toBe(false);
    expect(matchesSay('My name is Anna.', ['my name is *'])).toBe(true);
    expect(matchesSay('My name is', ['my name is *'])).toBe(false);
    expect(matchesSay("It's a pencil.", ['pen'])).toBe(false);
    expect(matchesSay("It's a pencil case.", ['pencil case'])).toBe(true);
    expect(matchesSay('next to the box', ['next to the box'])).toBe(true);
    expect(matchesSay('', ['*'])).toBe(false);
  });

  it('rozumění podle přepisu, rada k typické chybě, a při opakování i podle výslovnosti', () => {
    const age = { expect: ['i am #'], tips: [{ when: 'me *', tip: 'me → I' }, { when: '#', tip: 'celou větou' }] };
    expect(judgeSay(heard("i'm seven"), age).ok).toBe(true);
    expect(judgeSay(heard('me seven'), age)).toMatchObject({ ok: false, tip: 'me → I' });
    expect(judgeSay(heard('seven'), age)).toMatchObject({ ok: false, tip: 'celou větou' });

    const rep = { expect: ['give me the pen please'], ref: 'Give me the pen, please.' };
    const words = (errors: string[]) => ['give', 'me', 'the', 'pen', 'please'].map((word, i) => ({ word, accuracy: errors[i] === 'None' ? 85 : 30, error: errors[i] }));
    // Přepis se trochu liší, ale hodnocení výslovnosti našlo všechna slova.
    expect(judgeSay(heard('give me a pen please', { words: words(['None', 'None', 'None', 'None', 'None']) }), rep).ok).toBe(true);
    const bad = judgeSay(heard('give the pen', { words: words(['None', 'Omission', 'None', 'Mispronunciation', 'None']) }), rep);
    expect(bad.ok).toBe(false);
    expect(bad.unclear).toEqual(['me', 'pen']);
  });

  it('WAV pro server: 16 kHz mono, správná hlavička, převzorkování', () => {
    const down = downsample(new Float32Array(48000).fill(0.5), 48000);
    expect(down.length).toBe(16000);
    expect(down[100]).toBeCloseTo(0.5);
    const wav = new DataView(encodeWav(down));
    const str = (at: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => wav.getUint8(at + i)));
    expect(str(0)).toBe('RIFF');
    expect(str(8)).toBe('WAVE');
    expect(wav.getUint16(22, true)).toBe(1);
    expect(wav.getUint32(24, true)).toBe(16000);
    expect(wav.byteLength).toBe(44 + 16000 * 2);
  });

  it('bez mluvení se nehraje a v rozehrané misi ho nahradí Otázky a odpovědi', () => {
    const p = withSchool();
    const mluveni = SKILL_BY_ID['skola.mluveni'];
    expect(mluveni.needs).toBe('speech');
    caps.speech = false;
    expect(playableSkills(p, 'skola').map((s) => s.id)).not.toContain('skola.mluveni');
    for (let day = 0; day < 40; day++) expect(planDay(p)[0].skillIds).not.toContain('skola.mluveni');
    const mission = { kind: 'growth' as const, island: 'skola' as const, skillIds: ['skola.mluveni'], count: 5, pTarget: 0.75, title: 'Angličtina' };
    expect(nextItem(p, mission, 0, 1).skillId).toBe(mluveni.fallback);

    caps.speech = true;
    try {
      expect(playableSkills(p, 'skola').map((s) => s.id)).toContain('skola.mluveni');
      const item = nextItem(p, mission, 0, 1);
      expect(item.skillId).toBe('skola.mluveni');
      expect(item.answer.kind).toBe('say');
    } finally {
      caps.speech = false;
    }
  });

  it('opakování vět cílí na I / me / I am a vzorové odpovědi jsou celé věty', () => {
    const s = SKILL_BY_ID['skola.mluveni'];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      for (const l of s.levels) {
        const item = s.generate(l, createRng(seed));
        if (item.answer.kind !== 'say') throw new Error(item.id);
        seen.add(item.answer.model);
        expect(item.answer.model, item.id).toMatch(/^[A-Z].*[.!?…]$/);
      }
    }
    expect([...seen].some((m) => /\bme\b/.test(m))).toBe(true);
    expect([...seen].some((m) => /\bI am\b|\bI'm\b/.test(m))).toBe(true);
  });
});
