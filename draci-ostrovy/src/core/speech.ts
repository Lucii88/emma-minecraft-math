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
