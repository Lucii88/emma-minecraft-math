// Společné pomůcky pro kritické myšlení na Ostrově záhad: zkrácené zápisy
// otázek pro banky (bankSkill v src/core/bank.ts).
//
// Po chybě hra ukáže „Správně je X. <vysvětlení>“, proto vysvětlení
// nezačíná znovu odpovědí, ale rovnou říká proč a JAK to víme.

import type { ChoiceSpec, FixedSpec, OrderSpec } from '../../core/bank';
import type { ChoiceOption, Visual } from '../../core/types';

type Extra = Partial<Pick<ChoiceSpec, 'speak' | 'visual' | 'difficulty'>>;

export const FAKT = 'Fakt';
export const NAZOR = 'Názor';
export const PRAVDA = 'Pravda';
export const MYTUS = 'Mýtus';

/** Otázka „fakt, nebo názor?“ – konec zadání (kontrolují ho testy). */
export const ASK_FAKT = 'Je to fakt, nebo názor?';
/** Otázka „pravda, nebo mýtus?“ – konec zadání (kontrolují ho testy). */
export const ASK_MYTUS = 'Je to pravda, nebo mýtus?';

/** Otázka s výběrem: správná odpověď a 3–5 chybných (ukážou se nejvýš 3). */
export function q(
  key: string,
  prompt: string,
  correct: string | ChoiceOption,
  wrong: (string | ChoiceOption)[],
  hints: string[],
  explain: string,
  extra: Extra = {},
): ChoiceSpec {
  return { key, prompt, correct, wrong, hints, explain, ...extra };
}

/** Tvrzení k roztřídění: Fakt × Názor (stálá tlačítka ve stálém pořadí). */
export function fakt(
  key: string,
  statement: string,
  isFact: boolean,
  hints: string[],
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return {
    kind: 'fixed',
    key,
    prompt: `„${statement}“ ${ASK_FAKT}`,
    speak: `${statement} ${ASK_FAKT}`,
    options: [FAKT, NAZOR],
    correct: isFact ? 0 : 1,
    hints,
    explain,
    ...extra,
  };
}

/** Tvrzení o světě: Pravda × Mýtus. Vysvětlení vždy říká, jak se to zjistilo. */
export function mytus(
  key: string,
  statement: string,
  isTrue: boolean,
  hints: string[],
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return {
    kind: 'fixed',
    key,
    prompt: `„${statement}“ ${ASK_MYTUS}`,
    speak: `${statement} ${ASK_MYTUS}`,
    options: [PRAVDA, MYTUS],
    correct: isTrue ? 0 : 1,
    hints,
    explain,
    ...extra,
  };
}

/** Stálá tlačítka s vlastními možnostmi (Reklama × Zpráva × Pohádka…). */
export function pevne(
  key: string,
  prompt: string,
  options: string[],
  correct: number,
  hints: string[],
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return { kind: 'fixed', key, prompt, options, correct, hints, explain, ...extra };
}

/** Seřazení kroků (3–6 položek, každá do 40 znaků). */
export function poradi(
  key: string,
  prompt: string,
  correct: string[],
  hints: string[],
  explain: string,
  extra: Pick<Extra, 'speak' | 'difficulty'> = {},
): OrderSpec {
  return { kind: 'order', key, prompt, correct, hints, explain, ...extra };
}

/** Krátký text nad otázkou (reklama, detektivka). */
export function text(title: string, body: string): Visual {
  return { type: 'reading', title, text: body };
}
