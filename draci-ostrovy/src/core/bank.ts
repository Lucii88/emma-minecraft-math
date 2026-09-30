// Banky úloh pro ostrovy druhé fáze (svět, trh, dílna, záhady): ručně psané
// otázky a procedurální generátory, ze kterých se skládají úlohy.
//
// Id úlohy je `${skillId}:${level}:${key}`, takže stejná otázka má vždy
// stejné id (kvůli opakování a statistikám). Náhoda ovlivní jen výběr úlohy,
// pořadí možností a zamíchání položek k seřazení.

import { choice } from './czech';
import { MAX_PROGRAM_STEPS, shortestProgram } from './grid';
import { createRng, type Rng } from './rng';
import type {
  AbilityTag,
  Cell,
  ChoiceOption,
  IslandId,
  Item,
  Level,
  SkillDef,
  TestLikeFormat,
  Visual,
} from './types';

type GridVisual = Extract<Visual, { type: 'grid' }>;

interface BaseSpec {
  /** Klíč unikátní v rámci úrovně: malá písmena bez diakritiky, číslice, pomlčky. */
  key: string;
  prompt: string;
  /** Text k předčítání, pokud se liší od zadání (bez šipek a symbolů). */
  speak?: string;
  visual?: Visual;
  /** 1–3 postupné nápovědy, od obecné po konkrétní. Nikdy neprozradí výsledek. */
  hints: string[];
  /** Vysvětlení řešení (ukáže se po chybě). */
  explain: string;
  /** Jemné posunutí obtížnosti v rámci úrovně (−0,5 až +0,5). */
  difficulty?: number;
}

/** Výběr z možností: správná a 2–5 chybných; zamíchá se a ukážou se nejvýš 4. */
export interface ChoiceSpec extends BaseSpec {
  kind?: 'choice';
  correct: string | ChoiceOption;
  wrong: (string | ChoiceOption)[];
}

/** Stálá tlačítka ve stálém pořadí (Fakt × Názor, Potřeba × Přání). */
export interface FixedSpec extends BaseSpec {
  kind: 'fixed';
  options: (string | ChoiceOption)[];
  correct: number;
}

/** Číselná odpověď na klávesnici. */
export interface NumberSpec extends BaseSpec {
  kind: 'number';
  correct: number;
  unit?: string;
}

/** Seřazení (3–6 položek): `correct` je správné pořadí, zamíchá se samo. */
export interface OrderSpec extends BaseSpec {
  kind: 'order';
  correct: string[];
}

/** Program letu po mřížce. Vajíčka v mřížce musí drak cestou sebrat.
 *  `maxSteps` je výchozí nejkratší cesta + 3 (nejvýš MAX_PROGRAM_STEPS).
 *  `grid.path` smí být jen chybný program, který má hráčka opravit. */
export interface ProgramSpec extends Omit<BaseSpec, 'visual'> {
  kind: 'program';
  grid: Omit<GridVisual, 'type'> & { dragon: Cell; goal: Cell };
  maxSteps?: number;
}

/** Otevřená tvořivá úloha (jen v dovednosti s `open: true`). */
export interface OpenSpec extends BaseSpec {
  kind: 'open';
  minLength?: number;
  countIdeas?: boolean;
}

export type Spec = ChoiceSpec | FixedSpec | NumberSpec | OrderSpec | ProgramSpec | OpenSpec;

const toOption = (o: string | ChoiceOption): ChoiceOption => (typeof o === 'string' ? { label: o } : o);

/** Zamíchá položky tak, aby nezůstaly ve správném pořadí. */
function shuffleAway(rng: Rng, correct: string[]): string[] {
  for (let i = 0; i < 20; i++) {
    const out = rng.shuffle(correct);
    if (out.some((x, j) => x !== correct[j])) return out;
  }
  return [...correct.slice(1), correct[0]];
}

