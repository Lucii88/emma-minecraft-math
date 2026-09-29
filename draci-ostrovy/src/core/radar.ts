// Rodičovský radar: souhrny ze záznamu odpovědí. Vše jsou orientační
// signály, ne diagnóza – ukazujeme rozpětí a počty, žádné IQ ani percentily.

import { ISLANDS, SKILLS } from '../content';
import { levelDifficulty, masteredLevels } from './model';
import type { Profile } from './storage';
import { TEST_LIKE_LABELS, type AbilityTag, type AnswerEvent, type IslandDef, type SkillDef, type SkillState, type TestLikeFormat } from './types';

export interface SkillRadar {
  skill: SkillDef;
  state: SkillState | null;
  levels: { low: number; mid: number; high: number } | null;
  answers: number;
  firstTryRate: number | null;
}

export interface Radar {
  totals: { answers: number; sessions: number; minutes: number; days: number };
  islands: { island: IslandDef; skills: SkillRadar[] }[];
  potential: { novelTasks: number; hintsPerNovel: number | null; novelFirstTry: number | null };
  commitment: { braveItems: number; braveSolved: number; errorItems: number; solvedAfterError: number | null };
  creativity: { openAnswers: number; avgIdeas: number | null; samples: { t: number; text: string }[] };
  confidence: {
    rated: number;
    underconfidence: number | null; // podíl správných odpovědí označených „hádala“
    overconfidence: number | null;  // podíl chybných odpovědí označených „jistě“
    byChoice: Record<'hadala' | 'asi' | 'jiste', { n: number; correct: number }>;
  };
  testLike: { format: TestLikeFormat; label: string; count: number; first: number; last: number; minutes: number }[];
  abilities: { ability: AbilityTag; label: string; advantage: number; skills: number }[];
}

export const ABILITY_LABELS: Record<AbilityTag, string> = {
  pocetni: 'Počty a čísla',
  slovni: 'Jazyk a porozumění',
  prostorove: 'Prostor a tvary',
  usuzovani: 'Usuzování a logika',
  pamet: 'Paměť',
  znalosti: 'Znalosti o světě',
  tvorivost: 'Tvořivost',
};

const isCorrect = (e: AnswerEvent) => e.outcome === 'first' || e.outcome === 'later';

export function buildRadar(profile: Profile, events: AnswerEvent[]): Radar {
  const closed = events.filter((e) => e.outcome !== 'open');
  const days = new Set(events.map((e) => new Date(e.t).toDateString())).size;

  const islands = ISLANDS.filter((i) => i.available).map((island) => ({
    island,
    skills: SKILLS.filter((s) => s.island === island.id && !s.open).map((skill) => {
      const state = profile.skills[skill.id] ?? null;
      const mine = closed.filter((e) => e.skillId === skill.id);
      return {
        skill,
        state,
        levels: state && state.n > 0 ? masteredLevels(skill, state) : null,
        answers: mine.length,
        firstTryRate: mine.length ? mine.filter((e) => e.outcome === 'first').length / mine.length : null,
      };
    }),
  }));

  const novel = closed.filter((e) => e.novel);
  const brave = closed.filter((e) => e.brave);
  const errorItems = closed.filter((e) => e.attempts > 1 || e.outcome === 'failed');

  const open = events.filter((e) => e.outcome === 'open');
  const withIdeas = open.filter((e) => typeof e.ideas === 'number');

  const rated = closed.filter((e) => e.confidence);
  const byChoice = { hadala: { n: 0, correct: 0 }, asi: { n: 0, correct: 0 }, jiste: { n: 0, correct: 0 } };
  for (const e of rated) {
    const c = byChoice[e.confidence!];
    c.n++;
    if (e.outcome === 'first') c.correct++;
  }
  const ratedCorrect = rated.filter((e) => e.outcome === 'first');
  const ratedWrong = rated.filter((e) => e.outcome !== 'first');

  const tl = new Map<TestLikeFormat, { count: number; first: number; last: number; ms: number }>();
  for (const e of events) {
    if (!e.testLike) continue;
    const cur = tl.get(e.testLike) ?? { count: 0, first: e.t, last: e.t, ms: 0 };
    cur.count++;
    cur.first = Math.min(cur.first, e.t);
    cur.last = Math.max(cur.last, e.t);
    cur.ms += Math.min(e.responseMs, 5 * 60 * 1000);
    tl.set(e.testLike, cur);
  }

  const gradeD = levelDifficulty(Math.min(6, Math.max(1, profile.grade)) as 1);
  const abilityMap = new Map<AbilityTag, number[]>();
  for (const skill of SKILLS) {
    const st = profile.skills[skill.id];
    if (!st || st.n < 10 || skill.open) continue;
    abilityMap.set(skill.ability, [...(abilityMap.get(skill.ability) ?? []), st.theta - gradeD]);
  }

  return {
    totals: {
      answers: events.length,
      sessions: profile.sessions,
      minutes: Math.round(events.reduce((a, e) => a + Math.min(e.responseMs, 5 * 60 * 1000), 0) / 60000),
      days,
    },
    islands,
    potential: {
      novelTasks: novel.length,
      hintsPerNovel: novel.length ? novel.reduce((a, e) => a + e.hintsUsed, 0) / novel.length : null,
      novelFirstTry: novel.length ? novel.filter((e) => e.outcome === 'first').length / novel.length : null,
    },
    commitment: {
      braveItems: brave.length,
      braveSolved: brave.filter(isCorrect).length,
      errorItems: errorItems.length,
      solvedAfterError: errorItems.length ? errorItems.filter((e) => e.outcome === 'later').length / errorItems.length : null,
    },
    creativity: {
      openAnswers: open.length,
      avgIdeas: withIdeas.length ? withIdeas.reduce((a, e) => a + (e.ideas ?? 0), 0) / withIdeas.length : null,
      samples: open.filter((e) => e.text).slice(-6).map((e) => ({ t: e.t, text: e.text! })),
    },
    confidence: {
      rated: rated.length,
      underconfidence: ratedCorrect.length ? ratedCorrect.filter((e) => e.confidence === 'hadala').length / ratedCorrect.length : null,
      overconfidence: ratedWrong.length ? ratedWrong.filter((e) => e.confidence === 'jiste').length / ratedWrong.length : null,
      byChoice,
    },
    testLike: [...tl.entries()]
      .map(([format, v]) => ({ format, label: TEST_LIKE_LABELS[format], count: v.count, first: v.first, last: v.last, minutes: Math.max(1, Math.round(v.ms / 60000)) }))
      .sort((a, b) => b.count - a.count),
    abilities: [...abilityMap.entries()]
      .map(([ability, xs]) => ({ ability, label: ABILITY_LABELS[ability], advantage: xs.reduce((a, b) => a + b, 0) / xs.length, skills: xs.length }))
      .sort((a, b) => b.advantage - a.advantage),
  };
}
