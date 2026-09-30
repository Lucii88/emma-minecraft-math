// Adaptivní model: Elo s mírou nejistoty (podle Pelánkových prací o Elo ve
// výukových systémech). Každá dovednost má vlastní odhad θ na logitové škále.
// Obtížnost úlohy je dána úrovní RVP (L1 = −1 … L6 = 4) a jemným posunem.

import type { AnswerEvent, Item, Level, SkillDef, SkillState } from './types';

export const levelDifficulty = (level: Level): number => level - 2;

export function itemDifficulty(item: Item): number {
  return levelDifficulty(item.level) + (item.difficulty ?? 0);
}

export const logistic = (x: number) => 1 / (1 + Math.exp(-x));

export function pCorrect(theta: number, difficulty: number): number {
  return logistic(theta - difficulty);
}

/** Váha změny odhadu – na začátku velká (rychlé mapování), pak klesá. */
export function kFactor(n: number): number {
  return Math.max(0.2, 1.0 / (1 + 0.08 * n));
}

/** Nejistota odhadu (v logitech) pro zobrazení rozpětí. */
export function uncertainty(n: number): number {
  return 1.5 / Math.sqrt(1 + n / 4);
}

/** Skóre odpovědi: napoprvé bez nápovědy 1, se zaváháním méně. */
export function scoreOf(outcome: AnswerEvent['outcome'], attempts: number, hintsUsed: number): number {
  if (outcome === 'failed') return 0;
  if (outcome === 'first') return 1;
  const penalty = 0.35 * Math.max(0, attempts - 1) + 0.25 * hintsUsed;
  return Math.max(0.15, 1 - penalty);
}

export function initialState(grade: number): SkillState {
  // Začínáme lehce nad ročníkem: vstupní let rychle najde skutečnou úroveň.
  const theta = levelDifficulty(Math.min(6, Math.max(1, grade)) as Level) + 0.3;
  return { theta, n: 0, lastSeen: 0, history: [] };
}

export function updateState(state: SkillState, item: Item, score: number, t: number): SkillState {
  const p = pCorrect(state.theta, itemDifficulty(item));
  const theta = state.theta + kFactor(state.n) * (score - p);
  const history = state.history.slice();
  const last = history[history.length - 1];
  // snímek nejvýš jednou za den kvůli grafu vývoje
  if (!last || t - last.t > 20 * 60 * 60 * 1000) history.push({ t, theta });
  else history[history.length - 1] = { t: last.t, theta };
  return { theta, n: state.n + 1, lastSeen: t, history };
}

/** Obtížnost, kterou chceme pro cílovou pravděpodobnost úspěchu. */
export function targetDifficulty(theta: number, pTarget: number): number {
  return theta - Math.log(pTarget / (1 - pTarget));
}

/** Úroveň dovednosti nejbližší cílové obtížnosti. */
export function chooseLevel(skill: SkillDef, targetD: number): Level {
  let best = skill.levels[0];
  let bestDist = Infinity;
  for (const L of skill.levels) {
    const dist = Math.abs(levelDifficulty(L) - targetD);
    if (dist < bestDist) {
      best = L;
      bestDist = dist;
    }
  }
  return best;
}

/** Nejvyšší úroveň, kterou dítě zvládá s pravděpodobností aspoň 70 %,
 *  a rozpětí podle nejistoty. Vrací 0, pokud nezvládá ani nejnižší. */
export function masteredLevels(skill: SkillDef, state: SkillState): { low: number; mid: number; high: number } {
  const u = uncertainty(state.n);
  const margin = Math.log(0.7 / 0.3);
  const levelAt = (theta: number) => {
    let m = 0;
    for (const L of skill.levels) if (theta - levelDifficulty(L) >= margin) m = L;
    return m;
  };
  return { low: levelAt(state.theta - u), mid: levelAt(state.theta), high: levelAt(state.theta + u) };
}
