// Ostrov slov: čtení, hádanky, přesmyčky, rýmy, pravopis, hlásky, slovní
// druhy, třídění slov, protiklady a tvořivé psaní.

import type { SkillDef } from '../../core/types';
import { cteni } from './cteni';
import { hadanky } from './hadanky';
import { presmycky } from './presmycky';
import { rymy } from './rymy';
import { pravopis } from './pravopis';
import { hlasky } from './hlasky';
import { druhy } from './druhy';
import { skupiny } from './skupiny';
import { protiklady } from './protiklady';
import { tvoreni } from './tvoreni';

export const skills: SkillDef[] = [
  cteni,
  hadanky,
  presmycky,
  rymy,
  pravopis,
  hlasky,
  druhy,
  skupiny,
  protiklady,
  tvoreni,
];
