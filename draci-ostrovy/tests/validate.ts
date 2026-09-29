// Společná kontrola úloh pro testy všech ostrovů.

import { MAX_PROGRAM_STEPS, cellKey, fly, insideGrid, sameCell, shortestProgram } from '../src/core/grid';
import { createRng } from '../src/core/rng';
import type { Cell, IslandId, Item, JointMission, KnowledgeCard, Level, SkillDef, Visual } from '../src/core/types';
import { BODY_REGIONS } from '../src/core/types';

/** Jména a pojmy z filmů, které nesmí být v kódu (veřejný repozitář). */
export const FORBIDDEN_WORDS = [
  'bezzub', 'toothless', 'škyťák', 'hiccup', 'astrid', 'berk', 'blp', 'kliďas',
  'tlamoun', 'snoplivec', 'rybinoha', 'noční běs', 'night fury', 'světlá běs',
  'jak vycvičit draka', 'emma',
];

/** Zakázaná slova a dvojité mezery v libovolném textu (úloha, karta, mise). */
function textErrors(value: unknown, where: string): string[] {
  const errors: string[] = [];
  const text = JSON.stringify(value).toLocaleLowerCase('cs');
  for (const w of FORBIDDEN_WORDS) {
    if (new RegExp(`(^|[^\\p{L}])${w}`, 'u').test(text)) errors.push(`${where}: zakázané slovo „${w}“`);
  }
  return errors;
}

/** Kontrola vizuálů, které se kreslí z dat (mřížka, karty, graf, postup, tabulka). */
export function validateVisual(v: Visual, where: string): string[] {
  const errors: string[] = [];
  switch (v.type) {
    case 'grid': {
      if (v.cols < 2 || v.cols > 8 || v.rows < 2 || v.rows > 8) errors.push(`${where}: mřížka ${v.cols}×${v.rows} mimo rozsah 2–8`);
      const all: Cell[] = [v.dragon, v.goal, ...(v.rocks ?? []), ...(v.eggs ?? []), ...(v.places ?? [])].filter((c): c is Cell => !!c);
      for (const c of all) {
        if (!Number.isInteger(c.x) || !Number.isInteger(c.y) || !insideGrid(v, c)) errors.push(`${where}: políčko ${c.x},${c.y} mimo mřížku`);
      }
      // Drak, cíl, skály a vajíčka se nesmí překrývat. Místo (maják, studna)
      // smí být pod drakem nebo v cíli, ale ne na skále ani na jiném místě.
      const solid = new Map<string, string>();
      const put = (c: Cell | undefined, what: string) => {
        if (!c) return;
        const k = cellKey(c);
        if (solid.has(k)) errors.push(`${where}: ${what} a ${solid.get(k)} na stejném políčku ${k}`);
        else solid.set(k, what);
      };
      put(v.dragon, 'drak');
      put(v.goal, 'cíl');
      v.rocks?.forEach((c) => put(c, 'skála'));
      v.eggs?.forEach((c) => put(c, 'vajíčko'));
      const rocks = new Set((v.rocks ?? []).map(cellKey));
      const places = new Set<string>();
      for (const p of v.places ?? []) {
        if (!p.emoji.trim() || !p.name.trim()) errors.push(`${where}: místo bez obrázku nebo jména`);
        if (rocks.has(cellKey(p)) || v.eggs?.some((e) => sameCell(e, p))) errors.push(`${where}: místo ${p.name} na skále nebo vajíčku`);
        if (places.has(cellKey(p))) errors.push(`${where}: dvě místa na políčku ${cellKey(p)}`);
        places.add(cellKey(p));
      }
      if (v.path) {
        if (!v.dragon) errors.push(`${where}: nakreslená cesta bez draka`);
        if (v.path.some((m) => !['U', 'D', 'L', 'R'].includes(m))) errors.push(`${where}: neplatný krok cesty`);
        if (v.path.length > MAX_PROGRAM_STEPS) errors.push(`${where}: nakreslená cesta delší než ${MAX_PROGRAM_STEPS}`);
      }
      break;
    }
    case 'cards':
      if (v.cards.length < 1 || v.cards.length > 6) errors.push(`${where}: ${v.cards.length} karet (povoleno 1–6)`);
      for (const c of v.cards) if (!c.emoji.trim() || !c.title.trim()) errors.push(`${where}: karta bez obrázku nebo názvu`);
      break;
    case 'bars': {
      if (v.bars.length < 2 || v.bars.length > 8) errors.push(`${where}: ${v.bars.length} sloupců (povoleno 2–8)`);
      for (const b of v.bars) {
        if (!Number.isFinite(b.value) || b.value < 0) errors.push(`${where}: sloupec ${b.label} má neplatnou hodnotu`);
        if (!b.label.trim()) errors.push(`${where}: sloupec bez popisku`);
      }
      if (new Set(v.bars.map((b) => b.label)).size !== v.bars.length) errors.push(`${where}: opakovaný popisek sloupce`);
      break;
    }
    case 'steps':
      if (v.steps.length < 2 || v.steps.length > 10) errors.push(`${where}: ${v.steps.length} kroků postupu (povoleno 2–10)`);
      if (v.steps.some((x) => !x.trim())) errors.push(`${where}: prázdný krok postupu`);
      if (v.highlight !== undefined && (v.highlight < 0 || v.highlight >= v.steps.length)) errors.push(`${where}: zvýrazněný krok mimo postup`);
      break;
    case 'table': {
      const rows = v.cells.length / v.cols;
      if (v.cols < 2 || v.cols > 6 || !Number.isInteger(rows) || rows < 1 || rows > 6) errors.push(`${where}: tabulka ${v.cols} sloupců × ${rows} řádků`);
      if (v.ask !== undefined && (v.ask < 0 || v.ask >= v.cells.length || v.cells[v.ask] !== null)) errors.push(`${where}: políčko s otazníkem musí být prázdné`);
      if (v.boxes && (v.cols % v.boxes[0] !== 0 || rows % v.boxes[1] !== 0)) errors.push(`${where}: bloky ${v.boxes.join('×')} nedělí tabulku`);
      break;
    }
  }
  return errors;
}

