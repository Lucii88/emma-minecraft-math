// Stav hry (Zustand): profil, navigace a průběh právě hraného letu.

import { create } from 'zustand';
import { CARDS, ISLANDS, MISSIONS, SKILL_BY_ID, TRICKS, islandOf } from '../content';
import { masteredLevels, scoreOf, updateState } from './model';
import { MISSION_LENGTH, missionForSkill, nextItem, pickGrowthSkill, planDay, stateOf, type Mission } from './planner';
import { appendEvent, loadProfile, saveProfile, type DragonLook, type JournalEntry, type Profile } from './storage';
import { setMuted } from './sound';
import type { AnswerEvent, Confidence, IslandId, Item } from './types';

export type Screen = 'hatch' | 'map' | 'island' | 'play' | 'missionEnd' | 'dayEnd' | 'book' | 'journal' | 'parent';

export type Outcome = AnswerEvent['outcome'];

export interface Gain {
  kind: 'level' | 'trick' | 'species' | 'brave' | 'card';
  text: string;
  trickId?: string;
}

export interface Run {
  day: boolean;
  missions: Mission[];
  mIndex: number;
  iIndex: number;
  item: Item | null;
  attempts: number;
  hints: number;
  itemStart: number;
  sessionId: string;
  results: { skillId: string; outcome: Outcome; brave: boolean; hard: boolean }[];
  gains: Gain[];
  /** Zisky aktuální mise (pro obrazovku konce mise). */
  missionGains: Gain[];
  answered: number;
}

interface GameState {
  profile: Profile;
  screen: Screen;
  island: IslandId | null;
  run: Run | null;
  /** Dovednost, u které dítě vybírá ostrov pro misi „podle tebe“. */
  choosingIsland: boolean;

  go: (screen: Screen, island?: IslandId | null) => void;
  hatch: (look: DragonLook, name: string) => void;
  updateDragon: (look: DragonLook, name: string) => void;
  updateSettings: (patch: Partial<Profile['settings']>) => void;
  setGrade: (grade: number) => void;
  replaceProfile: (p: Profile) => void;

