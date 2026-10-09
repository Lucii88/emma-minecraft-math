// Vyhodnocení odpovědi nahlas: přepis řeči (z Azure) se porovná se vzory.
//
// Vzor je anglická věta. Velikost písmen, interpunkce a stažené tvary
// nehrají roli (I'm = I am). `*` = jedno či víc libovolných slov,
// `#` = číslo (slovem i číslicí). Vzor se hledá kdekoli v přepisu, takže
// „I'm seven years old“ projde i na vzor „i am #“.

import type { SayTip } from './types';

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "it's": 'it is', "he's": 'he is', "she's": 'she is', "that's": 'that is', "what's": 'what is',
  "where's": 'where is', "there's": 'there is', "who's": 'who is', "here's": 'here is',
  "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "aren't": 'are not',
  "can't": 'can not', cannot: 'can not', "haven't": 'have not', "hasn't": 'has not',
  "i've": 'i have', "let's": 'let us', "i'll": 'i will', "i'd": 'i would',
};

/** Vycpávky, které děti (i dospělí) vkládají do řeči. */
const FILLERS = new Set(['um', 'uh', 'umm', 'uhm', 'er', 'erm', 'hmm', 'hm', 'ah', 'eh', 'mm']);

/** Sjednotí text: malá písmena, bez interpunkce, rozepsané stažené tvary,
 *  čísla slovem, bez vycpávek. Vzory si nechají `*` a `#`. */
export function normSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'*# ]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter((w) => w && !FILLERS.has(w))
    .map((w) => CONTRACTIONS[w] ?? (/^\d+$/.test(w) && Number(w) <= 20 ? NUMBERS[Number(w)] : w))
    .join(' ');
}

const NUM = `(?:${NUMBERS.join('|')}|\\d+)`;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function patternRegex(pattern: string): RegExp {
  const body = normSpeech(pattern)
    .split(' ')
    .map((t) => (t === '*' ? "[a-z0-9']+(?: [a-z0-9']+)*?" : t === '#' ? NUM : escape(t)))
    .join(' ');
  return new RegExp(`(?:^| )${body}(?= |$)`);
}

export function matchesSay(heard: string, patterns: string[]): boolean {
  const text = normSpeech(heard);
  return !!text && patterns.some((p) => patternRegex(p).test(text));
}

/** Výsledek přepisu ze serveru (viz speechResult v server.mjs). */
export interface SpeechResult {
  status: 'ok' | 'nomatch' | 'error';
  text: string;
  lexical: string;
  scores: { accuracy: number | null; fluency: number | null; completeness: number | null; pron: number | null } | null;
  words: { word: string; accuracy: number | null; error: string }[];
}

export interface SayVerdict {
  ok: boolean;
  /** Co Miss Ember slyšela (pro dítě). */
  heard: string;
  /** Rada k typické chybě, pokud ji poznala. */
  tip?: string;
  /** Slova vzorové věty, která nezněla zřetelně (hodnocení výslovnosti). */
  unclear: string[];
}

/** Rozhodne, jestli odpovědi „rozuměla“: přepis odpovídá některému vzoru,
 *  nebo (u opakování věty) hodnocení výslovnosti našlo všechna slova
 *  a žádné nezaznělo špatně. */
export function judgeSay(result: SpeechResult, answer: { expect: string[]; ref?: string; tips?: SayTip[] }): SayVerdict {
  const heard = result.text.trim() || result.lexical.trim();
  const said = [result.lexical, result.text].filter(Boolean);
  const byText = said.some((s) => matchesSay(s, answer.expect));
  const refWords = answer.ref ? result.words.filter((w) => w.error !== 'Insertion') : [];
  const unclear = refWords.filter((w) => w.error === 'Omission' || w.error === 'Mispronunciation' || (w.accuracy ?? 100) < 40).map((w) => w.word);
  const byScore = refWords.length > 0 && unclear.length === 0;
  const ok = byText || byScore;
  const tip = ok ? undefined : answer.tips?.find((t) => said.some((s) => matchesSay(s, [t.when])))?.tip;
  return { ok, heard, ...(tip ? { tip } : {}), unclear: ok ? [] : unclear };
}
