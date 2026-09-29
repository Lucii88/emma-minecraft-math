// Vikingský trh – finanční gramotnost: placení a kontrola, cena a hodnota,
// potřeby a přání, spoření na cíl, práce a výdělek, peníze na kartě
// a v mobilu a rozpočet. Dračí druh ostrova: Šupinka obchodní.

import type { SkillDef } from '../../core/types';
import { platba } from './platba';
import { hodnota } from './hodnota';
import { potreby } from './potreby';
import { sporeni } from './sporeni';
import { prace } from './prace';
import { digitalni } from './digitalni';
import { rozpocet } from './rozpocet';

export const skills: SkillDef[] = [platba, hodnota, potreby, sporeni, prace, digitalni, rozpocet];
export { cards } from './karty';
export { missions } from './mise';
