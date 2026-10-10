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
  englishRun++;
  stopClips();
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
  stopClips();
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
  if (clips) return true;
  if (!englishReady) pickEnglish();
  return englishVoice !== null;
}

export function englishVoiceName(): string | null {
  if (clips) return 'Miss Ember (nahraný hlas)';
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

const isLetter = (part: string | undefined) => !!part && /^[a-z]$/.test(part);

/** Části promluvy: oddělené `PAUSE`, samotné písmeno malým písmenem. */
export const speechParts = (text: string) =>
  text
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (/^[a-z]$/i.test(p) ? p.toLowerCase() : p));

/** Přečte anglický text: nahrávkou Miss Ember, a co nahrané není, hlasem
 *  zařízení. Části oddělené `PAUSE` čte zvlášť s pauzou (hláskování). */
export function speakEnglish(text: string, onEnd?: () => void): boolean {
  const parts = speechParts(text);
  if (!parts.length) return false;
  const run = ++englishRun;
  stopClips();
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  return playClips(parts, run, onEnd) || speakTts(parts, run, onEnd);
}

/** Hlas zařízení (záloha): pomaleji než běžná řeč, každá část zvlášť. */
function speakTts(parts: string[], run: number, onEnd?: () => void): boolean {
  if (typeof speechSynthesis === 'undefined') return false;
  if (!englishReady) pickEnglish();
  const voice = englishVoice;
  if (!voice) return false;
  const say = (i: number) => {
    if (run !== englishRun) return;
    if (i >= parts.length) return onEnd?.();
    const letter = isLetter(parts[i]);
    const u = new SpeechSynthesisUtterance(parts[i]);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = letter ? LETTER_RATE : RATE;
    u.pitch = 1.05;
    let done = false;
    u.onend = u.onerror = () => {
      if (done || run !== englishRun) return;
      done = true;
      if (i + 1 >= parts.length) return onEnd?.();
      setTimeout(() => say(i + 1), letter && isLetter(parts[i + 1]) ? LETTER_GAP : PART_GAP);
    };
    speechSynthesis.speak(u);
  };
  say(0);
  return true;
}

// ---------------------------------------------------------------------------
// Nahraný hlas Miss Ember (public/hlas, vyrábí ho scripts/hlas). Zní na
// každém zařízení stejně a písmena čte jako jejich názvy. Přehrává se přes
// Web Audio – to iOS po prvním klepnutí pustí i bez dalšího dotyku.

let clips: Record<string, string> | null = null;
let clipsLoad: Promise<void> | null = null;
let voiceCtx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let playing: AudioBufferSourceNode[] = [];
const HLAS = `${import.meta.env.BASE_URL}hlas/`;

/** Načte seznam nahrávek (při startu hry). Bez něj čte hlas zařízení. */
export function loadVoiceClips(): Promise<void> {
  if (typeof fetch === 'undefined') return Promise.resolve();
  clipsLoad ??= fetch(`${HLAS}index.json`)
    .then((r) => (r.ok && String(r.headers.get('content-type')).includes('json') ? r.json() : null))
    .then((data: { clips?: Record<string, string> } | null) => {
      clips = data?.clips ?? null;
    })
    .catch(() => {
      clips = null;
    });
  return clipsLoad;
}

export const hasVoiceClips = () => clips !== null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  voiceCtx ??= new Ctor();
  if (voiceCtx.state !== 'running') void voiceCtx.resume().catch(() => undefined);
  return voiceCtx;
}

function clipBuffer(ctx: AudioContext, file: string): Promise<AudioBuffer | null> {
  let buffer = buffers.get(file);
  if (!buffer) {
    buffer = fetch(`${HLAS}${file}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => new Promise<AudioBuffer>((resolve, reject) => void ctx.decodeAudioData(data, resolve, reject)))
      .catch(() => {
        buffers.delete(file);
        return null;
      });
    buffers.set(file, buffer);
  }
  return buffer;
}

function stopClips() {
  for (const src of playing) {
    src.onended = null;
    try {
      src.stop();
    } catch {
      /* už dohrálo */
    }
  }
  playing = [];
}

/** Přehraje nahrávky částí za sebou s pauzami. false = některá chybí. */
function playClips(parts: string[], run: number, onEnd?: () => void): boolean {
  const files = clips;
  if (!files || !parts.every((p) => files[p])) return false;
  const ctx = audioContext();
  if (!ctx) return false;
  void Promise.all(parts.map((p) => clipBuffer(ctx, files[p]))).then((loaded) => {
    if (run !== englishRun) return;
    if (loaded.some((b) => !b)) {
      speakTts(parts, run, onEnd); // nahrávka se nenačetla – přečte hlas zařízení
      return;
    }
    let t = ctx.currentTime + 0.05;
    playing = loaded.map((b, i) => {
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(ctx.destination);
      src.start(t);
      const gap = i + 1 < parts.length ? (isLetter(parts[i]) && isLetter(parts[i + 1]) ? LETTER_GAP : PART_GAP) : 0;
      t += b!.duration + gap / 1000;
      return src;
    });
    playing[playing.length - 1].onended = () => {
      if (run !== englishRun) return;
      playing = [];
      onEnd?.();
    };
  });
  return true;
}

/** Hláskování slova pro hlas: „bag“ → „b | a | g“ (každé písmeno zvlášť). */
export function spellOut(word: string): string {
  return [...word.toLowerCase()].filter((c) => /[a-z]/.test(c)).join(PAUSE);
}

/** iOS pustí předčítání až po prvním dotyku. Prázdná promluva při prvním
 *  klepnutí kamkoli hlas „odemkne“, aby se pak poslech spustil sám. */
export function unlockSpeech() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    if (typeof speechSynthesis !== 'undefined') {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
    // Nahrávky: zvuk hraje i v tichém režimu (jako předčítání) a Web Audio
    // se odemkne krátkým tichem.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    const ctx = audioContext();
    if (ctx) {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start();
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  // iOS uspí zvuk, když je hra na pozadí – probudí ho další klepnutí.
  window.addEventListener('pointerdown', () => {
    if (voiceCtx && voiceCtx.state !== 'running') void voiceCtx.resume().catch(() => undefined);
  });
}
