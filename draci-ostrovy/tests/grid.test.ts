import { describe, expect, it } from 'vitest';
import { bankSkill, enumerateItems } from '../src/core/bank';
import { arrows, fly, programSolves, shortestProgram, type GridWorld } from '../src/core/grid';
import { createRng } from '../src/core/rng';
import type { Move } from '../src/core/types';
import { validateItem } from './validate';

// 5 × 4, drak vlevo nahoře, cíl vpravo dole, zeď skal uprostřed s mezerou dole.
const world: GridWorld = {
  cols: 5,
  rows: 4,
  dragon: { x: 0, y: 0 },
  goal: { x: 4, y: 3 },
  rocks: [
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ],
};

describe('let po mřížce', () => {
  it('program, který objede skály, doletí do cíle', () => {
    const program: Move[] = ['D', 'D', 'D', 'R', 'R', 'R', 'R'];
    const f = fly(world, program);
    expect(f.end).toBe('goal');
    expect(f.ok).toBe(true);
    expect(f.path).toHaveLength(8);
    expect(programSolves(world, program, 7)).toBe(true);
    expect(programSolves(world, program, 6)).toBe(false);
  });

  it('náraz do skály i vyletění z mapy let ukončí', () => {
    const rock = fly(world, ['R', 'R', 'D']);
    expect(rock.end).toBe('rock');
    expect(rock.stoppedAt).toBe(1);
    expect(rock.path).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);

    const edge = fly(world, ['U']);
    expect(edge.end).toBe('edge');
    expect(edge.path).toEqual([{ x: 0, y: 0 }]);
  });

  it('musí skončit v cíli – proletět jím nestačí, vrátit se smí', () => {
    const open: GridWorld = { cols: 4, rows: 1, dragon: { x: 0, y: 0 }, goal: { x: 2, y: 0 } };
    expect(fly(open, ['R', 'R', 'R']).end).toBe('elsewhere');
    expect(fly(open, ['R', 'R', 'R', 'L']).ok).toBe(true);
  });

  it('vajíčka je třeba sebrat všechna', () => {
    const eggs = [{ x: 1, y: 3 }];
    expect(fly(world, ['D', 'D', 'D', 'R', 'R', 'R', 'R'], eggs).ok).toBe(true);
    const far = [{ x: 4, y: 0 }];
    expect(fly(world, ['D', 'D', 'D', 'R', 'R', 'R', 'R'], far).ok).toBe(false);
  });

  it('nejkratší program najde nejkratší cestu i se sbíráním', () => {
    expect(shortestProgram(world)?.length).toBe(7);
    const withEgg = shortestProgram(world, [{ x: 4, y: 0 }]);
    expect(withEgg?.length).toBe(13);
    expect(fly(world, withEgg!, [{ x: 4, y: 0 }]).ok).toBe(true);
    expect(arrows(['R', 'U'])).toBe('→ ↑');
  });

  it('když cesta neexistuje, vrátí null', () => {
    const closed: GridWorld = { ...world, rocks: [...world.rocks!, { x: 2, y: 3 }] };
    expect(shortestProgram(closed)).toBeNull();
    expect(shortestProgram({ ...world, goal: { x: 2, y: 0 } })).toBeNull();
  });
});

