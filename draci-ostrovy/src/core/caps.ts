// Schopnosti zařízení a serveru, které se zjistí až za běhu (mluvení).
// Dokud nejsou ověřené, platí „ne“ – hra bez nich funguje dál.

import type { SkillDef } from './types';

export const caps = {
  /** Server má klíč k převodu řeči na text a hráč je z rodiny. */
  speech: false,
};

/** Mluvení jde hrát s rozpoznáváním řeči na serveru, nebo když odpovědi
 *  hodnotí rodič (přepínač „Mluvení se mnou“ v nastavení hráče). */
export const skillReady = (skill: SkillDef, settings?: { parentSpeaking?: boolean }) =>
  skill.needs !== 'speech' || caps.speech || !!settings?.parentSpeaking;
