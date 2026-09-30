import { beforeEach, describe, expect, it } from 'vitest';
import { ISLANDS, SKILLS } from '../src/content';
import { buildDemo } from '../src/core/demo';
import { buildRadar } from '../src/core/radar';
import { playableSkills, planDay } from '../src/core/planner';
import {
  MAIN_PLAYER,
  appendEvent,
  defaultProfile,
  importAll,
  loadDevice,
  loadEvents,
  loadProfile,
  normalizeProfile,
  saveDevice,
  saveProfile,
  setActivePlayer,
} from '../src/core/storage';

// Testy běží v Node: localStorage nahradíme jednoduchou mapou.
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  },
});

describe('hráči na jednom zařízení', () => {
  beforeEach(() => mem.clear());

  it('nové zařízení nemá hráče ani PIN', () => {
    expect(loadDevice()).toEqual({ players: [], active: null });
  });

  it('hráč ze starší verze zůstane pod původním klíčem a PIN se přestěhuje', () => {
    const old = { ...defaultProfile(), dragonName: 'Jiskra', settings: { ...defaultProfile().settings, pin: '1234' } };
    const { name: _n, gender: _g, ...legacy } = old;
    mem.set('draci-ostrovy:v1', JSON.stringify(legacy));
    const device = loadDevice();
    expect(device).toEqual({ players: [MAIN_PLAYER], active: MAIN_PLAYER, pin: '1234' });
    const p = loadProfile(MAIN_PLAYER);
    expect(p.dragonName).toBe('Jiskra');
    // Starší profily byly psané pro holku.
    expect(p.gender).toBe('f');
    expect(p.name).toBe('');
    // Záznam zařízení se uložil – příští start už nic nestěhuje.
    expect(JSON.parse(mem.get('draci-ostrovy:zarizeni')!)).toEqual(device);
  });

  it('každý hráč má vlastní profil i záznam odpovědí', async () => {
    saveDevice({ players: ['a', 'b'], active: 'a', pin: '0000' });
    saveProfile('a', { ...defaultProfile(), name: 'Ema', gender: 'f' });
    saveProfile('b', { ...defaultProfile(), name: 'Tonda', gender: 'm' });
    expect(loadProfile('b').name).toBe('Tonda');
    expect(mem.has('draci-ostrovy:v1:a')).toBe(true);

    setActivePlayer('a');
    await appendEvent({ t: 1, sessionId: 's', itemId: 'x', skillId: 'y', island: 'cisla', level: 1, outcome: 'first', attempts: 1, hintsUsed: 0, responseMs: 1000 });
    expect(await loadEvents()).toHaveLength(1);
    setActivePlayer('b');
    expect(await loadEvents()).toHaveLength(0);
  });

  it('neplatný záznam zařízení nerozbije start', () => {
    mem.set('draci-ostrovy:zarizeni', JSON.stringify({ players: ['a', 3], active: 'zmizely' }));
    expect(loadDevice()).toEqual({ players: ['a'], active: 'a' });
  });

  it('záloha ze starší verze převezme jméno a oslovení hráče', async () => {
    setActivePlayer('c');
    const current = { ...defaultProfile(), name: 'Tonda', gender: 'm' as const };
    const { name: _n, gender: _g, ...old } = defaultProfile();
    const p = await importAll(JSON.stringify({ profile: { ...old, dragonName: 'Plamínek' }, events: [] }), current);
    expect(p).toMatchObject({ name: 'Tonda', gender: 'm', dragonName: 'Plamínek' });
    expect(normalizeProfile({ gender: 'x' as never }).gender).toBe('f');
  });
});

describe('úlohy podobné testům', () => {
  it('rodič je může vynechat – ostrov ale nikdy nezůstane prázdný', () => {
    const skip = { ...defaultProfile(), settings: { ...defaultProfile().settings, skipTestLike: true } };
    for (const island of ISLANDS.filter((i) => i.available)) {
      const skills = playableSkills(skip, island.id);
      expect(skills.some((s) => !s.open)).toBe(true);
      const all = playableSkills(defaultProfile(), island.id);
      if (skills.length < all.length) expect(skills.every((s) => !s.testLike)).toBe(true);
    }
    for (let i = 0; i < 30; i++) {
      for (const m of planDay(skip)) {
        for (const id of m.skillIds) expect(SKILLS.find((s) => s.id === id)?.testLike).toBeUndefined();
      }
    }
  });
});

describe('ukázka pro rodiče', () => {
  it('smyšlené dítě naplní všechny části přehledu', () => {
    const { profile, events } = buildDemo(7, Date.UTC(2026, 8, 30));
    expect(profile.name).toBe('Kuba');
    const r = buildRadar(profile, events);
    expect(r.totals.answers).toBeGreaterThan(150);
    expect(r.totals.days).toBeGreaterThan(10);
    expect(r.abilities.length).toBeGreaterThan(2);
    expect(r.potential.novelTasks).toBeGreaterThan(10);
    expect(r.commitment.braveItems).toBeGreaterThan(0);
    expect(r.creativity.samples.length).toBeGreaterThan(0);
    expect(r.confidence.rated).toBeGreaterThan(20);
    expect(Object.keys(profile.missionsDone)).toHaveLength(5);
    // Silná stránka ukázky jsou počty.
    expect(r.abilities[0].ability).toBe('pocetni');
  });

  it('je pokaždé stejná', () => {
    const a = buildDemo(7, 0);
    const b = buildDemo(7, 0);
    expect(a.events.map((e) => e.itemId)).toEqual(b.events.map((e) => e.itemId));
  });
});