export function validateItem(item: Item, skill: SkillDef, level: Level): string[] {
  const errors: string[] = [];
  const where = `${item.id}`;
  if (!item.id.startsWith(`${skill.id}:${level}:`)) errors.push(`${where}: id musí začínat „${skill.id}:${level}:“`);
  // Klíč za úrovní: u ostrovů 2. fáze tisknutelné ASCII bez mezer. Ostrovy
  // 1. fáze mají v klíčích i diakritiku – jejich id už jsou uložená v profilu.
  const PHASE_1 = ['cisla', 'slova', 'telo'];
  if (!PHASE_1.includes(skill.island) && !/^[\x21-\x7e]+$/.test(item.id.slice(`${skill.id}:${level}:`.length))) {
    errors.push(`${where}: klíč obsahuje mezeru nebo diakritiku`);
  }
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
      // Velikost písmen se počítá: u úloh na velká písmena se možnosti liší
      // právě jen jí („Ingrid má psa.“ × „ingrid má psa.“).
      const labels = a.options.map((o) => o.label.trim().replace(/\s+/g, ' '));
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
    case 'program': {
      const v = item.visual;
      if (v?.type !== 'grid' || !v.dragon || !v.goal) {
        errors.push(`${where}: program bez mřížky s drakem a cílem`);
        break;
      }
      if (sameCell(v.dragon, v.goal)) errors.push(`${where}: drak už je v cíli`);
      const collect = a.collect ?? [];
      // Nakreslená cesta smí být jen chybný program k opravě, ne řešení.
      const world = { cols: v.cols, rows: v.rows, dragon: v.dragon, goal: v.goal, rocks: v.rocks };
      if (v.path && fly(world, v.path, collect).ok) errors.push(`${where}: nakreslená cesta by prozradila řešení`);
      const eggs = v.eggs ?? [];
      if (collect.length !== eggs.length || collect.some((c) => !eggs.some((e) => sameCell(e, c)))) {
        errors.push(`${where}: vajíčka k sebrání neodpovídají mřížce`);
      }
      if (a.maxSteps < 1 || a.maxSteps > MAX_PROGRAM_STEPS) errors.push(`${where}: maxSteps ${a.maxSteps} mimo 1–${MAX_PROGRAM_STEPS}`);
      const best = shortestProgram(world, collect);
      if (!best) errors.push(`${where}: do cíle se nedá doletět`);
      else if (best.length > a.maxSteps) errors.push(`${where}: nejkratší let má ${best.length} kroků, povoleno ${a.maxSteps}`);
      break;
    }
    case 'order': {
      if (a.items.length < 3 || a.items.length > 6) errors.push(`${where}: ${a.items.length} položek k seřazení (povoleno 3–6)`);
      if (new Set(a.items).size !== a.items.length) errors.push(`${where}: opakovaná položka k seřazení`);
      if ([...a.items].sort().join('|') !== [...a.correct].sort().join('|')) errors.push(`${where}: položky neodpovídají správnému pořadí`);
      if (a.items.every((x, i) => x === a.correct[i])) errors.push(`${where}: položky nejsou zamíchané`);
      if (a.items.some((x) => !x.trim() || x.length > 40)) errors.push(`${where}: položka je prázdná nebo delší než 40 znaků`);
      break;
    }
  }

  if (item.visual) errors.push(...validateVisual(item.visual, where));
  errors.push(...textErrors(item, where));
  if (/\s{2,}/.test(item.prompt)) errors.push(`${where}: dvojitá mezera v zadání`);
  return errors;
}

