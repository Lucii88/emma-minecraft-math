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
  englishRun++; // zastaví i rozehrané hláskování (pauzy mezi písmeny)
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

// ---------------------------------------------------------------------------
// Angličtina (školní ostrov): americký ženský hlas, když ho zařízení má
// (škola učí americkou angličtinu). iPad: Samantha, Ava, Allison, Zoe, Nicky;
// Edge: Aria, Jenny, Michelle; Chrome: „Google US English“. Když americký
// ženský chybí, vezme se jiný americký, pak britský ženský a nakonec
// jakýkoli anglický. Hlasy „Premium“ a „Enhanced“ (stažené v nastavení
// zařízení) mají přednost – zní mnohem zřetelněji než základní.

let englishVoice: SpeechSynthesisVoice | null = null;
let englishReady = false;
let englishRun = 0;

const US_FEMALE = ['Samantha', 'Ava', 'Allison', 'Zoe', 'Nicky', 'Aria', 'Jenny', 'Michelle', 'Ana', 'Susan', 'Google US English'];
const EN_MALE = ['Daniel', 'Arthur', 'Oliver', 'George', 'Ryan', 'Thomas', 'Alex', 'Fred', 'Tom', 'Aaron', 'Guy', 'Eric', 'Christopher', 'Roger', 'Steffan', 'Brian', 'Andrew', 'Male'];
const GB_FEMALE = ['Libby', 'Sonia', 'Maisie', 'Hazel', 'Kate', 'Serena', 'Martha', 'Stephanie', 'Google UK English Female'];

function pickEnglish() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  const region = (r: string) => voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(r));
  const us = region('en-us');
  const gb = region('en-gb');
  const en = region('en');
  // Ze jmenovaných hlasů ten nejkvalitnější, při shodě podle pořadí v seznamu.
  const quality = (v: SpeechSynthesisVoice) => (/premium/i.test(`${v.name} ${v.voiceURI}`) ? 2 : /enhanced|vylepšen/i.test(`${v.name} ${v.voiceURI}`) ? 1 : 0);
  const byName = (list: SpeechSynthesisVoice[], names: string[]) => {
    const rank = (v: SpeechSynthesisVoice) => names.findIndex((n) => v.name.includes(n));
    return list
      .filter((v) => rank(v) >= 0)
      .sort((a, b) => quality(b) - quality(a) || rank(a) - rank(b))[0];
  };
  englishVoice =
    byName(us, US_FEMALE) ??
    us.find((v) => !EN_MALE.some((n) => v.name.includes(n))) ??
    byName(gb, GB_FEMALE) ??
    us[0] ??
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

/** Oddělovač částí anglického textu: mezi nimi hlas udělá pauzu. Samotné
 *  písmeno je vlastní promluva – hlas ho tak přečte jako název písmena
 *  (a = ej, i = aj). Přepis „ay“ hlas četl jako „aj“. */
export const PAUSE = ' | ';
const RATE = 0.75;
const LETTER_RATE = 0.7;
const LETTER_GAP = 500; // ms mezi písmeny
const PART_GAP = 700; // ms mezi větou a hláskováním

/** Přečte anglický text. Pomaleji než běžná řeč – je pro začínající děti.
 *  Části oddělené `PAUSE` čte zvlášť s pauzou (hláskování po písmenech). */
export function speakEnglish(text: string, onEnd?: () => void): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!englishReady) pickEnglish();
  const voice = englishVoice;
  if (!voice) return false;
  const run = ++englishRun;
  speechSynthesis.cancel();
  const parts = text.split('|').map((p) => p.trim()).filter(Boolean);
  const say = (i: number) => {
    if (run !== englishRun) return;
    if (i >= parts.length) return onEnd?.();
    const letter = /^[a-z]$/i.test(parts[i]);
    const u = new SpeechSynthesisUtterance(letter ? parts[i].toLowerCase() : parts[i]);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = letter ? LETTER_RATE : RATE;
    u.pitch = 1.05;
    let done = false;
    u.onend = u.onerror = () => {
      if (done || run !== englishRun) return;
      done = true;
      if (i + 1 >= parts.length) return onEnd?.();
      setTimeout(() => say(i + 1), letter && /^[a-z]$/i.test(parts[i + 1]) ? LETTER_GAP : PART_GAP);
    };
    speechSynthesis.speak(u);
  };
  say(0);
  return true;
}

/** Hláskování slova pro hlas: „bag“ → „b | a | g“ (každé písmeno zvlášť). */
export function spellOut(word: string): string {
  return [...word.toLowerCase()].filter((c) => /[a-z]/.test(c)).join(PAUSE);
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
