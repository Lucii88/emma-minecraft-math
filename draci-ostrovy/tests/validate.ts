// Společná kontrola úloh pro testy všech ostrovů.

import { createRng } from '../src/core/rng';
import type { Item, Level, SkillDef } from '../src/core/types';
import { BODY_REGIONS } from '../src/core/types';

/** Jména a pojmy z filmů, které nesmí být v kódu (veřejný repozitář). */
export const FORBIDDEN_WORDS = [
  'bezzub', 'toothless', 'škyťák', 'hiccup', 'astrid', 'berk', 'blp', 'kliďas',
  'tlamoun', 'snoplivec', 'rybinoha', 'noční běs', 'night fury', 'světlá běs',
  'jak vycvičit draka', 'emma',
];

export function validateItem(item: Item, skill: SkillDef, level: Level): string[] {
  const errors: string[] = [];
  const where = `${item.id}`;
  if (!item.id.startsWith(`${skill.id}:${level}:`)) errors.push(`${where}: id musí začínat „${skill.id}:${level}:“`);
  if (item.skillId !== skill.id) errors.push(`${where}: skillId nesedí`);
  if (item.level !== level) errors.push(`${where}: level nesedí`);
  if (!item.prompt.trim()) errors.push(`${where}: prázdné zadání`);
  if (item.hints.length > 3) errors.push(`${where}: víc než 3 nápovědy`);
  if (!skill.open && item.hints.length < 1) errors.push(`${where}: chybí nápověda`);
  if (!skill.open && !item.explanation.trim()) errors.push(`${where}: chybí vysvětlení`);

  const a = item.answer;
  switch (a.kind) {
    case 'choice': {
      if (a.options.length < 2 || a.options.length > 4) errors.push(`${where}: počet možností ${a.options.length}`);
      if (a.correct < 0 || a.correct >= a.options.length) errors.push(`${where}: index správné odpovědi mimo rozsah`);
      const labels = a.options.map((o) => o.label.trim().toLocaleLowerCase('cs'));
      if (new Set(labels).size !== labels.length) errors.push(`${where}: duplicitní možnosti ${labels.join(' | ')}`);
      if (labels.some((l) => !l)) errors.push(`${where}: prázdná možnost`);
      break;
    }
    case 'number':
      if (!Number.isFinite(a.correct)) errors.push(`${where}: nečíselná odpověď`);
      if (a.correct < 0 && !a.allowNegative) errors.push(`${where}: záporný výsledek bez allowNegative`);
      break;
    case 'letters': {
      const sortedA = [...a.letters].sort().join('');
      const sortedB = [...a.correct].sort().join('');
      if (sortedA !== sortedB) errors.push(`${where}: písmena neodpovídají slovu`);
      if (a.letters.join('') === a.correct) errors.push(`${where}: písmena nejsou zamíchaná`);
      break;
    }
    case 'tap': {
      const all = { ...BODY_REGIONS.outside, ...BODY_REGIONS.inside } as Record<string, string>;
      if (!(a.correct in all)) errors.push(`${where}: neznámá oblast ${a.correct}`);
      if (item.visual?.type !== 'body') errors.push(`${where}: tap bez mapy těla`);
      break;
    }
    case 'numberline':
      if (a.correct < a.min || a.correct > a.max) errors.push(`${where}: správná hodnota mimo osu`);
      break;
    case 'open':
      if (!skill.open) errors.push(`${where}: otevřená úloha v uzavřené dovednosti`);
      break;
  }

  const text = JSON.stringify(item).toLocaleLowerCase('cs');
  for (const w of FORBIDDEN_WORDS) {
    if (new RegExp(`(^|[^\\p{L}])${w}`, 'u').test(text)) errors.push(`${where}: zakázané slovo „${w}“`);
  }
  if (/\s{2,}/.test(item.prompt)) errors.push(`${where}: dvojitá mezera v zadání`);
  return errors;
}

/** Vygeneruje `n` úloh pro každou úroveň dovednosti a vrátí chyby + počet
 *  různých úloh (kvůli opakovatelnosti). */
export function sweepSkill(skill: SkillDef, n = 300): { errors: string[]; distinct: Record<number, number> } {
  const errors: string[] = [];
  const distinct: Record<number, number> = {};
  for (const level of skill.levels) {
    const ids = new Set<string>();
    for (let seed = 1; seed <= n; seed++) {
      const item = skill.generate(level, createRng(seed * 7919 + level));
      errors.push(...validateItem(item, skill, level));
      ids.add(item.id);
    }
    distinct[level] = ids.size;
  }
  return { errors: [...new Set(errors)].slice(0, 50), distinct };
}
