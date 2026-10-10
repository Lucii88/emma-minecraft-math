// Ostrov blesků: elektrické obvody – co svítí a proč, vodiče a izolanty
// s bezpečností, vypínače a skládačka drátů.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { drateSkill } from './drate';
import { bleskyCards, bleskyMissions } from './karty';
import { obvodSkill } from './obvod';
import { vodiceSkill } from './vodice';
import { vypinaceSkill } from './vypinace';

export const skills: SkillDef[] = [obvodSkill, vodiceSkill, vypinaceSkill, drateSkill];
export const cards: KnowledgeCard[] = bleskyCards;
export const missions: JointMission[] = bleskyMissions;
