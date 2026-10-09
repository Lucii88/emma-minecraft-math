// Předčítání českým hlasem prohlížeče (Web Speech API). Kvalita se liší podle
// zařízení: iPad má „Zuzanu“, Edge přirozené hlasy „Vlasta“ a „Antonín“.

let czechVoice: SpeechSynthesisVoice | null = null;
let ready = false;

const PREFERRED = ['Vlasta', 'Antonín', 'Zuzana', 'Jakub'];

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('cs'));
  czechVoice =
    PREFERRED.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ??
    voices.find((v) => v.localService) ??
    voices[0] ??
    null;
  ready = true;
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasCzechVoice(): boolean {
  if (!ready) pickVoice();
  return czechVoice !== null;
}

export function voiceName(): string | null {
  return czechVoice?.name ?? null;
}

export function speak(text: string, onEnd?: () => void): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!ready) pickVoice();
  if (!czechVoice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/_/g, ' ').replace(/☐/g, ' '));
  u.voice = czechVoice;
  u.lang = czechVoice.lang;
  u.rate = 0.92;
  u.pitch = 1.05;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

// ---------------------------------------------------------------------------
// Angličtina (školní ostrov): britský ženský hlas, když ho zařízení má.
// iPad: Kate, Serena, Martha (en-GB); Edge: Libby, Sonia, Maisie; Chrome:
// „Google UK English Female“. Když britský ženský chybí, vezme se jiný
// britský, pak americký ženský (Samantha) a nakonec jakýkoli anglický.

let englishVoice: SpeechSynthesisVoice | null = null;
let englishReady = false;

const EN_FEMALE = ['Libby', 'Sonia', 'Maisie', 'Hazel', 'Kate', 'Serena', 'Martha', 'Stephanie', 'Google UK English Female', 'Susan'];
const EN_MALE = ['Daniel', 'Arthur', 'Oliver', 'George', 'Ryan', 'Thomas', 'Google UK English Male', 'Alex', 'Fred'];
const US_FEMALE = ['Samantha', 'Ava', 'Allison', 'Zoe', 'Nicky', 'Aria', 'Jenny', 'Michelle', 'Google US English'];

function pickEnglish() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  const gb = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('en-gb'));
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const byName = (list: SpeechSynthesisVoice[], names: string[]) => names.map((n) => list.find((v) => v.name.includes(n))).find(Boolean);
  englishVoice =
    byName(gb, EN_FEMALE) ??
    gb.find((v) => !EN_MALE.some((n) => v.name.includes(n))) ??
    byName(en, US_FEMALE) ??
    gb[0] ??
    en[0] ??
    null;
  englishReady = true;
}

if (typeof speechSynthesis !== 'undefined') {
  pickEnglish();
  speechSynthesis.addEventListener?.('voiceschanged', pickEnglish);
}

export function hasEnglishVoice(): boolean {
  if (!englishReady) pickEnglish();
  return englishVoice !== null;
}

export function englishVoiceName(): string | null {
  return englishVoice?.name ?? null;
}

/** Přečte anglický text. Pomaleji než běžná řeč – je pro začínající děti. */
export function speakEnglish(text: string, onEnd?: () => void): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!englishReady) pickEnglish();
  if (!englishVoice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = englishVoice;
  u.lang = englishVoice.lang;
  u.rate = 0.82;
  u.pitch = 1.05;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  speechSynthesis.speak(u);
  return true;
}

/** Anglické názvy písmen tak, aby je hlas přečetl správně (samotné „A“
 *  by mohl přečíst jako člen). Britsky: Z = zed. */
const LETTER_NAMES: Record<string, string> = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'gee', h: 'aitch', i: 'eye',
  j: 'jay', k: 'kay', l: 'ell', m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'ar',
  s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zed',
};

export const letterName = (letter: string) => LETTER_NAMES[letter.toLowerCase()] ?? letter;

/** Hláskování slova pro hlas: „bag“ → „bee, ay, gee“. */
export function spellOut(word: string): string {
  return [...word.toLowerCase()].filter((c) => c in LETTER_NAMES).map((c) => LETTER_NAMES[c]).join(', ');
}

/** iOS pustí předčítání až po prvním dotyku. Prázdná promluva při prvním
 *  klepnutí kamkoli hlas „odemkne“, aby se pak poslech spustil sám. */
export function unlockSpeech() {
  if (typeof speechSynthesis === 'undefined' || typeof window === 'undefined') return;
  const unlock = () => {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
}