describe('banka úloh', () => {
  const skill = bankSkill({
    id: 'dilna.test-banky',
    island: 'dilna',
    name: 'Test banky',
    description: 'Jen pro test.',
    rvp: { 1: ['I-5-2-01'], 2: ['I-5-2-01'] },
    ability: 'usuzovani',
    banks: {
      1: [
        { key: 'vyber', prompt: 'Kolik nohou má pavouk?', correct: '8', wrong: ['6', '4', '10'], hints: ['Počítej.'], explain: 'Pavouk má osm nohou.' },
        { kind: 'fixed', key: 'fakt', prompt: 'Je to fakt?', options: ['Fakt', 'Názor'], correct: 0, hints: ['Dá se to ověřit?'], explain: 'Dá se to změřit.' },
        { kind: 'order', key: 'rada', prompt: 'Seřaď od nejmenšího.', correct: ['myš', 'kočka', 'kůň'], hints: ['Která je nejmenší?'], explain: 'Myš, kočka, kůň.' },
        {
          kind: 'program',
          key: 'let',
          prompt: 'Doleť do hnízda.',
          grid: { cols: 3, rows: 3, dragon: { x: 0, y: 0 }, goal: { x: 2, y: 2 }, eggs: [{ x: 2, y: 0 }] },
          hints: ['Nejdřív vajíčko.'],
          explain: 'Doprava, doprava, dolů, dolů.',
        },
      ],
    },
    gen: {
      2: (rng) => {
        const n = rng.int(2, 9);
        return { kind: 'number', key: `n${n}`, prompt: `Kolik je ${n} + 1?`, correct: n + 1, hints: ['Přidej jedna.'], explain: `${n} + 1 = ${n + 1}.` };
      },
    },
  });

  it('sestaví všechny druhy úloh a projdou kontrolou', () => {
    const items = enumerateItems(skill.id, 1);
    expect(items.map((i) => i.answer.kind)).toEqual(['choice', 'choice', 'order', 'program']);
    for (const item of items) expect(validateItem(item, skill, 1)).toEqual([]);
    const fixed = items[1].answer;
    expect(fixed.kind === 'choice' && fixed.options.map((o) => o.label)).toEqual(['Fakt', 'Názor']);
    const program = items[3].answer;
    expect(program.kind === 'program' && program.maxSteps).toBe(7);
    expect(items[3].visual?.type).toBe('grid');
  });

  it('položky k seřazení nikdy nezůstanou ve správném pořadí', () => {
    for (let seed = 1; seed < 200; seed++) {
      const item = skill.generate(1, createRng(seed));
      if (item.answer.kind === 'order') expect(item.answer.items).not.toEqual(item.answer.correct);
    }
  });

  it('generátor dává úlohy s úrovní a id podle obsahu', () => {
    expect(skill.levels).toEqual([1, 2]);
    const item = skill.generate(2, createRng(3));
    expect(item.id).toMatch(/^dilna\.test-banky:2:n\d$/);
    expect(validateItem(item, skill, 2)).toEqual([]);
    expect(skill.generate(5, createRng(3)).level).toBe(2);
  });

  it('chybu v datech ohlásí hned', () => {
    const bad = (key: string) => () =>
      bankSkill({
        id: 'dilna.chybna',
        island: 'dilna',
        name: 'Chybná',
        description: 'Jen pro test.',
        rvp: {},
        ability: 'usuzovani',
        banks: { 1: [{ key, prompt: 'x', correct: 'a', wrong: ['b', 'c'], hints: ['h'], explain: 'e' }] },
      });
    expect(bad('Velká písmena')).toThrow(/neplatný klíč/);
    expect(bad('ok')).not.toThrow();
  });

  it('kontrola odhalí neřešitelný let i prozrazenou cestu', () => {
    const [, , , item] = enumerateItems(skill.id, 1);
    const blocked = { ...item, visual: { ...item.visual!, rocks: [{ x: 1, y: 0 }, { x: 0, y: 1 }] } } as typeof item;
    expect(validateItem(blocked, skill, 1).join()).toMatch(/nedá doletět/);
    const solved = { ...item, visual: { ...item.visual!, path: ['R', 'R', 'D', 'D'] } } as typeof item;
    expect(validateItem(solved, skill, 1).join()).toMatch(/prozradila/);
    // Chybný program k opravě nakreslený být smí.
    const buggy = { ...item, visual: { ...item.visual!, path: ['D', 'D', 'R', 'R'] } } as typeof item;
    expect(validateItem(buggy, skill, 1)).toEqual([]);
  });
});
