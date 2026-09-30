import { describe, expect, it } from 'vitest';
import { genderItem, gx, mapStrings } from '../src/core/gender';
import type { Item } from '../src/core/types';
import { markupErrors } from './validate';

describe('oslovení podle rodu', () => {
  it('nahradí značky podle hráče', () => {
    expect(gx('{Zvládla|Zvládl} jsi to sama? Jsi {připravená|připravený}.', 'f')).toBe('Zvládla jsi to sama? Jsi připravená.');
    expect(gx('{Zvládla|Zvládl} jsi to? Jsi {připravená|připravený}.', 'm')).toBe('Zvládl jsi to? Jsi připravený.');
    expect(gx('{Hádala|Hádal} jsem', 'm')).toBe('Hádal jsem');
    // Prázdná varianta: „{sama|sám}“ i „{a|}“ fungují.
    expect(gx('Zkusil{a|} jsi to', 'm')).toBe('Zkusil jsi to');
    expect(gx('bez značky', 'm')).toBe('bez značky');
  });

  it('úloha zachová id, odpověď i pořadí', () => {
    const item: Item = {
      id: 'x.y:1:k',
      skillId: 'x.y',
      level: 1,
      prompt: 'Co bys {udělala|udělal}?',
      hints: ['Jsi {sama|sám}.'],
      explanation: 'Protože.',
      answer: { kind: 'order', items: ['b {a|á}', 'a'], correct: ['a', 'b {a|á}'] },
    };
    const m = genderItem(item, 'm');
    expect(m.id).toBe(item.id);
    expect(m.prompt).toBe('Co bys udělal?');
    expect(m.hints).toEqual(['Jsi sám.']);
    expect(m.answer).toEqual({ kind: 'order', items: ['b á', 'a'], correct: ['a', 'b á'] });
    expect(mapStrings({ a: ['{x|y}'], n: 3 }, 'm')).toEqual({ a: ['y'], n: 3 });
  });

  it('kontrola odhalí překlep ve značce', () => {
    expect(markupErrors({ t: '{Zvládla|Zvládl jsi to' }, 'x')).toHaveLength(1);
    expect(markupErrors({ t: '{Zvládla|Zvládl} jsi to' }, 'x')).toEqual([]);
  });
});
