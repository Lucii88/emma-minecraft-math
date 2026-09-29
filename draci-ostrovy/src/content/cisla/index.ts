import type { SkillDef } from '../../core/types';
import { scitani } from './scitani';
import { nasobeni } from './nasobeni';
import { cisla } from './cisla';
import { slovni } from './slovni';
import { zlomky } from './zlomky';
import { cas } from './cas';
import { penize } from './penize';
import { autobus, hadi, trojuhelniky } from './hejny';
import { rady, vahy, ctverce } from './mozkolamy';

export const skills: SkillDef[] = [
  scitani,
  nasobeni,
  cisla,
  slovni,
  zlomky,
  cas,
  penize,
  autobus,
  hadi,
  trojuhelniky,
  rady,
  vahy,
  ctverce,
];
export { cards } from './karty';
export { missions } from './mise';
