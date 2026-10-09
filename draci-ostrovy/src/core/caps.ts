// Schopnosti zařízení a serveru, které se zjistí až za běhu (mluvení).
// Dokud nejsou ověřené, platí „ne“ – hra bez nich funguje dál.

import type { SkillDef } from './types';

export const caps = {
  /** Server má klíč k převodu řeči na text a hráč je z rodiny. */
  speech: false,
};

export const skillReady = (skill: SkillDef) => skill.needs !== 'speech' || caps.speech;
