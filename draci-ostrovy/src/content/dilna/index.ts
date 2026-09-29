// Vynálezecká dílna: algoritmy, data a šifry + umělá inteligence a digitální svět.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { algoritmyCards, algoritmyMissions, algoritmySkills } from './algoritmy';
import { digitalniCards, digitalniMissions, digitalniSkills } from './digitalni';

export const skills: SkillDef[] = [...algoritmySkills, ...digitalniSkills];
export const cards: KnowledgeCard[] = [...algoritmyCards, ...digitalniCards];
export const missions: JointMission[] = [...algoritmyMissions, ...digitalniMissions];
