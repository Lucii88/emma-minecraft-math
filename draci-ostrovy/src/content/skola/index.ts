// Školní ostrov: angličtina podle aktuálního školního učiva a příprava navíc
// (dětská zkouška Cambridge Pre A1 Starters). Ostrov vidí jen hráč, kterému
// ho rodič zapne v nastavení.

import type { SkillDef } from '../../core/types';
import { abecedaSkill, napisSkill, poskladejSkill } from './spelling';
import { jaMeSkill, kdeSkill, tohleSkill } from './gramatika';
import { poslechSkill, rekniToSkill } from './slovicka';
import { mluveniSkill } from './mluveni';
import { rozhovorSkill } from './rozhovor';

export const skills: SkillDef[] = [
  poslechSkill,
  rekniToSkill,
  poskladejSkill,
  napisSkill,
  abecedaSkill,
  jaMeSkill,
  kdeSkill,
  tohleSkill,
  rozhovorSkill,
  mluveniSkill,
];
export { missions } from './mise';