  startDay: () => void;
  startSkill: (skillId: string, brave?: boolean) => void;
  chooseIsland: (island: IslandId) => void;
  useHint: () => void;
  registerAttempt: () => void;
  completeItem: (outcome: Outcome, extra?: { confidence?: Confidence; text?: string; ideas?: number }) => void;
  continueRun: () => void;
  quitRun: () => void;
  /** Společná mise s rodičem: odškrtnout, nebo (rodič) zrušit odškrtnutí. */
  completeMission: (id: string) => void;
  undoMission: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function persist(p: Profile) {
  saveProfile(p);
  return p;
}

function journal(p: Profile, kind: JournalEntry['kind'], text: string): Profile {
  return { ...p, journal: [...p.journal, { t: Date.now(), kind, text }] };
}

function unlockNextTrick(p: Profile): { profile: Profile; gain: Gain | null } {
  const next = TRICKS.find((t) => !p.tricks.includes(t.id));
  if (!next) return { profile: p, gain: null };
  const name = p.dragonName || 'Tvůj drak';
  let profile: Profile = { ...p, tricks: [...p.tricks, next.id] };
  profile = journal(profile, 'trick', `Nový kousek pro ${name}: ${next.name}.`);
  return { profile, gain: { kind: 'trick', text: `Nový kousek: ${next.name}!`, trickId: next.id } };
}

/** Karty z Knihy draků, které se odemknou, když stupeň dovednosti vzroste
 *  z `from` na `to`. Oznámíme je jedním ziskem, ať konec mise nezahltí. */
function unlockCards(p: Profile, skillId: string, from: number, to: number): { profile: Profile; gain: Gain | null } {
  const cards = CARDS.filter((c) => c.skillId === skillId && c.level > from && c.level <= to);
  if (!cards.length) return { profile: p, gain: null };
  const titles = cards.map((c) => c.title).join(', ');
  const profile = journal(p, 'card', `${cards.length === 1 ? 'Nová stránka' : 'Nové stránky'} v Knize draků: ${titles}.`);
  const text = cards.length === 1 ? `Nová stránka v Knize draků: ${cards[0].title}` : `${cards.length} nové stránky v Knize draků`;
  return { profile, gain: { kind: 'card', text: cards.length > 4 ? `${cards.length} nových stránek v Knize draků` : text } };
}

const initialProfile = loadProfile();
setMuted(!initialProfile.settings.sound);

export const useGame = create<GameState>((set, get) => ({
  profile: initialProfile,
  screen: initialProfile.dragon ? 'map' : 'hatch',
  island: null,
  run: null,
  choosingIsland: false,

  go: (screen, island) => set((s) => ({ screen, island: island === undefined ? s.island : island })),

  hatch: (look, name) => {
    let p: Profile = { ...get().profile, dragon: look, dragonName: name.trim() || 'Dráček' };
    p = journal(p, 'first', `Vylíhnutí! ${p.dragonName} je na světě a začíná vaše společné dobrodružství.`);
    p = { ...p, tricks: ['poskok'] };
    set({ profile: persist(p), screen: 'map' });
  },

  updateDragon: (look, name) => {
    const p = { ...get().profile, dragon: look, dragonName: name.trim() || get().profile.dragonName };
    set({ profile: persist(p) });
  },

  updateSettings: (patch) => {
    const p = { ...get().profile, settings: { ...get().profile.settings, ...patch } };
    setMuted(!p.settings.sound);
    set({ profile: persist(p) });
  },

  setGrade: (grade) => set({ profile: persist({ ...get().profile, grade }) }),

  replaceProfile: (p) => {
    setMuted(!p.settings.sound);
    set({ profile: persist(p), screen: p.dragon ? 'map' : 'hatch', run: null });
  },

  startDay: () => {
    const { profile } = get();
    const missions = planDay(profile);
    const run: Run = {
      day: true,
      missions,
      mIndex: 0,
      iIndex: 0,
      item: null,
      attempts: 0,
      hints: 0,
      itemStart: Date.now(),
      sessionId: uid(),
      results: [],
      gains: [],
      missionGains: [],
      answered: 0,
    };
    run.item = nextItem(profile, missions[0], 0);
    set({ run, screen: 'play', choosingIsland: false, profile: persist({ ...profile, sessions: profile.sessions + 1 }) });
  },

  startSkill: (skillId, brave = false) => {
    const { profile, run: prev } = get();
    const skill = SKILL_BY_ID[skillId];
    const mission = missionForSkill(skill, brave ? 'brave' : 'free');
    const run: Run = {
      day: prev?.day ?? false,
      missions: [mission],
      mIndex: 0,
      iIndex: 0,
      item: nextItem(profile, mission, 0),
      attempts: 0,
      hints: 0,
      itemStart: Date.now(),
      sessionId: prev?.sessionId ?? uid(),
      results: [],
      gains: prev?.gains ?? [],
      missionGains: [],
      answered: prev?.answered ?? 0,
    };
    set({ run, screen: 'play', choosingIsland: false });
  },

  chooseIsland: (island) => {
    const { run, profile } = get();
    if (!run) return;
    const skill = pickGrowthSkill(profile, island);
    const missions = run.missions.slice();
    missions[run.mIndex] = { ...missions[run.mIndex], island, skillIds: [skill.id], title: skill.name };
    const updated: Run = { ...run, missions, iIndex: 0, attempts: 0, hints: 0, itemStart: Date.now(), missionGains: [] };
    updated.item = nextItem(profile, missions[run.mIndex], 0);
    set({ run: updated, choosingIsland: false, screen: 'play' });
  },

  useHint: () => set((s) => (s.run ? { run: { ...s.run, hints: s.run.hints + 1 } } : {})),

  registerAttempt: () => set((s) => (s.run ? { run: { ...s.run, attempts: s.run.attempts + 1 } } : {})),

  completeItem: (outcome, extra = {}) => {
    const { run } = get();
    let { profile } = get();
    if (!run || !run.item) return;
    const item = run.item;
    const skill = SKILL_BY_ID[item.skillId];
    const mission = run.missions[run.mIndex];
    const now = Date.now();
    const before = stateOf(profile, skill.id);
    const novel = before.n === 0;
    const brave = mission.kind === 'brave';

    const event: AnswerEvent = {
      t: now,
      sessionId: run.sessionId,
      itemId: item.id,
      skillId: skill.id,
      island: skill.island,
      level: item.level,
      outcome,
      attempts: Math.max(1, run.attempts),
      hintsUsed: run.hints,
      responseMs: now - run.itemStart,
      confidence: extra.confidence,
      brave,
      novel,
      testLike: skill.testLike,
      text: extra.text,
      ideas: extra.ideas,
    };
    void appendEvent(event);

    const gains: Gain[] = [];
    // Model se aktualizuje jen u uzavřených úloh.
    if (outcome !== 'open') {
      const after = updateState(before, item, scoreOf(outcome, event.attempts, run.hints), now);
      const best = profile.best?.[skill.id] ?? 0;
      const lvAfter = masteredLevels(skill, after).mid;
      profile = { ...profile, skills: { ...profile.skills, [skill.id]: after } };
      // Slavíme jen nové maximum a až když máme pár odpovědí (ne náhodný výkyv).
      if (lvAfter > best && after.n >= 3) {
        profile = { ...profile, best: { ...(profile.best ?? {}), [skill.id]: lvAfter } };
        const stars = '★'.repeat(lvAfter);
        profile = journal(profile, 'level', `${skill.name}: nový stupeň ${stars}. Zvládáš těžší úlohy než dřív.`);
        gains.push({ kind: 'level', text: `${skill.name}: nový stupeň ${stars}` });
        const t = unlockNextTrick(profile);
        profile = t.profile;
        if (t.gain) gains.push(t.gain);
        const c = unlockCards(profile, skill.id, best, lvAfter);
        profile = c.profile;
        if (c.gain) gains.push(c.gain);
      }
    } else if (extra.text) {
      profile = journal(profile, 'story', `Tvůj text: „${extra.text.slice(0, 80)}${extra.text.length > 80 ? '…' : ''}“`);
    }

    const recent = [...(profile.recent[skill.id] ?? []), item.id].slice(-40);
    profile = { ...profile, recent: { ...profile.recent, [skill.id]: recent }, totalAnswers: profile.totalAnswers + 1 };

    const results = [...run.results, { skillId: skill.id, outcome, brave, hard: item.level > profile.grade }];
    let next: Run = { ...run, results, gains: [...run.gains, ...gains], missionGains: [...run.missionGains, ...gains], answered: run.answered + 1 };

    const done = run.iIndex + 1 >= mission.count;
    if (!done) {
      next = { ...next, iIndex: run.iIndex + 1, attempts: 0, hints: 0, itemStart: Date.now() };
      next.item = nextItem(profile, mission, next.iIndex);
      set({ profile: persist(profile), run: next });
      return;
    }

    // Konec mise: spřátelení s dračím druhem ostrova a odvaha.
    const endGains: Gain[] = [];
    if (!profile.species.includes(mission.island) && ISLANDS.find((i) => i.id === mission.island)?.available) {
      const isl = islandOf(mission.island);
      profile = { ...profile, species: [...profile.species, mission.island] };
      profile = journal(profile, 'species', `Nový přítel ${isl.from}: ${isl.species.name}.`);
      endGains.push({ kind: 'species', text: `Nový dračí přítel: ${isl.species.name}` });
    }
    if (brave) {
      profile = journal(profile, 'brave', 'Bouřkový let: pustila ses do úloh, které byly schválně těžké. Odznak odvahy!');
      endGains.push({ kind: 'brave', text: 'Odznak odvahy za Bouřkový let' });
    }
    // Pokud mise nepřinesla nový kousek, občas se drak naučí něco i tak –
    // aby mise vždy měla hmatatelný konec (ne za výkon, ale za společný let).
    const hadTrick = [...next.missionGains, ...endGains].some((g) => g.kind === 'trick');
    if (!hadTrick && profile.tricks.length < 3) {
      const t = unlockNextTrick(profile);
      profile = t.profile;
      if (t.gain) endGains.push(t.gain);
    }
    next = { ...next, gains: [...next.gains, ...endGains], missionGains: [...next.missionGains, ...endGains] };
    set({ profile: persist(profile), run: next, screen: 'missionEnd' });
  },

  continueRun: () => {
    const { run, profile } = get();
    if (!run) return set({ screen: 'map' });
    const nextIndex = run.mIndex + 1;
    if (nextIndex >= run.missions.length) {
      set({ screen: run.day ? 'dayEnd' : 'map', run: run.day ? run : null });
      return;
    }
    const mission = run.missions[nextIndex];
    const updated: Run = { ...run, mIndex: nextIndex, iIndex: 0, attempts: 0, hints: 0, itemStart: Date.now(), missionGains: [] };
    if (mission.kind === 'choice') {
      set({ run: { ...updated, item: null }, screen: 'play', choosingIsland: true });
      return;
    }
    updated.item = nextItem(profile, mission, 0);
    set({ run: updated, screen: 'play' });
  },

  quitRun: () => set({ run: null, screen: 'map', choosingIsland: false }),

  completeMission: (id) => {
    const mission = MISSIONS.find((m) => m.id === id);
    let profile = get().profile;
    if (!mission || profile.missionsDone[id]) return;
    profile = { ...profile, missionsDone: { ...profile.missionsDone, [id]: Date.now() } };
    profile = journal(profile, 'mission', `Společná mise splněna: ${mission.title}.`);
    set({ profile: persist(profile) });
  },

  undoMission: (id) => {
    const profile = get().profile;
    if (!profile.missionsDone[id]) return;
    const { [id]: _, ...rest } = profile.missionsDone;
    set({ profile: persist({ ...profile, missionsDone: rest }) });
  },
}));

export { MISSION_LENGTH };
