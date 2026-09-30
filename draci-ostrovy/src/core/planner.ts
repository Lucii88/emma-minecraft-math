// Plánovač: sestaví Dnešní let (mise) a vybírá další úlohu podle
// adaptivního modelu – cíl je úspěšnost kolem 70–85 % (u Bouřkového letu
// kolem 45 %), bez opakování nedávných úloh.

import { ISLANDS, SKILL_BY_ID, skillsOf } from '../content';
import { createRng, randomSeed } from './rng';
import { genderItem } from './gender';
import { chooseLevel, initialState, itemDifficulty, levelDifficulty, targetDifficulty } from './model';
import type { Profile } from './storage';
import type { IslandId, Item, SkillDef, SkillState } from './types';

export type MissionKind = 'growth' | 'review' | 'choice' | 'brave' | 'free';

export interface Mission {
  kind: MissionKind;
  island: IslandId;
  skillIds: string[];
  count: number;
  pTarget: number;
  title: string;
}

export const MISSION_LENGTH = 5;

const DAY = 24 * 60 * 60 * 1000;

export function stateOf(profile: Profile, skillId: string): SkillState {
  return profile.skills[skillId] ?? initialState(profile.grade);
}

export const availableIslands = () => ISLANDS.filter((i) => i.available).map((i) => i.id);

function lastActivity(profile: Profile, island: IslandId): number {
  return Math.max(0, ...skillsOf(island).map((s) => profile.skills[s.id]?.lastSeen ?? 0));
}

function closedSkills(island: IslandId): SkillDef[] {
  return skillsOf(island).filter((s) => !s.open);
}

/** Dovednost k rozvoji: nové a málo procvičené mají přednost, pak ty
 *  nejdéle neviděné. Náhoda zajišťuje pestrost. */
export function pickGrowthSkill(profile: Profile, island: IslandId, seed = randomSeed()): SkillDef {
  const rng = createRng(seed);
  const skills = closedSkills(island);
  const now = Date.now();
  const weights = skills.map((s) => {
    const st = profile.skills[s.id];
    if (!st) return 3;
    const days = (now - st.lastSeen) / DAY;
    return (st.n < 10 ? 2 : 1) + Math.min(3, days / 2);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < skills.length; i++) {
    r -= weights[i];
    if (r <= 0) return skills[i];
  }
  return skills[skills.length - 1];
}

/** Dovednosti k opakování: už procvičené, nejdéle neviděné (rozložené
 *  opakování). Pokud žádné nejsou, vrátí nové. */
export function pickReviewSkills(profile: Profile, island: IslandId, k = 2): SkillDef[] {
  const seen = closedSkills(island)
    .filter((s) => profile.skills[s.id]?.n)
    .sort((a, b) => (profile.skills[a.id]!.lastSeen ?? 0) - (profile.skills[b.id]!.lastSeen ?? 0));
  if (seen.length >= 1) return seen.slice(0, k);
  return [pickGrowthSkill(profile, island)];
}

/** Dnešní let: rozvoj na nejdéle nenavštíveném ostrově, opakování na
 *  dalším a třetí mise podle volby dítěte. */
export function planDay(profile: Profile): Mission[] {
  const islands = availableIslands().sort((a, b) => lastActivity(profile, a) - lastActivity(profile, b));
  const growthIsland = islands[0];
  const reviewIsland = islands[1] ?? islands[0];
  const growth = pickGrowthSkill(profile, growthIsland);
  const review = pickReviewSkills(profile, reviewIsland);
  const missions: Mission[] = [
    { kind: 'growth', island: growthIsland, skillIds: [growth.id], count: MISSION_LENGTH, pTarget: 0.72, title: growth.name },
    { kind: 'review', island: reviewIsland, skillIds: review.map((s) => s.id), count: MISSION_LENGTH, pTarget: 0.82, title: 'Opakování' },
    { kind: 'choice', island: islands[2] ?? growthIsland, skillIds: [], count: MISSION_LENGTH, pTarget: 0.72, title: 'Podle tebe' },
  ];
  return missions.slice(0, Math.max(1, Math.min(3, profile.settings.missions)));
}

export function missionForSkill(skill: SkillDef, kind: MissionKind = 'free'): Mission {
  return {
    kind,
    island: skill.island,
    skillIds: [skill.id],
    count: kind === 'brave' ? 2 : skill.open ? 1 : MISSION_LENGTH,
    pTarget: kind === 'brave' ? 0.45 : 0.72,
    title: kind === 'brave' ? 'Bouřkový let' : skill.name,
  };
}

/** Vybere další úlohu mise (s oslovením podle hráče). */
export function nextItem(profile: Profile, mission: Mission, index: number, seed = randomSeed()): Item {
  const rng = createRng(seed);
  const skillId = mission.skillIds[index % mission.skillIds.length];
  const skill = SKILL_BY_ID[skillId];
  const state = stateOf(profile, skillId);
  // Vstupní let: prvních pár úloh nové dovednosti je o něco náročnějších,
  // aby odhad rychle našel skutečnou úroveň.
  const p = state.n < 4 && mission.kind !== 'brave' ? Math.min(mission.pTarget, 0.62) : mission.pTarget;
  const targetD = targetDifficulty(state.theta, p);
  const level = chooseLevel(skill, targetD);
  const recent = new Set(profile.recent[skillId] ?? []);
  let best: Item | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < 8; i++) {
    const item = skill.generate(level, rng);
    const fresh = recent.has(item.id) ? 10 : 0;
    const score = fresh + Math.abs(itemDifficulty(item) - targetD) + rng.next() * 0.2;
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return genderItem(best!, profile.gender);
}

/** Popis úrovně pro rodiče. */
export function levelLabel(level: number): string {
  if (level <= 0) return 'pod 1. ročníkem';
  if (level >= 6) return 'nad rámec 1. stupně';
  return `${level}. ročník`;
}

export { levelDifficulty };
