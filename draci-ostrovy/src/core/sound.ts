// Zvukové efekty syntetizované přes Web Audio – žádné soubory, nic ke
// stažení. Tlumené a krátké, aby nerušily přemýšlení.

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.12, lowpass = 1200) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, t0);
  filter.frequency.exponentialRampToValueAtTime(200, t0 + dur);
  const gain = a.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  tap: () => tone(660, 0, 0.06, 'triangle', 0.08),
  correct: () => {
    tone(784, 0, 0.18, 'triangle', 0.16);
    tone(1175, 0.09, 0.28, 'triangle', 0.14);
  },
  hard: () => {
    tone(784, 0, 0.15, 'triangle', 0.15);
    tone(988, 0.08, 0.15, 'triangle', 0.15);
    tone(1319, 0.16, 0.35, 'triangle', 0.15);
  },
  retry: () => tone(330, 0, 0.18, 'sine', 0.12, 262),
  hint: () => {
    tone(1047, 0, 0.12, 'sine', 0.07);
    tone(1397, 0.07, 0.2, 'sine', 0.06);
  },
  whoosh: () => noise(0, 0.45, 0.1, 2400),
  fire: () => {
    noise(0, 0.6, 0.16, 900);
    tone(110, 0, 0.5, 'sawtooth', 0.04, 70);
  },
  hatch: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.14));
  },
  trick: () => {
    noise(0, 0.35, 0.08, 3000);
    [659, 880, 1175].forEach((f, i) => tone(f, 0.2 + i * 0.1, 0.25, 'triangle', 0.12));
  },
};