/** Z otázky sestaví úlohu. */
export function buildItem(skillId: string, level: Level, s: Spec, rng: Rng): Item {
  const base = {
    id: `${skillId}:${level}:${s.key}`,
    skillId,
    level,
    prompt: s.prompt,
    hints: s.hints,
    explanation: s.explain,
    ...(s.speak ? { speak: s.speak } : {}),
    ...(s.difficulty !== undefined ? { difficulty: s.difficulty } : {}),
  };
  switch (s.kind) {
    case 'program': {
      const collect = s.grid.eggs ?? [];
      const shortest = shortestProgram({ ...s.grid }, collect);
      const maxSteps = s.maxSteps ?? Math.min(MAX_PROGRAM_STEPS, (shortest?.length ?? 0) + 3);
      return {
        ...base,
        visual: { type: 'grid', ...s.grid },
        answer: { kind: 'program', maxSteps, ...(collect.length ? { collect } : {}) },
      };
    }
    case 'fixed':
      return {
        ...base,
        ...(s.visual ? { visual: s.visual } : {}),
        answer: { kind: 'choice', options: s.options.map(toOption), correct: s.correct },
      };
    case 'number':
      return {
        ...base,
        ...(s.visual ? { visual: s.visual } : {}),
        answer: { kind: 'number', correct: s.correct, ...(s.unit ? { unit: s.unit } : {}) },
      };
    case 'order':
      return {
        ...base,
        ...(s.visual ? { visual: s.visual } : {}),
        answer: { kind: 'order', items: shuffleAway(rng, s.correct), correct: s.correct },
      };
    case 'open':
      return {
        ...base,
        ...(s.visual ? { visual: s.visual } : {}),
        answer: {
          kind: 'open',
          ...(s.minLength !== undefined ? { minLength: s.minLength } : {}),
          ...(s.countIdeas ? { countIdeas: true } : {}),
        },
      };
    default:
      return {
        ...base,
        ...(s.visual ? { visual: s.visual } : {}),
        answer: choice(rng, s.correct, s.wrong),
      };
  }
}

export interface BankSkillDef {
  id: string;
  island: IslandId;
  name: string;
  /** Jedna věta pro rodiče: co dovednost rozvíjí. */
  description: string;
  rvp: Partial<Record<Level, string[]>>;
  ability: AbilityTag;
  testLike?: TestLikeFormat;
  open?: boolean;
  /** Vysvětlení se ukáže jako zajímavost i po správné odpovědi. */
  showFact?: boolean;
  /** Ručně psané úlohy podle úrovně. */
  banks?: Partial<Record<Level, Spec[]>>;
  /** Procedurální úlohy podle úrovně. Má-li úroveň banku i generátor,
   *  použije se generátor s pravděpodobností `genShare` (výchozí 0,5). */
  gen?: Partial<Record<Level, (rng: Rng) => Spec>>;
  genShare?: number;
}

const DEFS = new Map<string, BankSkillDef>();

function levelsOf(def: BankSkillDef): Level[] {
  const levels = new Set<Level>();
  for (const [l, bank] of Object.entries(def.banks ?? {})) if (bank?.length) levels.add(Number(l) as Level);
  for (const l of Object.keys(def.gen ?? {})) levels.add(Number(l) as Level);
  return [...levels].sort((a, b) => a - b);
}

/** Nejbližší úroveň, kterou dovednost má (při shodě ta nižší). */
function nearest(levels: Level[], level: Level): Level {
  let best = levels[0];
  for (const l of levels) if (Math.abs(l - level) < Math.abs(best - level)) best = l;
  return best;
}

/** Chyba v datech se má projevit hned při načtení, ne až u dítěte. */
function assertKeys(def: BankSkillDef) {
  for (const [level, bank] of Object.entries(def.banks ?? {})) {
    const seen = new Set<string>();
    for (const s of bank ?? []) {
      if (!/^[a-z0-9-]+$/.test(s.key)) throw new Error(`${def.id}:${level}: neplatný klíč „${s.key}“`);
      if (seen.has(s.key)) throw new Error(`${def.id}:${level}: duplicitní klíč „${s.key}“`);
      seen.add(s.key);
    }
  }
}

export function bankSkill(def: BankSkillDef): SkillDef {
  assertKeys(def);
  const levels = levelsOf(def);
  if (!levels.length) throw new Error(`${def.id}: žádné úlohy`);
  DEFS.set(def.id, def);
  const share = def.genShare ?? 0.5;
  return {
    id: def.id,
    island: def.island,
    name: def.name,
    description: def.description,
    levels,
    rvp: def.rvp,
    ability: def.ability,
    ...(def.testLike ? { testLike: def.testLike } : {}),
    ...(def.open ? { open: true } : {}),
    ...(def.showFact ? { showFact: true } : {}),
    generate: (level: Level, rng: Rng): Item => {
      const lv = levels.includes(level) ? level : nearest(levels, level);
      const bank = def.banks?.[lv] ?? [];
      const gen = def.gen?.[lv];
      const spec = gen && (!bank.length || rng.chance(share)) ? gen(rng) : rng.pick(bank);
      return buildItem(def.id, lv, spec, rng);
    },
  };
}

/** Semínko z klíče – aby výčet úloh byl deterministický. */
function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Všechny ručně psané úlohy dovednosti a úrovně (pro testy a kontrolu obsahu).
 *  Procedurální úlohy prověří `sweepSkill` v testech. */
export function enumerateItems(skillId: string, level: Level): Item[] {
  const bank = DEFS.get(skillId)?.banks?.[level] ?? [];
  return bank.map((s) => buildItem(skillId, level, s, createRng(seedOf(`${skillId}:${level}:${s.key}`))));
}
