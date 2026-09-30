// Ostrov světa – příroda, mapy a hvězdy. Dračí druh: Mapovec větrný.

import type { JointMission, KnowledgeCard, SkillDef } from '../../core/types';
import { cesko, ceskoCards } from './cesko';
import { mapa, mapaCards } from './mapa';
import { missions as svetMissions } from './mise';
import { obdobi, obdobiCards } from './obdobi';
import { pokusy, pokusyCards } from './pokusy';
import { retezce, retezceCards } from './retezce';
import { rostliny, rostlinyCards } from './rostliny';
import { vesmir, vesmirCards } from './vesmir';
import { zvirata, zvirataCards } from './zvirata';

export const skills: SkillDef[] = [obdobi, zvirata, rostliny, retezce, pokusy, vesmir, mapa, cesko];

export const cards: KnowledgeCard[] = [
  ...obdobiCards,
  ...zvirataCards,
  ...rostlinyCards,
  ...retezceCards,
  ...pokusyCards,
  ...vesmirCards,
  ...mapaCards,
  ...ceskoCards,
];

export const missions: JointMission[] = svetMissions;
