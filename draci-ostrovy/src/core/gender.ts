// Oslovení podle toho, jestli hraje holka, nebo kluk. Texty obsahují značky
// {ženský|mužský} – třeba „{Zvládla|Zvládl} jsi to!“ nebo „Jsi {připravená|
// připravený}?“ – a před zobrazením se nahradí podle profilu hráče.

import type { Item } from './types';

export type Gender = 'f' | 'm';
export const GENDERS: readonly Gender[] = ['f', 'm'];

const MARK = /\{([^{}|]*)\|([^{}|]*)\}/g;

/** Nahradí značky {ženský|mužský} podle rodu. */
export function gx(text: string, gender: Gender): string {
  return text.includes('{') ? text.replace(MARK, (_, f: string, m: string) => (gender === 'm' ? m : f)) : text;
}

/** Totéž pro všechny texty v datech (vizuál, odpověď, karta, mise). */
export function mapStrings<T>(value: T, gender: Gender): T {
  if (typeof value === 'string') return gx(value, gender) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, gender)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, gender);
    return out as T;
  }
  return value;
}

/** Úloha pro konkrétního hráče. Id a dovednost zůstávají, mění se jen texty. */
export function genderItem(item: Item, gender: Gender): Item {
  return {
    ...item,
    prompt: gx(item.prompt, gender),
    ...(item.speak !== undefined ? { speak: gx(item.speak, gender) } : {}),
    hints: item.hints.map((h) => gx(h, gender)),
    explanation: gx(item.explanation, gender),
    ...(item.visual ? { visual: mapStrings(item.visual, gender) } : {}),
    answer: mapStrings(item.answer, gender),
  };
}
