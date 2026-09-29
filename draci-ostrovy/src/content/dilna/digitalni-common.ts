// Umělá inteligence a digitální svět (Vynálezecká dílna): společné pomůcky
// pro zápis otázek. Úlohy se staví přes `bankSkill` z jádra.

import type { ChoiceSpec, FixedSpec } from '../../core/bank';
import type { ChoiceOption, Visual } from '../../core/types';

export interface Extra {
  speak?: string;
  visual?: Visual;
  difficulty?: number;
}

/** Otázka s výběrem: správná + chybné možnosti (ukážou se nejvýš 4). */
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

/** Stálá tlačítka ve stálém pořadí (Používá AI × Nepoužívá AI…). */
export function fixed(
  key: string,
  prompt: string,
  options: (string | ChoiceOption)[],
  correct: number,
  hints: string[],
  explain: string,
  extra: Extra = {},
): FixedSpec {
  return { kind: 'fixed', key, prompt, options, correct, hints, explain, ...extra };
}

/** Matematické symboly pro předčítání: „7 + 8 = 15.“ → „7 plus 8 je 15.“ */
export function speakMath(s: string): string {
  return s
    .replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/×/g, ' krát ')
    .replace(/ : /g, ' děleno ')
    .replace(/=/g, ' je ')
    .replace(/\s+/g, ' ')
    .trim();
}
