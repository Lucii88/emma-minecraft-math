// Společné pomůcky pro Ostrov těla: banky otázek a sestavení úloh.
//
// Každá dovednost má pro každou úroveň „banku“ ručně napsaných otázek.
// Generátor z ní vybere jednu otázku; id úlohy je `${skillId}:${level}:${key}`,
// takže stejná otázka má vždy stejné id (kvůli opakování a statistikám).

import { capitalize, choice } from '../../core/czech';
import { createRng, type Rng } from '../../core/rng';
import type {
  AbilityTag,
  BodyRegion,
  ChoiceOption,
  Item,
  Level,
  SkillDef,
  TestLikeFormat,
  Visual,
} from '../../core/types';
import { BODY_REGIONS } from '../../core/types';

/** Otázka s výběrem odpovědi (3–4 možnosti). */
export interface ChoiceQ {
  kind?: 'choice';
  key: string;
  prompt: string;
  speak?: string;
  correct: string | ChoiceOption;
  /** Distraktory (aspoň 2). `choice()` z nich náhodně vybere nejvýš 3. */
  wrong: (string | ChoiceOption)[];
  hints: string[];
  explain: string;
  visual?: Visual;
  difficulty?: number;
}

/** Klepnutí na oblast mapy těla. */
export interface TapQ {
  kind: 'tap';
  key: string;
  prompt: string;
  speak?: string;
  mode: 'outside' | 'inside';
  region: BodyRegion;
  hints: string[];
  explain: string;
  difficulty?: number;
}

/** Tvrzení k roztřídění: Fakt, nebo Pohádka? */
export interface FactQ {
  kind: 'fact';
  key: string;
  statement: string;
  fact: boolean;
  hints: string[];
  explain: string;
  difficulty?: number;
}

export type Spec = ChoiceQ | TapQ | FactQ;
export type Banks = Partial<Record<Level, Spec[]>>;

export const FACT = 'Fakt';
export const TALE = 'Pohádka';

const OUTSIDE = BODY_REGIONS.outside as Record<string, string>;
const INSIDE = BODY_REGIONS.inside as Record<string, string>;

/** Český název oblasti mapy těla („močový měchýř“). */
export function regionLabel(region: BodyRegion): string {
  return OUTSIDE[region] ?? INSIDE[region];
}

/** Název oblasti s velkým písmenem, pro tlačítka. */
export function regionOption(region: BodyRegion): string {
  return capitalize(regionLabel(region));
}

/** Zkrácený zápis otázky s výběrem. */
export function q(
  key: string,
  prompt: string,
  correct: string | ChoiceOption,
  wrong: (string | ChoiceOption)[],
  hints: string[],
  explain: string,
  extra: Partial<Pick<ChoiceQ, 'speak' | 'visual' | 'difficulty'>> = {},
): ChoiceQ {
  return { key, prompt, correct, wrong, hints, explain, ...extra };
}

/** Tvrzení pro „Fakt, nebo pohádka?“. */
export function fact(key: string, statement: string, isFact: boolean, hints: string[], explain: string): FactQ {
  return { kind: 'fact', key, statement, fact: isFact, hints, explain };
}

/** Cesta v těle jako možnost: „Nos → hrtan → plíce“, předčítá se bez šipek. */
export function path(...parts: string[]): ChoiceOption {
  return { label: capitalize(parts.join(' → ')), speak: capitalize(parts.join(', ')) };
}

export function buildItem(skillId: string, level: Level, s: Spec, rng: Rng): Item {
  const id = `${skillId}:${level}:${s.key}`;
  const common = { id, skillId, level, hints: s.hints, explanation: s.explain };
  const extra = s.difficulty === undefined ? {} : { difficulty: s.difficulty };

  if (s.kind === 'tap') {
    return {
      ...common,
      prompt: s.prompt,
      ...(s.speak ? { speak: s.speak } : {}),
      visual: { type: 'body', mode: s.mode },
      answer: { kind: 'tap', correct: s.region },
      ...extra,
    };
  }

  if (s.kind === 'fact') {
    // Pořadí tlačítek je vždy stejné (Fakt vlevo, Pohádka vpravo), aby se
    // dítě soustředilo na tvrzení, ne na hledání tlačítka.
    return {
      ...common,
      prompt: `„${s.statement}“ Je to fakt, nebo pohádka?`,
      speak: `${s.statement} Je to fakt, nebo pohádka?`,
      answer: { kind: 'choice', options: [{ label: FACT }, { label: TALE }], correct: s.fact ? 0 : 1 },
      ...extra,
    };
  }

  return {
    ...common,
    prompt: s.prompt,
    ...(s.speak ? { speak: s.speak } : {}),
    ...(s.visual ? { visual: s.visual } : {}),
    answer: choice(rng, s.correct, s.wrong),
    ...extra,
  };
}

export interface BankSkillDef {
  id: string;
  name: string;
  description: string;
  rvp: Partial<Record<Level, string[]>>;
  ability: AbilityTag;
  testLike?: TestLikeFormat;
  /** Vysvětlení je zajímavost: ukáže se i po správné odpovědi napoprvé. */
  showFact?: boolean;
  banks: Banks;
}

const REGISTRY = new Map<string, Banks>();

function levelsOf(banks: Banks): Level[] {
  return (Object.keys(banks).map(Number) as Level[])
    .filter((l) => (banks[l]?.length ?? 0) > 0)
    .sort((a, b) => a - b);
}

/** Nejbližší úroveň, pro kterou banka existuje (při shodě ta nižší). */
function nearest(levels: Level[], level: Level): Level {
  let best = levels[0];
  for (const l of levels) {
    if (Math.abs(l - level) < Math.abs(best - level)) best = l;
  }
  return best;
}

export function bankSkill(def: BankSkillDef): SkillDef {
  const levels = levelsOf(def.banks);
  REGISTRY.set(def.id, def.banks);
  return {
    id: def.id,
    island: 'telo',
    name: def.name,
    description: def.description,
    levels,
    rvp: def.rvp,
    ability: def.ability,
    ...(def.testLike ? { testLike: def.testLike } : {}),
    ...(def.showFact ? { showFact: true } : {}),
    generate: (level: Level, rng: Rng): Item => {
      const bank = def.banks[level] ?? def.banks[nearest(levels, level)]!;
      return buildItem(def.id, level, rng.pick(bank), rng);
    },
  };
}

/** Semínko z klíče – aby výčet všech úloh byl deterministický. */
function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Všechny úlohy dané dovednosti a úrovně (pro testy a přehled pro rodiče). */
export function enumerateItems(skillId: string, level: Level): Item[] {
  const bank = REGISTRY.get(skillId)?.[level] ?? [];
  return bank.map((s) => buildItem(skillId, level, s, createRng(seedOf(`${skillId}:${level}:${s.key}`))));
}
