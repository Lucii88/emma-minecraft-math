// Výpis všech úloh, karet a misí ostrova do čitelného textu (pro korekturu).
// Spuštění: npm run vypis -- <ostrov> <výstup.txt>
import { writeFileSync } from 'node:fs';
import { enumerateItems } from '../src/core/bank';
import { arrows, shortestProgram } from '../src/core/grid';
import { createRng } from '../src/core/rng';
import type { Item, JointMission, KnowledgeCard, SkillDef, Visual } from '../src/core/types';

const [island, outPath] = process.argv.slice(2).filter((a) => a !== '--');
const mod = (await import(`../src/content/${island}/index.ts`)) as {
  skills: SkillDef[];
  cards?: KnowledgeCard[];
  missions?: JointMission[];
};

function visual(v?: Visual): string {
  if (!v) return '';
  switch (v.type) {
    case 'grid': {
      const parts = [`mřížka ${v.cols}×${v.rows}`];
      if (v.dragon) parts.push(`drak ${v.dragon.x},${v.dragon.y}`);
      if (v.goal) parts.push(`cíl ${v.goal.x},${v.goal.y}`);
      if (v.rocks?.length) parts.push(`skály ${v.rocks.map((c) => `${c.x},${c.y}`).join(' ')}`);
      if (v.eggs?.length) parts.push(`vajíčka ${v.eggs.map((c) => `${c.x},${c.y}`).join(' ')}`);
      if (v.places?.length) parts.push(`místa ${v.places.map((p) => `${p.emoji}${p.name}@${p.x},${p.y}`).join(' ')}`);
      if (v.path) parts.push(`cesta ${arrows(v.path)}`);
      if (v.compass) parts.push('růžice');
      return parts.join('; ');
    }
    case 'cards':
      return 'karty: ' + v.cards.map((c) => `[${c.emoji} ${c.title}${c.lines?.length ? ' / ' + c.lines.join(' / ') : ''}${c.tag ? ' #' + c.tag : ''}${c.mark ? ' *' : ''}]`).join(' ');
    case 'bars':
      return `graf ${v.title ?? ''}${v.unit ? ` (${v.unit})` : ''}: ` + v.bars.map((b) => `${b.emoji ?? ''}${b.label}=${b.value}`).join(', ');
    case 'steps':
      return `postup ${v.title ?? ''}: ` + v.steps.map((s, i) => `${i + 1}. ${s}${i === v.highlight ? ' (!)' : ''}`).join(' | ');
    case 'table': {
      const rows: string[] = [];
      for (let i = 0; i < v.cells.length; i += v.cols) rows.push(v.cells.slice(i, i + v.cols).map((c, j) => (i + j === v.ask ? '?' : c ?? '·')).join(' '));
      return `tabulka${v.boxes ? ` bloky ${v.boxes.join('×')}` : ''}${v.head ? ' se záhlavím' : ''}: ` + rows.join(' / ');
    }
    case 'reading':
      return `TEXT „${v.title}“: ${v.text}`;
    case 'series':
      return 'řada: ' + v.items.map((x) => x ?? '?').join(' ');
    case 'coins':
      return 'mince: ' + v.values.join(', ');
    case 'body':
      return `mapa těla (${v.mode === 'outside' ? 'části těla' : 'orgány'})${v.highlight ? `, zvýrazněno: ${v.highlight}` : ''}`;
    default:
      return JSON.stringify(v);
  }
}

function answer(it: Item): string {
  const a = it.answer;
  switch (a.kind) {
    case 'choice':
      return a.options.map((o, i) => (i === a.correct ? `✔ ${o.label}` : `✗ ${o.label}`)).join(' | ');
    case 'number':
      return `= ${a.correct}${a.unit ? ' ' + a.unit : ''}`;
    case 'order':
      return `pořadí: ${a.correct.join(' → ')}`;
    case 'program': {
      const v = it.visual as Extract<Visual, { type: 'grid' }>;
      const best = shortestProgram({ cols: v.cols, rows: v.rows, dragon: v.dragon!, goal: v.goal!, rocks: v.rocks }, a.collect ?? []);
      return `program ≤ ${a.maxSteps} kroků, nejkratší ${best?.length} (${best ? arrows(best) : 'NEŘEŠITELNÉ'})`;
    }
    case 'open':
      return '(otevřená)';
    case 'tap':
      return `klepnout na: ${a.correct}`;
    case 'letters':
      return `slovo: ${a.correct}`;
    default:
      return JSON.stringify(a);
  }
}

function block(it: Item): string {
  return [
    `### ${it.id}${it.difficulty ? ` (obtížnost ${it.difficulty})` : ''}`,
    `ZADÁNÍ: ${it.prompt}`,
    it.speak ? `ČTENÍ: ${it.speak}` : '',
    it.visual ? `VIZUÁL: ${visual(it.visual)}` : '',
    `ODPOVĚĎ: ${answer(it)}`,
    `NÁPOVĚDY: ${it.hints.join(' || ')}`,
    `VYSVĚTLENÍ: ${it.explanation}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const out: string[] = [`# Ostrov ${island}`];
for (const s of mod.skills) {
  out.push(`\n## ${s.id} – ${s.name} (${s.levels.join(', ')})${s.testLike ? ` [${s.testLike}]` : ''}\n${s.description}`);
  for (const level of s.levels) {
    const bank = enumerateItems(s.id, level);
    const seen = new Set(bank.map((i) => i.id));
    const generated: Item[] = [];
    for (let seed = 1; seed <= 400 && generated.length < 12; seed++) {
      const it = s.generate(level, createRng(seed * 7919 + level));
      if (!seen.has(it.id)) {
        seen.add(it.id);
        generated.push(it);
      }
    }
    out.push(`\n--- ${s.id} L${level}: banka ${bank.length}, ukázka generátoru ${generated.length} ---`);
    for (const it of [...bank, ...generated]) out.push(block(it));
  }
}
out.push('\n# Karty');
for (const c of mod.cards ?? []) {
  out.push(`- ${c.id} (L${c.level}) ${c.emoji} ${c.title}: ${c.text}${c.fix ? `\n  DŘÍV: ${c.fix.before}\n  DŮKAZ: ${c.fix.evidence}` : ''}`);
}
out.push('\n# Mise');
for (const m of mod.missions ?? []) out.push(`- ${m.id} (L${m.level}) ${m.emoji} ${m.title}: ${m.text}\n  TIP: ${m.parentTip}`);
writeFileSync(outPath, out.join('\n'));
console.log(`${island}: ${mod.skills.length} dovedností, ${mod.cards?.length ?? 0} karet, ${mod.missions?.length ?? 0} misí → ${outPath}`);