/** Karty znalostí: id `dovednost.klic`, úroveň, kterou dovednost má, krátký
 *  text ukončený tečkou a u „opravené stránky“ obě části. */
export function validateCards(cards: KnowledgeCard[], skills: SkillDef[]): string[] {
  const errors: string[] = [];
  const byId = new Map(skills.map((s) => [s.id, s]));
  const seen = new Set<string>();
  for (const c of cards) {
    const where = `karta ${c.id}`;
    if (seen.has(c.id)) errors.push(`${where}: duplicitní id`);
    seen.add(c.id);
    const skill = byId.get(c.skillId);
    if (!skill) {
      errors.push(`${where}: neznámá dovednost ${c.skillId}`);
    } else {
      if (!c.id.startsWith(`${skill.id}.`) || !/^[a-z0-9-]+$/.test(c.id.slice(skill.id.length + 1))) {
        errors.push(`${where}: id musí být „${skill.id}.klic“ (a–z, 0–9, pomlčky)`);
      }
      if (!skill.levels.includes(c.level)) errors.push(`${where}: dovednost nemá úroveň ${c.level}`);
      if (skill.open) errors.push(`${where}: otevřená dovednost nemá stupně, karta by se neodemkla`);
    }
    if (!c.emoji.trim() || !c.title.trim()) errors.push(`${where}: chybí obrázek nebo nadpis`);
    if (c.title.length > 40) errors.push(`${where}: nadpis delší než 40 znaků`);
    const text = c.text.trim();
    if (text.length < 20 || text.length > 280) errors.push(`${where}: text má ${text.length} znaků (povoleno 20–280)`);
    if (!/[.!?…]$/.test(text)) errors.push(`${where}: text nekončí tečkou`);
    if (c.fix && (!c.fix.before.trim() || !c.fix.evidence.trim())) errors.push(`${where}: opravená stránka bez obou částí`);
    if (/\s{2,}/.test(JSON.stringify(c))) errors.push(`${where}: dvojitá mezera`);
    errors.push(...textErrors(c, where));
  }
  return errors;
}

/** Společné mise: id `ostrov.klic`, vyplněné texty a tip pro rodiče. */
export function validateMissions(missions: JointMission[], island: IslandId): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const m of missions) {
    const where = `mise ${m.id}`;
    if (seen.has(m.id)) errors.push(`${where}: duplicitní id`);
    seen.add(m.id);
    if (m.island !== island) errors.push(`${where}: patří na ostrov ${m.island}, ne ${island}`);
    if (!new RegExp(`^${island}\\.[a-z0-9-]+$`).test(m.id)) errors.push(`${where}: id musí být „${island}.klic“`);
    if (!m.emoji.trim() || !m.title.trim()) errors.push(`${where}: chybí obrázek nebo nadpis`);
    if (m.title.length > 40) errors.push(`${where}: nadpis delší než 40 znaků`);
    if (m.text.trim().length < 20 || m.text.length > 300) errors.push(`${where}: zadání má ${m.text.length} znaků (povoleno 20–300)`);
    if (m.parentTip.trim().length < 20 || m.parentTip.length > 400) errors.push(`${where}: tip pro rodiče má ${m.parentTip.length} znaků (povoleno 20–400)`);
    if (!/[.!?…]$/.test(m.text.trim()) || !/[.!?…]$/.test(m.parentTip.trim())) errors.push(`${where}: text nekončí tečkou`);
    if (m.level < 1 || m.level > 6) errors.push(`${where}: úroveň ${m.level}`);
    if (/\s{2,}/.test(JSON.stringify(m))) errors.push(`${where}: dvojitá mezera`);
    errors.push(...textErrors(m, where));
  }
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
