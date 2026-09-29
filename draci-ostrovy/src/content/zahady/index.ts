// Ostrov záhad: kritické myšlení („Jak to víme?“) + logické hlavolamy a testové formáty.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { hlavolamyCards, hlavolamyMissions, hlavolamySkills } from './hlavolamy';
import { kritickeCards, kritickeMissions, kritickeSkills } from './kriticke';

export const skills: SkillDef[] = [...kritickeSkills, ...hlavolamySkills];
export const cards: KnowledgeCard[] = [...kritickeCards, ...hlavolamyCards];
export const missions: JointMission[] = [...kritickeMissions, ...hlavolamyMissions];
