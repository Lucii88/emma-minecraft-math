// Ukázka pro rodiče: smyšlené dítě a smyšlený záznam zhruba měsíce hraní.
// Úlohy vybírá stejný plánovač a odhady počítá stejný model jako ve hře;
// odpovědi „dává“ simulace podle předem zvolených silných a slabších stránek.
// Nic z toho se neukládá a nemíchá se s daty skutečného hráče.

import { MISSIONS, SKILLS } from '../content';
import { missionForSkill, nextItem, stateOf } from './planner';
import { itemDifficulty, pCorrect, scoreOf, updateState } from './model';
import { createRng } from './rng';
import { defaultProfile, type Profile } from './storage';
import type { AbilityTag, AnswerEvent, Confidence, SkillDef } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** Smyšlený profil: silný v počtech a úvahách, v paměti spíš průměrný. */
const TALENT: Record<AbilityTag, number> = {
  pocetni: 1.7,
  usuzovani: 1.3,
  prostorove: 0.9,
  znalosti: 0.6,
  slovni: 0.2,
  pamet: -0.3,
  tvorivost: 0,
};

const STORIES = [
  { text: 'Drak, který se bál tmy, si z ohně udělal lucernu a svítil ostatním drakům na cestu domů.', ideas: 1 },
  { text: 'Krabice může být loď, domeček pro kočku, bubínek, helma pro robota a skluzavka pro autíčka.', ideas: 5 },
  { text: 'Kdyby draci chodili do školy, měli by hodinu létání a počítali by jiskry.', ideas: 2 },
  { text: 'Lžíce se hodí na katapult na hrášek, na zrcátko, na lopatku do písku a na zvonek.', ideas: 4 },
];

const NOTE =
  'Ukázková poznámka: čte od pěti let, rád staví ze stavebnice podle vlastních plánů. Těžké úlohy někdy odkládá, ale když se k nim vrátí, obvykle je vyřeší.';

export interface Demo {
  profile: Profile;
  events: AnswerEvent[];
}

/** Sestaví ukázku. Je deterministická – stejné semínko, stejná ukázka
 *  (až na posun dat k dnešku). */
export function buildDemo(seed = 20260930, now = Date.now()): Demo {
  const rng = createRng(seed);
  const closed = SKILLS.filter((s) => !s.open);
  const open = SKILLS.filter((s) => s.open);
  // Oblíbené dovednosti hraje často, některé jen zkusí, zbytek zatím ne.
  const shuffled = rng.shuffle(closed);
  const favourites = shuffled.slice(0, 20);
  const tried = shuffled.slice(20, 32);

  let profile: Profile = {
    ...defaultProfile(),
    createdAt: now - 30 * DAY,
    name: 'Kuba',
    gender: 'm',
    grade: 2,
    dragonName: 'Jiskřík',
    settings: { ...defaultProfile().settings, notes: NOTE },
  };
  const events: AnswerEvent[] = [];
  let sessions = 0;

  const truth = (skill: SkillDef) => TALENT[skill.ability] + (((skill.id.length * 7) % 5) - 2) * 0.15;

  const answer = (skill: SkillDef, kind: 'free' | 'brave', count: number, t0: number, sessionId: string) => {
    const mission = missionForSkill(skill, kind);
    let t = t0;
    for (let i = 0; i < count; i++) {
      const item = nextItem(profile, mission, i, rng.int(1, 2 ** 30));
      const before = stateOf(profile, skill.id);
      const p = pCorrect(truth(skill), itemDifficulty(item));
      const first = rng.chance(p);
      const second = !first && rng.chance(p * 0.7);
      const outcome: AnswerEvent['outcome'] = first ? 'first' : second ? 'later' : 'failed';
      const attempts = first ? 1 : second ? 2 : 3;
      const hintsUsed = first ? 0 : second ? 1 : 2;
      let confidence: Confidence | undefined;
      if (events.length % 3 === 2) {
        // Mírné podceňování u těžších úloh – ať je v ukázce co číst.
        confidence = first ? (p < 0.65 && rng.chance(0.45) ? 'hadala' : p > 0.8 ? 'jiste' : 'asi') : rng.chance(0.15) ? 'jiste' : 'asi';
      }
      const responseMs = rng.int(6, 40) * 1000 + (skill.ability === 'usuzovani' ? 15000 : 0);
      t += responseMs + rng.int(3, 12) * 1000;
      events.push({
        t,
        sessionId,
        itemId: item.id,
        skillId: skill.id,
        island: skill.island,
        level: item.level,
        outcome,
        attempts,
        hintsUsed,
        responseMs,
        ...(confidence ? { confidence } : {}),
        ...(kind === 'brave' ? { brave: true } : {}),
        ...(before.n === 0 ? { novel: true } : {}),
        ...(skill.testLike ? { testLike: skill.testLike } : {}),
      });
      const after = updateState(before, item, scoreOf(outcome, attempts, hintsUsed), t);
      profile = {
        ...profile,
        skills: { ...profile.skills, [skill.id]: after },
        recent: { ...profile.recent, [skill.id]: [...(profile.recent[skill.id] ?? []), item.id].slice(-40) },
      };
    }
    return t;
  };

  let story = 0;
  for (let d = 28; d >= 1; d--) {
    if (rng.chance(0.3)) continue; // ne každý den se hraje
    const dayStart = now - d * DAY + rng.int(15, 19) * 60 * 60 * 1000;
    const sessionId = `ukazka-${d}`;
    sessions++;
    let t = dayStart;
    const pool = rng.chance(0.25) && tried.length ? tried : favourites;
    for (let m = 0; m < 3; m++) t = answer(rng.pick(pool), 'free', 5, t, sessionId);
    if (d % 7 === 3) t = answer(rng.pick(favourites), 'brave', 2, t, sessionId);
    if (d % 6 === 2 && story < STORIES.length && open.length) {
      const s = STORIES[story++];
      const skill = rng.pick(open);
      t += 120000;
      events.push({
        t,
        sessionId,
        itemId: `${skill.id}:1:ukazka-${story}`,
        skillId: skill.id,
        island: skill.island,
        level: 1,
        outcome: 'open',
        attempts: 1,
        hintsUsed: 0,
        responseMs: 110000,
        text: s.text,
        ideas: s.ideas,
      });
    }
  }

  const done = rng.shuffle(MISSIONS).slice(0, 5);
  profile = {
    ...profile,
    sessions,
    totalAnswers: events.length,
    missionsDone: Object.fromEntries(done.map((m, i) => [m.id, now - (3 + i * 4) * DAY])),
  };
  return { profile, events };
}
