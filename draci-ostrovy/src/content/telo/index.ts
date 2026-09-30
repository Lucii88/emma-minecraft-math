// Ostrov těla – lidské tělo, zdraví a bezpečí.

import type { SkillDef } from '../../core/types';
import { mapa } from './mapa';
import { organy } from './organy';
import { smysly } from './smysly';
import { kostra } from './kostra';
import { zdravi } from './zdravi';
import { bezpeci } from './bezpeci';
import { zivot } from './zivot';
import { faktPohadka } from './faktPohadka';

export const skills: SkillDef[] = [mapa, organy, smysly, kostra, zdravi, bezpeci, zivot, faktPohadka];

/** Výčet všech úloh dovednosti a úrovně (pro testy a přehled pro rodiče). */
export { enumerateItems } from './common';
export { cards } from './karty';
export { missions } from './mise';
